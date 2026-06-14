# -*- coding: utf-8 -*-
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "final-social-data.json").read_text(encoding="utf-8-sig"))
META = DATA["meta"]
TABS = DATA["tabs"]

def render_panel(tab, first_id):
    parts = []
    for block in tab["blocks"]:
        t = block["type"]
        if t == "h4":
            parts.append("            <h4>" + block["text"] + "</h4>")
        elif t == "p":
            if block.get("label"):
                parts.append('            <p><span class="fk-k">' + block["label"] + "</span> " + block["text"] + "</p>")
            else:
                parts.append("            <p>" + block["text"] + "</p>")
        elif t == "ul":
            items = "".join("<li>" + i + "</li>" for i in block["items"])
            parts.append("            <ul>" + items + "</ul>")
        elif t == "table":
            rows = []
            for r in block["rows"]:
                tag = "th" if r.get("head") else "td"
                rows.append("<tr>" + "".join("<" + tag + ">" + c + "</" + tag + ">" for c in r["cells"]) + "</tr>")
            parts.append('            <table class="fk-compare">' + "".join(rows) + "</table>")
        elif t == "gloss":
            spans = "".join('<span><strong>' + g["k"] + "</strong>" + g["v"] + "</span>" for g in block["items"])
            parts.append('            <div class="fk-gloss">' + spans + "</div>")
    body = "\n".join(parts)
    hidden = "" if tab["id"] == first_id else " hidden"
    active = " is-on" if tab["id"] == first_id else ""
    qn = 10
    return (
        '        <section class="fk-panel' + active + '" data-fs-panel="' + tab["id"] + '" role="tabpanel"' + hidden + ">\n"
        '          <p class="fk-panel-title">' + tab["title"] + "</p>\n"
        '          <div class="fs-concept" data-fs-concept="' + tab["id"] + '">\n'
        "          <div class=\"fk-card\">\n" + body + "\n"
        "          </div>\n"
        '            <button type="button" class="fs-quiz-start" data-fs-quiz-start="' + tab["id"] + '">연습문제 풀기<small>객관식 ' + str(qn) + "문항</small></button>\n"
        "          </div>\n"
        '          <div class="fs-quiz-wrap" data-fs-quiz-wrap="' + tab["id"] + '" hidden>\n'
        '            <div class="fs-quiz-app" data-fs-quiz-app="' + tab["id"] + '"></div>\n'
        "          </div>\n"
        "        </section>"
    )

def render_tabs():
    lines = []
    for i, tab in enumerate(TABS):
        on = " is-on" if i == 0 else ""
        sel = "true" if i == 0 else "false"
        lines.append(
            '          <button type="button" class="fk-topnav__btn' + on + '" data-fs-tab="' + tab["id"] + '" role="tab" aria-selected="' + sel + '">' + tab["label"] + "<small>" + tab["small"] + "</small></button>"
        )
    return "\n".join(lines)

first_id = TABS[0]["id"]
panels = "\n\n".join(render_panel(t, first_id) for t in TABS)

html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>""" + META["title"] + """</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="site-theme.css" />
  <link rel="stylesheet" href="final-social.css" />
</head>
<body>
  <div class="shell">
    <nav class="site-nav">
      <a class="site-nav__link" href="index.html#final">&larr; """ + META["nav"] + """</a>
    </nav>
    <p class="page-eyebrow">""" + META["eyebrow"] + """</p>
    <h1 class="app-title">""" + META["heading"] + """</h1>
    <div class="page-card" id="fsRoot">
      <p class="fk-lead">""" + META["lead"] + """</p>
      <div class="fk-topnav-wrap">
        <div class="fk-topnav" id="fsTopnav" role="tablist" aria-label=\"""" + META["tablist"] + """\">
""" + render_tabs() + """
        </div>
      </div>
      <div id="fsPanels">

""" + panels + """

      </div>
    </div>
  </div>
  <div class="footer">""" + META["footer"] + """</div>
  <link rel="stylesheet" href="bgm-player.css" />
  <script src="bgm-player.js" defer></script>
  <script src="fs-quiz-data.js" charset="UTF-8"></script>
  <script src="final-social-app.js" charset="UTF-8" defer></script>
</body>
</html>
"""

(ROOT / "final-social.html").write_text(html, encoding="utf-8", newline="\r\n")
print("ok")
