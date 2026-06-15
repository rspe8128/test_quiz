(function () {
  var booted = false;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function apiBase() {
    return ((window.SiteAuthConfig && SiteAuthConfig.API_BASE) || "").replace(/\/+$/, "");
  }

  function avatarHtml(member) {
    if (member.avatar) {
      return '<img src="' + esc(member.avatar) + '" alt="" />';
    }
    var letter = (member.username || "?").charAt(0).toUpperCase();
    return '<span class="hof-banner__letter">' + esc(letter) + "</span>";
  }

  function renderList(members) {
    var list = document.getElementById("hofList");
    if (!list) return;
    if (!members.length) {
      list.innerHTML =
        '<li class="hof-empty"><span class="hof-empty__icon">🏛️</span>' +
        "아직 등록된 VIP가 없습니다.<br>서버 후원자분들이 이곳에 올라갑니다.</li>";
      return;
    }
    list.innerHTML = members
      .map(function (m) {
        var msg = (m.message || "").trim();
        var nameLine =
          m.displayName && m.displayName !== m.username
            ? '<span class="hof-banner__name">' + esc(m.displayName) + "</span>"
            : "";
        return (
          '<li class="hof-banner">' +
          '<div class="hof-banner__pole"></div>' +
          '<div class="hof-banner__cloth">' +
          '<div class="hof-banner__crest">' +
          '<div class="hof-banner__avatar">' +
          avatarHtml(m) +
          "</div></div>" +
          '<p class="hof-banner__id">@' +
          esc(m.username) +
          nameLine +
          "</p>" +
          '<p class="hof-banner__msg' +
          (msg ? "" : " hof-banner__msg--empty") +
          '">' +
          esc(msg || "한마디를 남겨 주세요") +
          "</p>" +
          "</div></li>"
        );
      })
      .join("");
  }

  var pendingAvatar = undefined;
  var hasAvatarChange = false;

  function setAvatarPreview(dataUrl) {
    var btn = document.getElementById("hofAvatarBtn");
    if (!btn) return;
    var inner = btn.querySelector(".hof-edit__avatar-inner");
    if (dataUrl) {
      var existing = btn.querySelector("img.hof-edit-preview");
      if (!existing) {
        existing = document.createElement("img");
        existing.className = "hof-edit-preview";
        btn.appendChild(existing);
      }
      existing.src = dataUrl;
      if (inner) inner.style.display = "none";
    } else {
      var img = btn.querySelector("img.hof-edit-preview");
      if (img) img.remove();
      if (inner) {
        inner.style.display = "";
        inner.innerHTML = "사진<br>선택";
      }
    }
  }

  function setupVipEditor(user) {
    var panel = document.getElementById("hofEdit");
    if (!panel || !user || user.role !== "vip") {
      if (panel) panel.hidden = true;
      return;
    }
    panel.hidden = false;
    document.getElementById("hofUsername").value = "@" + user.username;
    document.getElementById("hofMessage").value = user.vipMessage || "";
    setAvatarPreview(user.vipAvatar || null);
    pendingAvatar = undefined;
    hasAvatarChange = false;
  }

  async function loadHall() {
    var res = await fetch(apiBase() + "/hall-of-fame");
    var data;
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    if (!res.ok) {
      throw new Error((data && data.error) || "목록을 불러오지 못했습니다.");
    }
    renderList(data.members || []);
  }

  async function saveProfile() {
    if (!window.SiteAuth || !SiteAuth.api) {
      alert("프로필을 저장하려면 VIP 계정으로 로그인해 주세요.");
      return;
    }
    var btn = document.getElementById("hofSaveBtn");
    var msg = document.getElementById("hofSaveMsg");
    if (btn) btn.disabled = true;
    if (msg) msg.hidden = true;
    var payload = { message: String(document.getElementById("hofMessage").value || "").trim() };
    if (hasAvatarChange) {
      payload.avatar = pendingAvatar || "";
    }
    try {
      var data = await SiteAuth.api("/vip/profile", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (msg) {
        msg.hidden = false;
        msg.textContent = data.message || "저장되었습니다.";
        msg.classList.add("is-ok");
      }
      hasAvatarChange = false;
      pendingAvatar = undefined;
      await loadHall();
      if (window.SiteAuth.refresh) SiteAuth.refresh();
    } catch (e) {
      if (msg) {
        msg.hidden = false;
        msg.textContent = e.message;
        msg.classList.remove("is-ok");
      }
    }
    if (btn) btn.disabled = false;
  }

  function bindEditor() {
    var fileInput = document.getElementById("hofAvatarFile");
    var avatarBtn = document.getElementById("hofAvatarBtn");
    if (avatarBtn && fileInput) {
      avatarBtn.addEventListener("click", function () {
        fileInput.click();
      });
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (file.size > 200 * 1024) {
          alert("프로필 사진은 200KB 이하로 올려 주세요.");
          fileInput.value = "";
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          pendingAvatar = String(reader.result || "");
          hasAvatarChange = true;
          setAvatarPreview(pendingAvatar);
        };
        reader.readAsDataURL(file);
      });
    }
    var saveBtn = document.getElementById("hofSaveBtn");
    if (saveBtn) saveBtn.addEventListener("click", saveProfile);
  }

  function bindScrollDrag() {
    var el = document.getElementById("hofScroll");
    if (!el) return;
    var down = false;
    var startX = 0;
    var scrollL = 0;
    el.addEventListener("mousedown", function (e) {
      down = true;
      startX = e.pageX - el.offsetLeft;
      scrollL = el.scrollLeft;
    });
    el.addEventListener("mouseleave", function () {
      down = false;
    });
    el.addEventListener("mouseup", function () {
      down = false;
    });
    el.addEventListener("mousemove", function (e) {
      if (!down) return;
      e.preventDefault();
      var x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollL - (x - startX) * 1.2;
    });
  }

  async function boot(user) {
    if (booted) {
      setupVipEditor(user);
      return;
    }
    booted = true;
    bindEditor();
    bindScrollDrag();
    setupVipEditor(user);
    try {
      await loadHall();
    } catch (e) {
      var list = document.getElementById("hofList");
      if (list) list.innerHTML = '<li class="hof-empty">' + esc(e.message) + "</li>";
    }
  }

  document.addEventListener("siteauth:ready", function (ev) {
    var user = ev.detail ? ev.detail.user : null;
    boot(user);
  });
})();
