"""
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

"""Turn the chat-scope toggles on the user form into a role.

Permissions hang off roles, not off people, so "let this agent read every
conversation while their colleague is on leave" has to resolve to *some* role.
Rather than inventing per-user grants — which would mean every permission check
in the codebase learning about a second source of truth — the two toggles
describe the chat scope a person should have, and this module finds the role in
their organization that matches. A new role is created only when no existing
one does, so the common case adds nothing to the Roles screen.
"""

import re
from dataclasses import dataclass
from typing import Optional, Set
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.auth import require_grantable
from app.core.logger import get_logger
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User

logger = get_logger(__name__)

# The unclaimed queue: sessions the AI is still handling that nobody has taken.
AI_QUEUE_PERMISSION = "view_unassigned_chats"
# Every conversation in the organization, including other agents' assignments.
ALL_CHATS_PERMISSION = "view_all_chats"


@dataclass(frozen=True)
class ChatScope:
    """What the two toggles on the user form are asking for."""

    see_all_ai_chats: bool
    see_all_org_chats: bool

    @classmethod
    def of(cls, role: Role) -> "ChatScope":
        """The scope a role already grants — what the form shows on open."""
        names = {p.name for p in role.permissions}
        return cls(
            see_all_ai_chats=AI_QUEUE_PERMISSION in names,
            see_all_org_chats=ALL_CHATS_PERMISSION in names,
        )

    def label(self) -> str:
        if self.see_all_org_chats and self.see_all_ai_chats:
            return "all chats"
        if self.see_all_org_chats:
            return "all chats, no AI queue"
        if self.see_all_ai_chats:
            return "assigned + AI queue"
        return "assigned only"


def resolve_role(
    db: Session,
    current_user: User,
    base_role: Role,
    see_all_ai_chats: Optional[bool],
    see_all_org_chats: Optional[bool],
) -> Role:
    """The role that grants `base_role` plus/minus the requested chat scope.

    Either toggle may be None, meaning "whatever the role already does" — an
    API client that has never heard of these fields gets exactly the old
    behaviour.
    """
    current = ChatScope.of(base_role)
    wanted = ChatScope(
        see_all_ai_chats=(
            current.see_all_ai_chats if see_all_ai_chats is None else see_all_ai_chats
        ),
        see_all_org_chats=(
            current.see_all_org_chats if see_all_org_chats is None else see_all_org_chats
        ),
    )
    if wanted == current:
        return base_role

    held = {p.name for p in base_role.permissions}
    # super_admin already passes every check, so widening it would create a
    # near-duplicate role that grants nothing new.
    if "super_admin" in held:
        return base_role

    desired = set(held)
    for granted, permission in (
        (wanted.see_all_ai_chats, AI_QUEUE_PERMISSION),
        (wanted.see_all_org_chats, ALL_CHATS_PERMISSION),
    ):
        desired.add(permission) if granted else desired.discard(permission)

    # Same rule as the Roles editor: an admin cannot hand out what they do not
    # hold themselves.
    require_grantable(current_user, desired - held)

    existing = _role_granting(db, base_role.organization_id, desired)
    if existing is not None:
        return existing
    return _create_scoped_role(db, base_role, desired, wanted)


#: Every label label() can produce, so a name can be stripped back down again.
SCOPE_LABELS = tuple(
    ChatScope(ai, org).label() for ai in (True, False) for org in (True, False)
)
_SCOPE_SUFFIX = re.compile(
    r" \((?:%s)\)(?: \d+)?$" % "|".join(re.escape(label) for label in SCOPE_LABELS)
)


def _unscoped(name: str) -> str:
    """`Agent (all chats)` -> `Agent`.

    Re-scoping someone who is already on a derived role would otherwise stack
    suffixes: "Agent (all chats) (assigned only)".
    """
    return _SCOPE_SUFFIX.sub("", name)


def _role_granting(db: Session, organization_id: UUID, desired: Set[str]) -> Optional[Role]:
    """An existing role in the org whose permissions are exactly `desired`.

    Exact, not superset: a role that also grants manage_users would hand the
    person far more than the toggle asked for.
    """
    roles = (
        db.query(Role)
        .options(joinedload(Role.permissions))
        .filter(Role.organization_id == organization_id)
        .all()
    )
    for role in roles:
        if {p.name for p in role.permissions} == desired:
            return role
    return None


def _create_scoped_role(
    db: Session, base_role: Role, desired: Set[str], scope: ChatScope
) -> Role:
    role = Role(
        name=_available_name(db, base_role, scope),
        description=f"{_unscoped(base_role.name)}, scoped to {scope.label()}",
        organization_id=base_role.organization_id,
        # Never the org default. get_default_role() picks the default for
        # invited users, and a scope chosen for one person is not that.
        is_default=False,
    )
    role.permissions = (
        db.query(Permission).filter(Permission.name.in_(desired)).all()
    )
    db.add(role)
    db.flush()
    logger.info(
        "Created chat-scope role %r (%s) for organization %s",
        role.name, scope.label(), base_role.organization_id,
    )
    return role


def _available_name(db: Session, base_role: Role, scope: ChatScope) -> str:
    """`Agent (all chats)`, or the first free numbered variant of it.

    Role names are not unique in the schema, but two roles sharing a name in
    one org is confusing in every screen that lists them.
    """
    taken = {
        name for (name,) in db.query(Role.name).filter(
            Role.organization_id == base_role.organization_id
        )
    }
    preferred = f"{_unscoped(base_role.name)} ({scope.label()})"
    if preferred not in taken:
        return preferred
    suffix = 2
    while f"{preferred} {suffix}" in taken:
        suffix += 1
    return f"{preferred} {suffix}"
