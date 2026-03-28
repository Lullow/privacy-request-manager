import pytest
from sqlalchemy import select
from unittest.mock import AsyncMock, patch

from models import User


@pytest.mark.asyncio
async def test_register_creates_user(client):
    with patch("auth.router.send_verification_email", new_callable=AsyncMock):
        resp = await client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "secret123",
        })
    assert resp.status_code == 201
    assert resp.json()["email_sent"] is True


@pytest.mark.asyncio
async def test_register_duplicate_unverified_resends_email(client):
    with patch("auth.router.send_verification_email", new_callable=AsyncMock):
        await client.post("/api/auth/register", json={
            "email": "dup@example.com",
            "password": "secret123",
        })
        resp = await client.post("/api/auth/register", json={
            "email": "dup@example.com",
            "password": "secret123",
        })
    assert resp.status_code == 201
    assert "verifierat" in resp.json()["message"]


@pytest.mark.asyncio
async def test_login_unverified_user_returns_403(client):
    with patch("auth.router.send_verification_email", new_callable=AsyncMock):
        await client.post("/api/auth/register", json={
            "email": "unverified@example.com",
            "password": "secret123",
        })
    resp = await client.post("/api/auth/login", json={
        "email": "unverified@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client):
    resp = await client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_without_token_returns_401(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_invalid_token_returns_401(client):
    resp = await client.get("/api/auth/me", headers={"Authorization": "Bearer faketoken"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_verify_email_invalid_token_returns_400(client):
    resp = await client.get("/api/auth/verify-email?token=nonexistent")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_verify_email_happy_path(client, session):
    with patch("auth.router.send_verification_email", new_callable=AsyncMock):
        await client.post("/api/auth/register", json={
            "email": "verify_happy@example.com",
            "password": "secret123",
        })

    result = await session.execute(select(User).where(User.email == "verify_happy@example.com"))
    user = result.scalar_one()
    token = user.verification_token

    resp = await client.get(f"/api/auth/verify-email?token={token}")
    assert resp.status_code == 200
    assert "access_token" in resp.json()

    login_resp = await client.post("/api/auth/login", json={
        "email": "verify_happy@example.com",
        "password": "secret123",
    })
    assert login_resp.status_code == 200


@pytest.mark.asyncio
async def test_register_weak_password_returns_422(client):
    resp = await client.post("/api/auth/register", json={
        "email": "weak@example.com",
        "password": "abc",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_password_no_digit_returns_422(client):
    resp = await client.post("/api/auth/register", json={
        "email": "nodigit@example.com",
        "password": "abcdefgh",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_password_no_letter_returns_422(client):
    resp = await client.post("/api/auth/register", json={
        "email": "noletter@example.com",
        "password": "12345678",
    })
    assert resp.status_code == 422
