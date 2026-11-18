document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ===== MAIN TABS ===== */
  const tabs = $$(".ob-tab");
  const panels = $$(".ob-panel");
  let currentTab = "new-request";

  function showTab(name) {
    currentTab = name;
    panels.forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${name}`));
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.dataset.active.split(" ").forEach((c) => t.classList.toggle(c, on));
      t.classList.toggle("border-transparent", !on);
    });
    $("#expiry-banner").classList.toggle("hidden", !["new-request", "auto-bid"].includes(name));
    resetFilters();
  }
  tabs.forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

  /* ===== FILTERS ===== */
  const searchInput = $("#ob-search");
  const filterBar = $("#filter-bar");
  const DEFAULTS = { fulfil: "All", rx: "All", stock: "All", status: "All", min: "", max: "" };
  const LABELS = { fulfil: "Fulfilment", rx: "Prescription", stock: "Stock", status: "Status" };
  let F = { ...DEFAULTS };

  // Close all menus
  const closeMenus = (except) => {
    $$("[data-dd-menu]").forEach((m) => {
      if (m !== except) m.classList.add("hidden");
    });
  };

  function applyFilters() {
    const panel = $(`#tab-${currentTab}`);
    if (!panel || currentTab === "auto-bid") return;
    const q = searchInput.value.trim().toLowerCase();
    let shown = 0;
    $$("tbody tr[data-row]", panel).forEach((tr) => {
      const d = tr.dataset;
      let ok = !q || tr.textContent.toLowerCase().includes(q);
      ["fulfil", "rx", "stock", "status"].forEach((k) => {
        if (F[k] !== "All" && d[k] !== F[k]) ok = false;
      });
      if (F.min !== "" && +d.price < +F.min) ok = false;
      if (F.max !== "" && +d.price > +F.max) ok = false;
      tr.classList.toggle("hidden", !ok);
      if (ok) shown++;
    });
    const empty = $("tr[data-empty]", panel);
    if (empty) empty.classList.toggle("hidden", shown !== 0);
  }

  function markSelected(menu, value) {
    $$(".ob-opt", menu).forEach((o) => {
      const on = o.dataset.v === value;
      o.classList.toggle("text-blue-600", on);
      o.classList.toggle("text-slate-800", !on);
    });
  }

  function resetFilters() {
    F = { ...DEFAULTS };
    searchInput.value = "";
    $$("[data-dd]").forEach((dd) => {
      const f = $("[data-filter]", dd);
      if (f) {
        $("[data-dd-label]", dd).textContent = LABELS[f.dataset.filter];
        markSelected($("[data-dd-menu]", dd), "All");
      }
    });
    $("#price-min").value = "";
    $("#price-max").value = "";
    $$("[data-dd-label]").forEach((l) => {
      if (/^\u20B9/.test(l.textContent)) l.textContent = "Price Range";
    });
    closeMenus();
    applyFilters();
  }

  $("#filter-toggle").addEventListener("click", () => {
    filterBar.classList.toggle("hidden");
    filterBar.classList.toggle("flex");
    closeMenus();
  });

  $$("[data-dd-trigger]").forEach((t) =>
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = $("[data-dd-menu]", t.closest("[data-dd]"));
      closeMenus(menu);
      menu.classList.toggle("hidden");
    })
  );

  $$(".ob-opt").forEach((o) =>
    o.addEventListener("click", () => {
      const dd = o.closest("[data-dd]");
      const menu = $("[data-dd-menu]", dd);
      markSelected(menu, o.dataset.v);
      if (o.dataset.filter) {
        F[o.dataset.filter] = o.dataset.v;
        $("[data-dd-label]", dd).textContent = o.dataset.v === "All" ? LABELS[o.dataset.filter] : o.dataset.v;
        closeMenus();
        applyFilters();
      } else {
        // date filter
        $("[data-dd-label]", dd).textContent = o.dataset.v;
        $("#date-custom").classList.toggle("hidden", !("custom" in o.dataset));
        if (!("custom" in o.dataset)) closeMenus();
      }
    })
  );

  $("[data-range-apply]").addEventListener("click", (e) => {
    F.min = $("#price-min").value;
    F.max = $("#price-max").value;
    const label = $("[data-dd-label]", e.target.closest("[data-dd]"));
    label.textContent = F.min !== "" || F.max !== "" ? `\u20B9${F.min || 0} - ${F.max !== "" ? "\u20B9" + F.max : "Any"}` : "Price Range";
    closeMenus();
    applyFilters();
  });
  $("[data-range-cancel]").addEventListener("click", (e) => {
    $("#price-min").value = "";
    $("#price-max").value = "";
    F.min = F.max = "";
    $("[data-dd-label]", e.target.closest("[data-dd]")).textContent = "Price Range";
    closeMenus();
    applyFilters();
  });

  $("#filter-reset").addEventListener("click", () => {
    resetFilters();
  });
  searchInput.addEventListener("input", applyFilters);
  $$("[data-dd-menu]").forEach((m) => m.addEventListener("click", (e) => e.stopPropagation()));
  document.addEventListener("click", () => closeMenus());

  /* ===== MODALS ===== */
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("hidden");
    m.classList.add("flex");
  }
  const closeModal = (m) => {
    m.classList.add("hidden");
    m.classList.remove("flex");
  };
  const closeAll = () => $$(".ob-modal").forEach(closeModal);

  /* ===== CREATE BID ===== */
  const ON_NUM = ["bg-blue-100", "text-blue-600"];
  const OFF_NUM = ["bg-slate-100", "text-slate-600"];
  const budget = +$("#cb-budget").textContent;
  const confirmBox = $("#cb-confirm");
  const submitBtn = $("#cb-submit");

  function showStep(n) {
    $$(".cb-pane").forEach((p) => p.classList.toggle("hidden", p.id !== `cb-pane-${n}`));
    $$(".cb-ind").forEach((ind) => {
      const on = +ind.dataset.n === n;
      ind.classList.toggle("text-blue-600", on);
      ind.classList.toggle("font-semibold", on);
      ind.classList.toggle("text-slate-800", !on);
      const num = $(".cb-num", ind);
      ON_NUM.forEach((c) => num.classList.toggle(c, on));
      OFF_NUM.forEach((c) => num.classList.toggle(c, !on));
    });
    if (n === 3) $("#cb-review-total").textContent = $("#cb-total").textContent;
  }

  function recalc() {
    let sub = 0;
    $$(".cb-price").forEach((inp) => {
      const line = (+inp.value || 0) * +inp.dataset.qty;
      sub += line;
      inp.closest("tr").querySelector(".cb-line").textContent = `\u20B9${line}`;
    });
    const total = Math.max(0, sub - (+$("#cb-disc").value || 0) + (+$("#cb-del").value || 0));
    $("#cb-sub").textContent = `\u20B9${sub}`;
    $("#cb-total").textContent = `\u20B9${total}`;
    $("#cb-warn").classList.toggle("hidden", total <= budget);
    $("#cb-warn-text").textContent = `Exceeds budget by \u20B9${total - budget}`;
  }
  $$(".cb-price, #cb-disc, #cb-del").forEach((i) => i.addEventListener("input", recalc));
  $$("[data-step]").forEach((b) => b.addEventListener("click", () => showStep(+b.dataset.step)));
  confirmBox.addEventListener("change", () => (submitBtn.disabled = !confirmBox.checked));

  function resetCreateBid() {
    showStep(1);
    confirmBox.checked = false;
    submitBtn.disabled = true;
    recalc();
  }

  /* ===== OPEN / CLOSE WIRING ===== */
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener && !opener.disabled) {
      const target = opener.dataset.open;
      if (target === "create-bid") resetCreateBid();
      closeAll();
      openModal(target);
      return;
    }
    const closer = e.target.closest("[data-close]");
    if (closer) {
      const m = closer.closest(".ob-modal");
      if (m) closeModal(m);
      return;
    }
    if (e.target.classList.contains("ob-modal")) closeModal(e.target);
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeAll());

  resetCreateBid();
  showTab("new-request");
});