/**
 * 사이트 로그인 게이트 — 가입 후 관리자 승인 필요
 */
(function () {
  if (!window.SiteAuthConfig) return;

  var CFG = window.SiteAuthConfig;
  var API = (CFG.API_BASE || "").replace(/\/+$/, "");
  var TOKEN_KEY = CFG.TOKEN_KEY || "site-auth-token-v1";
  var USER_CACHE_KEY = CFG.USER_CACHE_KEY || "site-auth-user-cache-v1";
  var CACHE_TTL_MS = 10 * 60 * 1000;
  var CACHE_TTL_PENDING_MS = 45 * 1000;
  var isAdminPage = /admin\.html$/i.test(location.pathname);
  var isPublicPage = /hall-of-fame\.html$/i.test(location.pathname);

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
      else {
        localStorage.removeItem(TOKEN_KEY);
        clearUserCache();
      }
    } catch (e) {}
    state.token = token || null;
  }

  function clearUserCache() {
    try {
      sessionStorage.removeItem(USER_CACHE_KEY);
    } catch (e) {}
  }

  function loadUserCache(token) {
    try {
      var raw = sessionStorage.getItem(USER_CACHE_KEY);
      if (!raw) return null;
      var cached = JSON.parse(raw);
      if (!cached || cached.token !== token || !cached.user) return null;
      var ttl = cached.user.status === "pending" ? CACHE_TTL_PENDING_MS : CACHE_TTL_MS;
      if (Date.now() - cached.ts > ttl) return null;
      return cached.user;
    } catch (e) {
      return null;
    }
  }

  function saveUserCache(token, user) {
    try {
      sessionStorage.setItem(
        USER_CACHE_KEY,
        JSON.stringify({ token: token, user: user, ts: Date.now() })
      );
    } catch (e) {}
  }

  function warmupApi() {
    if (CFG.isLocal) return;
    fetch(API + "/health", { mode: "cors", credentials: "omit" }).catch(function () {});
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

  function isAdmin(user) {
    return !!(user && String(user.role) === "admin");
  }

  function isVip(user) {
    return !!(user && String(user.role) === "vip");
  }

  function canUseSite(user) {
    return user && (isAdmin(user) || isVip(user) || user.status === "approved");
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
    var adminLink = isAdmin(user)
      ? '<a href="admin.html">관리자 대시보드</a><span>·</span>'
      : "";
    var nameNote = user.pendingDisplayName
      ? ' <span class="auth-bar__pending" title="이름 변경 승인 대기">(' +
        esc(user.pendingDisplayName) +
        " 대기)</span>"
      : "";
    bar.innerHTML =
      "<span>" +
      esc(user.displayName || user.username) +
      "님" +
      nameNote +
      "</span>" +
      '<a href="requests.html">요청함</a><span>·</span>' +
      '<button type="button" data-auth-settings>계정 설정</button><span>·</span>' +
      adminLink +
      '<button type="button" data-auth-logout>로그아웃</button>';
    bar.hidden = false;
    bar.querySelector("[data-auth-logout]").addEventListener("click", logout);
    bar.querySelector("[data-auth-settings]").addEventListener("click", showSettings);
  }

  function showSettings() {
    var user = state.user;
    if (!user || !canUseSite(user)) return;
    var gate = ensureOverlay();
    gate.hidden = false;
    var pendingNote = user.pendingDisplayName
      ? '<p class="auth-card__lead">변경 신청: <strong>' +
        esc(user.pendingDisplayName) +
        "</strong> (관리자 승인 대기 중)<br>승인 전까지는 기존 이름으로 이용할 수 있습니다.</p>"
      : "";
  var adminNote = isAdmin(user)
      ? '<p class="auth-card__lead">관리자 계정은 이름 변경 시 바로 반영됩니다.</p>'
      : '<p class="auth-card__lead">이름 변경은 관리자 승인 후 반영됩니다. 승인 대기 중에도 사이트는 정상 이용 가능합니다.</p>';

    gate.innerHTML =
      '<div class="auth-card" role="dialog" aria-modal="true">' +
      "<h2>계정 설정</h2>" +
      '<p class="auth-card__lead">아이디: <strong>@' +
      esc(user.username) +
      "</strong></p>" +
      pendingNote +
      adminNote +
      '<form id="authSettingsForm" class="auth-settings-panel">' +
      '<label class="auth-field"><span>표시 이름</span><input name="displayName" required maxlength="40" value="' +
      esc(user.pendingDisplayName || user.displayName || "") +
      '" placeholder="표시 이름" /><small>가능하면 본명으로 해주세요</small></label>' +
      '<button type="submit" class="auth-btn">이름 변경 신청</button>' +
      '<button type="button" class="auth-btn auth-btn--ghost" data-auth-settings-close>닫기</button>' +
      "</form>" +
      '<p class="auth-msg" id="authSettingsMsg" hidden></p>' +
      "</div>";

    gate.querySelector("[data-auth-settings-close]").addEventListener("click", function () {
      gate.hidden = true;
    });

    gate.querySelector("#authSettingsForm").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var msg = document.getElementById("authSettingsMsg");
      var btn = gate.querySelector(".auth-btn[type=submit]");
      if (btn) btn.disabled = true;
      if (msg) msg.hidden = true;
      var fd = new FormData(ev.target);
      try {
        var data = await api("/auth/profile/display-name", {
          method: "POST",
          body: JSON.stringify({ displayName: String(fd.get("displayName") || "").trim() })
        });
        state.user = data.user;
        saveUserCache(getToken(), data.user);
        if (msg) {
          msg.hidden = false;
          msg.textContent = data.message || "저장되었습니다.";
          msg.classList.add("is-ok");
        }
        renderBar(state.user);
        if (isAdmin(state.user)) {
          setTimeout(function () {
            gate.hidden = true;
          }, 800);
        }
      } catch (e) {
        if (msg) {
          msg.hidden = false;
          msg.textContent = e.message;
          msg.classList.remove("is-ok");
        }
      }
      if (btn) btn.disabled = false;
    });
  }

  function showLoginForm(mode) {
    document.documentElement.classList.remove("site-ready");
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
        ? '<label class="auth-field"><span>이름</span><input name="displayName" autocomplete="name" placeholder="표시 이름" required /><small>가능하면 본명으로 해주세요</small></label>'
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

  function finishPublicPage(user) {
    unlockSite();
    document.documentElement.classList.add("site-ready");
    ensureOverlay().hidden = true;
    state.user = user || null;
    state.ready = !!(user && canUseSite(user));
    if (user && canUseSite(user)) renderBar(user);
    else ensureBar().hidden = true;
    document.dispatchEvent(new CustomEvent("siteauth:ready", { detail: { user: user || null } }));
  }

  function applyUser(user) {
    state.user = user;

    if (isAdminPage) {
      if (!isAdmin(user)) {
        location.replace("index.html");
        return;
      }
      document.documentElement.classList.add("admin-ready", "site-ready");
      unlockSite();
      ensureOverlay().hidden = true;
      renderBar(user);
      state.ready = true;
      document.dispatchEvent(new CustomEvent("siteauth:ready", { detail: { user: user } }));
      return;
    }

      if (isAdmin(user) || isVip(user) || user.status === "approved") {
        showApproved(user);
    } else if (user.status === "pending") {
      showPending(user);
    } else {
      showRejected(user);
    }
  }

  async function refreshUserInBackground(token) {
    try {
      var data = await api("/auth/me");
      var user = data.user;
      saveUserCache(token, user);
      var prev = state.user;
      var changed =
        !prev ||
        prev.status !== user.status ||
        prev.role !== user.role ||
        prev.displayName !== user.displayName ||
        prev.pendingDisplayName !== user.pendingDisplayName;
        if (changed) {
          if (isPublicPage) finishPublicPage(user);
          else applyUser(user);
        }
    } catch (e) {
      if (e.status === 401) {
        clearUserCache();
        setToken("");
        if (isPublicPage) finishPublicPage(null);
        else showLoginForm("login");
      }
    }
  }

  function showApproved(user) {
    ensureOverlay().hidden = true;
    unlockSite();
    document.documentElement.classList.add("site-ready");
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
    clearUserCache();
    setToken("");
    state.user = null;
    state.ready = false;
    document.documentElement.classList.remove("site-ready");
    ensureBar().hidden = true;
    if (isPublicPage) finishPublicPage(null);
    else showLoginForm("login");
  }

  async function bootstrapPublic() {
    var token = getToken();
    if (!token) {
      finishPublicPage(null);
      return;
    }
    var cached = loadUserCache(token);
    if (cached) {
      finishPublicPage(cached);
      refreshUserInBackground(token);
      return;
    }
    try {
      var data = await api("/auth/me");
      saveUserCache(token, data.user);
      finishPublicPage(data.user);
    } catch (e) {
      if (e.status === 401) setToken("");
      finishPublicPage(null);
    }
  }

  async function bootstrap() {
    warmupApi();

    if (isPublicPage) {
      await bootstrapPublic();
      return;
    }

    var token = getToken();
    if (!token) {
      showLoginForm("login");
      return;
    }

    var cached = loadUserCache(token);
    if (cached) {
      applyUser(cached);
      refreshUserInBackground(token);
      return;
    }

    try {
      var data = await api("/auth/me");
      var user = data.user;
      saveUserCache(token, user);
      applyUser(user);
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

  if (!isPublicPage) document.documentElement.classList.add("auth-locked");
  warmupApi();

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
    logout: logout,
    refresh: bootstrap
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
