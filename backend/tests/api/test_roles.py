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

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.database import Base, get_db
from fastapi import FastAPI
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission, role_permissions
from uuid import UUID, uuid4
from app.api import roles as roles_router
from app.core.auth import get_current_user
from app.main import app
from app.core.config import settings
from tests.conftest import engine, TestingSessionLocal, create_tables

# Create a test FastAPI app
app = FastAPI()
app.include_router(
    roles_router.router,
    prefix=f"{settings.API_V1_STR}/roles",
    tags=["roles"]
)

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_permissions(db) -> list[Permission]:
    """Create test permissions"""
    permissions = []
    for name in ["manage_roles", "manage_users", "manage_chats"]:
        perm = Permission(
            name=name,
            description=f"Can {name}"
        )
        db.add(perm)
        permissions.append(perm)
    db.commit()
    for p in permissions:
        db.refresh(p)
    return permissions

@pytest.fixture
def test_role(db, test_organization, test_permissions) -> Role:
    """Create a test role with required permissions"""
    role = Role(
        id=1,
        name="Test Role",
        description="Test Role Description",
        organization_id=test_organization.id,
        is_default=False
    )
    db.add(role)
    db.commit()

    # Associate permissions with role
    for perm in test_permissions:
        db.execute(
            role_permissions.insert().values(
                role_id=role.id,
                permission_id=perm.id
            )
        )
    db.commit()
    db.refresh(role)
    return role

