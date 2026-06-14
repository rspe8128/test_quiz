# -*- coding: utf-8 -*-
"""Extract Korean history textbook + 197 quiz PDFs into JS data files."""
import json
import re
import pdfplumber
from pathlib import Path

from kh_concepts_content import get_detailed_concepts

ROOT = Path(__file__).resolve().parent
QUIZ_PDF = Path(r"c:\Users\marin\Desktop\4. 197제.pdf")
BOOK_PDF = Path(r"c:\Users\marin\Desktop\1. 교재.pdf")

SYM_MAP = {"①": 0, "②": 1, "③": 2, "④": 3, "⑤": 4}


def clean(s: str) -> str:
    if not s:
        return ""
    return s.replace("\uffff", "").replace("￿", "").strip()


def one_line(s: str) -> str:
    return re.sub(r"\s+", " ", clean(s))


def merge_body(old: str, new: str) -> str:
    if not old:
        return new
    if not new:
        return old
    score = lambda t: ("?" in t) * 3 + ("<보" in t) * 2 + len(t) / 200
    return new if score(new) > score(old) else old


def parse_column(text: str):
    ans_map = {}
    for m in re.finditer(r"(\d+)\.\s*\[정답\]\s*([^\n\[]*)", text):
        num = int(m.group(1))
        ans = one_line(m.group(2))
        start = m.end()
        ex = ""
        em = re.search(
            r"\[해설\]\s*(.+?)(?=\n\d+\.\s*\[정답\]|\Z)", text[start:], re.S
        )
        if em:
            ex = one_line(em.group(1))
        ans_map[num] = {"a": ans, "ex": ex[:900]}

    qtext = re.sub(r"\n\d+\.\s*\[정답\][\s\S]*$", "", text).strip()
    if not qtext.startswith("\n"):
        qtext = "\n" + qtext
    parts = re.split(r"\n(?=(\d{1,3})\.\s)", qtext)
    qs = {}
    for i in range(1, len(parts) - 1, 2):
        num = int(parts[i])
        body = parts[i + 1].strip()
        if num <= 197:
            qs[num] = body
    return qs, ans_map


def _norm_combo(s: str) -> str:
    return re.sub(r"[\s,]", "", s)


def _is_option_line(ln: str) -> bool:
    if not ln or len(ln) > 88:
        return False
    if re.match(r"^[「『\-<]", ln):
        return False
    if re.match(r"^\d+\.", ln):
        return False
    if re.match(r"^[ㄱ-ㅎ]\.", ln):
        return False
    if re.search(r"(다|었다|하였다|였다|있다|없다|한다|된다)\.?$", ln):
        return True
    if re.match(r"^\([가-힣]\)", ln):
        return True
    if len(ln) <= 24 and re.search(r"[ㄱ-ㅎ①②③④⑤]", ln):
        return True
    return False


def parse_opts_multiline(body: str):
    lines = [x.strip() for x in body.split("\n") if x.strip()]
    if not lines:
        return "", [], "text"

    q_lines = []
    i = 0
    while i < len(lines):
        q_lines.append(lines[i])
        if "?" in lines[i] or "<보" in lines[i]:
            i += 1
            break
        i += 1
    q = " ".join(q_lines)
    rest = lines[i:]

    if "<보" in body:
        bogi = []
        in_bogi = False
        for ln in rest:
            if "<보" in ln:
                in_bogi = True
                continue
            if in_bogi:
                bogi.append(ln)
        stmt = [x for x in bogi if re.match(r"^[ㄱ-ㅎ]\.", x)]
        combos = []
        for x in bogi:
            if re.match(r"^[ㄱ-ㅎ]\.", x):
                continue
            if len(x) <= 28 and re.search(r"[ㄱ-ㅎ①②③④⑤]", x):
                combos.append(x)
        combos = list(dict.fromkeys(combos))
        if combos:
            return q, combos[-6:], "combo"
        if stmt:
            return q, stmt, "combo_stmt"

    merged = []
    buf = ""
    for ln in rest:
        if re.match(r"^[「『\-]", ln):
            continue
        if not buf:
            buf = ln
            continue
        if len(buf) < 120 and not re.search(r"(다|었다|하였다|였다)\.?$", buf):
            buf = buf + " " + ln
        else:
            merged.append(buf)
            buf = ln
    if buf:
        merged.append(buf)

    opts = [x for x in merged if _is_option_line(x)]
    stem_extra = [x for x in merged if x not in opts]
    if stem_extra:
        q = (q + " " + " ".join(stem_extra)).strip()

    combos_end = []
    while opts and len(opts[-1]) <= 24 and re.search(r"^[ㄱ-ㅎ①②③④⑤,\s]+$", opts[-1].replace(" ", "")):
        combos_end.insert(0, opts.pop())
    if combos_end and not opts:
        return q, combos_end, "combo"
    if combos_end and opts:
        return q, combos_end, "combo"
    if 2 <= len(opts) <= 10:
        return q, opts, "statement"
    return q, opts, "text"


