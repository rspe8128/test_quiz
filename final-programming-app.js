(function () {
  const app = document.getElementById("app");
  if (!app) return;

  let view = "concepts";

  const esc = function (s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  };

  const formatItem = function (text) {
    return esc(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  };

  const shuffle = function (a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = b[i]; b[i] = b[j]; b[j] = t;
    }
    return b;
  };

  const Q = (typeof PROG_QUIZ !== "undefined" ? PROG_QUIZ : []).map(function (item) {
    return {
      id: item.id,
      q: item.q || ("Q" + item.id),
      opts: item.opts || [],
      a: item.a || "",
      ex: item.ex || "",
      cat: item.cat || "기타",
      playable: (item.opts || []).length > 0
    };
  });

  const PLAYABLE = Q.filter(function (q) { return q.playable; });
  const CATS = [...new Set(PLAYABLE.map(function (q) { return q.cat; }))].sort();

  const LS_KEY = "final-prog-quiz-v1";
  const emptyProg = function () { return { mastered: {}, wrongCnt: {}, best: 0 }; };

  function loadProg() {
    try {
      const t = localStorage.getItem(LS_KEY);
      return t ? Object.assign(emptyProg(), JSON.parse(t)) : emptyProg();
    } catch (e) { return emptyProg(); }
  }

  function saveProg() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S.prog)); } catch (e) {}
  }

  let S = {
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
    revIdx: 0
  };

  function bindTabs() {
    document.querySelectorAll("[data-prog-view]").forEach(function (btn) {
      const on = btn.getAttribute("data-prog-view") === view;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function filt() {
    return S.catF ? PLAYABLE.filter(function (q) { return q.cat === S.catF; }) : PLAYABLE;
  }
  function mCnt() { return filt().filter(function (q) { return S.prog.mastered[q.id]; }).length; }
  function pct() { const f = filt(); return f.length ? Math.round(mCnt() / f.length * 100) : 0; }
  function nextQ() {
    const n = S.queue.find(function (id) {
      const q = PLAYABLE.find(function (x) { return x.id === id; });
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
    const qs = PLAYABLE.filter(function (q) { return q.cat === c; });
    const m = qs.filter(function (q) { return S.prog.mastered[q.id]; }).length;
    return { t: qs.length, m: m, p: qs.length ? Math.round(m / qs.length * 100) : 0 };
  }

  function lockNext() {
    let nq = nextQ();
    while (nq && !nq.a) {
      const rest = S.queue.filter(function (id) { return id !== nq.id; });
      S.queue = rest.concat([nq.id]);
      nq = nextQ();
    }
    if (nq) {
      S.lockedQ = nq;
      S.lockedAns = nq.a;
      S.lockedOpts = shuffle(nq.opts.slice());
    } else {
      S.lockedQ = null;
      S.lockedOpts = [];
      S.lockedAns = "";
    }
  }

  window.go = function (cat) {
    S.catF = cat;
    S.queue = shuffle(PLAYABLE.map(function (q) { return q.id; }));
    S.sel = null;
    S.sess = { c: 0, w: 0 };
    S.streak = 0;
    S.phase = "quiz";
    lockNext();
    render();
  };
  window.toMenu = function () {
    S.phase = "menu";
    S.lockedQ = null;
    S.sel = null;
    S.lockedAns = "";
    render();
  };
  window.rev = function () { S.revIdx = 0; S.phase = "review"; render(); };
  window.emptyProg = emptyProg;
  window.pick = function (o) {
    if (S.sel !== null || !S.lockedQ) return;
    const cur = S.lockedQ;
    const ans = S.lockedAns;
    if (!ans) return;
    S.sel = o;
    const ok = o === ans;
    if (ok) {
      S.prog.mastered[cur.id] = true;
      S.sess.c++;
      S.streak++;
      if (S.streak > S.prog.best) S.prog.best = S.streak;
    } else {
      S.prog.wrongCnt[cur.id] = (S.prog.wrongCnt[cur.id] || 0) + 1;
      S.sess.w++;
      S.streak = 0;
      const rest = S.queue.filter(function (id) { return id !== cur.id; });
      S.queue = rest.concat([cur.id]);
    }
    saveProg();
    render();
  };
  window.nxt = function () {
    S.sel = null;
    S.lockedQ = null;
    S.lockedAns = "";
    lockNext();
    render();
  };
  window.render = render;
  window.S = S;
  window.saveProg = saveProg;

  function renderConcepts() {
    const chapters = typeof PROG_CONCEPTS !== "undefined" ? PROG_CONCEPTS : [];
    let h = '<div class="concept-wrap">';
    h += '<p class="concept-note">프밍기 수업 자료를 바탕으로 정리했습니다. <strong>연습 문제</strong> 탭에서 기말 대비 객관식 40문항을 풀 수 있습니다.</p>';
    chapters.forEach(function (ch, ci) {
      h += '<details class="concept-chapter"' + (ci === 0 ? " open" : "") + "><summary>" + esc(ch.name) + '</summary><div class="concept-details-body">';
      h += '<p class="concept-chapter-hint">단원 ' + ch.units.length + "개</p>";
      ch.units.forEach(function (u, ui) {
        h += '<details class="concept-nested"' + (ci === 0 && ui === 0 ? " open" : "") + "><summary>" + esc(u.name) + "</summary><div class=\"concept-details-body\">";
        if (u.intro) h += '<p class="concept-unit-intro">' + esc(u.intro) + "</p>";
        (u.sections || []).forEach(function (sec) {
          h += "<h3>" + esc(sec.title) + "</h3><ul>";
          (sec.items || []).forEach(function (item) {
            h += "<li>" + formatItem(item) + "</li>";
          });
          h += "</ul>";
        });
        h += "</div></details>";
      });
      h += "</div></details>";
    });
    h += "</div>";
    app.innerHTML = h;
  }

  function renderQuizMenu() {
    const te = PLAYABLE.filter(function (q) { return S.prog.mastered[q.id]; }).length;
    const pe = PLAYABLE.length ? Math.round(te / PLAYABLE.length * 100) : 0;
    const wqs = wrongQs();
    let h = '<p class="quiz-intro">기말 대비 <strong>객관식 ' + PLAYABLE.length + "문항</strong>입니다. 단원별·전체 풀이가 가능하며, 틀린 문제는 다시 나옵니다.</p>";
    h += '<div class="progress-box"><div class="progress-box__head"><span>전체 진행</span><span>' + te + "/" + PLAYABLE.length + " (" + pe + "%)</span></div>";
    h += '<div class="bar"><div class="bar-fill" style="width:' + pe + '%"></div></div>';
    if (S.prog.best > 0) h += '<div class="progress-box__sub">최고 연속 정답: ' + S.prog.best + "</div>";
    h += "</div>";
    if (wqs.length) {
      h += '<button type="button" class="btn btn-review" onclick="rev()">틀린 문제 복습 (' + wqs.length + ")</button>";
    }
    h += '<button type="button" class="btn btn-main" onclick="go(null)">' + (mCnt() === 0 ? "전체 풀기 시작" : "이어서 풀기") + " — " + (filt().length - mCnt()) + "문항 남음</button>";
    h += '<div class="quiz-cat-label">단원별 풀기</div>';
    CATS.forEach(function (c) {
      const s = catSt(c);
      h += '<button type="button" class="btn cat-btn" onclick="go(\'' + c.replace(/'/g, "\\'") + "')\"><span>" + esc(c) + '</span><span class="cat-btn__meta"><span class="cat-btn__count">' + s.m + "/" + s.t + '</span><span class="cat-bar"><span class="cat-bar-fill" style="width:' + s.p + '%"></span></span></span></button>';
    });
    if (te > 0 || Object.keys(S.prog.wrongCnt).length) {
      h += '<button type="button" class="btn btn-reset" onclick="if(confirm(\'기록을 초기화할까요?\')){S.prog=emptyProg();S.streak=0;saveProg();render();}">기록 초기화</button>';
    }
    h += '<p class="quiz-extra">코드 작성 연습은 <a href="java-practice.html">중간 대비 Java 연습</a> 페이지를 참고하세요.</p>';
    app.innerHTML = h;
  }

  function renderReview() {
    const wqs = wrongQs();
    const rq = wqs[S.revIdx || 0];
    if (!rq) {
      app.innerHTML = '<div class="quiz-empty"><p>복습할 문제가 없습니다.</p><button type="button" class="btn" onclick="toMenu()">목록으로</button></div>';
      return;
    }
    let h = '<div class="quiz-head"><button type="button" class="link-btn" onclick="toMenu()">← 목록</button><span>' + (S.revIdx + 1) + "/" + wqs.length + "</span></div>";
    h += '<span class="q-num">' + rq.id + "번 · " + esc(rq.cat) + "</span>";
    h += '<div class="q-text">' + esc(rq.q) + "</div>";
    h += '<div class="q-answer">정답: ' + esc(rq.a) + "</div>";
    h += '<div class="ex-box"><strong>해설</strong><div class="ex-box__body">' + esc(rq.ex || "—") + "</div></div>";
    h += '<div class="quiz-nav-row">';
    h += '<button type="button" class="btn" ' + (S.revIdx === 0 ? "disabled" : "") + ' onclick="S.revIdx--;render()">이전</button>';
    h += '<button type="button" class="btn" onclick="' + (S.revIdx < wqs.length - 1 ? "S.revIdx++;render()" : "toMenu()") + '">' + (S.revIdx < wqs.length - 1 ? "다음" : "완료") + "</button></div>";
    app.innerHTML = h;
  }

  function renderQuiz() {
    const cur = S.lockedQ;
    const ans = S.lockedAns || (cur ? cur.a : "");
    const unmast = filt().filter(function (q) { return !S.prog.mastered[q.id]; }).length;
    const done = !cur && unmast === 0;
    const p = pct();
    const mc = mCnt();
    const fl = filt().length;
    const rate = S.sess.c + S.sess.w > 0 ? Math.round(S.sess.c / (S.sess.c + S.sess.w) * 100) : 0;
    const ok = S.sel !== null && S.sel === ans;

    let h = '<div class="quiz-head"><button type="button" class="link-btn" onclick="toMenu()">← 목록</button>';
    if (S.streak >= 3) h += '<span class="streak-badge">' + S.streak + "연속!</span>";
    h += "</div>";
    h += '<div class="quiz-meta">' + esc(S.catF || "전체") + " · " + mc + "/" + fl + " · 정답률 " + rate + "%</div>";
    h += '<div class="bar bar-sm"><div class="bar-fill" style="width:' + p + '%"></div></div>';

    if (done) {
      h += '<div class="quiz-done"><div class="quiz-done__icon">✓</div>';
      h += "<h3>" + esc(S.catF || "전체") + " 완료!</h3>";
      h += "<p>정답 " + S.sess.c + " · 오답 " + S.sess.w + "</p>";
      h += '<button type="button" class="btn btn-next" onclick="toMenu()">목록으로</button></div>';
    } else if (cur) {
      h += '<span class="q-num">' + cur.id + "번 · " + esc(cur.cat) + "</span>";
      h += '<h3 class="q-text">' + esc(cur.q) + "</h3>";
      h += '<div class="opt-list">';
      S.lockedOpts.forEach(function (o, i) {
        const isA = o === ans;
        const isS = o === S.sel;
        let cls = "";
        let lbl = "";
        if (S.sel !== null) {
          if (isA) { cls = "bg-ok"; lbl = "정답"; }
          else if (isS) { cls = "bg-err"; lbl = "오답"; }
        }
        h += '<button type="button" class="btn opt-btn ' + cls + '" ' + (S.sel !== null ? "disabled" : "") + " onclick=\"pick('" + o.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "')\"><span class=\"opt-num\">" + (i + 1) + "</span>" + esc(o);
        if (lbl) h += '<span class="opt-label">' + lbl + "</span>";
        h += "</button>";
      });
      h += "</div>";
      if (S.sel !== null && ans) {
        if (ok) {
          h += '<div class="result-box result-box--ok"><div class="result-box__title">정답입니다</div><div class="ex-box ex-box--inline">' + esc(cur.ex) + "</div></div>";
        } else {
          h += '<div class="result-box result-box--err"><div class="result-box__title">틀렸습니다</div>';
          h += '<div class="q-wrong-pick">선택: ' + esc(S.sel) + "</div>";
          h += '<div class="q-answer">정답: ' + esc(ans) + "</div>";
          h += '<div class="ex-box ex-box--inline">' + esc(cur.ex) + "</div></div>";
        }
        h += '<button type="button" class="btn btn-next" onclick="nxt()">다음</button>';
      }
    } else {
      h += '<div class="quiz-empty"><p>불러오는 중…</p></div>';
    }
    app.innerHTML = h;
  }

  function renderQuizView() {
    if (S.phase === "menu") renderQuizMenu();
    else if (S.phase === "review") renderReview();
    else renderQuiz();
  }

  function render() {
    bindTabs();
    if (view === "practice") renderQuizView();
    else renderConcepts();
  }

  document.querySelectorAll("[data-prog-view]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      view = btn.getAttribute("data-prog-view");
      if (view === "practice") S.phase = "menu";
      render();
    });
  });

  document.addEventListener("keydown", function (ev) {
    if (view !== "practice" || S.phase !== "quiz" || S.sel !== null || !S.lockedOpts.length) return;
    if (ev.target && ["INPUT", "TEXTAREA", "SELECT"].includes(ev.target.tagName)) return;
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(ev.code);
    if (!m) return;
    const idx = Number(m[1]) - 1;
    if (idx >= S.lockedOpts.length) return;
    ev.preventDefault();
    pick(S.lockedOpts[idx]);
  });

  render();
})();
