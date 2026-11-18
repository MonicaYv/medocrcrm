  document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* =====================  MAIN TABS  ===================== */
  const tabs = $$(".ob-tab");
  const panels = $$(".ob-panel");
  const controls = $("#list-controls");
  let currentTab = "new-requests";

  function showTab(name) {
    currentTab = name;
    panels.forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${name}`));
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.dataset.active.split(" ").forEach((c) => t.classList.toggle(c, on));
      t.classList.toggle("border-transparent", !on);
    });
    controls.classList.toggle("hidden", name === "auto-bid");
    // urgency filter only exists on New Requests
    $$("[data-only]").forEach((el) => el.classList.toggle("hidden", el.dataset.only !== name));
    resetFilters();
  }
  tabs.forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
  $$("[data-tab-jump]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tabJump)));

  /* =====================  FILTERS  ===================== */
  const searchInput = $("#ob-search");
  const filterBar = $("#filter-bar");
  const DEFAULTS = { mode: "All Modes", urgency: "All Urgency", from: "", to: "", min: "", max: "" };
  let F = { ...DEFAULTS };

  const fmt = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${+d} ${M[+m - 1]} ${y}`;
  };

  function closeMenus(except) {
    $$("[data-dd-menu]").forEach((m) => {
      if (m !== except) m.classList.add("hidden");
    });
  }

  function applyFilters() {
    const panel = $(`#tab-${currentTab}`);
    if (!panel || currentTab === "auto-bid") return;
    const q = searchInput.value.trim().toLowerCase();
    const rows = $$("tbody tr[data-row]", panel);
    let shown = 0;
    rows.forEach((tr) => {
      const d = tr.dataset;
      let ok = true;
      if (q && !tr.textContent.toLowerCase().includes(q)) ok = false;
      if (F.mode !== DEFAULTS.mode && d.mode !== F.mode) ok = false;
      if (F.urgency !== DEFAULTS.urgency && d.urgency && d.urgency !== F.urgency) ok = false;
      if (F.from && d.date < F.from) ok = false;
      if (F.to && d.date > F.to) ok = false;
      if (F.min !== "" && +d.price < +F.min) ok = false;
      if (F.max !== "" && +d.price > +F.max) ok = false;
      tr.classList.toggle("hidden", !ok);
      if (ok) shown++;
    });
    const empty = $("tr[data-empty]", panel);
    if (empty) empty.classList.toggle("hidden", shown !== 0);
    const label = $(".ob-showing", panel);
    if (label) {
      const active = q || JSON.stringify(F) !== JSON.stringify(DEFAULTS);
      label.textContent = active ? `Showing ${shown} of ${rows.length}` : label.dataset.default;
    }
  }

  function markSelected(menu, value) {
    const sel = (menu.dataset.sel || "").split(" ");
    $$(".ob-opt", menu).forEach((o) => {
      const on = o.dataset.v === value;
      sel.forEach((c) => o.classList.toggle(c, on));
      o.classList.toggle("text-slate-800", !on);
    });
  }

  function resetFilters() {
    F = { ...DEFAULTS };
    searchInput.value = "";
    $$("[data-dd]").forEach((dd) => {
      const label = $("[data-dd-label]", dd);
      const menu = $("[data-dd-menu]", dd);
      const opt = $(".ob-opt", menu);
      if (opt) {
        label.textContent = opt.dataset.v;
        markSelected(menu, opt.dataset.v);
      } else if (menu.contains($("#range-from"))) {
        label.textContent = "Custom Range";
      } else {
        label.textContent = "Price Range";
      }
    });
    ["#range-from", "#range-to", "#price-min", "#price-max"].forEach((id) => ($(id).value = ""));
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

  // single-choice lists (mode, urgency)
  $$(".ob-opt").forEach((o) =>
    o.addEventListener("click", () => {
      const dd = o.closest("[data-dd]");
      F[o.dataset.filter] = o.dataset.v;
      $("[data-dd-label]", dd).textContent = o.dataset.v;
      markSelected($("[data-dd-menu]", dd), o.dataset.v);
      closeMenus();
      applyFilters();
    })
  );

  // range cards (date, price)
  $$("[data-range-apply]").forEach((b) =>
    b.addEventListener("click", () => {
      const dd = b.closest("[data-dd]");
      const label = $("[data-dd-label]", dd);
      if (b.dataset.rangeApply === "date") {
        F.from = $("#range-from").value;
        F.to = $("#range-to").value;
        label.textContent = F.from || F.to ? `${fmt(F.from) || "Any"} - ${fmt(F.to) || "Any"}` : "Custom Range";
      } else {
        F.min = $("#price-min").value;
        F.max = $("#price-max").value;
        label.textContent =
          F.min !== "" || F.max !== "" ? `\u20B9${F.min || 0} - ${F.max !== "" ? "\u20B9" + F.max : "Any"}` : "Price Range";
      }
      closeMenus();
      applyFilters();
    })
  );
  $$("[data-range-cancel]").forEach((b) =>
    b.addEventListener("click", () => {
      const isDate = b.dataset.rangeCancel === "date";
      const ids = isDate ? ["#range-from", "#range-to"] : ["#price-min", "#price-max"];
      ids.forEach((id) => ($(id).value = ""));
      if (isDate) {
        F.from = F.to = "";
        $("[data-dd-label]", b.closest("[data-dd]")).textContent = "Custom Range";
      } else {
        F.min = F.max = "";
        $("[data-dd-label]", b.closest("[data-dd]")).textContent = "Price Range";
      }
      closeMenus();
      applyFilters();
    })
  );

  $("#filter-reset").addEventListener("click", resetFilters);
  searchInput.addEventListener("input", applyFilters);
  $$("[data-dd-menu]").forEach((m) => m.addEventListener("click", (e) => e.stopPropagation()));
  document.addEventListener("click", () => closeMenus());

  /* =====================  MODALS  ===================== */
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("hidden");
    m.classList.add("flex");
  }
  function closeModal(m) {
    m.classList.add("hidden");
    m.classList.remove("flex");
  }
  function closeAll() {
    $$(".ob-modal").forEach(closeModal);
  }

  /* ---------- Bid details ---------- */
  const subtabs = $$(".bd-subtab");
  const panes = $$(".bd-pane");
  const activeSub = ["font-semibold", "text-shazam-blue", "underline"];

  function showSubtab(id) {
    panes.forEach((p) => p.classList.toggle("hidden", p.id !== id));
    subtabs.forEach((b) => {
      const on = b.dataset.subtab === id;
      activeSub.forEach((c) => b.classList.toggle(c, on));
      b.classList.toggle("text-slate-800", !on);
    });
  }
  subtabs.forEach((b) => b.addEventListener("click", () => showSubtab(b.dataset.subtab)));

  function configureBidDetails(status, bid) {
    const won = status === "won";
    if (bid) $("#bd-bid").textContent = bid;
    $("#bd-badge-won").classList.toggle("hidden", !won);
    $("#bd-badge-pending").classList.toggle("hidden", won);
    $("#bd-banner-won").classList.toggle("hidden", !won);
    $("#bd-banner-pending").classList.toggle("hidden", won);
    $("#bd-footer-won").classList.toggle("hidden", !won);
    $("#bd-footer-pending").classList.toggle("hidden", won);
    showSubtab("bd-overview");
  }

  /* ---------- Edit bid: step 1 -> step 2 ---------- */
  const steps = $$(".eb-step");
  const confirmBox = $("#eb-confirm");
  const saveBtn = $("#eb-save");
  const showStep = (n) => steps.forEach((s) => s.classList.toggle("hidden", s.id !== `eb-step-${n}`));
  function resetEditBid() {
    showStep(1);
    confirmBox.checked = false;
    saveBtn.disabled = true;
  }
  $("#eb-review").addEventListener("click", () => showStep(2));
  $("#eb-back").addEventListener("click", () => showStep(1));
  confirmBox.addEventListener("change", () => (saveBtn.disabled = !confirmBox.checked));

  /* ---------- Open / close wiring ---------- */
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener && !opener.disabled) {
      const target = opener.dataset.open;
      if (target === "bid-saved" && opener.dataset.bid) $("#bs-bid").textContent = opener.dataset.bid;
      if (target === "bid-details") configureBidDetails(opener.dataset.status, opener.dataset.bid);
      if (target === "edit-bid") resetEditBid();
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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  /* ---------- Submit bid: consultation mode cards ---------- */
  const modeCards = $$(".mode-card");
  modeCards.forEach((card) =>
    card.addEventListener("click", () => {
      modeCards.forEach((c) => {
        c.classList.remove(...c.dataset.on.split(" "));
        c.classList.add(...c.dataset.off.split(" "));
      });
      card.classList.remove(...card.dataset.off.split(" "));
      card.classList.add(...card.dataset.on.split(" "));
    })
  );

  showSubtab("bd-overview");
  showTab("new-requests");
});