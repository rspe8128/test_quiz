(function () {
  var selectedId = null;

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

  function showShell() {
    document.getElementById("reqShell").hidden = false;
    document.documentElement.classList.add("site-ready");
  }

  function showCompose(on) {
    document.getElementById("reqCompose").hidden = !on;
    document.getElementById("reqDetail").hidden = on;
    document.getElementById("reqPlaceholder").hidden = on;
    if (on) selectedId = null;
  }

  function showDetail(on) {
    document.getElementById("reqDetail").hidden = !on;
    document.getElementById("reqCompose").hidden = on;
    document.getElementById("reqPlaceholder").hidden = on;
  }

  function showPlaceholder() {
    document.getElementById("reqPlaceholder").hidden = false;
    document.getElementById("reqCompose").hidden = true;
    document.getElementById("reqDetail").hidden = true;
  }

  var MAX_FILE_BYTES = 50 * 1024 * 1024;

  async function readFiles(input) {
    var files = Array.from(input.files || []);
    var out = [];
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.size > MAX_FILE_BYTES) {
        throw new Error('"' + file.name + '" 파일은 50MB 이하여야 합니다.');
      }
      var data = await new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      out.push({ name: file.name, mime: file.type || "application/octet-stream", data: data });
    }
    return out;
  }

  function renderList(requests) {
    var list = document.getElementById("reqList");
    if (!requests.length) {
      list.innerHTML = '<p class="req-empty">보낸 요청이 없습니다.</p>';
      return;
    }
    list.innerHTML = requests
      .map(function (r) {
        var badgeClass = r.status === "replied" || r.status === "closed" ? "req-item__badge--replied" : "";
        return (
          '<button type="button" class="req-item' +
          (selectedId === r.id ? " is-on" : "") +
          '" data-id="' +
          r.id +
          '">' +
          '<div class="req-item__title">' +
          esc(r.title) +
          "</div>" +
          '<div class="req-item__meta">' +
          esc(r.categoryLabel) +
          " · " +
          fmtDate(r.createdAt) +
          "</div>" +
          '<span class="req-item__badge ' +
          badgeClass +
          '">' +
          esc(r.statusLabel) +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    list.querySelectorAll(".req-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDetail(parseInt(btn.getAttribute("data-id"), 10));
      });
    });
  }

  async function loadList() {
    var data = await SiteAuth.api("/requests/mine");
    renderList(data.requests || []);
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

  function renderFiles(request) {
    if (!request.files || !request.files.length) return "";
    return (
      '<div class="req-detail__files"><h3>첨부파일</h3>' +
      request.files
        .map(function (f) {
          return (
            '<button type="button" class="req-file-link" data-file="' +
            f.id +
            '">📎 ' +
            esc(f.filename) +
            " (" +
            Math.round(f.size / 1024) +
            "KB)</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  async function openDetail(id) {
    selectedId = id;
    var data = await SiteAuth.api("/requests/" + id);
    var r = data.request;
    await loadList();

    var detail = document.getElementById("reqDetail");
    var replyBlock = r.adminReply
      ? '<div class="req-detail__reply"><h3>관리자 답변</h3><p>' + esc(r.adminReply) + "</p></div>"
      : '<p class="req-detail__wait">관리자 확인 중입니다. 답변이 오면 여기에 표시됩니다.</p>';

    detail.innerHTML =
      '<div class="req-detail__head">' +
      '<h2 class="req-detail__title">' +
      esc(r.title) +
      "</h2>" +
      '<p class="req-detail__meta">' +
      esc(r.categoryLabel) +
      " · " +
      esc(r.statusLabel) +
      "<br>보낸 시각: " +
      fmtDate(r.createdAt) +
      (r.repliedAt ? "<br>답변 시각: " + fmtDate(r.repliedAt) : "") +
      "</p></div>" +
      '<div class="req-detail__body">' +
      esc(r.body) +
      "</div>" +
      renderFiles(r) +
      replyBlock;

    detail.querySelectorAll("[data-file]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var fileId = parseInt(btn.getAttribute("data-file"), 10);
        var fname = btn.textContent.replace(/^📎\s*/, "").split(" (")[0];
        downloadFile(r.id, fileId, fname);
      });
    });

    showDetail(true);
  }

  document.getElementById("reqComposeBtn").addEventListener("click", function () {
    showCompose(true);
    document.getElementById("reqCompose").reset();
    document.getElementById("reqComposeMsg").hidden = true;
  });

  document.getElementById("reqComposeCancel").addEventListener("click", function () {
    if (selectedId) openDetail(selectedId);
    else showPlaceholder();
  });

  document.getElementById("reqCompose").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var msg = document.getElementById("reqComposeMsg");
    msg.hidden = true;
    var fd = new FormData(ev.target);
    try {
      var files = await readFiles(ev.target.querySelector('input[name="files"]'));
      var data = await SiteAuth.api("/requests", {
        method: "POST",
        body: JSON.stringify({
          category: fd.get("category"),
          title: fd.get("title"),
          body: fd.get("body"),
          files: files
        })
      });
      msg.hidden = false;
      msg.textContent = data.message || "전송되었습니다.";
      msg.classList.add("is-ok");
      await loadList();
      if (data.request && data.request.id) {
        setTimeout(function () {
          openDetail(data.request.id);
        }, 400);
      }
    } catch (e) {
      msg.hidden = false;
      msg.textContent = e.message;
      msg.classList.remove("is-ok");
    }
  });

  function onReady(ev) {
    var user = ev && ev.detail ? ev.detail.user : SiteAuth.getUser();
    if (!user || (user.role !== "admin" && user.status !== "approved")) {
      location.replace("index.html");
      return;
    }
    showShell();
    loadList().catch(function () {
      document.getElementById("reqList").innerHTML =
        '<p class="req-empty">목록을 불러오지 못했습니다.</p>';
    });
    showPlaceholder();
  }

  document.addEventListener("siteauth:ready", onReady);
})();
