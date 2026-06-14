# -*- coding: utf-8 -*-
"""Render PDF page images extracted from user material."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "fsci-assets" / "manifest.json"


def _load():
    if not MANIFEST.exists():
        return {"pages": {}}
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def render_pdf_pages(section_id, title="원본 자료 슬라이드"):
    data = _load()
    pages = data.get("pages", {}).get(section_id, [])
    if not pages:
        return (
            '<p class="fk-note">PDF 슬라이드가 없습니다. '
            "프로젝트 폴더에서 <code>python extract-fsci-images.py</code>를 실행하세요.</p>"
        )
    parts = [
        '<div class="fsci-pdf-block">',
        f"<h4>{title}</h4>",
        '<p class="fsci-pdf-lead">제공해 주신 '
        '<strong>모의고사-해설-기말고사-대비순서.pdf</strong>에서 해당 페이지를 그대로 추출했습니다.</p>',
        '<div class="fsci-pdf-gallery">',
    ]
    for item in pages:
        p = item["page"]
        src = item["file"]
        parts.append(
            f'<figure class="fsci-pdf-page">'
            f'<img src="{src}" alt="PDF {p}쪽" loading="lazy" width="960" height="540" />'
            f'<figcaption>PDF p.{p}</figcaption></figure>'
        )
    parts.append("</div></div>")
    return "\n".join(parts)