def _match_opt(opts: list, target: str) -> str:
    if not target:
        return ""
    if target in opts:
        return target
    nt = _norm_combo(target)
    for o in opts:
        if _norm_combo(o) == nt:
            return o
    for o in opts:
        if target in o or o in target:
            return o
    return ""


def _answer_from_named_entity(ex1: str, opts: list) -> str:
    patterns = [
        r"방납의 폐단으로 등장한 정책은\s*([가-힣]{2,10})",
        r"정책은\s*([가-힣]{2,10})이다",
        r"실시한 것이\s*\(?가\)?\s*([가-힣]{2,10})",
        r"([가-힣]{2,10})임을 유추",
        r"이 신분층은\s*([가-힣]{2,8})",
        r"이 제도는\s*([가-힣]{2,10})",
        r"([가-힣]{2,10})을\s*실시하였다",
        r"([가-힣]{2,10})에\s*대한\s*설명",
        r"([가-힣]{2,10})의\s*결과",
        r"이\s*농법은\s*([가-힣]{2,8})",
        r"이\s*전쟁은\s*([가-힣]{2,8})",
        r"([가-힣]{2,10})이\s*대두",
    ]
    for pat in patterns:
        m = re.search(pat, ex1)
        if not m:
            continue
        kw = m.group(1)
        for o in opts:
            if kw in o:
                return o
    return ""


