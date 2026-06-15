"""사용자 → 관리자 요청(첨부파일) 저장."""
from __future__ import annotations

import base64
import os
import re
import sqlite3
from datetime import datetime, timezone

import auth_store

DB_PATH = auth_store.DB_PATH
MAX_FILE_BYTES = int(os.environ.get("REQUEST_MAX_FILE_MB", "50")) * 1024 * 1024
ALLOWED_CATEGORIES = {"problem", "material", "other"}
ALLOWED_STATUS = {"pending", "read", "replied", "closed"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_requests_db() -> None:
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                admin_reply TEXT,
                created_at TEXT NOT NULL,
                read_at TEXT,
                replied_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS request_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                size INTEGER NOT NULL,
                data BLOB NOT NULL,
                FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
            );
            """
        )
        conn.commit()


def _category_label(cat: str) -> str:
    return {
        "problem": "문제 추가 요청",
        "material": "자료 추가 요청",
        "other": "기타 요청",
    }.get(cat, cat)


def _status_label(status: str) -> str:
    return {
        "pending": "접수됨",
        "read": "확인함",
        "replied": "답변 완료",
        "closed": "처리 완료",
    }.get(status, status)


def _sanitize_filename(name: str) -> str:
    name = os.path.basename(name.strip()) or "file"
    name = re.sub(r"[^\w.\-가-힣 ]+", "_", name)
    return name[:120] or "file"


def _decode_file(item: dict) -> tuple[str, str, bytes]:
    filename = _sanitize_filename(str(item.get("name") or "file"))
    mime = str(item.get("mime") or "application/octet-stream").split(";")[0].strip()[:80]
    raw = item.get("data") or ""
    if isinstance(raw, str) and raw.startswith("data:"):
        raw = raw.split(",", 1)[-1]
    try:
        data = base64.b64decode(raw, validate=True)
    except Exception as exc:
        raise ValueError(f"첨부파일 '{filename}' 형식이 올바르지 않습니다.") from exc
    if len(data) > MAX_FILE_BYTES:
        mb = MAX_FILE_BYTES // (1024 * 1024)
        raise ValueError(f"첨부파일 '{filename}'은(는) {mb}MB 이하여야 합니다.")
    if len(data) == 0:
        raise ValueError(f"첨부파일 '{filename}'이(가) 비어 있습니다.")
    return filename, mime, data


def _files_meta(request_id: int) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT id, filename, mime_type, size FROM request_files WHERE request_id = ? ORDER BY id",
            (request_id,),
        ).fetchall()
    return [
        {"id": r["id"], "filename": r["filename"], "mime": r["mime_type"], "size": r["size"]}
        for r in rows
    ]


def _request_dict(row: sqlite3.Row, *, include_body: bool = True) -> dict:
    item = {
        "id": row["id"],
        "userId": row["user_id"],
        "category": row["category"],
        "categoryLabel": _category_label(row["category"]),
        "title": row["title"],
        "status": row["status"],
        "statusLabel": _status_label(row["status"]),
        "adminReply": row["admin_reply"],
        "createdAt": row["created_at"],
        "readAt": row["read_at"],
        "repliedAt": row["replied_at"],
        "fileCount": 0,
    }
    if include_body:
        item["body"] = row["body"]
    files = _files_meta(row["id"])
    item["fileCount"] = len(files)
    item["files"] = files
    user = auth_store.get_user_by_id(row["user_id"])
    if user:
        item["fromName"] = user["display_name"]
        item["fromUsername"] = user["username"]
    return item


def create_request(user_id: int, category: str, title: str, body: str, files: list[dict]) -> dict:
    category = category.strip().lower()
    if category not in ALLOWED_CATEGORIES:
        raise ValueError("요청 유형이 올바르지 않습니다.")
    title = title.strip()
    body = body.strip()
    if not title or len(title) > 120:
        raise ValueError("제목은 1~120자여야 합니다.")
    if not body or len(body) > 5000:
        raise ValueError("내용은 1~5000자여야 합니다.")

    decoded_files = [_decode_file(f) for f in files]

    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO requests (user_id, category, title, body, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', ?)
            """,
            (user_id, category, title, body, _now()),
        )
        request_id = cur.lastrowid
        for filename, mime, data in decoded_files:
            conn.execute(
                """
                INSERT INTO request_files (request_id, filename, mime_type, size, data)
                VALUES (?, ?, ?, ?, ?)
                """,
                (request_id, filename, mime, len(data), data),
            )
        conn.commit()

    row = _get_row(request_id)
    return _request_dict(row)  # type: ignore[arg-type]


def _get_row(request_id: int) -> sqlite3.Row | None:
    with _connect() as conn:
        return conn.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()


def list_for_user(user_id: int) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    return [_request_dict(r, include_body=False) for r in rows]


def list_for_admin(status: str | None = None) -> list[dict]:
    with _connect() as conn:
        if status and status in ALLOWED_STATUS:
            rows = conn.execute(
                "SELECT * FROM requests WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM requests ORDER BY created_at DESC").fetchall()
    return [_request_dict(r, include_body=False) for r in rows]


def get_request(request_id: int) -> dict | None:
    row = _get_row(request_id)
    if not row:
        return None
    return _request_dict(row)


def get_file(request_id: int, file_id: int) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT * FROM request_files
            WHERE id = ? AND request_id = ?
            """,
            (file_id, request_id),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "requestId": request_id,
        "filename": row["filename"],
        "mime": row["mime_type"],
        "size": row["size"],
        "data": base64.b64encode(row["data"]).decode("ascii"),
    }


def mark_read(request_id: int) -> dict | None:
    row = _get_row(request_id)
    if not row:
        return None
    if row["status"] == "pending":
        with _connect() as conn:
            conn.execute(
                "UPDATE requests SET status = 'read', read_at = ? WHERE id = ?",
                (_now(), request_id),
            )
            conn.commit()
    return get_request(request_id)


def reply_request(request_id: int, reply: str, status: str = "replied") -> dict | None:
    reply = reply.strip()
    if not reply:
        raise ValueError("답변 내용을 입력해 주세요.")
    if len(reply) > 3000:
        raise ValueError("답변은 3000자 이하여야 합니다.")
    if status not in {"replied", "closed"}:
        status = "replied"
    row = _get_row(request_id)
    if not row:
        return None
    now = _now()
    with _connect() as conn:
        conn.execute(
            """
            UPDATE requests
            SET admin_reply = ?, status = ?, replied_at = ?, read_at = COALESCE(read_at, ?)
            WHERE id = ?
            """,
            (reply, status, now, now, request_id),
        )
        conn.commit()
    return get_request(request_id)
