(function () {
  var root = document.getElementById("fsRoot");
  if (!root) return;

  var tabButtons = root.querySelectorAll(".fk-topnav__btn");
  var panels = root.querySelectorAll(".fk-panel");
  var wrap = root.querySelector(".fk-topnav-wrap");

  var QUIZ = (typeof FS_QUIZ !== "undefined" ? FS_QUIZ : []).map(function (item) {
    return {
      id: item.id,
      tab: item.tab,
      q: item.q || "",
      opts: item.opts || [],
      a: item.a || "",
      ex: item.ex || ""
    };
  });

  var quizByTab = {};
  QUIZ.forEach(function (q) {
    if (!quizByTab[q.tab]) quizByTab[q.tab] = [];
    quizByTab[q.tab].push(q);
  });

  var activeTab = "region";
  var quizSessions = {};

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

  function emptySession() {
    return {
      phase: "quiz",
      order: [],
      idx: 0,
      sel: null,
      opts: [],
      score: { c: 0, w: 0 }
    };
  }

  function getSession(tabId) {
    if (!quizSessions[tabId]) quizSessions[tabId] = emptySession();
    return quizSessions[tabId];
  }

  function currentQ(tabId) {
    var s = getSession(tabId);
    var id = s.order[s.idx];
    return QUIZ.find(function (q) { return q.id === id; }) || null;
  }

  function activateTab(name) {
    activeTab = name;
    tabButtons.forEach(function (btn) {
      var on = btn.getAttribute("data-fs-tab") === name;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-fs-panel") === name;
      panel.classList.toggle("is-on", on);
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
    if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showConcept(tabId) {
    var panel = root.querySelector('[data-fs-panel="' + tabId + '"]');
    if (!panel) return;
    var concept = panel.querySelector('[data-fs-concept="' + tabId + '"]');
    var quizWrap = panel.querySelector('[data-fs-quiz-wrap="' + tabId + '"]');
    if (concept) concept.hidden = false;
    if (quizWrap) quizWrap.hidden = true;
  }

  function showQuiz(tabId) {
    var panel = root.querySelector('[data-fs-panel="' + tabId + '"]');
    if (!panel) return;
    var concept = panel.querySelector('[data-fs-concept="' + tabId + '"]');
    var quizWrap = panel.querySelector('[data-fs-quiz-wrap="' + tabId + '"]');
    if (concept) concept.hidden = true;
    if (quizWrap) {
      quizWrap.hidden = false;
      quizWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function startQuiz(tabId) {
    var qs = quizByTab[tabId] || [];
    if (!qs.length) return;
    var s = emptySession();
    s.order = shuffle(qs.map(function (q) { return q.id; }));
    quizSessions[tabId] = s;
    showQuiz(tabId);
    renderQuiz(tabId);
  }

  function renderQuiz(tabId) {
    var app = root.querySelector('[data-fs-quiz-app="' + tabId + '"]');
    if (!app) return;
    var s = getSession(tabId);
    var qs = quizByTab[tabId] || [];
    var tabBtn = root.querySelector('[data-fs-tab="' + tabId + '"]');
    var tabLabel = tabBtn ? tabBtn.childNodes[0].textContent.trim() : tabId;

    if (s.phase === "done") {
      var total = s.score.c + s.score.w;
      var pct = total ? Math.round(s.score.c / total * 100) : 0;
      app.innerHTML =
        '<div class="fs-quiz-head"><button type="button" class="fs-quiz-back" data-fs-back="' + tabId + '">&larr; 내용 정리로</button></div>' +
        '<div class="fs-quiz-done"><div class="fs-quiz-done__icon">' + (pct >= 80 ? "✓" : "◎") + "</div>" +
        "<h3>" + esc(tabLabel) + " 완료</h3>" +
        "<p>정답 <strong>" + s.score.c + "</strong> / " + total + " (" + pct + "%)</p>" +
        '<button type="button" class="fs-quiz-retry" data-fs-retry="' + tabId + '">다시 풀기</button>' +
        '<button type="button" class="fs-quiz-back fs-quiz-back--secondary" data-fs-back="' + tabId + '">내용 정리로 돌아가기</button></div>';
      return;
    }

    var cur = currentQ(tabId);
    if (!cur) {
      s.phase = "done";
      renderQuiz(tabId);
      return;
    }

    if (!s.opts.length) {
      s.opts = shuffle(cur.opts.slice());
    }

    var h = '<div class="fs-quiz-head"><button type="button" class="fs-quiz-back" data-fs-back="' + tabId + '">&larr; 내용 정리로</button>';
    h += '<span class="fs-quiz-progress">' + (s.idx + 1) + " / " + qs.length + "</span></div>";
    h += '<span class="fs-q-num">Q' + (s.idx + 1) + "</span>";
    h += '<p class="fs-q-text">' + esc(cur.q) + "</p>";
    h += '<div class="fs-opt-list">';
    s.opts.forEach(function (o, i) {
      var cls = "";
      var lbl = "";
      if (s.sel !== null) {
        if (o === cur.a) { cls = "fs-opt--ok"; lbl = "정답"; }
        else if (o === s.sel) { cls = "fs-opt--err"; lbl = "오답"; }
      }
      h += '<button type="button" class="fs-opt ' + cls + '" data-fs-pick="' + tabId + '" data-opt="' + encodeURIComponent(o) + '" ' + (s.sel !== null ? "disabled" : "") + ">";
      h += '<span class="fs-opt-num">' + (i + 1) + "</span>" + esc(o);
      if (lbl) h += '<span class="fs-opt-lbl">' + lbl + "</span>";
      h += "</button>";
    });
    h += "</div>";

    if (s.sel !== null) {
      var ok = s.sel === cur.a;
      h += '<div class="fs-result fs-result--' + (ok ? "ok" : "err") + '">';
      h += '<div class="fs-result__title">' + (ok ? "정답입니다" : "틀렸습니다") + "</div>";
      if (!ok) h += '<p class="fs-result__ans">정답: ' + esc(cur.a) + "</p>";
      h += '<p class="fs-result__ex">' + esc(cur.ex) + "</p></div>";
      h += '<button type="button" class="fs-quiz-next" data-fs-next="' + tabId + '">' + (s.idx < qs.length - 1 ? "다음 문항" : "결과 보기") + "</button>";
    }

    app.innerHTML = h;
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateTab(btn.getAttribute("data-fs-tab"));
    });
  });

  root.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-fs-quiz-start]");
    if (t) {
      startQuiz(t.getAttribute("data-fs-quiz-start"));
      return;
    }
    t = ev.target.closest("[data-fs-back]");
    if (t) {
      showConcept(t.getAttribute("data-fs-back"));
      return;
    }
    t = ev.target.closest("[data-fs-retry]");
    if (t) {
      startQuiz(t.getAttribute("data-fs-retry"));
      return;
    }
    t = ev.target.closest("[data-fs-pick]");
    if (t && !t.disabled) {
      var tabId = t.getAttribute("data-fs-pick");
      var s = getSession(tabId);
      if (s.sel !== null) return;
      var opt = decodeURIComponent(t.getAttribute("data-opt") || "");
      s.sel = opt;
      var cur = currentQ(tabId);
      if (cur && opt === cur.a) s.score.c++;
      else s.score.w++;
      renderQuiz(tabId);
      return;
    }
    t = ev.target.closest("[data-fs-next]");
    if (t) {
      var tabId2 = t.getAttribute("data-fs-next");
      var s2 = getSession(tabId2);
      s2.idx++;
      s2.sel = null;
      s2.opts = [];
      if (s2.idx >= (quizByTab[tabId2] || []).length) s2.phase = "done";
      renderQuiz(tabId2);
    }
  });

  activateTab(activeTab);
})();