def infer_answer_from_ex(q: str, opts: list, qtype: str, ex: str) -> str:
    if not ex:
        return ""
    ex1 = one_line(ex)

    named = _answer_from_named_entity(ex1, opts)
    if named:
        return named

    m = re.search(r"(?:정답|답)(?:은|이)?\s*([①②③④⑤])", ex1)
    if m and opts:
        idx = SYM_MAP.get(m.group(1), -1)
        if 0 <= idx < len(opts):
            return opts[idx]

    m = re.match(r"^([①②③④⑤])", ex1)
    if m and opts and qtype == "statement":
        idx = SYM_MAP[m.group(1)]
        if idx < len(opts):
            return opts[idx]

    if qtype in ("combo", "combo_stmt") and opts:
        wrong = set()
        for wm in re.finditer(r"([ㄱ-ㅎ](?:,\s*[ㄱ-ㅎ])+)\s*(?:은|이)\s", ex1):
            wrong.update(re.findall(r"[ㄱ-ㅎ]", wm.group(1)))
        for wm in re.finditer(r"([ㄱ-ㅎ])\s*(?:은|이)\s+[^\.]{0,20}(?:배척|아니|틀린|해당하지)", ex1):
            wrong.add(wm.group(1))
        correct = set()
        for cm in re.finditer(r"([ㄱ-ㅎ])\.\s*[^\.]{4,40}(?:주장|맞|옳|적절)", ex1):
            correct.add(cm.group(1))
        if "㉠" in ex1 and ("아니라" in ex1 or "아니다" in ex1):
            wrong.add("ㄱ")
        if correct:
            target = ",".join(sorted(correct))
            hit = _match_opt(opts, target)
            if hit:
                return hit
            for o in opts:
                oj = set(re.findall(r"[ㄱ-ㅎ]", o))
                if oj and oj <= correct and len(oj) == len(correct):
                    return o
        for pat in [
            r"([ㄱ-ㅎ](?:,\s*[ㄱ-ㅎ])+)",
            r"([ㄱ-ㅎ](?:\s+[ㄱ-ㅎ])+)",
        ]:
            cm = re.search(pat, ex1)
            if cm:
                hit = _match_opt(opts, cm.group(1))
                if hit:
                    return hit

    if ("두 번째" in q or "두번째" in q) and opts:
        sm = re.search(r"순서는\s*(.+?)\s*이다", ex1)
        if sm:
            seq = re.findall(r"\(([가-힣])\)", sm.group(1))
            if len(seq) >= 2:
                mark = seq[1]
                for o in opts:
                    if f"({mark})" in o:
                        return o

    if "㉠" in ex1 and ("아니라" in ex1 or "아니다" in ex1) and opts:
        wrong_j = {"ㄱ"}
        right_j = set()
        if "군신 요구 이후" in ex1 or "㉢" in ex1:
            right_j.add("ㄷ")
        if "주전론" in ex1 or "북벌" in ex1:
            right_j.add("ㄴ")
        if right_j:
            for o in opts:
                oj = set(re.findall(r"[ㄱ-ㅎ]", o))
                if oj == right_j:
                    return o
            target = ",".join(sorted(right_j))
            hit = _match_opt(opts, target)
            if hit:
                return hit

    if "ㄷ. 청의 문물" in ex1.replace(" ", "") and opts:
        for o in opts:
            if _norm_combo(o) == "ㄷ":
                return o

    if qtype == "statement" and opts:
        for phrase, kw in [
            ("북학론", "북학론"),
            ("북벌 운동", "북벌"),
            ("병자호란", "병자호란"),
            ("모내기", "모내기"),
            ("대동법", "대동법"),
            ("영정법", "영정법"),
            ("균역법", "균역법"),
            ("통신사", "통신사"),
            ("연행사", "연행사"),
            ("강화도 조약", "강화도"),
            ("동학", "동학"),
            ("갑오개혁", "갑오"),
        ]:
            if phrase in ex1 or kw in ex1:
                for o in opts:
                    if kw in o:
                        return o

        if "북벌 운동은 병자호란 이후" in ex1.replace(" ", ""):
            for o in opts:
                if "북벌 운동" in o:
                    return o
        if "병자호란 이후" in ex1:
            for o in opts:
                if "북벌" in o and "이후" not in o:
                    return o

        best_o, best_s = "", -999
        for o in opts:
            score = 0
            key = re.sub(r"[다었다하였다\.]$", "", o)[:18]
            if key and key in ex1:
                score += 20 + len(key)
            for w in re.findall(r"[가-힣]{3,}", o):
                if w in ex1:
                    score += len(w)
            pos = ex1.find(o[:10]) if len(o) >= 10 else -1
            if pos >= 0:
                ctx = ex1[max(0, pos - 25) : pos + len(o) + 25]
                if any(t in ctx for t in ("이전", "아니", "아니다", "해당하지", "틀린")):
                    score -= 60
                if any(t in ctx for t in ("이후", "옳은", "적절", "맞는", "해당")):
                    score += 35
            if score > best_s:
                best_s, best_o = score, o
        if best_s >= 18:
            return best_o

    return ""


