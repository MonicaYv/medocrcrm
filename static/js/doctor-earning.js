/* Earnings page. Data below is sample data; replace the arrays with backend/API responses.
   Styling uses Tailwind classes only (full literal class strings so the Tailwind scanner
   can find them - add this file to your Tailwind content paths). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var MODE = {
    "Clinic Visit": "bg-green-50 text-kyc-green",
    "Video Call": "bg-green-50 text-kyc-green",
    "Voice Call": "bg-purple-50 text-purple-600",
    "Home Visit": "bg-orange-50 text-instant-orange",
    "Hospital": "bg-blue-50 text-facebook-blue"
  };
  var STATUS = {
    Settled: "bg-green-50 text-kyc-green",
    Missed: "bg-slate-200 text-grayish-blue-slate"
  };
  var TAB_ON = "text-shazam-blue border-shazam-blue font-medium";
  var TAB_OFF = "text-slate-600 border-transparent font-normal";
  var EYE = '<svg class="w-5 h-5 text-shazam-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

  function toggle(el, on, onCls, offCls) {
    onCls.split(" ").forEach(function (c) { el.classList.toggle(c, on); });
    offCls.split(" ").forEach(function (c) { el.classList.toggle(c, !on); });
  }
  function chip(map, label) {
    return '<span class="inline-block text-[12px] px-2.5 py-1 rounded-full ' + map[label] + '">' + label + "</span>";
  }
  function inr(n) { return "₹" + n.toLocaleString("en-IN"); }
  function ini(n) { return n.split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2); }
  function toast(msg) {
    var t = $("#erToast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toast.h);
    toast.h = setTimeout(function () { t.classList.add("hidden"); }, 2400);
  }
  function open(id) { var m = $("#" + id); m.classList.remove("hidden"); m.classList.add("flex"); }
  function hide(id) { var m = $("#" + id); m.classList.add("hidden"); m.classList.remove("flex"); }

  /* ---------- tabs ---------- */
  function showTab(name) {
    $$(".er-tab").forEach(function (t) { toggle(t, t.dataset.tab === name, TAB_ON, TAB_OFF); });
    $$("[data-pane]").forEach(function (p) { p.classList.toggle("hidden", p.id !== "er-" + name); });
  }
  $("#erTabs").addEventListener("click", function (e) {
    var b = e.target.closest(".er-tab");
    if (b) showTab(b.dataset.tab);
  });
  $("#erViewAll").addEventListener("click", function () { showTab("transactions"); });

  /* ---------- header: period, export, refresh ---------- */
  var PERIOD = {
    "This Month": "This Month · 1-29 July 2026",
    "Last 30 Days": "Last 30 Days",
    "Last 90 Days": "Last 90 Days",
    "This Financial Year": "This Financial Year"
  };
  function closeMenus() {
    $("#erPeriodMenu").classList.add("hidden");
    $("#erExportMenu").classList.add("hidden");
  }
  $("#erPeriodBtn").addEventListener("click", function () {
    var m = $("#erPeriodMenu"), was = m.classList.contains("hidden");
    closeMenus();
    m.classList.toggle("hidden", !was);
  });
  $("#erExportBtn").addEventListener("click", function () {
    var m = $("#erExportMenu"), was = m.classList.contains("hidden");
    closeMenus();
    m.classList.toggle("hidden", !was);
  });
  $("#erPeriodMenu").addEventListener("click", function (e) {
    var b = e.target.closest("[data-period]");
    if (!b) return;
    $("#erPeriodLabel").textContent = PERIOD[b.dataset.period];
    closeMenus();
    toast("Period set to " + b.dataset.period + " - connect to your backend to reload data");
  });
  $("#erExportMenu").addEventListener("click", function (e) {
    var b = e.target.closest("[data-export]");
    if (!b) return;
    closeMenus();
    if (b.dataset.export === "csv") exportCsv();
    else toast("PDF statement - connect to your backend download URL");
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#erPeriodBtn, #erPeriodMenu, #erExportBtn, #erExportMenu")) closeMenus();
  });
  $("#erRefresh").addEventListener("click", function () {
    var i = $("#erRefreshIcon");
    i.classList.add("animate-spin");
    drawAll();
    setTimeout(function () { i.classList.remove("animate-spin"); toast("Data refreshed"); }, 700);
  });

  /* ---------- revenue trend (SVG bars) ---------- */
  var REVENUE = [["Jun 1", 5.3], ["Jun 8", 6.2], ["Jun 15", 7.1], ["Jun 22", 6.8]]; /* values in thousands */

  function barChart(target, data, max, ticks, fmtSub) {
    var W = 900, H = 240, PL = 50, PR = 10, PT = 10, PB = fmtSub ? 44 : 30, BW = 40, out = "", i;
    for (i = 0; i < ticks.length; i++) {
      var y = PT + (H - PT - PB) * (i / (ticks.length - 1));
      out += '<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + y + '" y2="' + y + '" class="stroke-slate-100"/>' +
        '<text x="' + (PL - 8) + '" y="' + (y + 4) + '" text-anchor="end" class="fill-grayish-blue-slate text-[11px]">' + ticks[i] + "</text>";
    }
    out += '<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + (H - PB) + '" y2="' + (H - PB) + '" class="stroke-slate-200"/>';
    var slot = (W - PL - PR) / data.length;
    data.forEach(function (d, k) {
      var h = (H - PT - PB) * d[1] / max, x = PL + slot * (k + 0.5) - BW / 2;
      out += '<rect x="' + x.toFixed(1) + '" y="' + (H - PB - h).toFixed(1) + '" width="' + BW + '" height="' + h.toFixed(1) + '" class="fill-shazam-blue"/>' +
        '<text x="' + (x + BW / 2).toFixed(1) + '" y="' + (H - PB + 18) + '" text-anchor="middle" class="fill-slate-700 text-[11px]">' + d[0] + "</text>";
      if (fmtSub) out += '<text x="' + (x + BW / 2).toFixed(1) + '" y="' + (H - PB + 33) + '" text-anchor="middle" class="fill-slate-400 text-[10px]">' + fmtSub(d[1]) + "</text>";
    });
    $(target).innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" class="w-full h-auto">' + out + "</svg>";
  }
  function drawRevenue() { barChart("#erRevenueChart", REVENUE, 8, ["8K", "6K", "4K", "2K", "0"], null); }

  /* ---------- payment history (SVG bars) ---------- */
  var HISTORY = [["Jun", 0.98], ["Jul", 1.1], ["Aug", 1.4], ["Sep", 1.3]]; /* values in lakh */
  function drawHistory() {
    barChart("#erHistoryChart", HISTORY, 1.5, ["₹1.5L", "₹1L", "₹50K", "₹0"], function (v) {
      return v >= 1 ? "₹" + v.toFixed(1) + "L" : "₹" + Math.round(v * 100) + "K";
    });
  }

  /* ---------- donuts ---------- */
  function donut(target, segs, top, bottom, legend) {
    var R = 62, C = 2 * Math.PI * R, off = 0;
    var svg = '<svg viewBox="0 0 160 160" class="w-[170px] h-[170px] shrink-0"><circle cx="80" cy="80" r="' + R + '" class="fill-none stroke-slate-100" stroke-width="22"/>';
    segs.forEach(function (s) {
      var len = C * s.v / 100;
      svg += '<circle cx="80" cy="80" r="' + R + '" class="fill-none ' + s.stroke + '" stroke-width="22" stroke-dasharray="' + len.toFixed(2) + " " + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 80 80)"/>';
      off += len;
    });
    svg += '<text x="80" y="78" text-anchor="middle" class="fill-dark-inky-blue text-[18px] font-bold">' + top + '</text><text x="80" y="95" text-anchor="middle" class="fill-grayish-blue-slate text-[10px]">' + bottom + "</text></svg>";
    $(target).innerHTML = svg + '<ul class="flex-1 min-w-[200px] space-y-3.5 text-[14px]">' + legend + "</ul>";
  }
  function legendPct(dot, name, pct) {
    return '<li class="flex items-center gap-3"><i class="w-2.5 h-2.5 rounded-full ' + dot + '"></i><span class="text-slate-700">' + name + '</span><b class="ml-auto font-semibold text-dark-inky-blue">' + pct + "%</b></li>";
  }
  function legendAmt(dot, name, amt, pct) {
    return '<li class="flex items-start gap-3"><i class="w-2.5 h-2.5 rounded-full mt-1.5 ' + dot + '"></i><div><p class="font-semibold text-dark-inky-blue">' + name + '</p><p class="text-[13px] text-grayish-blue-slate">' + amt + " • " + pct + "%</p></div></li>";
  }
  function drawDonuts() {
    donut("#erCommDonut", [
      { v: 42, stroke: "stroke-shazam-blue" },
      { v: 28, stroke: "stroke-purple-500" },
      { v: 19, stroke: "stroke-kyc-green" },
      { v: 11, stroke: "stroke-instant-orange" }
    ], "₹1.24L", "Total Revenue",
      legendPct("bg-shazam-blue", "Video Call", 42) + legendPct("bg-purple-500", "Voice Call", 28) +
      legendPct("bg-kyc-green", "Clinic Visit", 19) + legendPct("bg-instant-orange", "Home Visit", 11));

    donut("#erStatusDonut", [
      { v: 74, stroke: "stroke-kyc-green" },
      { v: 5, stroke: "stroke-instant-orange" },
      { v: 21, stroke: "stroke-shazam-blue" }
    ], "₹1.24L", "Total",
      legendAmt("bg-kyc-green", "Cleared", "₹1,82,400", 74) + legendAmt("bg-instant-orange", "Pending Clearance", "₹12,600", 5) +
      legendAmt("bg-shazam-blue", "Processing", "₹54,500", 21));
  }
  function drawAll() { drawRevenue(); drawDonuts(); drawHistory(); }

  /* ---------- transactions ---------- */
  var TXN = [
    ["TXN-20001", "APT-3312", "22 Jul", "Rachel Kate", "Clinic Visit", 400, 48, "Settled", "10:30 AM", "10:35 AM"],
    ["TXN-20000", "APT-3311", "22 Jul", "Joleen Smith", "Home Visit", 800, 96, "Settled", "11:00 AM", "11:05 AM"],
    ["TXN-19999", "APT-3309", "22 Jul", "Arjun Mehta", "Video Call", 300, 36, "Settled", "12:00 PM", "12:05 PM"],
    ["TXN-19998", "APT-3308", "22 Jul", "Priya Sharma", "Clinic Visit", 400, 48, "Settled", "12:30 PM", "12:35 PM"],
    ["TXN-19997", "APT-3307", "22 Jul", "Mohan Das", "Voice Call", 150, 18, "Settled", "01:00 PM", "01:05 PM"],
    ["TXN-19996", "APT-3306", "22 Jul", "Nisha Kapoor", "Video Call", 250, 30, "Settled", "02:00 PM", "02:05 PM"],
    ["TXN-19995", "APT-3305", "22 Jul", "Steve Lamark", "Home Visit", 550, 66, "Settled", "03:00 PM", "03:05 PM"],
    ["TXN-19994", "APT-3304", "22 Jul", "Dolly Paris", "Clinic Visit", 0, 0, "Missed", "", ""],
    ["TXN-19993", "APT-3303", "22 Jul", "Josh Kerr", "Video Call", 300, 36, "Settled", "04:00 PM", "04:05 PM"],
    ["TXN-19992", "APT-3302", "22 Jul", "Karen Cooper", "Home Visit", 700, 84, "Settled", "05:00 PM", "05:05 PM"]
  ];
  var TF = { q: "", mode: "All Modes", status: "All Status" };

  function filtered() {
    return TXN.filter(function (t) {
      var hay = (t[0] + " " + t[1] + " " + t[3] + " " + t[4]).toLowerCase();
      if (TF.q && hay.indexOf(TF.q.toLowerCase()) < 0) return false;
      if (TF.mode !== "All Modes" && t[4] !== TF.mode) return false;
      if (TF.status !== "All Status" && t[7] !== TF.status) return false;
      return true;
    });
  }
  function renderTxn() {
    var list = filtered();
    $("#erTxnRows").innerHTML = list.length ? list.map(function (t) {
      var missed = t[7] === "Missed", net = t[5] - t[6];
      return '<tr class="border-b border-slate-100 text-[14px]">' +
        '<td class="px-4 py-3.5 text-slate-700">' + t[0].replace("-", "–") + "</td>" +
        '<td class="px-3 text-shazam-blue">' + t[1].replace("-", "–") + "</td>" +
        '<td class="px-3 text-slate-700">' + t[2] + "</td>" +
        '<td class="px-3"><span class="flex items-center gap-2"><span class="w-7 h-7 rounded-full bg-shazam-blue text-white text-[10px] font-semibold flex items-center justify-center">' + ini(t[3]) + "</span>" + t[3] + "</span></td>" +
        '<td class="px-3 text-center">' + chip(MODE, t[4]) + "</td>" +
        '<td class="px-3 text-center">' + inr(t[5]) + "</td>" +
        '<td class="px-3 text-center ' + (missed ? "text-slate-700" : "text-red-500") + '">' + (missed ? "₹0" : "-" + inr(t[6])) + "</td>" +
        '<td class="px-3 text-center font-semibold ' + (missed ? "text-slate-700" : "text-kyc-green") + '">' + inr(net) + "</td>" +
        '<td class="px-3 text-center">' + chip(STATUS, t[7]) + "</td>" +
        '<td class="px-3 text-center"><button type="button" data-txn="' + t[0] + '" title="View">' + EYE + "</button></td></tr>";
    }).join("") : '<tr><td colspan="10" class="text-center text-[14px] text-grayish-blue-slate py-10">No transactions match. Change the search or filters to see more.</td></tr>';
  }
  $("#erTxnSearch").addEventListener("input", function (e) { TF.q = e.target.value.trim(); renderTxn(); });
  $("#erFilterBtn").addEventListener("click", function () {
    var f = $("#erFilters");
    f.classList.toggle("hidden");
    f.classList.toggle("flex");
  });
  $("#erFMode").addEventListener("change", function (e) { TF.mode = e.target.value; renderTxn(); });
  $("#erFStatus").addEventListener("change", function (e) { TF.status = e.target.value; renderTxn(); });
  $("#erFReset").addEventListener("click", function () {
    TF = { q: "", mode: "All Modes", status: "All Status" };
    $("#erTxnSearch").value = "";
    $("#erFMode").selectedIndex = 0;
    $("#erFStatus").selectedIndex = 0;
    renderTxn();
  });

  /* ---------- transaction popup ---------- */
  var cur = null;
  function openTxn(t) {
    cur = t;
    var net = t[5] - t[6];
    $("#tx-id").textContent = t[0].replace("-", "–");
    $("#tx-net-head").textContent = inr(net);
    $("#tx-gross").textContent = inr(t[5]);
    $("#tx-comm").textContent = inr(t[6]);
    $("#tx-net").textContent = inr(net);
    $("#tx-appt").textContent = t[1].replace("-", "–");
    $("#tx-patient").textContent = t[3];
    $("#tx-date").textContent = t[2] + " 2026";
    $("#tx-mode").innerHTML = chip(MODE, t[4]);
    $("#tx-status").innerHTML = chip(STATUS, t[7]);
    $("#tx-ref").textContent = t[0].replace("-", "–");
    var steps = [
      ["Appointment completed", t[8]],
      ["Transaction recorded", t[9]],
      ["Payout processed", t[2] + " 2026"],
      ["Settled to bank", t[2] + " 2026"]
    ];
    $("#txTimeline").innerHTML = steps.map(function (s) {
      return '<li class="flex items-center gap-2.5"><span class="w-4 h-4 rounded-full bg-kyc-green text-white text-[9px] flex items-center justify-center">✓</span><b class="font-semibold text-dark-inky-blue">' + s[0] + '</b><span class="text-slate-400 text-[13px]">· ' + (s[1] || "–") + "</span></li>";
    }).join("");
    open("m-txn");
  }
  $("#erTxnRows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-txn]");
    if (!b) return;
    openTxn(TXN.filter(function (t) { return t[0] === b.dataset.txn; })[0]);
  });
  $("#txCopy").addEventListener("click", function () {
    if (navigator.clipboard) navigator.clipboard.writeText($("#tx-ref").textContent);
    toast("Reference copied");
  });
  $("#txReceiptBtn").addEventListener("click", function () {
    var t = cur, lines = ["Receipt " + t[0], "Appointment: " + t[1], "Patient: " + t[3], "Date: " + t[2] + " 2026", "Gross: " + inr(t[5]), "Commission: " + inr(t[6]), "Net: " + inr(t[5] - t[6])];
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    a.download = "receipt-" + t[0] + ".txt"; /* swap for your backend receipt PDF URL */
    a.click();
  });
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-close]");
    if (c) { hide(c.dataset.close); return; }
    if (e.target.hasAttribute && e.target.hasAttribute("data-modal")) hide(e.target.id);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") $$("[data-modal].flex").forEach(function (m) { hide(m.id); });
  });

  /* ---------- payment method ---------- */
  var METHODS = [
    { id: "pm1", bank: "HDFC Bank", last4: "4821", holder: "Lifecare Multispeciality Hospital", verified: true, def: true }
  ];
  var SHIELD = '<svg class="text-kyc-green mt-1 shrink-0" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>';
  function renderMethods() {
    $("#erMethods").innerHTML = METHODS.length ? METHODS.map(function (m) {
      return '<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-start justify-between gap-4">' +
        '<div class="flex items-start gap-3">' + SHIELD + "<div>" +
        '<div class="flex flex-wrap items-center gap-3"><b class="text-[14px] font-semibold text-dark-inky-blue">' + m.bank + " ···· " + m.last4 + "</b>" +
        (m.verified ? '<span class="text-[12px] px-3 py-0.5 rounded-full bg-green-50 text-kyc-green">✓ Verified</span>' : "") + "</div>" +
        '<p class="text-[13px] text-grayish-blue-slate mt-1">Account holder: ' + m.holder + "</p>" +
        '<p class="text-[14px] font-semibold text-dark-inky-blue mt-4">···· ' + m.last4 + "</p>" +
        (m.def ? '<span class="inline-block text-[12px] px-3 py-1 rounded-full bg-blue-50 text-shazam-blue mt-2">Default payout method</span>' : "") +
        "</div></div>" +
        '<div class="flex items-center gap-3"><button type="button" data-edit="' + m.id + '" class="text-[13px] font-medium px-5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 cursor-pointer hover:bg-slate-50">Edit Details</button>' +
        '<button type="button" data-remove="' + m.id + '" class="text-[13px] font-medium px-5 py-2 rounded-lg border border-red-500 bg-white text-red-500 cursor-pointer hover:bg-red-50">Remove</button></div></div>';
    }).join("") : '<div class="bg-white rounded-xl border border-slate-200 p-8 text-center text-[14px] text-grayish-blue-slate">No payment method added yet.</div>';
  }
  $("#erMethods").addEventListener("click", function (e) {
    var ed = e.target.closest("[data-edit]"), rm = e.target.closest("[data-remove]");
    if (ed) toast("Edit details - connect to your backend form");
    if (rm) {
      METHODS = METHODS.filter(function (m) { return m.id !== rm.dataset.remove; });
      renderMethods();
      toast("Payment method removed");
    }
  });
  $("#erAddMethod").addEventListener("click", function () { toast("Add payment method - connect to your backend flow"); });

  /* ---------- export CSV ---------- */
  function exportCsv() {
    var rows = [["Txn ID", "Appt ID", "Date", "Patient", "Mode", "Gross", "Commission", "Net", "Status"]].concat(TXN.map(function (t) {
      return [t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[5] - t[6], t[7]];
    }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "earnings-transactions.csv";
    a.click();
  }

  renderTxn();
  renderMethods();
  drawAll();
})();