(function () {
  var currentStatus = "pending";
  var currentReqStatus = "pending";
  var selectedReqId = null;

  var APP_LABELS = {
    prog: "프로그래밍",
    korean: "국어 기말",
    english: "영어",
    science: "통합과학",
    social: "통합사회",
    "final-history": "한국사",
    "word-quiz": "국어 단어",
    history: "역사",
    economics: "경제",
    chinese: "중국어",
    "java-practice": "Java",
    "grammar-quiz": "문법 퀴즈",
    grammar: "문법",
    french: "프랑스어"
  };

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("ko-KR");
    } catch (e) {
      return iso;
    }
  }

  function isAdminUser(user) {
    return user && String(user.role) === "admin";
  }

  function showMsg(text, ok) {
    var el = document.getElementById("adminMsg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.classList.toggle("is-ok", !!ok);
  }

  function showVipMsg(text, ok) {
    var el = document.getElementById("adminVipMsg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.classList.toggle("is-ok", !!ok);
  }

  function vipActionHtml(u) {
    if (u.role === "admin") return "";
    if (u.role === "vip") {
      return (
        '<div class="admin-user__actions">' +
        '<button type="button" class="reject" data-vip-id="' +
        u.id +
        '" data-vip-action="demote">VIP 해제</button></div>'
      );
    }
    if (u.status === "approved") {
      return (
        '<div class="admin-user__actions">' +
        '<button type="button" class="approve" data-vip-id="' +
        u.id +
        '" data-vip-action="promote">VIP 승격</button></div>'
      );
    }
    return "";
  }

  function renderVipUsers(users) {
    var list = document.getElementById("adminVipList");
    if (!list) return;
    var eligible = (users || []).filter(function (u) {
      return u.role !== "admin" && (u.role === "vip" || u.status === "approved");
    });
    if (!eligible.length) {
      list.innerHTML =
        '<p class="admin-empty">승인된 회원이 없습니다.<br>먼저 아래 「승인 대기」에서 회원을 승인해 주세요.</p>';
      return;
    }
    list.innerHTML = eligible
      .map(function (u) {
        var isVip = u.role === "vip";
        return (
          '<article class="admin-user">' +
          "<div>" +
          '<div class="admin-user__name">' +
          esc(u.displayName || u.username) +
          (isVip ? ' <span class="admin-user__vip">VIP</span>' : "") +
          "</div>" +
          '<div class="admin-user__meta">@' +
          esc(u.username) +
          "</div>" +
          "</div>" +
          vipActionHtml(u) +
          "</article>"
        );
      })
      .join("");
  }

  function bindVipClicks() {
    if (document.documentElement.dataset.vipClickBound) return;
    document.documentElement.dataset.vipClickBound = "1";
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-vip-id]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var id = parseInt(btn.getAttribute("data-vip-id"), 10);
      if (!id) return;
      var promote = btn.getAttribute("data-vip-action") === "promote";
      setVip(id, promote, btn);
    });
  }
  function statusLabel(status) {
    if (status === "pending") return "승인 대기";
    if (status === "approved") return "승인됨";
    if (status === "rejected") return "거절됨";
    return status;
  }

  function roleBadge(u) {
    if (u.role === "admin") return "관리자";
    if (u.role === "vip") return "VIP";
    return statusLabel(u.status);
  }

  function renderUsers(users) {
    var list = document.getElementById("adminList");
    if (!list) return;
    if (!users.length) {
      list.innerHTML = '<p class="admin-empty">해당 목록이 비어 있습니다.</p>';
      return;
    }
    list.innerHTML = users
      .map(function (u) {
        var actions =
          u.role === "admin"
            ? '<span class="admin-user__meta">관리자</span>'
            : u.status === "pending"
              ? '<div class="admin-user__actions">' +
                '<button type="button" class="approve" data-approve="' +
                u.id +
                '">승인</button>' +
                '<button type="button" class="reject" data-reject="' +
                u.id +
                '">거절</button>' +
                "</div>"
              : u.role === "vip" || u.status === "approved"
                ? vipActionHtml(u) ||
                  '<span class="admin-user__meta">' + esc(roleBadge(u)) + "</span>"
                : '<span class="admin-user__meta">' +
                  esc(statusLabel(u.status)) +
                  "</span>";
        return (
          '<article class="admin-user">' +
          "<div>" +
          '<div class="admin-user__name">' +
          esc(u.displayName || u.username) +
          "</div>" +
          '<div class="admin-user__meta">@' +
          esc(u.username) +
          " · " +
          esc(roleBadge(u)) +
          "</div>" +
          "</div>" +
          actions +
          "</article>"
        );
      })
      .join("");

    list.querySelectorAll("[data-approve]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        moderate(parseInt(btn.getAttribute("data-approve"), 10), "approve");
      });
    });
    list.querySelectorAll("[data-reject]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        moderate(parseInt(btn.getAttribute("data-reject"), 10), "reject");
      });
    });
  }

  function renderNameChanges(users) {
    var list = document.getElementById("adminNameList");
    if (!list) return;
    if (!users.length) {
      list.innerHTML = '<p class="admin-empty">대기 중인 이름 변경이 없습니다.</p>';
      return;
    }
    list.innerHTML = users
      .map(function (u) {
        return (
          '<article class="admin-user">' +
          "<div>" +
          '<div class="admin-user__name">' +
          esc(u.displayName || u.username) +
          " → " +
          esc(u.pendingDisplayName) +
          "</div>" +
          '<div class="admin-user__meta">@' +
          esc(u.username) +
          "</div>" +
          "</div>" +
          '<div class="admin-user__actions">' +
          '<button type="button" class="approve" data-approve-name="' +
          u.id +
          '">승인</button>' +
          '<button type="button" class="reject" data-reject-name="' +
          u.id +
          '">거절</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    list.querySelectorAll("[data-approve-name]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        moderateName(parseInt(btn.getAttribute("data-approve-name"), 10), "approve-name");
      });
    });
    list.querySelectorAll("[data-reject-name]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        moderateName(parseInt(btn.getAttribute("data-reject-name"), 10), "reject-name");
      });
    });
  }

  function renderReqList(requests) {
    var list = document.getElementById("adminReqList");
    if (!list) return;
    if (!requests.length) {
      list.innerHTML = '<p class="admin-empty">요청이 없습니다.</p>';
      return;
    }
    list.innerHTML = requests
      .map(function (r) {
        return (
          '<article class="admin-user admin-req-item' +
          (selectedReqId === r.id ? " is-on" : "") +
          '" data-req-id="' +
          r.id +
          '">' +
          "<div>" +
          '<div class="admin-user__name">' +
          esc(r.title) +
          "</div>" +
          '<div class="admin-user__meta">' +
          esc(r.fromName || r.fromUsername || "") +
          " · " +
          esc(r.categoryLabel) +
          "<br>" +
          fmtDate(r.createdAt) +
          "</div>" +
          '<div class="admin-user__pending">' +
          esc(r.statusLabel) +
          (r.fileCount ? " · 첨부 " + r.fileCount + "개" : "") +
          "</div>" +
          "</div></article>"
        );
      })
      .join("");

    list.querySelectorAll("[data-req-id]").forEach(function (el) {
      el.addEventListener("click", function () {
        openReqDetail(parseInt(el.getAttribute("data-req-id"), 10));
      });
    });
  }

  async function downloadFile(requestId, fileId, filename) {
    var data = await SiteAuth.api("/requests/" + requestId + "/files/" + fileId);
    var f = data.file;
    var bin = atob(f.data);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var blob = new Blob([bytes], { type: f.mime || "application/octet-stream" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename || f.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openReqDetail(id) {
    selectedReqId = id;
    var data = await SiteAuth.api("/requests/" + id);
    var r = data.request;
    await loadRequests();

    var filesHtml =
      r.files && r.files.length
        ? "<p><strong>첨부</strong> " +
          r.files
            .map(function (f) {
              return (
                '<button type="button" class="req-file-link" data-file="' +
                f.id +
                '">📎 ' +
                esc(f.filename) +
                "</button>"
              );
            })
            .join(" ") +
          "</p>"
        : "";

    var replyHtml = r.adminReply
      ? '<div class="admin-req-detail__meta"><strong>이전 답변</strong><br>' +
        esc(r.adminReply) +
        "</div>"
      : "";

    var detail = document.getElementById("adminReqDetail");
    detail.innerHTML =
      '<h3 class="admin-req-detail__title">' +
      esc(r.title) +
      "</h3>" +
      '<p class="admin-req-detail__meta">' +
      "보낸 사람: " +
      esc(r.fromName || r.fromUsername) +
      " (@ " +
      esc(r.fromUsername || "") +
      ")<br>" +
      esc(r.categoryLabel) +
      " · " +
      fmtDate(r.createdAt) +
      "</p>" +
      '<div class="admin-req-detail__body">' +
      esc(r.body) +
      "</div>" +
      filesHtml +
      replyHtml +
      '<form class="admin-req-reply-form" id="adminReplyForm">' +
      '<label class="req-field"><span>답변 보내기</span>' +
      '<textarea name="reply" required placeholder="학생에게 보낼 답변을 작성하세요."></textarea></label>' +
      '<div class="admin-user__actions">' +
      '<button type="submit" class="approve">답변 전송</button>' +
      '<button type="button" class="reject" data-close-req>처리 완료</button>' +
      "</div></form>";

    detail.querySelectorAll("[data-file]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        downloadFile(r.id, parseInt(btn.getAttribute("data-file"), 10), btn.textContent);
      });
    });

    detail.querySelector("#adminReplyForm").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var reply = new FormData(ev.target).get("reply");
      try {
        await SiteAuth.api("/admin/requests/reply", {
          method: "POST",
          body: JSON.stringify({ requestId: r.id, reply: reply, status: "replied" })
        });
        showMsg("답변을 보냈습니다.", true);
        openReqDetail(r.id);
      } catch (e) {
        showMsg(e.message);
      }
    });

    detail.querySelector("[data-close-req]").addEventListener("click", async function () {
      var reply = detail.querySelector('textarea[name="reply"]').value.trim();
      if (!reply && !r.adminReply) {
        showMsg("답변 없이 완료하려면 내용을 입력하거나 기존 답변이 있어야 합니다.");
        return;
      }
      try {
        await SiteAuth.api("/admin/requests/reply", {
          method: "POST",
          body: JSON.stringify({
            requestId: r.id,
            reply: reply || r.adminReply,
            status: "closed"
          })
        });
        showMsg("처리 완료했습니다.", true);
        loadRequests();
      } catch (e) {
        showMsg(e.message);
      }
    });
  }

  async function loadAiStats() {
    var list = document.getElementById("adminAiStats");
    if (!list) return;
    list.innerHTML = '<p class="admin-empty">불러오는 중…</p>';
    try {
      var data = await SiteAuth.api("/admin/ai-stats");
      renderAiStats(data.users || []);
    } catch (e) {
      list.innerHTML = '<p class="admin-empty">목록을 불러오지 못했습니다.</p>';
    }
  }

  function renderAiStats(users) {
    var list = document.getElementById("adminAiStats");
    if (!list) return;
    if (!users.length) {
      list.innerHTML = '<p class="admin-empty">학습 데이터가 없습니다.</p>';
      return;
    }
    list.innerHTML = users
      .map(function (u) {
        return (
          '<article class="admin-user admin-req-item" data-ai-user="' +
          u.id +
          '">' +
          "<div>" +
          '<div class="admin-user__name">' +
          esc(u.displayName || u.username) +
          "</div>" +
          '<div class="admin-user__meta">@' +
          esc(u.username) +
          " · " +
          esc(statusLabel(u.status)) +
          "</div>" +
          '<div class="admin-user__pending">AI 문제 ' +
          (u.totalAiItems || 0) +
          "개 · 정답 " +
          (u.totalMastered || 0) +
          "개</div>" +
          "</div>" +
          '<span class="admin-user__meta">상세</span></article>'
        );
      })
      .join("");

    list.querySelectorAll("[data-ai-user]").forEach(function (el) {
      el.addEventListener("click", function () {
        openAiDetail(parseInt(el.getAttribute("data-ai-user"), 10));
      });
    });
  }

  async function openAiDetail(userId) {
    var box = document.getElementById("adminAiDetail");
    if (!box) return;
    box.hidden = false;
    box.innerHTML = '<p class="admin-empty">불러오는 중…</p>';
    try {
      var data = await SiteAuth.api("/admin/ai-stats/user?userId=" + userId);
      var u = data.user;
      var subs =
        (u.aiSubjects || []).length === 0
          ? "<p>생성한 AI 문제가 없습니다.</p>"
          : u.aiSubjects
              .map(function (s) {
                return (
                  "<p><strong>" +
                  esc(APP_LABELS[s.appId] || s.appId) +
                  "</strong> — 문제 " +
                  s.itemCount +
                  "개, 맞춤 " +
                  s.masteredCount +
                  "개, 오답 시도 " +
                  s.wrongAttempts +
                  "회, 최고 연속 " +
                  s.bestStreak +
                  " · " +
                  fmtDate(s.updatedAt) +
                  "</p>"
                );
              })
              .join("");
      box.innerHTML =
        "<h3 class=\"admin-req-detail__title\">" +
        esc(u.displayName || u.username) +
        " (@ " +
        esc(u.username) +
        ")</h3>" +
        '<p class="admin-req-detail__meta">상태: ' +
        esc(statusLabel(u.status)) +
        "</p>" +
        subs;
    } catch (e) {
      box.innerHTML = '<p class="admin-empty">' + esc(e.message) + "</p>";
    }
  }

  async function loadVipUsers() {
    var list = document.getElementById("adminVipList");
    if (list) list.innerHTML = '<p class="admin-empty">불러오는 중…</p>';
    try {
      var data = await SiteAuth.api("/admin/users");
      renderVipUsers(data.users || []);
    } catch (e) {
      if (list) list.innerHTML = '<p class="admin-empty">목록을 불러오지 못했습니다.</p>';
      showVipMsg(e.message);
    }
  }

  async function setVip(userId, vip, btn) {
    showVipMsg("");
    if (btn) btn.disabled = true;
    try {
      await SiteAuth.api("/admin/set-vip", {
        method: "POST",
        body: JSON.stringify({ userId: userId, vip: !!vip })
      });
      showVipMsg(vip ? "VIP로 승격했습니다." : "VIP를 해제했습니다.", true);
      await loadVipUsers();
      await loadUsers();
    } catch (e) {
      showVipMsg(e.message);
    }
    if (btn) btn.disabled = false;
  }

  async function loadUsers() {
    var list = document.getElementById("adminList");
    if (list) list.innerHTML = '<p class="admin-empty">불러오는 중…</p>';
    try {
      var path = currentStatus ? "/admin/users?status=" + encodeURIComponent(currentStatus) : "/admin/users";
      var data = await SiteAuth.api(path);
      renderUsers(data.users || []);
      showMsg("");
    } catch (e) {
      showMsg(e.message);
      if (list) list.innerHTML = '<p class="admin-empty">목록을 불러오지 못했습니다.</p>';
    }
  }

  async function loadNameChanges() {
    var list = document.getElementById("adminNameList");
    if (list) list.innerHTML = '<p class="admin-empty">불러오는 중…</p>';
    try {
      var data = await SiteAuth.api("/admin/name-changes");
      renderNameChanges(data.users || []);
    } catch (e) {
      if (list) list.innerHTML = '<p class="admin-empty">목록을 불러오지 못했습니다.</p>';
    }
  }

  async function loadRequests() {
    var list = document.getElementById("adminReqList");
    if (list) list.innerHTML = '<p class="admin-empty">불러오는 중…</p>';
    try {
      var path = currentReqStatus
        ? "/admin/requests?status=" + encodeURIComponent(currentReqStatus)
        : "/admin/requests";
      var data = await SiteAuth.api(path);
      renderReqList(data.requests || []);
    } catch (e) {
      if (list) list.innerHTML = '<p class="admin-empty">목록을 불러오지 못했습니다.</p>';
    }
  }

  async function moderate(userId, action) {
    showMsg("");
    try {
      await SiteAuth.api("/admin/" + action, {
        method: "POST",
        body: JSON.stringify({ userId: userId })
      });
      showMsg(action === "approve" ? "승인했습니다." : "거절했습니다.", true);
      loadUsers();
    } catch (e) {
      showMsg(e.message);
    }
  }

  async function moderateName(userId, action) {
    showMsg("");
    try {
      await SiteAuth.api("/admin/" + action, {
        method: "POST",
        body: JSON.stringify({ userId: userId })
      });
      showMsg(action === "approve-name" ? "이름 변경을 승인했습니다." : "이름 변경을 거절했습니다.", true);
      loadNameChanges();
    } catch (e) {
      showMsg(e.message);
    }
  }

  function onReady(ev) {
    var user = ev && ev.detail ? ev.detail.user : SiteAuth.getUser();
    if (!isAdminUser(user)) {
      location.replace("index.html");
      return;
    }
    bindVipClicks();
    loadRequests();
    loadAiStats();
    loadVipUsers();
    loadNameChanges();
    loadUsers();
  }

  document.querySelectorAll(".admin-panel__tabs:not(.admin-req-tabs) .admin-tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".admin-panel__tabs:not(.admin-req-tabs) .admin-tab").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
      });
      currentStatus = btn.getAttribute("data-status") || "";
      loadUsers();
    });
  });

  document.querySelectorAll(".admin-req-tabs .admin-tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".admin-req-tabs .admin-tab").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
      });
      currentReqStatus = btn.getAttribute("data-req-status") || "";
      selectedReqId = null;
      document.getElementById("adminReqDetail").innerHTML =
        '<p class="admin-empty">요청을 선택하세요.</p>';
      loadRequests();
    });
  });

  document.addEventListener("siteauth:ready", onReady);
})();
