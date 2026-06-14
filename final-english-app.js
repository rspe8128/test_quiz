(function () {
  var root = document.getElementById("feRoot");
  if (!root) return;

  var concepts = document.getElementById("feConcepts");
  if (!concepts) return;

  var buttons = concepts.querySelectorAll(".fk-topnav__btn");
  var panels = concepts.querySelectorAll(".fk-panel");
  var wrap = concepts.querySelector(".fk-topnav-wrap");

  function activateTab(name) {
    buttons.forEach(function (btn) {
      var on = btn.getAttribute("data-fe-tab") === name;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-fe-panel") === name;
      panel.classList.toggle("is-on", on);
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
    if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateTab(btn.getAttribute("data-fe-tab"));
    });
  });

  root.querySelectorAll("[data-fe-expand-all]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = btn.closest(".fk-panel");
      if (!panel) return;
      panel.querySelectorAll("details.fk-passage").forEach(function (d) {
        d.open = true;
      });
    });
  });

  activateTab("u3-summary");
})();
