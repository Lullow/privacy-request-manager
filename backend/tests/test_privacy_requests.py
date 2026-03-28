import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch

from models import Token, User
from auth.utils import generate_token


async def _create_verified_user_and_token(session, email="user@example.com"):
    import bcrypt
    from datetime import timedelta

    hashed = bcrypt.hashpw(b"secret123", bcrypt.gensalt()).decode()
    user = User(
        email=email,
        password_hash=hashed,
        is_verified=True,
        verification_token=None,
        created_at=datetime.utcnow(),
    )
    session.add(user)
    await session.flush()

    token = Token(
        token=generate_token(),
        user_id=user.id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    session.add(token)
    await session.commit()
    return user, token.token


@pytest.mark.asyncio
async def test_create_privacy_request(client, session):
    _, token = await _create_verified_user_and_token(session, "creator@example.com")
    resp = await client.post(
        "/api/privacy-requests",
        json={
            "company_name": "Acme AB",
            "company_email": "gdpr@acme.com",
            "full_name": "Anna Svensson",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["company_name"] == "Acme AB"
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_list_privacy_requests(client, session):
    _, token = await _create_verified_user_and_token(session, "lister@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    await client.post(
        "/api/privacy-requests",
        json={"company_name": "Bolaget AB", "company_email": "gdpr@bolaget.com", "full_name": "Erik Lindqvist"},
        headers=headers,
    )
    resp = await client.get("/api/privacy-requests", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_privacy_request_not_found(client, session):
    _, token = await _create_verified_user_and_token(session, "getter@example.com")
    resp = await client.get("/api/privacy-requests/99999", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_privacy_request(client, session):
    _, token = await _create_verified_user_and_token(session, "deleter@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    create_resp = await client.post(
        "/api/privacy-requests",
        json={"company_name": "ToDelete AB", "company_email": "del@test.com", "full_name": "Per Nilsson"},
        headers=headers,
    )
    request_id = create_resp.json()["id"]
    del_resp = await client.delete(f"/api/privacy-requests/{request_id}", headers=headers)
    assert del_resp.status_code == 200
    get_resp = await client.get(f"/api/privacy-requests/{request_id}", headers=headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_invalid_profile_url_returns_422(client, session):
    _, token = await _create_verified_user_and_token(session, "urltest@example.com")
    resp = await client.post(
        "/api/privacy-requests",
        json={"company_name": "Test AB", "company_email": "t@test.com", "full_name": "Test", "profile_url": "not-a-url"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_invalid_birth_date_returns_422(client, session):
    _, token = await _create_verified_user_and_token(session, "datetest@example.com")
    resp = await client.post(
        "/api/privacy-requests",
        json={"company_name": "Test AB", "company_email": "t@test.com", "full_name": "Test", "birth_date": "31/01/1990"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_cannot_access_other_users_request(client, session):
    _, token_a = await _create_verified_user_and_token(session, "usera@example.com")
    _, token_b = await _create_verified_user_and_token(session, "userb@example.com")

    create_resp = await client.post(
        "/api/privacy-requests",
        json={"company_name": "Secret AB", "company_email": "s@secret.com", "full_name": "Anna A"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    request_id = create_resp.json()["id"]

    resp = await client.get(
        f"/api/privacy-requests/{request_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 404
