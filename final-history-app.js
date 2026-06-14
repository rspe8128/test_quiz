/* Korean history final exam quiz + concepts (UI strings in kh-ui-strings.js) */
const U = typeof KH_UI !== "undefined" ? KH_UI : {};

function normAns(s) {
  return String(s || "").replace(/[\s,]/g, "");
}

function sameAnswer(a, b) {
  if (!a || !b) return false;
  return a === b || normAns(a) === normAns(b);
}

function inferAnswerClient(cur) {
  const ex = cur.ex || "";
  const opts = cur.opts || [];
  if (!ex || !opts.length) return "";

  const named = [
    /방납의 폐단으로 등장한 정책은\s*([가-힣]{2,10})/,
    /정책은\s*([가-힣]{2,10})이다/,
    /이 신분층은\s*([가-힣]{2,8})/,
    /이 제도는\s*([가-힣]{2,10})/,
    /이 전쟁은\s*([가-힣]{2,8})/,
    /이 농법은\s*([가-힣]{2,8})/,
    /([가-힣]{2,10})임을 유추/
  ];
  for (let i = 0; i < named.length; i++) {
    const m = ex.match(named[i]);
    if (m) {
      const hit = opts.find(function (o) { return o.indexOf(m[1]) >= 0; });
      if (hit) return hit;
    }
  }

  if (ex.replace(/\s/g, "").indexOf("북벌운동은병자호란이후") >= 0) {
    const hit = opts.find(function (o) { return o.indexOf("북벌") >= 0; });
    if (hit) return hit;
  }

  if (ex.indexOf("북학론") >= 0) {
    const hit = opts.find(function (o) { return o.indexOf("북학론") >= 0; });
    if (hit) return hit;
  }

  let best = "", bestN = 0;
  opts.forEach(function (o) {
    const words = o.match(/[가-힣]{4,}/g) || [];
    let n = 0;
    words.forEach(function (w) {
      if (ex.indexOf(w) >= 0) n++;
    });
    if (n > bestN) {
      bestN = n;
      best = o;
    }
  });
  return bestN >= 2 ? best : "";
}

function getAnswer(cur) {
  return cur.a || inferAnswerClient(cur);
}

const Q = (typeof KH_QUIZ !== "undefined" ? KH_QUIZ : []).map(function (item) {
  const opts = item.opts || [];
  const a = item.a || "";
  return {
    id: item.id,
    q: item.q || ((U.fallbackQ || "Q") + " " + item.id),
    opts: opts,
    a: a,
    ex: item.ex || "",
    cat: item.cat || (U.defaultCat || "History"),
    playable: opts.length > 0
  };
});

const PLAYABLE = Q.filter(function (q) { return q.playable; });
const CATS = [...new Set(PLAYABLE.map(function (q) { return q.cat; }))].sort();

const LS_KEY = "final-history-quiz-v1";
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
  topView: "quiz",
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

const app = document.getElementById("app");
const esc = function (s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
};
const shuffle = function (a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = b[i]; b[i] = b[j]; b[j] = t;
  }
  return b;
};

