"""SQLite 경로·연결 — 로컬, Render 영구 디스크, Turso embedded replica."""
from __future__ import annotations

import os
import shutil
import sqlite3
import threading

ROOT = os.path.dirname(os.path.abspath(__file__))
_lock = threading.Lock()
_sync_lock = threading.Lock()
_sync_timer: threading.Timer | None = None
_shared_conn = None

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
SYNC_DEBOUNCE_SEC = float(os.environ.get("TURSO_SYNC_DEBOUNCE_SEC", "2"))


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
    legacy = os.path.join(ROOT, "auth.db")
    target = os.path.abspath(DB_PATH)
    if os.path.abspath(legacy) == target:
        return
    if os.path.isfile(legacy) and not os.path.isfile(target):
        ensure_db_dir()
        shutil.copy2(legacy, target)


class Row:
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
        result = self._conn.executescript(script)
        _schedule_turso_sync()
        return result

    def commit(self):
        self._conn.commit()
        _schedule_turso_sync()


class _DbSession:
    """공유 연결 — with 블록마다 닫지 않고 commit만 수행."""

    def __enter__(self):
        _lock.acquire()
        conn = _get_shared_connection()
        if use_turso():
            self._wrapper = _LibsqlConnection(conn)
            return self._wrapper
        self._wrapper = None
        return conn

    def __exit__(self, exc_type, exc, tb):
        try:
            if exc_type is None:
                if self._wrapper is not None:
                    self._wrapper.commit()
                else:
                    _get_shared_connection().commit()
        finally:
            _lock.release()
        return False


def _create_sqlite_connection() -> sqlite3.Connection:
    ensure_db_dir()
    migrate_legacy_db()
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def _create_libsql_connection():
    import libsql

    ensure_db_dir()
    migrate_legacy_db()
    return libsql.connect(
        DB_PATH,
        sync_url=TURSO_URL,
        auth_token=TURSO_TOKEN,
        sync_interval=60,
    )


def _get_shared_connection():
    global _shared_conn
    if _shared_conn is None:
        _shared_conn = _create_libsql_connection() if use_turso() else _create_sqlite_connection()
    return _shared_conn


def _do_turso_sync() -> None:
    global _sync_timer
    with _lock:
        conn = _shared_conn
        if conn is not None and hasattr(conn, "sync"):
            try:
                conn.sync()
            except Exception:
                pass
    with _sync_lock:
        _sync_timer = None


def _schedule_turso_sync() -> None:
    global _sync_timer
    if not use_turso():
        return
    with _sync_lock:
        if _sync_timer is not None:
            _sync_timer.cancel()
        _sync_timer = threading.Timer(SYNC_DEBOUNCE_SEC, _do_turso_sync)
        _sync_timer.daemon = True
        _sync_timer.start()


def connect():
    return _DbSession()


def warmup() -> None:
    """서버 시작 시 DB 연결·Turso 초기 동기화 1회."""
    with _DbSession() as conn:
        conn.execute("SELECT 1")
    if use_turso():
        with _lock:
            raw = _shared_conn
            if raw is not None and hasattr(raw, "sync"):
                try:
                    raw.sync()
                except Exception:
                    pass


def flush() -> None:
    """종료 전 Turso 동기화."""
    global _sync_timer
    with _sync_lock:
        if _sync_timer is not None:
            _sync_timer.cancel()
            _sync_timer = None
    if use_turso():
        _do_turso_sync()


def db_info() -> dict:
    return {
        "path": DB_PATH,
        "turso": use_turso(),
        "persistentDisk": os.path.isdir("/var/data") and os.access("/var/data", os.W_OK),
    }


def persistence_hint() -> str:
    if use_turso():
        return "Turso 클라우드 DB (백그라운드 동기화)"
    if os.path.isdir("/var/data") and os.access("/var/data", os.W_OK):
        return "Render 영구 디스크에 저장 중"
    if os.environ.get("PORT"):
        return (
            "경고: 계정 DB가 임시 디스크에 있습니다. "
            "재배포·재시작 시 가입 계정이 사라집니다."
        )
    return "로컬 SQLite (auth.db)"