def fallback_score_answer(opts: list, ex: str, q: str) -> str:
    if not opts or not ex:
        return ""
    ex1 = one_line(ex)
    best_o, best_s = "", -999
    for o in opts:
        score = 0
        frag = o[: min(16, len(o))]
        pos = ex1.find(frag) if frag else -1
        if pos >= 0:
            ctx = ex1[max(0, pos - 28) : pos + len(frag) + 28]
            if any(t in ctx for t in ("이전", "아니다", "아니", "해당하지", "틀린", "전 시기")):
                score -= 50
            if any(t in ctx for t in ("이후", "옳은", "적절", "맞는", "해당", "정답")):
                score += 45
        for w in re.findall(r"[가-힣]{3,}", o):
            if w in ex1:
                score += len(w) * 1.2
        if "병자호란" in ex1 and "북벌" in o:
            score += 30
        if "이전 시기" in ex1 and frag and frag[:8] in ex1:
            score -= 35
        if score > best_s:
            best_s, best_o = score, o
    return best_o if best_s >= 8 else ""


def word_overlap_answer(opts: list, ex: str) -> str:
    if not opts or not ex:
        return ""
    best_o, best = "", 0
    for o in opts:
        words = [
            w
            for w in re.findall(r"[가-힣]{4,}", o)
            if w not in ("하였다", "되었다", "있었다", "이었다", "하였으며")
        ]
        hits = sum(1 for w in words if w in ex)
        if hits > best:
            best, best_o = hits, o
    return best_o if best >= 2 else ""


def resolve_answer(ans: str, opts: list, qtype: str, ex: str, q: str = "") -> str:
    if ans:
        hit = _match_opt(opts, ans) if opts else ans
        if hit:
            return hit
        m = re.match(r"^([①②③④⑤])$", ans.strip())
        if m and opts:
            idx = SYM_MAP[m.group(1)]
            if idx < len(opts):
                return opts[idx]
    inferred = infer_answer_from_ex(q, opts, qtype, ex)
    if inferred:
        return inferred
    fallback = fallback_score_answer(opts, ex, q)
    if fallback:
        return fallback
    overlap = word_overlap_answer(opts, ex)
    if overlap:
        return overlap
    if ans in opts:
        return ans
    return ans


def guess_cat(q: str, n: int) -> str:
    rules = [
        ("개화·근대", r"개화|갑오|을미|독립협|대한제|세검|밀원|공사|철도|전차|의병|을사|국채|대원군|황제|헌법"),
        ("임진·정유", r"임진|정유|이순신|한산도|명량|도요토미|평양|왜란|일본"),
        ("호란·대외", r"호란|북벌|북학|연행사|통신사|청|명|사대|화의|주전|주화|군신|척화|오랑캐"),
        ("경제·수취", r"대동법|전세|공납|군역|균역|영정|삼정|농업|모내기|상업|수공업|광업|대동|방납|토지|과전|직전"),
        ("사회·신분", r"신분|양반|노비|향촌|서원|향약|가족|부계|사화|붕당|사림|세도"),
        ("사상·문화", r"성리|실학|불교|유교|도참|풍수|문화|사상|훈민|한글|과학"),
        ("고려·전기", r"고려|무신|공민|과전|원간섭|이성계|건국"),
    ]
    for name, pat in rules:
        if re.search(pat, q):
            return name
    if n <= 40:
        return "호란·대외"
    if n <= 90:
        return "경제·수취"
    if n <= 140:
        return "사회·신분"
    if n <= 170:
        return "사상·문화"
    return "개화·근대"


def build_quiz():
    all_q, all_a = {}, {}
    with pdfplumber.open(str(QUIZ_PDF)) as pdf:
        for pi, page in enumerate(pdf.pages):
            if pi == 0:
                continue
            w, h = page.width, page.height
            mid = w / 2
            for col in (
                page.within_bbox((0, 0, mid, h)).extract_text() or "",
                page.within_bbox((mid, 0, w, h)).extract_text() or "",
            ):
                qs, ans = parse_column(col)
                for k, v in qs.items():
                    all_q[k] = merge_body(all_q.get(k, ""), v)
                all_a.update(ans)

    items = []
    for n in range(1, 198):
        body = all_q.get(n, "")
        q, opts, qtype = parse_opts_multiline(body)
        meta = all_a.get(n, {})
        a = resolve_answer(meta.get("a", ""), opts, qtype, meta.get("ex", ""), q)
        if not q and body:
            q = one_line(body)[:500]
        items.append(
            {
                "id": n,
                "q": q,
                "opts": opts,
                "a": a,
                "ex": meta.get("ex", ""),
                "type": qtype,
                "cat": guess_cat(q + " " + body[:200], n),
            }
        )
    return items


