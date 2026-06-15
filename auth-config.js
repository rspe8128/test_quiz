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
    isLocal: isLocal
  };

  if (typeof global.AIQuizConfig === "undefined") {
    global.AIQuizConfig = { getApiBase: function () { return API_BASE; }, BUILTIN_API_BASE: API_BASE };
  }
})(typeof window !== "undefined" ? window : globalThis);
