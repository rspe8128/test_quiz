"""계정별 AI 퀴즈 문제·진행도 저장."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

import auth_store

DB_PATH = auth_store.DB_PATH


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_ai_quiz_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_ai_quiz (
                user_id INTEGER NOT NULL,
                app_id TEXT NOT NULL,
                items_json TEXT NOT NULL DEFAULT '[]',
                prog_json TEXT NOT NULL DEFAULT '{}',
                updated_at TEXT NOT NULL,
                PRIMARY KEY (user_id, app_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.commit()


def _default_prog() -> dict:
    return {"mastered": {}, "wrongCnt": {}, "best": 0}


def get_data(user_id: int, app_id: str) -> dict:
    app_id = app_id.strip()
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM user_ai_quiz WHERE user_id = ? AND app_id = ?",
            (user_id, app_id),
        ).fetchone()
    if not row:
        return {"items": [], "prog": _default_prog(), "updatedAt": None}
    try:
        items = json.loads(row["items_json"])
    except json.JSONDecodeError:
        items = []
    try:
        prog = json.loads(row["prog_json"])
    except json.JSONDecodeError:
        prog = _default_prog()
    return {
        "items": items if isinstance(items, list) else [],
        "prog": prog if isinstance(prog, dict) else _default_prog(),
        "updatedAt": row["updated_at"],
    }


def save_data(user_id: int, app_id: str, items: list | None, prog: dict | None) -> dict:
    app_id = app_id.strip()
    current = get_data(user_id, app_id)
    if items is None:
        items = current["items"]
    if prog is None:
        prog = current["prog"]
    if not isinstance(items, list):
        items = []
    if not isinstance(prog, dict):
        prog = _default_prog()

    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO user_ai_quiz (user_id, app_id, items_json, prog_json, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, app_id) DO UPDATE SET
                items_json = excluded.items_json,
                prog_json = excluded.prog_json,
                updated_at = excluded.updated_at
            """,
            (user_id, app_id, json.dumps(items, ensure_ascii=False), json.dumps(prog, ensure_ascii=False), _now()),
        )
        conn.commit()
    return get_data(user_id, app_id)


def _summarize_prog(prog: dict, item_count: int) -> dict:
    mastered = prog.get("mastered") or {}
    wrong = prog.get("wrongCnt") or {}
    mastered_n = sum(1 for v in mastered.values() if v)
    wrong_n = sum(int(v or 0) for v in wrong.values())
    return {
        "itemCount": item_count,
        "masteredCount": mastered_n,
        "wrongAttempts": wrong_n,
        "bestStreak": int(prog.get("best") or 0),
    }


def list_user_stats() -> list[dict]:
    users = auth_store.list_users()
    out = []
    for u in users:
        if u["role"] == "admin":
            continue
        with _connect() as conn:
            rows = conn.execute(
                "SELECT app_id, items_json, prog_json, updated_at FROM user_ai_quiz WHERE user_id = ?",
                (u["id"],),
            ).fetchall()
        subjects = []
        total_items = 0
        total_mastered = 0
        for row in rows:
            try:
                items = json.loads(row["items_json"])
            except json.JSONDecodeError:
                items = []
            try:
                prog = json.loads(row["prog_json"])
            except json.JSONDecodeError:
                prog = _default_prog()
            if not isinstance(items, list):
                items = []
            summary = _summarize_prog(prog, len(items))
            total_items += summary["itemCount"]
            total_mastered += summary["masteredCount"]
            if summary["itemCount"] > 0 or summary["masteredCount"] > 0 or summary["wrongAttempts"] > 0:
                subjects.append(
                    {
                        "appId": row["app_id"],
                        "updatedAt": row["updated_at"],
                        **summary,
                    }
                )
        out.append(
            {
                "id": u["id"],
                "username": u["username"],
                "displayName": u["displayName"],
                "status": u["status"],
                "totalAiItems": total_items,
                "totalMastered": total_mastered,
                "subjects": subjects,
            }
        )
    return out


def get_user_detail(user_id: int) -> dict | None:
    row = auth_store.get_user_by_id(user_id)
    if not row:
        return None
    user = {
        "id": row["id"],
        "username": row["username"],
        "displayName": row["display_name"],
        "role": row["role"],
        "status": row["status"],
        "createdAt": row["created_at"],
    }
    with _connect() as conn:
        rows = conn.execute(
            "SELECT app_id, items_json, prog_json, updated_at FROM user_ai_quiz WHERE user_id = ?",
            (user_id,),
        ).fetchall()
    subjects = []
    for r in rows:
        data = get_data(user_id, r["app_id"])
        summary = _summarize_prog(data["prog"], len(data["items"]))
        subjects.append(
            {
                "appId": r["app_id"],
                "updatedAt": r["updated_at"],
                "items": data["items"],
                "prog": data["prog"],
                **summary,
            }
        )
    user["aiSubjects"] = subjects
    return user