def split_pair_line(line: str):
    if " | " in line:
        return [x.strip() for x in line.split(" | ") if x.strip()]
    # two titles glued: 'A B' where both look like titles
    m = re.match(r"^(.{6,40}?)\s+(.{6,40})$", line)
    if m and re.search(r"(조선|고려|양|수취|신분|향촌|불교|성리|실학|개화)", line):
        return [m.group(1).strip(), m.group(2).strip()]
    return [line]


def parse_textbook_page(text: str, page_no: int):
    text = re.sub(r"서과교상비\s*", "", text)
    text = re.sub(r"010-3192-4216\s*kosin95@naver.com\s*", "", text)
    lines = [clean(x) for x in text.split("\n") if clean(x)]
    if not lines:
        return []

    head = lines[0]
    if head == "서과교상비" and len(lines) > 1:
        head = lines[1]
        body_lines = lines[2:]
    else:
        body_lines = lines[1:]

    titles = split_pair_line(head)
    cols = [[] for _ in titles]
    for ln in body_lines:
        parts = split_pair_line(ln) if " | " in ln else [ln]
        if len(parts) == len(titles):
            for i, p in enumerate(parts):
                cols[i].append(p)
        else:
            cols[0].append(ln)

    units = []
    for title, col_lines in zip(titles, cols):
        bullets = []
        for ln in col_lines:
            for piece in re.split(r"\s+-\s+", ln):
                piece = piece.strip()
                if piece.startswith("-"):
                    piece = piece[1:].strip()
                if piece and piece != title:
                    bullets.append(piece)
        if bullets:
            units.append({"name": title, "bullets": bullets, "page": page_no})
    return units


def build_concepts():
    return get_detailed_concepts()


def write_js(path: Path, var_name: str, data):
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(f"const {var_name} = {payload};\n", encoding="utf-8")


def write_ui_strings():
    ui = {
        "pageTitle": "기말 한국사 · 197제 퀴즈",
        "navBack": "기말 대비 메인",
        "eyebrow": "기말 1-1 · 한국사",
        "appTitle": "한국사 197제 · 교재 정리",
        "tabQuiz": "197제 퀴즈",
        "tabConcepts": "한국사 개념",
        "footer": "제작자: 정해우 · 교재·문제 PDF 기반",
        "fallbackQ": "문제",
        "defaultCat": "한국사",
        "revealTag": "(해설 확인)",
        "conceptIntro": "교재 내용을 대단원 → 소단원 → 핵심 주제 순으로 풀어 썼습니다. 각 소단원의 맨 위 요약을 먼저 읽고, 아래 소제목별로 정리된 내용을 차례로 보면 됩니다.",
        "unitCount": "소단원",
        "conceptOutro": "197제 퀴즈와 함께 보면 ‘언제·왜·무엇이’ 연결되는지 잡기 좋습니다.",
        "menuIntro": "한국사 최쌤 197제 · 보기를 고르면 정답 여부를 바로 알려 줍니다 · 틀리면 정답과 해설(틀린 이유)을 함께 보여 줍니다 · 진행도는 브라우저에 저장됩니다.",
        "progressLabel": "전체 진행",
        "streakBest": "최고 연속 정답(자가채점 포함):",
        "reviewBtn": "오답 복습",
        "startBtn": "학습 시작",
        "continueBtn": "이어서 풀기",
        "remainSuffix": "문제 남음",
        "catLabel": "단원별",
        "resetConfirm": "진행도를 초기화할까요?",
        "resetBtn": "진행도 초기화",
        "noReview": "복습할 오답이 없습니다.",
        "toMenu": "메뉴로",
        "backMenu": "← 메뉴",
        "numSuffix": "번",
        "answerLabel": "정답: ",
        "explainLabel": "해설",
        "noExplain": "(해설 없음)",
        "prevBtn": "← 이전",
        "nextBtn": "다음 →",
        "doneBtn": "완료",
        "allLabel": "전체",
        "streakLive": "연속",
        "rateLabel": "정답률",
        "completeLabel": "완료!",
        "correctSuffix": "정답",
        "wrongSuffix": "오답",
        "correctTag": "정답",
        "wrongTag": "오답",
        "noOptsHint": "이 문항은 선택지를 불러오지 못했습니다. 다른 문항을 먼저 풀어 주세요.",
        "noAnswerHint": "정답 데이터를 찾지 못했습니다. 해설만 참고해 주세요.",
        "resultCorrect": "정답입니다!",
        "resultWrong": "오답입니다",
        "yourPickLabel": "내가 고른 답: ",
        "wrongReasonLabel": "해설 · 틀린 이유",
        "wrongQueue": "오답 — 대기열 맨 뒤로 보냅니다.",
        "loading": "불러오는 중...",
    }
    write_js(ROOT / "kh-ui-strings.js", "KH_UI", ui)


