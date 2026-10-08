"""
Copyright 2024-2026 Komi AI

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

"""repair agent roles left behind by the hosted signup seeder

Revision ID: repair_agent_role_seed_001
Revises: add_run_connector_status_001
Create Date: 2026-08-03

Two signup paths seed an organization's starter roles, and they disagreed. The
hosted one gave Agent only view_assigned_chats + manage_assigned_chats, and
marked BOTH Admin and Agent is_default=true. b7c4e91a2d38 repaired the orgs
that existed in July 2026; every org created since through hosted signup was
seeded wrong again. The seeders now share DEFAULT_AGENT_ROLE_PERMISSIONS, so
this is the last of it.

Unlike b7c4e91a2d38 this does NOT backfill by capability. That migration
widened every chat-capable role and promised admins the grant was theirs to
revoke:

    "an admin who wants an agent kept out can uncheck the permission in Roles"

Running a capability backfill again would break that promise — a role someone
deliberately narrowed would silently get its permissions back. So the repair
matches the bad seed EXACTLY: a role qualifies only if its permission set is
precisely {view_assigned_chats, manage_assigned_chats}, no more and no less.
An edited role has a different set and is left alone. A community-seeded org
has four permissions and never matches, which is what makes this a no-op
outside hosted.

Also does NOT promote a role to is_default where an organization has none.
roles.py refuses to edit or delete a default role, so promoting Agent would
make it permanently uneditable through the API.

Idempotent: every insert is guarded by NOT EXISTS (role_permissions has no
primary key or unique constraint, so that guard is the only thing standing
between a re-run and duplicate rows), and the is_default repair is a no-op
once an org is down to one default.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = 'repair_agent_role_seed_001'
down_revision = 'add_run_connector_status_001'
branch_labels = None
depends_on = None


# The exact permission set the hosted seeder produced, and what it should have
# been. Sorted, because the match is done against a sorted aggregate.
BAD_SEED = ('manage_assigned_chats', 'view_assigned_chats')
MISSING_FROM_BAD_SEED = ('view_unassigned_chats', 'view_people')

# view_agents and view_knowledge became real permissions in the same release
# that this migration ships with — they were in the catalogue and the role
# editor for months while being enforced nowhere. Anyone holding the manage_*
# twin already passes those checks (they are OR'd), so this grant changes no
# behaviour. It exists so the role editor stops showing an admin role with
# "manage knowledge" ticked and "view knowledge" blank.
IMPLIED_BY_MANAGE = (
    ('view_agents', 'manage_agents'),
    ('view_knowledge', 'manage_knowledge'),
)

# Permission rows themselves may be absent on a deployment whose last org was
# created before the name was added to Permission.default_permissions().
REQUIRED_PERMISSIONS = (
    ('view_unassigned_chats', 'Can view unassigned AI chats'),
    ('view_people', 'Can view the people directory'),
    ('view_agents', 'Can view chat agents'),
    ('view_knowledge', 'Can view knowledge base'),
)


BAD_SEED_SIGNATURE = ",".join(sorted(BAD_SEED))


def _sql_list(values) -> str:
    return ", ".join(f"'{value}'" for value in values)


def upgrade() -> None:
    for name, description in REQUIRED_PERMISSIONS:
        op.execute(
            f"""
            INSERT INTO permissions (name, description)
            SELECT '{name}', '{description}'
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = '{name}')
            """
        )

    # Roles whose permission set is exactly the bad seed. HAVING on the sorted
    # aggregate is what makes it exact — a role with one extra permission, or
    # one fewer, produces a different string and is skipped.
    #
    # Both permissions go in ONE statement, deliberately. Granting them in
    # separate statements does not work: the first grant changes the role's
    # permission set, so it no longer matches the signature and the second
    # statement finds nothing to do. The subquery here is evaluated once,
    # against the pre-insert state.
    op.execute(
        f"""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT bad.role_id, target.id
        FROM (
            SELECT rp.role_id
            FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id
            GROUP BY rp.role_id
            HAVING string_agg(p.name, ',' ORDER BY p.name) = '{BAD_SEED_SIGNATURE}'
        ) bad
        CROSS JOIN permissions target
        WHERE target.name IN ({_sql_list(MISSING_FROM_BAD_SEED)})
          AND NOT EXISTS (
              SELECT 1 FROM role_permissions existing
              WHERE existing.role_id = bad.role_id
                AND existing.permission_id = target.id
          )
        """
    )

    for implied, held in IMPLIED_BY_MANAGE:
        op.execute(
            f"""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT DISTINCT rp.role_id, target.id
            FROM role_permissions rp
            JOIN permissions holder ON holder.id = rp.permission_id
            CROSS JOIN permissions target
            WHERE holder.name = '{held}'
              AND target.name = '{implied}'
              AND NOT EXISTS (
                  SELECT 1 FROM role_permissions existing
                  WHERE existing.role_id = rp.role_id
                    AND existing.permission_id = target.id
              )
            """
        )

    # One default role per organization, same repair as b7c4e91a2d38. Clearing
    # Admin is what leaves Agent as the default; clearing Agent instead would
    # hand every newly invited user full permissions.
    #
    # The COUNT(*) > 1 guard means an org whose only default is Admin keeps it
    # rather than ending up with no default at all.
    op.execute(
        """
        UPDATE roles SET is_default = false
        WHERE name = 'Admin'
          AND is_default = true
          AND organization_id IN (
              SELECT organization_id FROM roles
              WHERE is_default = true
              GROUP BY organization_id
              HAVING COUNT(*) > 1
          )
        """
    )


def downgrade() -> None:
    """Deliberately empty.

    There is nothing safe to undo. Revoking the four permissions would strip
    them from roles that legitimately hold them — this migration cannot tell
    the grants it made from the ones the seeder wrote. Deleting the permission
    rows, as b7c4e91a2d38's downgrade does, would cascade across every
    organization. And the pre-repair is_default state was ambiguous by
    definition, which is the whole reason for the repair.
    """
