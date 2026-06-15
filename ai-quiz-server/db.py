"""SQLite 경로·연결 — 로컬, Render 영구 디스크, Turso embedded replica."""
from __future__ import annotations

import os
import shutil
import sqlite3
import threading

ROOT = os.path.dirname(os.path.abspath(__file__))
_lock = threading.Lock()

TURSO_URL = (
    os.environ.get("TURSO_DATABASE_URL")
    or os.environ.get("LIBSQL_URL")
    or ""
).strip()
TURSO_TOKEN = (
    os.environ.get("TURSO_AUTH_TOKEN")
    or os.environ.get("LIBSQL_AUTH_TOKEN")
    or ""
).strip()


def resolve_db_path() -> str:
    explicit = (os.environ.get("AUTH_DB_PATH") or "").strip()
    if explicit:
        return explicit
    data_dir = "/var/data"
    if os.path.isdir(data_dir) and os.access(data_dir, os.W_OK):
        return os.path.join(data_dir, "site.db")
    return os.path.join(ROOT, "auth.db")


DB_PATH = resolve_db_path()


def ensure_db_dir() -> None:
    parent = os.path.dirname(os.path.abspath(DB_PATH))
    if parent:
        os.makedirs(parent, exist_ok=True)


def use_turso() -> bool:
    return bool(TURSO_URL and TURSO_TOKEN)


def migrate_legacy_db() -> None:
    """로컬 auth.db → 영구 디스크 경로로 한 번만 복사."""
    legacy = os.path.join(ROOT, "auth.db")
    target = os.path.abspath(DB_PATH)
    if os.path.abspath(legacy) == target:
        return
    if os.path.isfile(legacy) and not os.path.isfile(target):
        ensure_db_dir()
        shutil.copy2(legacy, target)


class Row:
    """sqlite3.Row 호환 — libsql 튜플 결과를 dict-like로."""

    def __init__(self, description, values):
        if description and isinstance(description[0], (tuple, list)):
            keys = [col[0] for col in description]
        else:
            keys = list(description or [])
        self._keys = keys
        self._values = tuple(values)
        self._map = dict(zip(keys, self._values))

    def keys(self):
        return self._map.keys()

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return self._map[key]

    def __iter__(self):
        return iter(self._values)


class _LibsqlCursor:
    def __init__(self, cur):
        self._cur = cur
        self.lastrowid = getattr(cur, "lastrowid", None)

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        return Row(self._cur.description, row)

    def fetchall(self):
        return [Row(self._cur.description, r) for r in self._cur.fetchall()]


class _LibsqlConnection:
    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql, params=()):
        cur = self._conn.execute(sql, params)
        wrapped = _LibsqlCursor(cur)
        wrapped.lastrowid = cur.lastrowid
        return wrapped

    def executescript(self, script):
        return self._conn.executescript(script)

    def commit(self):
        self._conn.commit()
        if hasattr(self._conn, "sync"):
            try:
                self._conn.sync()
            except Exception:
                pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            self.commit()
        return False


def _connect_sqlite() -> sqlite3.Connection:
    ensure_db_dir()
    migrate_legacy_db()
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _connect_libsql() -> _LibsqlConnection:
    import libsql

    ensure_db_dir()
    migrate_legacy_db()
    raw = libsql.connect(
        DB_PATH,
        sync_url=TURSO_URL,
        auth_token=TURSO_TOKEN,
        sync_interval=30,
    )
    try:
        raw.sync()
    except Exception:
        pass
    return _LibsqlConnection(raw)


def connect():
    with _lock:
        if use_turso():
            return _connect_libsql()
        return _connect_sqlite()


def db_info() -> dict:
    return {
        "path": DB_PATH,
        "turso": use_turso(),
        "persistentDisk": os.path.isdir("/var/data") and os.access("/var/data", os.W_OK),
    }


def persistence_hint() -> str:
    if use_turso():
        return "Turso 클라우드 DB에 동기화 중 (계정 영구 저장)"
    if os.path.isdir("/var/data") and os.access("/var/data", os.W_OK):
        return "Render 영구 디스크에 저장 중"
    if os.environ.get("PORT"):
        return (
            "경고: 계정 DB가 임시 디스크에 있습니다. "
            "재배포·재시작 시 가입 계정이 사라집니다. "
            "Render 영구 디스크(/var/data) 또는 Turso(TURSO_DATABASE_URL)를 설정하세요."
        )
    return "로컬 SQLite (auth.db)"