function bindTabs() {
  const nav = document.getElementById("khTopnav");
  if (!nav || nav.dataset.bound) return;
  nav.dataset.bound = "1";
  nav.addEventListener("click", function (ev) {
    const btn = ev.target.closest("[data-kh-view]");
    if (!btn) return;
    const v = btn.getAttribute("data-kh-view");
    if (!v || S.topView === v) return;
    S.topView = v;
    nav.querySelectorAll(".kh-topnav__btn").forEach(function (b) {
      const on = b.getAttribute("data-kh-view") === v;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    render();
  });
}

function filt() {
  const base = S.catF ? PLAYABLE.filter(function (q) { return q.cat === S.catF; }) : PLAYABLE;
  return base;
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
  while (nq && !getAnswer(nq)) {
    const rest = S.queue.filter(function (id) { return id !== nq.id; });
    S.queue = rest.concat([nq.id]);
    nq = nextQ();
  }
  if (nq) {
    S.lockedQ = nq;
    S.lockedAns = getAnswer(nq);
    S.lockedOpts = shuffle(nq.opts.slice());
  } else {
    S.lockedQ = null;
    S.lockedOpts = [];
    S.lockedAns = "";
  }
}

function go(cat) {
  S.catF = cat;
  S.queue = shuffle(PLAYABLE.map(function (q) { return q.id; }));
  S.sel = null;
  S.sess = { c: 0, w: 0 };
  S.streak = 0;
  S.phase = "quiz";
  lockNext();
  render();
}
function toMenu() { S.phase = "menu"; S.lockedQ = null; S.sel = null; S.lockedAns = ""; render(); }
function rev() { S.revIdx = 0; S.phase = "review"; render(); }

function pick(o) {
  if (S.sel !== null || !S.lockedQ) return;
  const cur = S.lockedQ;
  const ans = S.lockedAns || getAnswer(cur);
  if (!ans) return;

  S.sel = o;
  const ok = sameAnswer(o, ans);
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
}

function nxt() {
  S.sel = null;
  S.lockedQ = null;
  S.lockedAns = "";
  lockNext();
  render();
}

function renderConcepts() {
  const chapters = typeof KH_CONCEPTS !== "undefined" ? KH_CONCEPTS : [];
  let h = '<div class="concept-wrap"><p class="concept-note">' + esc(U.conceptIntro || "") + "</p>";
  chapters.forEach(function (ch, ci) {
    h += '<details class="concept-chapter"' + (ci === 0 ? " open" : "") + "><summary>" + esc(ch.name) + '</summary><div class="concept-details-body">';
    h += "<p class=\"concept-chapter-hint\">" + esc((U.unitCount || "") + " " + ch.units.length) + "</p>";
    ch.units.forEach(function (u, ui) {
      h += '<details class="concept-nested"' + (ci === 0 && ui === 0 ? " open" : "") + "><summary>" + esc(u.name) + "</summary><div class=\"concept-details-body\">";
      if (u.intro) h += '<p class="concept-unit-intro">' + esc(u.intro) + "</p>";
      if (u.sections && u.sections.length) {
        u.sections.forEach(function (sec) {
          h += "<h3>" + esc(sec.title) + "</h3><ul>";
          (sec.items || []).forEach(function (item) { h += "<li>" + esc(item) + "</li>"; });
          h += "</ul>";
        });
      } else if (u.bullets && u.bullets.length) {
        h += "<ul>";
        u.bullets.forEach(function (b) { h += "<li>" + esc(b) + "</li>"; });
        h += "</ul>";
      }
      h += "</div></details>";
    });
    h += "</div></details>";
  });
  h += '<p class="concept-note" style="margin-top:1rem">' + esc(U.conceptOutro || "") + "</p></div>";
  app.innerHTML = h;
}

function renderMenu() {
  const te = PLAYABLE.filter(function (q) { return S.prog.mastered[q.id]; }).length;
  const pe = PLAYABLE.length ? Math.round(te / PLAYABLE.length * 100) : 0;
  const wqs = wrongQs();
  let h = '<p style="text-align:center;font-size:14px;color:#666;line-height:1.65;margin:0 0 14px">' + esc(U.menuIntro || "") + "</p>";
  h += `<div class="progress-box"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span style="font-weight:600">${esc(U.progressLabel || "")}</span><span style="color:#666">${te}/${PLAYABLE.length} (${pe}%)</span></div>`;
  h += '<div class="bar"><div class="bar-fill" style="width:' + pe + '%"></div></div>';
  if (S.prog.best > 0) h += '<div style="font-size:10px;color:#999;margin-top:6px">' + esc(U.streakBest || "") + " " + S.prog.best + "</div>";
  h += "</div>";
  if (wqs.length) h += '<button class="btn" style="margin-bottom:10px;text-align:center;color:#e65100" onclick="rev()">' + esc(U.reviewBtn || "") + " (" + wqs.length + ")</button>";
  h += '<button class="btn btn-main" onclick="go(null)">' + (mCnt() === 0 ? esc(U.startBtn || "") : esc(U.continueBtn || "")) + " — " + (filt().length - mCnt()) + esc(U.remainSuffix || "") + "</button>";
  h += '<div style="font-size:13px;font-weight:700;color:#0284c7;margin:16px 0 10px">' + esc(U.catLabel || "") + "</div>";
  CATS.forEach(function (c) {
    const s = catSt(c);
    h += '<button class="btn cat-btn" onclick="go(\'' + c.replace(/'/g, "\\'") + "')\"><span>" + esc(c) + '</span><span style="display:flex;align-items:center;gap:5px"><span style="font-size:10px;color:#999">' + s.m + "/" + s.t + '</span><span class="cat-bar"><span class="cat-bar-fill" style="width:' + s.p + '%;background:#0284c7"></span></span></span></button>';
  });
  if (te > 0 || Object.keys(S.prog.wrongCnt).length) {
    h += "<button type=\"button\" onclick=\"if(confirm('" + (U.resetConfirm || "").replace(/'/g, "\\'") + "')){S.prog=emptyProg();S.streak=0;saveProg();render();}\" style=\"margin-top:16px;padding:10px 20px;border:none;border-radius:8px;background:#888;color:#fff;cursor:pointer;font-size:13px;font-family:inherit;font-weight:600;width:100%;max-width:320px;margin-left:auto;margin-right:auto;display:block\">" + esc(U.resetBtn || "") + "</button>";
  }
  app.innerHTML = h;
}

function renderReview() {
  const wqs = wrongQs();
  const rq = wqs[S.revIdx || 0];
  if (!rq) {
    app.innerHTML = '<div style="text-align:center;padding:2rem 0"><p style="color:#666">' + esc(U.noReview || "") + '</p><button class="btn" style="width:auto;display:inline-block;margin-top:10px" onclick="toMenu()">' + esc(U.toMenu || "") + "</button></div>";
    return;
  }
  const ans = getAnswer(rq);
  let h = '<div style="display:flex;justify-content:space-between;margin-bottom:14px"><button class="link-btn" onclick="toMenu()">' + esc(U.backMenu || "") + '</button><span style="font-size:10px;color:#999">' + (S.revIdx + 1) + "/" + wqs.length + "</span></div>";
  h += '<span class="q-num">' + rq.id + esc(U.numSuffix || "") + "</span>";
  h += '<div style="font-size:14px;line-height:1.6;margin-bottom:10px">' + esc(rq.q) + "</div>";
  if (ans) h += '<div style="font-size:13px;color:#1b5e20;font-weight:600;margin-bottom:8px">' + esc(U.answerLabel || "") + esc(ans) + "</div>";
  h += '<div class="ex-box"><strong>' + esc(U.explainLabel || "") + '</strong><div style="margin-top:6px;font-size:12px;line-height:1.65;color:#555">' + esc(rq.ex || U.noExplain || "") + "</div></div>";
  h += '<div style="display:flex;gap:6px;margin-top:12px">';
  h += '<button class="btn" style="flex:1;text-align:center" ' + (S.revIdx === 0 ? "disabled" : "") + ' onclick="S.revIdx--;render()">' + esc(U.prevBtn || "") + "</button>";
  h += '<button class="btn" style="flex:1;text-align:center" onclick="' + (S.revIdx < wqs.length - 1 ? "S.revIdx++;render()" : "toMenu()") + '">' + (S.revIdx < wqs.length - 1 ? esc(U.nextBtn || "") : esc(U.doneBtn || "")) + "</button></div>";
  app.innerHTML = h;
}

function renderQuiz() {
  const cur = S.lockedQ;
  const ans = S.lockedAns || (cur ? getAnswer(cur) : "");
  const unmast = filt().filter(function (q) { return !S.prog.mastered[q.id]; }).length;
  const done = !cur && unmast === 0;
  const p = pct();
  const mc = mCnt();
  const fl = filt().length;
  const rate = S.sess.c + S.sess.w > 0 ? Math.round(S.sess.c / (S.sess.c + S.sess.w) * 100) : 0;
  const ok = S.sel !== null && ans && sameAnswer(S.sel, ans);

  let h = '<div style="display:flex;justify-content:space-between;margin-bottom:10px"><button class="link-btn" onclick="toMenu()">' + esc(U.backMenu || "") + "</button>";
  if (S.streak >= 3) h += '<span style="font-size:10px;color:#e65100;font-weight:600">' + esc(U.streakLive || "") + " " + S.streak + "!</span>";
  h += "</div>";
  h += '<div style="font-size:10px;color:#999;margin-bottom:4px">' + esc(S.catF || U.allLabel || "") + " · " + mc + "/" + fl + " · " + esc(U.rateLabel || "") + " " + rate + "%</div>";
  h += '<div class="bar bar-sm"><div class="bar-fill" style="width:' + p + '%"></div></div>';

  if (done) {
    h += '<div style="text-align:center;padding:36px 12px"><div style="font-size:42px;color:#4caf50;margin-bottom:8px">&#10003;</div>';
    h += "<h3 style=\"color:#0284c7;margin-bottom:8px\">" + esc(S.catF || U.allLabel || "") + " " + esc(U.completeLabel || "") + "</h3>";
    h += "<p style=\"color:#666\">" + S.sess.c + esc(U.correctSuffix || "") + " / " + S.sess.w + esc(U.wrongSuffix || "") + "</p>";
    h += '<button class="btn btn-next" onclick="toMenu()">' + esc(U.toMenu || "") + "</button></div>";
  } else if (cur) {
    h += '<span class="q-num">' + cur.id + esc(U.numSuffix || "") + " · " + esc(cur.cat) + "</span>";
    h += '<h3 style="font-size:14px;font-weight:500;line-height:1.65;margin:0 0 14px;white-space:pre-wrap">' + esc(cur.q) + "</h3>";

    if (S.lockedOpts.length) {
      h += '<div style="display:flex;flex-direction:column;gap:5px">';
      S.lockedOpts.forEach(function (o, i) {
        const isA = ans && sameAnswer(o, ans);
        const isS = o === S.sel;
        let cls = "", lbl = "", extra = "padding-left:48px;";
        if (S.sel !== null) {
          if (isA) { cls = "bg-ok"; lbl = U.correctTag || ""; extra += "color:#1b5e20;"; }
          else if (isS) { cls = "bg-err"; lbl = U.wrongTag || ""; extra += "color:#c62828;"; }
        }
        h += '<button type="button" class="btn ' + cls + '" style="' + extra + '" ' + (S.sel !== null ? "disabled" : "") + " onclick=\"pick('" + o.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "')\"><span class=\"opt-num\">" + (i + 1) + "</span>" + esc(o);
        if (lbl) h += '<span class="opt-label">' + esc(lbl) + "</span>";
        h += "</button>";
      });
      h += "</div>";
    }

    if (S.sel !== null && ans) {
      const exHtml = cur.ex ? esc(cur.ex) : esc(U.noExplain || "");
      if (ok) {
        h += '<div class="result-box result-box--ok"><div class="result-box__title">' + esc(U.resultCorrect || "") + '</div><div class="ex-box" style="margin-top:8px;border:none;background:transparent;padding:0"><div style="font-size:12px;line-height:1.65;color:#555">' + exHtml + "</div></div></div>";
      } else {
        h += '<div class="result-box result-box--err">';
        h += '<div class="result-box__title">' + esc(U.resultWrong || "") + "</div>";
        h += '<div style="font-size:12px;color:#c62828;margin:8px 0">' + esc(U.yourPickLabel || "") + esc(S.sel) + "</div>";
        h += '<div style="font-size:13px;font-weight:700;color:#1b5e20;margin-bottom:8px">' + esc(U.answerLabel || "") + esc(ans) + "</div>";
        h += '<div style="font-size:11px;font-weight:600;color:#666;margin-bottom:4px">' + esc(U.wrongReasonLabel || "") + "</div>";
        h += '<div style="font-size:12px;line-height:1.65;color:#444">' + exHtml + "</div></div>";
        h += '<p style="font-size:11px;color:#c62828;margin-top:8px">' + esc(U.wrongQueue || "") + "</p>";
      }
      h += '<button class="btn btn-next" onclick="nxt()">' + esc(U.nextBtn || "") + "</button>";
    } else if (S.sel !== null && !ans) {
      h += '<div class="ex-box"><p style="color:#666;font-size:12px">' + esc(U.noAnswerHint || "") + "</p></div>";
      h += '<button class="btn btn-next" onclick="nxt()">' + esc(U.nextBtn || "") + "</button>";
    }
  } else {
    h += '<div style="text-align:center;padding:24px;color:#999">' + esc(U.loading || "") + "</div>";
  }
  app.innerHTML = h;
}

function render() {
  bindTabs();
  if (S.topView === "concepts") { renderConcepts(); return; }
  if (S.phase === "menu") renderMenu();
  else if (S.phase === "review") renderReview();
  else renderQuiz();
}

document.addEventListener("keydown", function (ev) {
  if (ev.target && ["INPUT", "TEXTAREA", "SELECT"].includes(ev.target.tagName)) return;
  if (S.topView !== "quiz" || S.phase !== "quiz" || S.sel !== null || !S.lockedOpts.length) return;
  const m = /^(?:Digit|Numpad)([1-9])$/.exec(ev.code);
  if (!m) return;
  const idx = Number(m[1]) - 1;
  if (idx >= S.lockedOpts.length) return;
  ev.preventDefault();
  pick(S.lockedOpts[idx]);
});

render();
