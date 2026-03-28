import pytest
from unittest.mock import AsyncMock, patch


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