def write_html_shell():
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title id="docTitle">Final History</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="site-theme.css" />
  <link rel="stylesheet" href="final-history.css" />
</head>
<body>
  <div class="shell">
    <nav class="site-nav">
      <a class="site-nav__link" id="navBack" href="index.html#final">&larr;</a>
    </nav>
    <p class="page-eyebrow" id="pageEyebrow"></p>
    <h1 class="app-title" id="pageTitle"></h1>
    <div class="page-card">
      <div class="kh-topnav" id="khTopnav" role="tablist">
        <button type="button" class="kh-topnav__btn is-on" data-kh-view="quiz" role="tab" aria-selected="true" id="tabQuiz"></button>
        <button type="button" class="kh-topnav__btn" data-kh-view="concepts" role="tab" aria-selected="false" id="tabConcepts"></button>
      </div>
      <div class="wrap" id="app"></div>
    </div>
  </div>
  <div class="footer" id="pageFooter"></div>
  <script src="kh-ui-strings.js"></script>
  <script>
    document.getElementById("docTitle").textContent = KH_UI.pageTitle;
    document.getElementById("navBack").appendChild(document.createTextNode(" " + KH_UI.navBack));
    document.getElementById("pageEyebrow").textContent = KH_UI.eyebrow;
    document.getElementById("pageTitle").textContent = KH_UI.appTitle;
    document.getElementById("tabQuiz").textContent = KH_UI.tabQuiz;
    document.getElementById("tabConcepts").textContent = KH_UI.tabConcepts;
    document.getElementById("pageFooter").textContent = KH_UI.footer;
  </script>
  <script src="kh-quiz-data.js"></script>
  <script src="kh-concepts-data.js"></script>
  <script src="final-history-app.js"></script>
  <link rel="stylesheet" href="bgm-player.css" />
  <script src="bgm-player.js" defer></script>
</body>
</html>
"""
    (ROOT / "final-history.html").write_text(html, encoding="utf-8")


def main():
    quiz = build_quiz()
    concepts = build_concepts()
    write_js(ROOT / "kh-quiz-data.js", "KH_QUIZ", quiz)
    write_js(ROOT / "kh-concepts-data.js", "KH_CONCEPTS", concepts)
    write_ui_strings()
    write_html_shell()
    print(f"quiz: {len(quiz)} items, with opts: {sum(1 for x in quiz if x['opts'])}, with ans: {sum(1 for x in quiz if x['a'])}")
    for ch in concepts:
        print(f"  {ch['name']}: {len(ch['units'])} units")


if __name__ == "__main__":
    main()
