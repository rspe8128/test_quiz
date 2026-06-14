#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 퀴즈 생성 프록시 서버 (이식 가능)

사용법:
  set OPENAI_API_KEY=sk-...
  python server.py

기본 주소: http://localhost:8787
사이트 설정에 위 주소를 입력하면 어디서 호스팅해도 동일하게 동작합니다.

환경 변수:
  OPENAI_API_KEY  — 필수 (OpenAI 또는 OpenRouter 등 호환 API)
  AI_QUIZ_PORT    — 기본 8787
  AI_QUIZ_HOST    — 기본 127.0.0.1 (다른 PC에서 접속 시 0.0.0.0)
  AI_QUIZ_MODEL   — 기본 gpt-4o-mini
  AI_QUIZ_API_BASE — 기본 https://api.openai.com/v1
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT, "presets.json")

HOST = os.environ.get("AI_QUIZ_HOST") or ("0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
PORT = int(os.environ.get("PORT", os.environ.get("AI_QUIZ_PORT", "8787")))
API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
API_BASE = os.environ.get("AI_QUIZ_API_BASE", "https://api.openai.com/v1").rstrip("/")
MODEL = os.environ.get("AI_QUIZ_MODEL", "gpt-4o-mini")


def load_presets() -> dict:
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def fill_template(tpl: str, **kwargs) -> str:
    def repl(m):
        return str(kwargs.get(m.group(1), ""))

    return re.sub(r"\{\{(\w+)\}\}", repl, tpl)


def call_llm(system: str, user: str) -> list:
    if not API_KEY:
        raise RuntimeError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")

    payload = {
        "model": MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    req = urllib.request.Request(
        f"{API_BASE}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"API 오류 ({e.code}): {detail[:400]}") from e

    text = body.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not text:
        raise RuntimeError("AI 응답이 비어 있습니다.")
    parsed = json.loads(text)
    return parsed.get("items") or parsed.get("questions") or []


class Handler(BaseHTTPRequestHandler):
    server_version = "AIQuizProxy/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _json(self, code: int, obj: dict):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/") in ("", "/health"):
            self._json(
                200,
                {
                    "ok": True,
                    "model": MODEL,
                    "has_key": bool(API_KEY),
                },
            )
            return
        self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path.rstrip("/") != "/generate":
            self._json(404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return

        preset_key = str(data.get("preset") or "generic")
        topic = str(data.get("topic") or "").strip()
        count = max(1, min(15, int(data.get("count") or 5)))

        if not topic:
            self._json(400, {"error": "topic required"})
            return

        presets = load_presets()
        preset = presets.get(preset_key) or presets["generic"]

        try:
            items = call_llm(
                preset["system"],
                fill_template(preset["userTemplate"], topic=topic, count=count),
            )
            self._json(200, {"items": items})
        except Exception as e:
            self._json(500, {"error": str(e)})


def main():
    if not API_KEY:
        print("경고: OPENAI_API_KEY가 없습니다. /generate 요청은 실패합니다.", file=sys.stderr)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"AI 퀴즈 서버 → http://{HOST}:{PORT}")
    print("헬스체크: GET /health")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n종료")
        httpd.server_close()


if __name__ == "__main__":
    main()
