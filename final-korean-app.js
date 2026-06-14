(function () {
  var root = document.getElementById("fkRoot");
  if (!root) return;

  var buttons = root.querySelectorAll(".fk-topnav__btn");
  var panels = root.querySelectorAll(".fk-panel");
  var wrap = root.querySelector(".fk-topnav-wrap");

  function activateTab(name) {
    buttons.forEach(function (btn) {
      var on = btn.getAttribute("data-fk-tab") === name;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-fk-panel") === name;
      panel.classList.toggle("is-on", on);
      if (on) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    });
    if (wrap) {
      wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateTab(btn.getAttribute("data-fk-tab"));
    });
  });

  activateTab("negotiation");
})();
