(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-condensed", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else if (reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -24px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  var menuBtn = document.querySelector(".menu-btn");
  var panel = document.getElementById("menu-panel");
  if (menuBtn && panel) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menuBtn.setAttribute("aria-expanded", "false");
        panel.hidden = true;
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        menuBtn.setAttribute("aria-expanded", "false");
        panel.hidden = true;
      }
    });
  }

  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.parentElement;
      var was = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(function (i) {
        i.classList.remove("open");
        var btn = i.querySelector(".faq-q");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
      if (!was) {
        item.classList.add("open");
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  var calc = document.getElementById("arCalc");
  if (!calc) return;
  var collectionsInput = document.getElementById("collections");
  var daysInput = document.getElementById("daysAr");
  var rateInput = document.getElementById("leakRate");
  var cashMath = document.getElementById("cashMath");
  var leakMath = document.getElementById("leakMath");
  var cashOut = document.getElementById("cashOut");
  var leakOut = document.getElementById("leakOut");

  function readNum(el) {
    var raw = String(el.value).replace(/,/g, "").trim();
    if (!raw) return null;
    var n = Number(raw);
    if (!isFinite(n) || n < 0) return null;
    return n;
  }

  function group(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  function groupInput(n) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  function renderCalc() {
    var collections = readNum(collectionsInput);
    var days = readNum(daysInput);
    var rate = readNum(rateInput);
    if (collections === null || days === null || rate === null) {
      cashMath.textContent = "Annual collections divided by 365, times days in accounts receivable.";
      leakMath.textContent = "Annual collections times the share missed or underpaid.";
      cashOut.textContent = "Enter your figures";
      cashOut.classList.add("calc-pending");
      leakOut.textContent = "";
      leakOut.classList.add("calc-pending");
      return;
    }
    var cash = collections / 365 * days;
    var missed = collections * (rate / 100);
    cashMath.textContent = groupInput(collections) + " / 365 x " + groupInput(days) + " days.";
    leakMath.textContent = groupInput(collections) + " x " + groupInput(rate) + " percent.";
    cashOut.textContent = group(cash);
    leakOut.textContent = group(missed);
    cashOut.classList.remove("calc-pending");
    leakOut.classList.remove("calc-pending");
  }

  function paintInput(el) {
    var n = readNum(el);
    if (n === null) return;
    el.value = groupInput(n);
  }

  [collectionsInput, daysInput, rateInput].forEach(function (el) {
    el.addEventListener("blur", function () { paintInput(el); });
  });
  calc.addEventListener("submit", function (e) { e.preventDefault(); });
  calc.addEventListener("input", renderCalc);
  renderCalc();
})();
