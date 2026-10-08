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

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission, role_permissions
from uuid import UUID
from typing import Iterable, List, Optional
from app.core.logger import get_logger

logger = get_logger(__name__)


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_users_by_organization(self, organization_id: UUID) -> List[User]:
        """Get all users in an organization"""
        return self.db.query(User)\
            .filter(User.organization_id == organization_id)\
            .order_by(User.created_at.desc())\
            .all()

    def get_users_with_any_permission(
        self, organization_id: str | UUID, permission_names: Iterable[str]
    ) -> List[User]:
        """Active users in an org whose role grants any of `permission_names`.

        Used to pick notification recipients for chats nobody owns yet, so the
        push only reaches people who can actually open the conversation.
        """
        if isinstance(organization_id, str):
            organization_id = UUID(organization_id)

        names = list(permission_names)
        if not names:
            return []

        return self.db.query(User)\
            .join(Role, User.role_id == Role.id)\
            .join(role_permissions, role_permissions.c.role_id == Role.id)\
            .join(Permission, Permission.id == role_permissions.c.permission_id)\
            .filter(User.organization_id == organization_id)\
            .filter(User.is_active == True)\
            .filter(Permission.name.in_(names))\
            .distinct()\
            .all()

    def get_active_users_count(self, organization_id: str | UUID) -> int:
        """Get count of active users in an organization"""
        if isinstance(organization_id, str):
            organization_id = UUID(organization_id)
        return self.db.query(User)\
            .filter(User.organization_id == organization_id)\
            .filter(User.is_active == True)\
            .count()

    def get_user(self, user_id: str | UUID) -> User | None:
        """Get a user by ID"""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> User | None:
        """Get a user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def create_user(self, **kwargs) -> User:
        """Create a new user"""
        user = User(**kwargs)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user_id: str, **kwargs) -> Optional[User]:
        """Update user"""
        user = self.get_user(user_id)
        if user:
            for key, value in kwargs.items():
                setattr(user, key, value)
            self.db.commit()
            self.db.refresh(user)
        return user

    def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        user = self.get_user(user_id)
        if user:
            self.db.delete(user)
            self.db.commit()
            return True
        return False

    def get_first_admin_by_org(self, organization_id: UUID) -> Optional[User]:
        """Get the first admin user in an organization"""
        try:
            return self.db.query(User)\
                .filter(User.organization_id == organization_id)\
                .filter(User.is_admin == True)\
                .first()
        except Exception as e:
            logger.error(f"Error getting admin user: {str(e)}")
            return None