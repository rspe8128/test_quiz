(function () {
  var app = document.getElementById("feMockApp");
  if (!app) return;

  var view = "concepts";

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function shuffle(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = b[i];
      b[i] = b[j];
      b[j] = t;
    }
    return b;
  }

  var Q = (typeof FE_MOCK_QUIZ !== "undefined" ? FE_MOCK_QUIZ : []).map(function (item) {
    return {
      id: item.id,
      passage: item.passage,
      extra: item.extra || "",
      bogi: item.bogi || "",
      q: item.q || "",
      opts: item.opts || [],
      a: item.a || "",
      ex: item.ex || "",
      cat: item.cat || "모의고사",
      playable: (item.opts || []).length > 0
    };
  });

  var WRITTEN = typeof FE_MOCK_WRITTEN !== "undefined" ? FE_MOCK_WRITTEN : [];

  var PLAYABLE = Q.filter(function (q) { return q.playable; });
  var CATS = [];
  PLAYABLE.forEach(function (q) {
    if (CATS.indexOf(q.cat) === -1) CATS.push(q.cat);
  });

  var LS_KEY = "final-english-mock-v3";

  function emptyProg() {
    return { mastered: {}, wrongCnt: {}, best: 0 };
  }

  function loadProg() {
    try {
      var t = localStorage.getItem(LS_KEY);
      return t ? Object.assign(emptyProg(), JSON.parse(t)) : emptyProg();
    } catch (e) {
      return emptyProg();
    }
  }

  function saveProg() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(S.prog));
    } catch (e) {}
  }

  var S = {
    prog: loadProg(),
    streak: 0,
    queue: [],
    sel: null,
    phase: "menu",
    catF: null,
    sess: { c: 0, w: 0 },
    lockedQ: null,
    lockedOpts: [],
    lockedAns: "",
    revIdx: 0,
    passageOpen: true,
    writtenType: "all"
  };

  function bindTabs() {
    document.querySelectorAll("[data-fe-view]").forEach(function (btn) {
      var on = btn.getAttribute("data-fe-view") === view;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    var concepts = document.getElementById("feConcepts");
    var mockWrap = document.getElementById("feMockWrap");
    if (concepts) concepts.hidden = view !== "concepts";
    if (mockWrap) mockWrap.hidden = view !== "mock";
  }

  function filt() {
    return S.catF ? PLAYABLE.filter(function (q) { return q.cat === S.catF; }) : PLAYABLE;
  }

  function mCnt() {
    return filt().filter(function (q) { return S.prog.mastered[q.id]; }).length;
  }

  function pct() {
    var f = filt();
    return f.length ? Math.round(mCnt() / f.length * 100) : 0;
  }

  function nextQ() {
    var n = S.queue.find(function (id) {
      var q = PLAYABLE.find(function (x) { return x.id === id; });
      return q && (!S.catF || q.cat === S.catF) && !S.prog.mastered[id];
    });
    return n ? PLAYABLE.find(function (q) { return q.id === n; }) : null;
  }

  function wrongQs() {
    return PLAYABLE.filter(function (q) {
      return S.prog.wrongCnt[q.id] && !S.prog.mastered[q.id];
    }).sort(function (a, b) {
      return (S.prog.wrongCnt[b.id] || 0) - (S.prog.wrongCnt[a.id] || 0);
    });
  }

  function catSt(c) {
    var qs = PLAYABLE.filter(function (q) { return q.cat === c; });
    var m = qs.filter(function (q) { return S.prog.mastered[q.id]; }).length;
    return { t: qs.length, m: m, p: qs.length ? Math.round(m / qs.length * 100) : 0 };
  }

  function lockNext() {
    var nq = nextQ();
    while (nq && !nq.a) {
      var rest = S.queue.filter(function (id) { return id !== nq.id; });
      S.queue = rest.concat([nq.id]);
      nq = nextQ();
    }
    if (nq) {
      S.lockedQ = nq;
      S.lockedAns = nq.a;
      S.lockedOpts = shuffle(nq.opts.slice());
      S.passageOpen = true;
    } else {
      S.lockedQ = null;
      S.lockedOpts = [];
      S.lockedAns = "";
    }
  }

  function passageHtml(key) {
    var p = typeof FE_MOCK_PASSAGES !== "undefined" ? FE_MOCK_PASSAGES[key] : null;
    if (!p) return "";
    return (
      '<details class="fk-passage"' + (S.passageOpen ? " open" : "") + ">" +
      "<summary>지문 보기 · " + esc(p.label) + "</summary>" +
      '<div class="fk-passage__body">' + p.html + "</div></details>"
    );
  }

  window.feGo = function (cat) {
    S.catF = cat;
    S.queue = shuffle(PLAYABLE.map(function (q) { return q.id; }));
    S.sel = null;
    S.sess = { c: 0, w: 0 };
    S.streak = 0;
    S.phase = "quiz";
    lockNext();
    render();
  };

  window.feToMenu = function () {
    S.phase = "menu";
    S.lockedQ = null;
    S.sel = null;
    S.lockedAns = "";
    render();
  };

  window.feRev = function () {
    S.revIdx = 0;
    S.phase = "review";
    render();
  };

  window.feShowWritten = function (type) {
    S.writtenType = type || "all";
    S.phase = "written";
    render();
  };

  window.feEmptyProg = emptyProg;

  window.fePick = function (o) {
    if (S.sel !== null || !S.lockedQ) return;
    var cur = S.lockedQ;
    var ans = S.lockedAns;
    if (!ans) return;
    S.sel = o;
    var ok = o === ans;
    if (ok) {
      S.prog.mastered[cur.id] = true;
      S.sess.c++;
      S.streak++;
      if (S.streak > S.prog.best) S.prog.best = S.streak;
    } else {
      S.prog.wrongCnt[cur.id] = (S.prog.wrongCnt[cur.id] || 0) + 1;
      S.sess.w++;
      S.streak = 0;
      var rest = S.queue.filter(function (id) { return id !== cur.id; });
      S.queue = rest.concat([cur.id]);
    }
    saveProg();
    render();
  };

  window.feNxt = function () {
    S.sel = null;
    S.lockedQ = null;
    S.lockedAns = "";
    lockNext();
    render();
  };

  function renderMenu() {
    var te = PLAYABLE.filter(function (q) { return S.prog.mastered[q.id]; }).length;
    var pe = PLAYABLE.length ? Math.round(te / PLAYABLE.length * 100) : 0;
    var wqs = wrongQs();
    var h =
      '<p class="quiz-intro">Unit 3–4 <strong>직보모의고사 Ver3</strong> · 객관식 ' +
      PLAYABLE.length +
      "문항 · SQ 5 · LQ 3. PDF 문제·정답·해설을 그대로 반영했습니다.</p>";
    h +=
      '<div class="progress-box"><div class="progress-box__head"><span>객관식 진행</span><span>' +
      te +
      "/" +
      PLAYABLE.length +
      " (" +
      pe +
      "%)</span></div>";
    h += '<div class="bar"><div class="bar-fill" style="width:' + pe + '%"></div></div>';
    if (S.prog.best > 0) {
      h += '<div class="progress-box__sub">최고 연속 정답: ' + S.prog.best + "</div>";
    }
    h += "</div>";
    if (wqs.length) {
      h +=
        '<button type="button" class="btn btn-review" onclick="feRev()">틀린 문제 복습 (' +
        wqs.length +
        ")</button>";
    }
    h +=
      '<button type="button" class="btn btn-main" onclick="feGo(null)">' +
      (mCnt() === 0 ? "객관식 전체 풀기" : "객관식 이어서 풀기") +
      " — " +
      (filt().length - mCnt()) +
      "문항 남음</button>";
    h += '<div class="quiz-cat-label">지문별 객관식</div>';
    CATS.forEach(function (c) {
      var s = catSt(c);
      h +=
        '<button type="button" class="btn cat-btn" onclick="feGo(\'' +
        c.replace(/'/g, "\\'") +
        "')\"><span>" +
        esc(c) +
        '</span><span class="cat-btn__meta"><span class="cat-btn__count">' +
        s.m +
        "/" +
        s.t +
        '</span><span class="cat-bar"><span class="cat-bar-fill" style="width:' +
        s.p +
        '%"></span></span></span></button>';
    });
    h += '<div class="quiz-cat-label">서술형 · 모범답안</div>';
    h +=
      '<button type="button" class="btn cat-btn" onclick="feShowWritten(\'SQ\')"><span>SQ 1–5</span><span class="cat-btn__meta"><span class="cat-btn__count">5문항</span></span></button>';
    h +=
      '<button type="button" class="btn cat-btn" onclick="feShowWritten(\'LQ\')"><span>LQ 1–3</span><span class="cat-btn__meta"><span class="cat-btn__count">3문항</span></span></button>';
    if (te > 0 || Object.keys(S.prog.wrongCnt).length) {
      h +=
        '<button type="button" class="btn btn-reset" onclick="if(confirm(\'객관식 기록을 초기화할까요?\')){S.prog=feEmptyProg();S.streak=0;saveProg();render();}">객관식 기록 초기화</button>';
    }
    app.innerHTML = h;
  }

  function renderWritten() {
    var items = WRITTEN.filter(function (w) {
      return S.writtenType === "all" || w.type === S.writtenType;
    });
    var title = S.writtenType === "SQ" ? "SQ 1–5" : S.writtenType === "LQ" ? "LQ 1–3" : "서술형";
    var h =
      '<div class="quiz-head"><button type="button" class="link-btn" onclick="feToMenu()">← 목록</button><span>' +
      esc(title) +
      "</span></div>";
    h += '<p class="quiz-intro">문제를 읽고 직접 쓴 뒤, 펼쳐서 모범답안·해설과 비교하세요.</p>';
    items.forEach(function (w) {
      h += '<details class="fk-passage fe-written-item">';
      h += "<summary>" + esc(w.id) + " · " + esc(w.type) + "</summary>";
      h += '<div class="fk-passage__body">';
      h += '<div class="q-text" style="white-space:pre-wrap;margin-bottom:12px">' + esc(w.prompt) + "</div>";
      h += '<div class="q-answer">모범답안</div>';
      h += '<p style="margin:0 0 10px;line-height:1.7">' + esc(w.answer) + "</p>";
      if (w.ex) {
        h += '<div class="ex-box"><strong>해설</strong><div class="ex-box__body">' + esc(w.ex) + "</div></div>";
      }
      h += "</div></details>";
    });
    app.innerHTML = h;
  }

  function renderReview() {
    var wqs = wrongQs();
    var rq = wqs[S.revIdx || 0];
    if (!rq) {
      app.innerHTML =
        '<div class="quiz-empty"><p>복습할 문제가 없습니다.</p><button type="button" class="btn" onclick="feToMenu()">목록으로</button></div>';
      return;
    }
    var h =
      '<div class="quiz-head"><button type="button" class="link-btn" onclick="feToMenu()">← 목록</button><span>' +
      (S.revIdx + 1) +
      "/" +
      wqs.length +
      "</span></div>";
    h += passageHtml(rq.passage);
    h += '<span class="q-num">' + rq.id + "번 · " + esc(rq.cat) + "</span>";
    h += '<div class="q-text">' + esc(rq.q) + "</div>";
    h += '<div class="q-answer">정답: ' + esc(rq.a) + "</div>";
    h += '<div class="ex-box"><strong>해설</strong><div class="ex-box__body">' + esc(rq.ex || "—") + "</div></div>";
    h += '<div class="quiz-nav-row">';
    h +=
      '<button type="button" class="btn" ' +
      (S.revIdx === 0 ? "disabled" : "") +
      ' onclick="S.revIdx--;render()">이전</button>';
    h +=
      '<button type="button" class="btn" onclick="' +
      (S.revIdx < wqs.length - 1 ? "S.revIdx++;render()" : "feToMenu()") +
      '">' +
      (S.revIdx < wqs.length - 1 ? "다음" : "완료") +
      "</button></div>";
    app.innerHTML = h;
  }

  function renderQuiz() {
    var cur = S.lockedQ;
    var ans = S.lockedAns || (cur ? cur.a : "");
    var unmast = filt().filter(function (q) { return !S.prog.mastered[q.id]; }).length;
    var done = !cur && unmast === 0;
    var p = pct();
    var mc = mCnt();
    var fl = filt().length;
    var rate = S.sess.c + S.sess.w > 0 ? Math.round((S.sess.c / (S.sess.c + S.sess.w)) * 100) : 0;
    var ok = S.sel !== null && S.sel === ans;

    var h =
      '<div class="quiz-head"><button type="button" class="link-btn" onclick="feToMenu()">← 목록</button>';
    if (S.streak >= 3) h += '<span class="streak-badge">' + S.streak + "연속!</span>";
    h += "</div>";
    h +=
      '<div class="quiz-meta">' +
      esc(S.catF || "전체") +
      " · " +
      mc +
      "/" +
      fl +
      " · 정답률 " +
      rate +
      "%</div>";
    h += '<div class="bar bar-sm"><div class="bar-fill" style="width:' + p + '%"></div></div>';

    if (done) {
      h += '<div class="quiz-done"><div class="quiz-done__icon">✓</div>';
      h += "<h3>" + esc(S.catF || "전체") + " 완료!</h3>";
      h += "<p>정답 " + S.sess.c + " · 오답 " + S.sess.w + "</p>";
      h += '<button type="button" class="btn btn-next" onclick="feToMenu()">목록으로</button></div>';
    } else if (cur) {
      h += passageHtml(cur.passage);
      h += '<span class="q-num">' + cur.id + "번 · " + esc(cur.cat) + "</span>";
      h += '<div class="q-text">' + esc(cur.q) + "</div>";
      h += '<div class="opt-list">';
      S.lockedOpts.forEach(function (o, i) {
        var isA = o === ans;
        var isS = o === S.sel;
        var cls = "";
        var lbl = "";
        if (S.sel !== null) {
          if (isA) {
            cls = "bg-ok";
            lbl = "정답";
          } else if (isS) {
            cls = "bg-err";
            lbl = "오답";
          }
        }
        h +=
          '<button type="button" class="btn opt-btn ' +
          cls +
          '" ' +
          (S.sel !== null ? "disabled" : "") +
          " onclick=\"fePick('" +
          o.replace(/\\/g, "\\\\").replace(/'/g, "\\'") +
          "')\"><span class=\"opt-num\">" +
          (i + 1) +
          "</span>" +
          esc(o);
        if (lbl) h += '<span class="opt-label">' + lbl + "</span>";
        h += "</button>";
      });
      h += "</div>";
      if (S.sel !== null && ans) {
        if (ok) {
          h +=
            '<div class="result-box result-box--ok"><div class="result-box__title">정답입니다</div><div class="ex-box ex-box--inline">' +
            esc(cur.ex) +
            "</div></div>";
        } else {
          h += '<div class="result-box result-box--err"><div class="result-box__title">틀렸습니다</div>';
          h += '<div class="q-wrong-pick">선택: ' + esc(S.sel) + "</div>";
          h += '<div class="q-answer">정답: ' + esc(ans) + "</div>";
          h += '<div class="ex-box ex-box--inline">' + esc(cur.ex) + "</div></div>";
        }
        h += '<button type="button" class="btn btn-next" onclick="feNxt()">다음</button>';
      }
    } else {
      h += '<div class="quiz-empty"><p>불러오는 중…</p></div>';
    }
    app.innerHTML = h;

    var det = app.querySelector(".fk-passage");
    if (det) {
      det.addEventListener("toggle", function () {
        S.passageOpen = det.open;
      });
    }
  }

  function render() {
    bindTabs();
    if (view !== "mock") return;
    if (S.phase === "menu") renderMenu();
    else if (S.phase === "review") renderReview();
    else if (S.phase === "written") renderWritten();
    else renderQuiz();
  }

  document.querySelectorAll("[data-fe-view]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      view = btn.getAttribute("data-fe-view");
      if (view === "mock") S.phase = "menu";
      render();
    });
  });

  document.addEventListener("keydown", function (ev) {
    if (view !== "mock" || S.phase !== "quiz" || S.sel !== null || !S.lockedOpts.length) return;
    if (ev.target && ["INPUT", "TEXTAREA", "SELECT"].includes(ev.target.tagName)) return;
    var m = /^(?:Digit|Numpad)([1-9])$/.exec(ev.code);
    if (!m) return;
    var idx = Number(m[1]) - 1;
    if (idx >= S.lockedOpts.length) return;
    ev.preventDefault();
    fePick(S.lockedOpts[idx]);
  });

  window.S = S;
  window.saveProg = saveProg;
  window.render = render;
  render();
})();
