(function () {
  var header = document.querySelector(".header");
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.querySelector(".drawer");
  var modal = document.getElementById("callModal");
  var form = document.getElementById("leadForm");
  var done = document.getElementById("leadDone");
  var phone = document.getElementById("phone");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = ["about", "location", "premium", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var lastFocus = null;
  var KEY = "budongsan-net-leads";

  function lock(on) {
    document.body.classList.toggle("no-scroll", on);
  }

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.inert = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "메뉴 닫기");
    lock(true);
    drawer.querySelector(".drawer-panel").focus();
  }

  function closeDrawer() {
    if (!drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    drawer.inert = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "메뉴 열기");
    if (modal.hidden) lock(false);
    toggle.focus();
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    lock(true);
    modal.querySelector(".modal-card").focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    if (!drawer.classList.contains("is-open")) lock(false);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  toggle.addEventListener("click", function () {
    if (drawer.classList.contains("is-open")) closeDrawer();
    else openDrawer();
  });

  drawer.addEventListener("click", function (event) {
    if (event.target === drawer) closeDrawer();
  });

  Array.prototype.forEach.call(drawer.querySelectorAll("a"), function (link) {
    link.addEventListener("click", closeDrawer);
  });

  Array.prototype.forEach.call(document.querySelectorAll(".js-call"), function (button) {
    button.addEventListener("click", function () {
      closeDrawer();
      openModal();
    });
  });

  modal.addEventListener("click", function (event) {
    if (event.target.closest("[data-close]")) closeModal();
  });

  modal.addEventListener("keydown", function (event) {
    if (event.key !== "Tab") return;
    var nodes = Array.prototype.filter.call(
      modal.querySelectorAll("a, button"),
      function (el) { return !el.disabled; }
    );
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (drawer.classList.contains("is-open")) closeDrawer();
    else closeModal();
  });

  function spy() {
    header.classList.toggle("is-stuck", window.scrollY > 4);
    var marker = window.scrollY + 120;
    var current = null;
    sections.forEach(function (section) {
      var top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) current = section;
    });
    var id = current ? "#" + current.id : "";
    navLinks.forEach(function (link) {
      var on = link.getAttribute("href") === id;
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  var frame = 0;
  window.addEventListener("scroll", function () {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      spy();
      frame = 0;
    });
  }, { passive: true });
  spy();

  function formatPhone(value) {
    var digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length < 4) return digits;
    if (digits.length < 8) return digits.slice(0, 3) + "-" + digits.slice(3);
    return digits.slice(0, 3) + "-" + digits.slice(3, 7) + "-" + digits.slice(7);
  }

  phone.addEventListener("input", function () {
    phone.value = formatPhone(phone.value);
  });

  function mark(field, invalid) {
    field.classList.toggle("is-error", invalid);
    var control = field.querySelector("input, select, textarea");
    if (control) control.setAttribute("aria-invalid", invalid ? "true" : "false");
    return invalid;
  }

  function validate(target) {
    var nameInput = document.getElementById("name");
    var phoneInput = document.getElementById("phone");
    var sizeInput = document.getElementById("size");
    var agreeInput = document.getElementById("agree");
    var name = nameInput.value.trim();
    var nameOk = name.replace(/\s/g, "").length >= 2 && /^[가-힣a-zA-Z\s]{2,30}$/.test(name);
    var phoneOk = /^01[016789]-\d{3,4}-\d{4}$/.test(phoneInput.value);
    var sizeOk = sizeInput.value !== "";
    var agreeOk = agreeInput.checked;
    var checks = [
      [target.querySelector('[data-field="name"]'), !nameOk, nameInput],
      [target.querySelector('[data-field="phone"]'), !phoneOk, phoneInput],
      [target.querySelector('[data-field="size"]'), !sizeOk, sizeInput],
      [target.querySelector('[data-field="agree"]'), !agreeOk, agreeInput]
    ];
    var first = null;
    checks.forEach(function (item) {
      var invalid = mark(item[0], item[1]);
      if (invalid && !first) first = item[2];
    });
    if (first) first.focus();
    return !first;
  }

  Array.prototype.forEach.call(form.querySelectorAll("input, select, textarea"), function (control) {
    control.addEventListener("input", function () {
      var field = control.closest(".field, .agree-row");
      if (field) mark(field, false);
    });
    control.addEventListener("change", function () {
      var field = control.closest(".field, .agree-row");
      if (field) mark(field, false);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validate(form)) return;
    var payload = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      size: document.getElementById("size").value,
      message: document.getElementById("message").value.trim(),
      at: new Date().toISOString()
    };
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(list)) list = [];
      list.push(payload);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (error) {
      /* 저장이 막혀도 완료 화면은 보여 줍니다. */
    }
    form.hidden = true;
    done.hidden = false;
    done.querySelector("h3").focus();
  });

  document.getElementById("leadReset").addEventListener("click", function () {
    form.reset();
    Array.prototype.forEach.call(form.querySelectorAll(".is-error"), function (field) {
      mark(field, false);
    });
    done.hidden = true;
    form.hidden = false;
    document.getElementById("name").focus();
  });
})();
