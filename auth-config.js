/**
 * API 주소 — localhost면 로컬 서버, 아니면 Render
 */
(function (global) {
  var host = typeof location !== "undefined" ? location.hostname : "";
  var isLocal =
    !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    location.protocol === "file:";
  var API_BASE = isLocal
    ? "http://localhost:8787"
    : "https://test-quiz-8eb3.onrender.com";

  global.SiteAuthConfig = {
    API_BASE: API_BASE,
    TOKEN_KEY: "site-auth-token-v1",
    USER_CACHE_KEY: "site-auth-user-cache-v1",
    isLocal: isLocal
  };

  if (typeof global.AIQuizConfig === "undefined") {
    global.AIQuizConfig = { getApiBase: function () { return API_BASE; }, BUILTIN_API_BASE: API_BASE };
  }

  if (!isLocal && typeof document !== "undefined" && document.head) {
    var pre = document.createElement("link");
    pre.rel = "preconnect";
    pre.href = API_BASE;
    document.head.appendChild(pre);
    var dns = document.createElement("link");
    dns.rel = "dns-prefetch";
    dns.href = API_BASE;
    document.head.appendChild(dns);
  }
})(typeof window !== "undefined" ? window : globalThis);