@pytest.fixture
def test_user(db: Session, test_organization, test_role: Role) -> User:
    """Create a test user with required permissions"""
    user = User(
        id=uuid4(),
        email="test@test.com",
        hashed_password="hashed_password",
        organization_id=test_organization.id,
        role_id=test_role.id,
        is_active=True,
        full_name="Test User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def client(test_user: User) -> TestClient:
    """Client authenticated as a user whose role really holds manage_roles.

    There used to be a `dependency_overrides[require_permissions]` line here.
    It never did anything — require_permissions is a factory and FastAPI keys
    overrides on the closure it returns — so it read as coverage while the real
    gates ran unchecked. The fixture role grants the permissions instead.
    """
    async def override_get_current_user():
        return test_user

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db

    yield TestClient(app)
    app.dependency_overrides.clear()

def test_create_role(client: TestClient, test_permissions):
    """Test creating a new role"""
    role_data = {
        "name": "New Role",
        "description": "New role description",
        "is_default": False,
        "permissions": [{"id": perm.id, "name": perm.name, "description": perm.description} for perm in test_permissions[:2]]
    }
    
    response = client.post("/api/v1/roles", json=role_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == role_data["name"]
    assert data["description"] == role_data["description"]
    assert data["is_default"] == role_data["is_default"]
    assert len(data["permissions"]) == 2

def test_create_default_role_when_exists(client: TestClient, test_role, db):
    """Test creating a default role when one already exists"""
    # First make the test_role default
    test_role.is_default = True
    db.commit()
    
    role_data = {
        "name": "Another Default Role",
        "description": "This should fail",
        "is_default": True,
        "permissions": []
    }
    
    response = client.post("/api/v1/roles", json=role_data)
    assert response.status_code == 400
    assert "Organization already has a default role" in response.json()["detail"]

def test_list_roles(client: TestClient, test_role):
    """Test listing all roles"""
    response = client.get("/api/v1/roles")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == test_role.name
    assert data[0]["description"] == test_role.description

def test_get_role(client: TestClient, test_role):
    """Test getting a specific role"""
    response = client.get(f"/api/v1/roles/{test_role.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_role.name
    assert data["description"] == test_role.description

def test_update_role(client: TestClient, test_role, test_permissions):
    """Test updating a role"""
    update_data = {
        "name": "Updated Role Name",
        "description": "Updated description",
        "permissions": [{"id": perm.id, "name": perm.name, "description": perm.description} for perm in test_permissions[:1]]
    }
    
    response = client.put(f"/api/v1/roles/{test_role.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert len(data["permissions"]) == 1

def test_delete_role(client: TestClient, db, test_organization):
    """Test deleting a role"""
    # Create a new role that won't be used by any users
    role = Role(
        name="Role To Delete",
        description="This role will be deleted",
        organization_id=test_organization.id,
        is_default=False
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    
    response = client.delete(f"/api/v1/roles/{role.id}")
    assert response.status_code == 204

def test_add_permission_to_role(client: TestClient, test_role, test_permissions):
    """Test adding a permission to a role"""
    permission = test_permissions[0]
    response = client.post(f"/api/v1/roles/{test_role.id}/permissions/{permission.name}")
    assert response.status_code == 200
    assert response.json()["message"] == "Permission added to role"

def test_remove_permission_from_role(client: TestClient, test_role, test_permissions):
    """Test removing a permission from a role"""
    permission = test_permissions[0]
    response = client.delete(f"/api/v1/roles/{test_role.id}/permissions/{permission.name}")
    assert response.status_code == 200
    assert response.json()["message"] == "Permission removed from role"

def test_list_permissions(client: TestClient, test_permissions):
    """Test listing all available permissions"""
    response = client.get("/api/v1/roles/permissions/all")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == len(test_permissions)

# Negative test cases

def test_create_role_duplicate_name(client: TestClient, test_role):
    """Test creating a role with duplicate name"""
    role_data = {
        "name": test_role.name,  # Same name as existing role
        "description": "This should fail",
        "is_default": False,
        "permissions": []
    }
    
    response = client.post("/api/v1/roles", json=role_data)
    assert response.status_code == 400
    assert "Role with this name already exists" in response.json()["detail"]

def test_update_default_role(client: TestClient, test_role, db):
    """Test updating a default role"""
    # Make the role default
    test_role.is_default = True
    db.commit()
    
    update_data = {
        "name": "Updated Name",
        "description": "This should fail"
    }
    
    response = client.put(f"/api/v1/roles/{test_role.id}", json=update_data)
    assert response.status_code == 400
    assert "Cannot modify default role" in response.json()["detail"]

def test_delete_default_role(client: TestClient, test_role, db):
    """Test deleting a default role"""
    # Make the role default
    test_role.is_default = True
    db.commit()
    
    response = client.delete(f"/api/v1/roles/{test_role.id}")
    assert response.status_code == 400
    assert "Cannot delete default role" in response.json()["detail"]

def test_delete_role_in_use(client: TestClient, test_role, test_user):
    """Test deleting a role that is assigned to users"""
    response = client.delete(f"/api/v1/roles/{test_role.id}")
    assert response.status_code == 400
    assert "Cannot delete role that is assigned to users" in response.json()["detail"]

def test_get_nonexistent_role(client: TestClient):
    """Test getting a nonexistent role"""
    response = client.get("/api/v1/roles/999")
    assert response.status_code == 404
    assert "Role not found" in response.json()["detail"]

def test_update_nonexistent_role(client: TestClient):
    """Test updating a nonexistent role"""
    update_data = {
        "name": "Updated Name",
        "description": "This should fail"
    }
    
    response = client.put("/api/v1/roles/999", json=update_data)
    assert response.status_code == 404
    assert "Role not found" in response.json()["detail"]

def test_delete_nonexistent_role(client: TestClient):
    """Test deleting a nonexistent role"""
    response = client.delete("/api/v1/roles/999")
    assert response.status_code == 404
    assert "Role not found" in response.json()["detail"]

def test_add_invalid_permission(client: TestClient, test_role):
    """Test adding an invalid permission to a role"""
    response = client.post(f"/api/v1/roles/{test_role.id}/permissions/invalid_permission")
    assert response.status_code == 404
    assert "Permission not found" in response.json()["detail"]

def test_remove_invalid_permission(client: TestClient, test_role):
    """Test removing an invalid permission from a role"""
    response = client.delete(f"/api/v1/roles/{test_role.id}/permissions/invalid_permission")
    assert response.status_code == 404
    assert "Permission not found" in response.json()["detail"] 

# ------------------------------------------------- permission gating & escalation

@pytest.fixture
def unprivileged_client(db: Session, test_organization) -> TestClient:
    """A client whose role grants nothing.

    Every endpoint here except POST used to be Depends(get_current_user) with
    only an org check, so any authenticated user could rewrite roles — including
    granting their own role super_admin.
    """
    # Explicit id: the test_role fixture hardcodes id=1, so an autoincrement
    # here collides depending on which fixture resolves first.
    role = Role(id=99, name="No Permissions", organization_id=test_organization.id)
    db.add(role)
    db.commit()
    user = User(
        id=uuid4(),
        email="nopermissions@test.com",
        hashed_password="hashed_password",
        organization_id=test_organization.id,
        role_id=role.id,
        is_active=True,
        full_name="No Permissions",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    async def override_get_current_user():
        return user

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db

    yield TestClient(app)
    app.dependency_overrides.clear()


def test_role_endpoints_require_permissions(unprivileged_client: TestClient, test_role: Role):
    """None of the role endpoints are reachable without manage_roles/manage_users"""
    role_id = test_role.id
    assert unprivileged_client.get("/api/v1/roles").status_code == 403
    assert unprivileged_client.get(f"/api/v1/roles/{role_id}").status_code == 403
    assert unprivileged_client.get("/api/v1/roles/permissions/all").status_code == 403
    assert unprivileged_client.post("/api/v1/roles", json={"name": "X", "permissions": []}).status_code == 403
    assert unprivileged_client.put(f"/api/v1/roles/{role_id}", json={"name": "X"}).status_code == 403
    assert unprivileged_client.delete(f"/api/v1/roles/{role_id}").status_code == 403
    assert unprivileged_client.post(f"/api/v1/roles/{role_id}/permissions/manage_roles").status_code == 403
    assert unprivileged_client.delete(f"/api/v1/roles/{role_id}/permissions/manage_roles").status_code == 403


def test_cannot_grant_permission_caller_does_not_hold(client: TestClient, db: Session, test_role: Role):
    """The reported hole: POST /roles/{own_role_id}/permissions/super_admin"""
    db.add(Permission(name="super_admin", description="Has all permissions"))
    db.commit()

    response = client.post(f"/api/v1/roles/{test_role.id}/permissions/super_admin")

    assert response.status_code == 403
    assert "do not hold" in response.json()["detail"]
    db.refresh(test_role)
    assert "super_admin" not in {p.name for p in test_role.permissions}


def test_cannot_grant_unheld_permission_via_update(client: TestClient, db: Session, test_role: Role):
    """The same escalation through PUT rather than the permissions route"""
    super_admin = Permission(name="super_admin", description="Has all permissions")
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)

    response = client.put(
        f"/api/v1/roles/{test_role.id}",
        json={
            "name": test_role.name,
            "permissions": [
                {"id": super_admin.id, "name": "super_admin", "description": "Has all permissions"}
            ],
        },
    )

    assert response.status_code == 403
    db.refresh(test_role)
    assert "super_admin" not in {p.name for p in test_role.permissions}


def test_cannot_create_role_with_unheld_permission(client: TestClient, db: Session):
    """Creating a role is a grant too — otherwise the rule is trivially bypassed"""
    super_admin = Permission(name="super_admin", description="Has all permissions")
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)

    response = client.post(
        "/api/v1/roles",
        json={
            "name": "Backdoor",
            "description": "",
            "permissions": [{"id": super_admin.id, "name": "super_admin", "description": "Has all permissions"}],
        },
    )

    assert response.status_code == 403


def test_can_grant_permission_caller_holds(client: TestClient, db: Session, test_organization):
    """Granting something you do hold is unaffected"""
    other_role = Role(name="Other Role", organization_id=test_organization.id)
    db.add(other_role)
    db.commit()
    db.refresh(other_role)

    response = client.post(f"/api/v1/roles/{other_role.id}/permissions/manage_users")

    assert response.status_code == 200
    db.refresh(other_role)
    assert "manage_users" in {p.name for p in other_role.permissions}


def test_super_admin_can_grant_anything(db: Session, test_organization):
    """check_permissions short-circuits on super_admin, so an owner is unaffected"""
    super_admin = Permission(name="super_admin", description="Has all permissions")
    db.add(super_admin)
    db.commit()
    owner_role = Role(name="Owner", organization_id=test_organization.id)
    db.add(owner_role)
    db.commit()
    db.execute(role_permissions.insert().values(role_id=owner_role.id, permission_id=super_admin.id))
    db.commit()
    owner = User(
        id=uuid4(),
        email="owner@test.com",
        hashed_password="hashed_password",
        organization_id=test_organization.id,
        role_id=owner_role.id,
        is_active=True,
        full_name="Owner",
    )
    db.add(owner)
    target = Role(name="Target", organization_id=test_organization.id)
    db.add(target)
    db.commit()
    db.refresh(target)

    async def override_get_current_user():
        return owner

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db
    try:
        response = TestClient(app).post(f"/api/v1/roles/{target.id}/permissions/super_admin")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
