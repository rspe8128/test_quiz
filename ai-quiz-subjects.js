/**
 * 과목 페이지별 AI 퀴즈 자동 연결
 */
(function () {
  if (typeof AIQuiz === "undefined" || !AIQuiz.mountSubject) return;

  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

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

  var cfg = SUBJECTS[page];
  if (!cfg) return;

  var mounted = false;

  function canMount() {
    if (!window.SiteAuth) return true;
    var user = SiteAuth.getUser();
    return SiteAuth.isReady() && user && (user.role === "admin" || user.role === "vip" || user.status === "approved");
  }

  function tryBoot() {
    if (window.SiteAuth && !SiteAuth.isReady()) {
      document.addEventListener("siteauth:ready", boot, { once: true });
      setTimeout(function () {
        if (!mounted && SiteAuth.isReady()) boot();
      }, 50);
      return;
    }
    boot();
  }

  async function boot() {
    if (mounted || !canMount()) return;
    mounted = true;
    try {
      await AIQuiz.mountSubject(cfg);
    } catch (e) {
      mounted = false;
      console.error("AI 퀴즈 마운트 실패:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryBoot);
  } else {
    tryBoot();
  }
})();
