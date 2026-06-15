/**
 * 과목 페이지별 AI 퀴즈 자동 연결
 */
(function () {
  if (typeof AIQuiz === "undefined" || !AIQuiz.mountSubject) return;

  var SUBJECTS = {
    "final-programming.html": {
      appId: "prog",
      preset: "programming",
      bottomMount: ".page-card",
      tabBar: "#progTopnav",
      tabAttr: "data-prog-view",
      tabBtnClass: "prog-topnav__btn",
      hideHosts: ["#app"]
    },
    "final-korean.html": {
      appId: "korean",
      preset: "korean_mcq",
      bottomMount: "#fkRoot",
      tabBar: "#fkModeNav",
      tabAttr: "data-fk-view",
      tabBtnClass: "fk-mode-nav__btn",
      hideHosts: ["#fkConcepts", "#fkQuizWrap"]
    },
    "final-english.html": {
      appId: "english",
      preset: "english",
      bottomMount: "#feRoot",
      tabBar: "#feModeNav",
      tabAttr: "data-fe-view",
      tabBtnClass: "fk-mode-nav__btn",
      hideHosts: ["#feConcepts", "#feMockWrap"]
    },
    "final-science.html": {
      appId: "science",
      preset: "science",
      bottomMount: "#fsciRoot",
      tabBar: "#fsciRoot .fk-topnav",
      tabAttr: "data-fsci-tab",
      tabBtnClass: "fk-topnav__btn",
      hideHosts: ["#fsciPanels"]
    },
    "final-social.html": {
      appId: "social",
      preset: "social",
      bottomMount: "#fsRoot",
      tabBar: "#fsTopnav",
      tabAttr: "data-fs-tab",
      tabBtnClass: "fk-topnav__btn",
      hideHosts: ["#fsPanels"]
    },
    "final-history.html": {
      appId: "final-history",
      preset: "history",
      bottomMount: ".page-card",
      tabBar: "#khTopnav",
      tabAttr: "data-kh-view",
      tabBtnClass: "kh-topnav__btn",
      hideHosts: ["#app"]
    },
    "final-economics.html": {
      appId: "final-economics",
      preset: "economics",
      bottomMount: ".page-card"
    },
    "final-math.html": {
      appId: "final-math",
      preset: "generic",
      bottomMount: ".page-card"
    },
    "final-physics.html": {
      appId: "final-physics",
      preset: "science",
      bottomMount: ".page-card"
    },
    "word-quiz.html": {
      appId: "word-quiz",
      preset: "korean_word",
      bottomMount: "body",
      hideHosts: [
        "#home",
        "#wordSubHome",
        "#litSubHome",
        "#listSelection",
        "#wordStudySelection",
        "#wordStudy",
        "#selection",
        "#quiz",
        "#results",
        "#litSection",
        "#controls"
      ]
    },
    "history.html": {
      appId: "history",
      preset: "history",
      bottomMount: ".page-card",
      tabBar: "#histTopnav",
      tabAttr: "data-hist-view",
      tabBtnClass: "hist-topnav__btn",
      hideHosts: ["#app"]
    },
    "economics.html": {
      appId: "economics",
      preset: "economics",
      bottomMount: ".page-card",
      tabBar: "#econTopnav",
      tabAttr: "data-econ-view",
      tabBtnClass: "econ-topnav__btn",
      hideHosts: ["#app"]
    },
    "chinese.html": {
      appId: "chinese",
      preset: "chinese",
      bottomMount: "body",
      hideHosts: ["#cn-home", "#cn-app"]
    },
    "java-practice.html": {
      appId: "java-practice",
      preset: "java_practice",
      bottomMount: "body",
      hideHosts: [".wrap"]
    },
    "korean-grammar-quiz.html": {
      appId: "grammar-quiz",
      preset: "grammar",
      bottomMount: ".shell",
      hideHosts: ["#kgq-intro", "#kgq-runner"]
    },
    "korean-grammar.html": {
      appId: "grammar",
      preset: "grammar",
      bottomMount: ".shell",
      hideHosts: [".shell > .card", ".shell > details"]
    },
    "french.html": {
      appId: "french",
      preset: "generic",
      bottomMount: ".page-card"
    }
  };

  Object.keys(SUBJECTS).forEach(function (key) {
    if (key.endsWith(".html")) {
      var bare = key.slice(0, -5);
      if (!SUBJECTS[bare]) SUBJECTS[bare] = SUBJECTS[key];
    }
  });

  function pageKey() {
    var tail = (location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();
    if (SUBJECTS[tail]) return tail;
    if (!/\.html$/i.test(tail) && SUBJECTS[tail + ".html"]) return tail + ".html";
    return tail;
  }

  var cfg = SUBJECTS[pageKey()];
  if (!cfg) return;

  var mounted = false;

  function tryBoot() {
    if (mounted) return;
    boot();
  }

  async function boot() {
    if (mounted) return;
    mounted = true;
    try {
      await AIQuiz.mountSubject(cfg);
    } catch (e) {
      mounted = false;
      console.error("AI 퀴즈 마운트 실패:", e);
    }
  }

  function scheduleBoot() {
    tryBoot();
    if (!mounted) {
      setTimeout(tryBoot, 80);
      setTimeout(tryBoot, 400);
      setTimeout(tryBoot, 1200);
    }
  }

  document.addEventListener("siteauth:ready", function () {
    scheduleBoot();
    if (mounted && AIQuiz.refreshSubject) AIQuiz.refreshSubject(cfg.appId);
  });
  document.addEventListener("ai-quiz:request-mount", scheduleBoot);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleBoot);
  } else {
    scheduleBoot();
  }
})();
