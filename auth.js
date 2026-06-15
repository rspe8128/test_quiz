/**
 * 사이트 로그인 게이트 — 가입 후 관리자 승인 필요
 */
(function () {
  if (!window.SiteAuthConfig) return;

  var CFG = window.SiteAuthConfig;
  var API = (CFG.API_BASE || "").replace(/\/+$/, "");
  var TOKEN_KEY = CFG.TOKEN_KEY || "site-auth-token-v1";
  var isAdminPage = /admin\.html$/i.test(location.pathname);

  var state = {
    user: null,
    token: null,
    ready: false
  };

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    state.token = token || null;
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function authHeaders() {
    var t = getToken();
    var h = { "Content-Type": "application/json" };
    if (t) h.Authorization = "Bearer " + t;
    return h;
  }

  async function api(path, options) {
    var res = await fetch(API + path, Object.assign({ headers: authHeaders() }, options || {}));
    var data;
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    if (!res.ok) {
      var err = new Error(data.error || "요청에 실패했습니다.");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function unlockSite() {
    document.documentElement.classList.remove("auth-locked");
  }

  function lockSite() {
    document.documentElement.classList.add("auth-locked");
  }

  function canUseSite(user) {
    return user && (user.role === "admin" || user.status === "approved");
  }

  function ensureOverlay() {
    var gate = document.getElementById("authGate");
    if (gate) return gate;
    gate = document.createElement("div");
    gate.id = "authGate";
    gate.className = "auth-gate";
    gate.hidden = true;
    document.body.appendChild(gate);
    return gate;
  }

  function ensureBar() {
    var bar = document.getElementById("authBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "authBar";
    bar.className = "auth-bar";
    bar.hidden = true;
    document.body.appendChild(bar);
    return bar;
  }

  function renderBar(user) {
    var bar = ensureBar();
    if (!user || !canUseSite(user)) {
      bar.hidden = true;
      return;
    }
    var adminLink =
      user.role === "admin"
        ? '<a href="admin.html">관리자 대시보드</a><span>·</span>'
        : "";
    bar.innerHTML =
      "<span>" +
      esc(user.displayName || user.username) +
      "님</span>" +
      adminLink +
      '<button type="button" data-auth-logout>로그아웃</button>';
    bar.hidden = false;
    bar.querySelector("[data-auth-logout]").addEventListener("click", logout);
  }

  function showLoginForm(mode) {
    var gate = ensureOverlay();
    gate.hidden = false;
    lockSite();
    mode = mode || "login";

    gate.innerHTML =
      '<div class="auth-card" role="dialog" aria-modal="true">' +
      '<span class="auth-card__badge">민사 1-1 퀴즈</span>' +
      "<h2>로그인이 필요합니다</h2>" +
      '<p class="auth-card__lead">회원가입 후 관리자 승인을 받으면 사이트를 이용할 수 있습니다.</p>' +
      '<div class="auth-tabs">' +
      '<button type="button" data-auth-tab="login"' +
      (mode === "login" ? ' class="is-on"' : "") +
      ">로그인</button>" +
      '<button type="button" data-auth-tab="register"' +
      (mode === "register" ? ' class="is-on"' : "") +
      ">회원가입</button>" +
      "</div>" +
      '<form id="authForm">' +
      (mode === "register"
        ? '<label class="auth-field"><span>이름</span><input name="displayName" autocomplete="name" placeholder="표시 이름" /></label>'
        : "") +
      '<label class="auth-field"><span>아이디</span><input name="username" autocomplete="username" required placeholder="영문 소문자·숫자·_ 3~24자" /></label>' +
      '<label class="auth-field"><span>비밀번호</span><input type="password" name="password" autocomplete="current-password" required minlength="6" placeholder="6자 이상" /></label>' +
      '<button type="submit" class="auth-btn">' +
      (mode === "register" ? "가입 신청" : "로그인") +
      "</button>" +
      "</form>" +
      '<p class="auth-msg" id="authMsg" hidden></p>' +
      "</div>";

    gate.querySelectorAll("[data-auth-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showLoginForm(btn.getAttribute("data-auth-tab"));
      });
    });

    gate.querySelector("#authForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      submitAuth(mode, new FormData(ev.target));
    });
  }

  function showPending(user) {
    var gate = ensureOverlay();
    gate.hidden = false;
    lockSite();
    gate.innerHTML =
      '<div class="auth-card">' +
      '<div class="auth-wait-icon">⏳</div>' +
      "<h2>승인 대기 중</h2>" +
      '<p class="auth-card__lead"><strong>' +
      esc(user.displayName || user.username) +
      "</strong>님, 가입 신청이 접수되었습니다.<br>관리자가 승인하면 사이트를 이용할 수 있습니다.</p>" +
      '<button type="button" class="auth-btn auth-btn--ghost" data-auth-refresh>승인 여부 다시 확인</button>' +
      '<button type="button" class="auth-btn auth-btn--ghost" data-auth-logout>로그아웃</button>' +
      "</div>";
    gate.querySelector("[data-auth-refresh]").addEventListener("click", bootstrap);
    gate.querySelector("[data-auth-logout]").addEventListener("click", logout);
  }

  function showRejected(user) {
    var gate = ensureOverlay();
    gate.hidden = false;
    lockSite();
    gate.innerHTML =
      '<div class="auth-card">' +
      "<h2>가입이 거절되었습니다</h2>" +
      '<p class="auth-card__lead">관리자에게 문의하거나 다른 아이디로 다시 가입해 주세요.</p>' +
      '<button type="button" class="auth-btn auth-btn--ghost" data-auth-logout>로그아웃</button>' +
      "</div>";
    gate.querySelector("[data-auth-logout]").addEventListener("click", logout);
  }

  function showApproved(user) {
    ensureOverlay().hidden = true;
    unlockSite();
    renderBar(user);
    state.user = user;
    state.ready = true;
    document.dispatchEvent(new CustomEvent("siteauth:ready", { detail: { user: user } }));
  }

  async function submitAuth(mode, formData) {
    var msg = document.getElementById("authMsg");
    var btn = document.querySelector("#authForm .auth-btn");
    if (btn) btn.disabled = true;
    if (msg) msg.hidden = true;

    try {
      var payload = {
        username: String(formData.get("username") || "").trim().toLowerCase(),
        password: String(formData.get("password") || "")
      };
      if (mode === "register") {
        payload.displayName = String(formData.get("displayName") || payload.username).trim();
      }
      var data = await api(mode === "register" ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setToken(data.token);
      await bootstrap();
    } catch (e) {
      if (msg) {
        msg.hidden = false;
        msg.textContent = e.message;
        msg.classList.remove("is-ok");
      }
      if (btn) btn.disabled = false;
    }
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (e) {}
    setToken("");
    state.user = null;
    state.ready = false;
    ensureBar().hidden = true;
    showLoginForm("login");
  }

  async function bootstrap() {
    var token = getToken();
    if (!token) {
      if (isAdminPage) {
        showLoginForm("login");
        return;
      }
      showLoginForm("login");
      return;
    }

    try {
      var data = await api("/auth/me");
      var user = data.user;
      state.user = user;

      if (isAdminPage) {
        if (user.role !== "admin") {
          location.href = "index.html";
          return;
        }
        unlockSite();
        ensureOverlay().hidden = true;
        renderBar(user);
        state.ready = true;
        document.dispatchEvent(new CustomEvent("siteauth:ready", { detail: { user: user } }));
        return;
      }

      if (user.role === "admin" || user.status === "approved") {
        showApproved(user);
      } else if (user.status === "pending") {
        showPending(user);
      } else {
        showRejected(user);
      }
    } catch (e) {
      setToken("");
      if (e.status === 401) {
        showLoginForm("login");
        return;
      }
      var hint = CFG.isLocal
        ? "로컬 서버가 꺼져 있을 수 있습니다. ai-quiz-server 폴더에서 python server.py 를 실행해 주세요."
        : "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      var gate = ensureOverlay();
      gate.hidden = false;
      lockSite();
      gate.innerHTML =
        '<div class="auth-card">' +
        "<h2>연결 실패</h2>" +
        '<p class="auth-card__lead">' +
        esc(e.message || "서버 응답 없음") +
        "<br><br>" +
        esc(hint) +
        "</p>" +
        '<button type="button" class="auth-btn" data-auth-retry>다시 시도</button>' +
        '<button type="button" class="auth-btn auth-btn--ghost" data-auth-login>로그인 화면</button>' +
        "</div>";
      gate.querySelector("[data-auth-retry]").addEventListener("click", bootstrap);
      gate.querySelector("[data-auth-login]").addEventListener("click", function () {
        showLoginForm("login");
      });
    }
  }

  document.documentElement.classList.add("auth-locked");

  window.SiteAuth = {
    getToken: getToken,
    getUser: function () {
      return state.user;
    },
    isReady: function () {
      return state.ready;
    },
    authHeaders: authHeaders,
    api: api,
    logout: logout
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
