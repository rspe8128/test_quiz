"""SQLite 사용자·세션 저장 (stdlib only)."""
from __future__ import annotations

import hashlib
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("AUTH_DB_PATH", os.path.join(ROOT, "auth.db"))
SESSION_DAYS = int(os.environ.get("AUTH_SESSION_DAYS", "30"))
ADMIN_USERNAME = (os.environ.get("AUTH_ADMIN_USERNAME") or "rspe").strip().lower()
ADMIN_PASSWORD = os.environ.get("AUTH_ADMIN_PASSWORD", "").strip()
ADMIN_DISPLAY = (os.environ.get("AUTH_ADMIN_DISPLAY") or "유노 남친").strip()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _hash_password(password: str, salt: bytes | None = None) -> str:
    if salt is None:
        salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return salt.hex() + ":" + digest.hex()


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return secrets.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def init_db() -> None:
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                display_name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        conn.commit()

    ensure_admin()


def ensure_admin() -> None:
    """환경 변수 기준 관리자 계정 생성·동기화 (role=admin → 대시보드 접근)."""
    if not ADMIN_PASSWORD:
        return
    row = get_user_by_username(ADMIN_USERNAME)
    if not row:
        create_user(
            ADMIN_USERNAME,
            ADMIN_PASSWORD,
            ADMIN_DISPLAY,
            role="admin",
            status="approved",
        )
        return
    if row["role"] != "admin":
        return
    with _connect() as conn:
        conn.execute(
            """
            UPDATE users
            SET password_hash = ?, display_name = ?, status = 'approved', role = 'admin'
            WHERE id = ?
            """,
            (_hash_password(ADMIN_PASSWORD), ADMIN_DISPLAY, row["id"]),
        )
        conn.commit()


def _user_dict(row: sqlite3.Row | None) -> dict | None:
    if not row:
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "displayName": row["display_name"],
        "role": row["role"],
        "status": row["status"],
        "createdAt": row["created_at"],
    }


def get_user_by_username(username: str) -> sqlite3.Row | None:
    with _connect() as conn:
        return conn.execute(
            "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
            (username.strip().lower(),),
        ).fetchone()


def get_user_by_id(user_id: int) -> sqlite3.Row | None:
    with _connect() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def create_user(
    username: str,
    password: str,
    display_name: str,
    *,
    role: str = "user",
    status: str = "pending",
) -> dict:
    username = username.strip().lower()
    display_name = (display_name or username).strip() or username
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO users (username, password_hash, display_name, role, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (username, _hash_password(password), display_name, role, status, _now()),
        )
        conn.commit()
        user_id = cur.lastrowid
    row = get_user_by_id(user_id)
    return _user_dict(row)  # type: ignore[return-value]


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires = (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).isoformat()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires),
        )
        conn.commit()
    return token


def delete_session(token: str) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()


def get_user_by_token(token: str) -> dict | None:
    if not token:
        return None
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT u.*, s.expires_at AS session_expires
            FROM users u
            JOIN sessions s ON s.user_id = u.id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()
    if not row:
        return None
    expires = datetime.fromisoformat(row["session_expires"])
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        delete_session(token)
        return None
    return _user_dict(row)


def authenticate(username: str, password: str) -> dict | None:
    row = get_user_by_username(username)
    if not row or not _verify_password(password, row["password_hash"]):
        return None
    return _user_dict(row)


def list_users(status: str | None = None) -> list[dict]:
    with _connect() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM users WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    return [_user_dict(r) for r in rows]  # type: ignore[misc]


def set_user_status(user_id: int, status: str) -> dict | None:
    with _connect() as conn:
        conn.execute("UPDATE users SET status = ? WHERE id = ?", (status, user_id))
        conn.commit()
    return _user_dict(get_user_by_id(user_id))
