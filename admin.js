(function () {
  var currentStatus = "pending";

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function showMsg(text, ok) {
    var el = document.getElementById("adminMsg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.classList.toggle("is-ok", !!ok);
  }

  function statusLabel(status) {
    if (status === "pending") return "승인 대기";
    if (status === "approved") return "승인됨";
    if (status === "rejected") return "거절됨";
    return status;
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
          esc(statusLabel(u.status)) +
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

  document.querySelectorAll(".admin-tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".admin-tab").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
      });
      currentStatus = btn.getAttribute("data-status") || "";
      loadUsers();
    });
  });

  document.addEventListener("siteauth:ready", loadUsers);
})();
