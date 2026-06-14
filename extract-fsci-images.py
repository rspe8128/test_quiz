# -*- coding: utf-8 -*-
"""Extract images and page renders from biology PDF."""
import json
from pathlib import Path

import fitz  # PyMuPDF

PDF = Path(r"C:\Users\marin\Downloads\모의고사-해설-기말고사-대비순서.pdf")
ROOT = Path(__file__).resolve().parent
OUT = ROOT / "fsci-assets"
META = OUT / "manifest.json"

# Biology section pages (1-based) from PDF structure
PAGE_SECTIONS = {
    "bio-material": list(range(4, 16)),   # 2-3 자연의 구성물질 + 점검 전
    "bio-cell": list(range(22, 32)),      # 3-1 세포
    "bio-metabolism": list(range(36, 47)), # 3-2 물질대사
    "bio-genetics": list(range(49, 60)),   # 3-3 유전정보
}


def main():
    OUT.mkdir(exist_ok=True)
    doc = fitz.open(PDF)
    manifest = {"pdf": str(PDF), "total_pages": len(doc), "embedded": [], "pages": {}}

    img_idx = 0
    for page_num in range(len(doc)):
        page = doc[page_num]
        p1 = page_num + 1
        images = page.get_images(full=True)
        for img in images:
            xref = img[0]
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            ext = base.get("ext", "png")
            if ext in ("jpx", "jpeg2000"):
                ext = "jpg"
            img_idx += 1
            name = f"embed-p{p1:02d}-{img_idx:03d}.{ext}"
            path = OUT / name
            path.write_bytes(base["image"])
            manifest["embedded"].append({
                "file": f"fsci-assets/{name}",
                "page": p1,
                "width": base.get("width"),
                "height": base.get("height"),
            })

    # Render full pages for section slides (2x zoom for readability)
    zoom = 2.0
    mat = fitz.Matrix(zoom, zoom)
    for section, pages in PAGE_SECTIONS.items():
        sec_dir = OUT / section
        sec_dir.mkdir(exist_ok=True)
        manifest["pages"][section] = []
        for p1 in pages:
            if p1 > len(doc):
                continue
            page = doc[p1 - 1]
            pix = page.get_pixmap(matrix=mat, alpha=False)
            name = f"page-{p1:02d}.png"
            rel = f"fsci-assets/{section}/{name}"
            pix.save(sec_dir / name)
            manifest["pages"][section].append({"file": rel, "page": p1})

    META.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("pages", len(doc))
    print("embedded images", len(manifest["embedded"]))
    for sec, items in manifest["pages"].items():
        print(sec, len(items), "page renders")
    print("wrote", META)


if __name__ == "__main__":
    main()
