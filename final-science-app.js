(function () {
  var root = document.getElementById("fsciRoot");
  if (!root) return;

  var mainTabs = root.querySelectorAll("[data-fsci-tab]");
  var mainPanels = root.querySelectorAll("[data-fsci-panel]");
  var mainWrap = root.querySelector(".fk-topnav-wrap");

  var bioSubTabs = root.querySelectorAll("[data-fsci-bio-tab]");
  var bioPanels = root.querySelectorAll("[data-fsci-bio-panel]");

  var QUIZ = (typeof FSCI_QUIZ !== "undefined" ? FSCI_QUIZ : []).map(function (item) {
    return {
      id: item.id,
      tab: item.tab,
      unit: item.unit || "",
      source: item.source || "",
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

  var activeMain = "biology";
  var activeBio = "bio-material";
  var quizSessions = {};
  var quizStarted = false;

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

  function activateMain(name) {
    activeMain = name;
    mainTabs.forEach(function (btn) {
      var on = btn.getAttribute("data-fsci-tab") === name;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    mainPanels.forEach(function (panel) {
      var on = panel.getAttribute("data-fsci-panel") === name;
      panel.classList.toggle("is-on", on);
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
    if (mainWrap) mainWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function activateBio(name) {
    activeBio = name;
    bioSubTabs.forEach(function (btn) {
      var on = btn.getAttribute("data-fsci-bio-tab") === name;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    bioPanels.forEach(function (panel) {
      var on = panel.getAttribute("data-fsci-bio-panel") === name;
      panel.classList.toggle("is-on", on);
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
    if (name === "bio-quiz" && !quizStarted) {
      showQuizIntro();
    }
  }

  function showQuizIntro() {
    var intro = root.querySelector('[data-fsci-quiz-intro="bio-quiz"]');
    var app = root.querySelector('[data-fsci-quiz-app="bio-quiz"]');
    if (intro) intro.hidden = false;
    if (app) app.innerHTML = "";
    quizStarted = false;
  }

  function showQuizApp() {
    var intro = root.querySelector('[data-fsci-quiz-intro="bio-quiz"]');
    if (intro) intro.hidden = true;
    quizStarted = true;
  }

  function startQuiz(tabId) {
    var qs = quizByTab[tabId] || [];
    if (!qs.length) return;
    var s = emptySession();
    s.order = shuffle(qs.map(function (q) { return q.id; }));
    quizSessions[tabId] = s;
    showQuizApp();
    renderQuiz(tabId);
  }

  function renderQuiz(tabId) {
    var app = root.querySelector('[data-fsci-quiz-app="' + tabId + '"]');
    if (!app) return;
    var s = getSession(tabId);
    var qs = quizByTab[tabId] || [];

    if (s.phase === "done") {
      var total = s.score.c + s.score.w;
      var pct = total ? Math.round(s.score.c / total * 100) : 0;
      app.innerHTML =
        '<div class="fs-quiz-head"><button type="button" class="fs-quiz-back" data-fsci-back-quiz="' + tabId + '">&larr; 목록으로</button></div>' +
        '<div class="fs-quiz-done"><div class="fs-quiz-done__icon">' + (pct >= 80 ? "✓" : "◎") + "</div>" +
        "<h3>연습문제 완료</h3>" +
        "<p>정답 <strong>" + s.score.c + "</strong> / " + total + " (" + pct + "%)</p>" +
        '<button type="button" class="fs-quiz-retry" data-fsci-retry="' + tabId + '">다시 풀기</button>' +
        '<button type="button" class="fs-quiz-back fs-quiz-back--secondary" data-fsci-back-quiz="' + tabId + '">목록으로 돌아가기</button></div>';
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

    var h = '<div class="fs-quiz-head"><button type="button" class="fs-quiz-back" data-fsci-back-quiz="' + tabId + '">&larr; 목록으로</button>';
    h += '<span class="fs-quiz-progress">' + (s.idx + 1) + " / " + qs.length + "</span></div>";
    h += '<div class="fs-q-meta">';
    if (cur.unit) h += '<span class="fs-q-tag">' + esc(cur.unit) + "</span>";
    if (cur.source) h += '<span class="fs-q-tag">' + esc(cur.source) + "</span>";
    h += "</div>";
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
      h += '<button type="button" class="fs-opt ' + cls + '" data-fsci-pick="' + tabId + '" data-opt="' + encodeURIComponent(o) + '" ' + (s.sel !== null ? "disabled" : "") + ">";
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
      h += '<button type="button" class="fs-quiz-next" data-fsci-next="' + tabId + '">' + (s.idx < qs.length - 1 ? "다음 문항" : "결과 보기") + "</button>";
    }

    app.innerHTML = h;
  }

  mainTabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateMain(btn.getAttribute("data-fsci-tab"));
    });
  });

  bioSubTabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateBio(btn.getAttribute("data-fsci-bio-tab"));
    });
  });

  root.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-fsci-quiz-start]");
    if (t) {
      startQuiz(t.getAttribute("data-fsci-quiz-start"));
      return;
    }
    t = ev.target.closest("[data-fsci-back-quiz]");
    if (t) {
      showQuizIntro();
      return;
    }
    t = ev.target.closest("[data-fsci-retry]");
    if (t) {
      startQuiz(t.getAttribute("data-fsci-retry"));
      return;
    }
    t = ev.target.closest("[data-fsci-pick]");
    if (t && !t.disabled) {
      var tabId = t.getAttribute("data-fsci-pick");
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
    t = ev.target.closest("[data-fsci-next]");
    if (t) {
      var tabId2 = t.getAttribute("data-fsci-next");
      var s2 = getSession(tabId2);
      s2.idx++;
      s2.sel = null;
      s2.opts = [];
      if (s2.idx >= (quizByTab[tabId2] || []).length) s2.phase = "done";
      renderQuiz(tabId2);
    }
  });

  activateMain(activeMain);
  activateBio(activeBio);
})();
