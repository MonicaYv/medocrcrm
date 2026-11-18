  /* Earnings & payout page. Static data below is sample data; replace the arrays with
   backend/API responses. All styling uses Tailwind classes only (full literal class
   strings so the Tailwind scanner can find them - add this file to your content paths). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var MODE = {
    "Clinic Visit": "bg-emerald-50 text-emerald-600",
    "Video Call": "bg-green-50 text-kyc-green",
    "Voice Call": "bg-purple-50 text-purple-600",
    "Home Visit": "bg-orange-50 text-instant-orange",
    "Hospital": "bg-blue-50 text-facebook-blue"
  };
  var STATUS = {
    Settled: "bg-green-50 text-kyc-green",
    Missed: "bg-slate-200 text-grayish-blue-slate",
    Paid: "bg-green-50 text-kyc-green",
    Processing: "bg-amber-50 text-yellow-600",
    Pending: "bg-amber-50 text-yellow-600",
    Failed: "bg-red-50 text-red-500"
  };
  var PILL = {
    Paid: "bg-green-50 text-kyc-green border-green-200",
    Processing: "bg-amber-50 text-yellow-600 border-yellow-200",
    Pending: "bg-amber-50 text-yellow-600 border-yellow-200",
    Failed: "bg-red-50 text-red-500 border-red-200"
  };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var TAB_ON = "text-shazam-blue border-shazam-blue font-medium";
  var TAB_OFF = "text-slate-600 border-transparent font-normal";
  var RANGE_ON = "bg-white text-dark-inky-blue shadow-sm font-medium";

  function toggle(el, on, onCls, offCls) {
    onCls.split(" ").forEach(function (c) { el.classList.toggle(c, on); });
    offCls.split(" ").forEach(function (c) { el.classList.toggle(c, !on); });
  }
  function chip(map, label) {
    return '<span class="inline-block text-[10px] px-2.5 py-1 rounded-md ' + map[label] + '">' + label + "</span>";
  }
  function toast(msg) {
    var t = $("#erToast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toast.h);
    toast.h = setTimeout(function () { t.classList.add("hidden"); }, 2400);
  }
  var EYE = '<svg class="w-[18px] h-[18px] text-shazam-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var DL = '<svg class="w-[18px] h-[18px] text-kyc-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>';

  /* ---------- tabs ---------- */
  $("#erTabs").addEventListener("click", function (e) {
    var b = e.target.closest(".er-tab");
    if (!b) return;
    $$(".er-tab").forEach(function (t) { toggle(t, t === b, TAB_ON, TAB_OFF); });
    $$("[data-pane]").forEach(function (p) { p.classList.toggle("hidden", p.id !== "er-" + b.dataset.tab); });
  });

  /* ---------- auto bid toggle ---------- */
  $("#erAutoBid").addEventListener("click", function (e) {
    var b = e.currentTarget;
    var on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", on ? "true" : "false");
    toast("Auto Bid " + (on ? "enabled" : "disabled"));
  });

  /* ---------- earnings trend (SVG built with Tailwind classes) ---------- */
  var SERIES = {
    daily:   { gross: [3.2, 5.1, 4.4, 6.8, 5.2, 7.4, 6.1], net: [2.8, 4.5, 3.9, 6.0, 4.6, 6.5, 5.4], labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    weekly:  { gross: [22, 31, 27, 36], net: [19, 27, 24, 32], labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"] },
    monthly: { gross: [3, 5.5, 4.6, 7.2, 8.4, 6.8, 7.6, 5.2, 6.4, 8, 7.2, 8.6, 7.4, 6.9, 7.8, 7.1], net: [2.6, 4.8, 4, 6.3, 7.3, 6, 6.7, 4.5, 5.6, 7, 6.3, 7.5, 6.5, 6, 6.8, 6.2], labels: ["Jul 1", "", "", "", "Jul 8", "", "", "", "Jul 15", "", "", "", "Jul 22", "", "", ""] }
  };
  var W = 560, H = 210, PL = 34, PR = 8, PT = 10, PB = 24;

  function path(data, max, close) {
    var n = data.length, step = (W - PL - PR) / (n - 1), pts = data.map(function (v, i) {
      return [PL + i * step, PT + (H - PT - PB) * (1 - v / max)];
    });
    var d = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L");
    return close ? { d: d, pts: pts } : d;
  }
  function drawChart(key) {
    var s = SERIES[key], max = Math.ceil(Math.max.apply(null, s.gross) / 2) * 2, i, out = "";
    for (i = 0; i <= 4; i++) {
      var y = PT + (H - PT - PB) * (i / 4);
      out += '<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + y + '" y2="' + y + '" class="stroke-slate-100"/>' +
        '<text x="' + (PL - 6) + '" y="' + (y + 3) + '" text-anchor="end" class="fill-slate-400 text-[9px]">' + (i === 4 ? "0" : Math.round(max * (1 - i / 4)) + "k") + "</text>";
    }
    var g = path(s.gross, max, true), n = path(s.net, max, true), base = H - PB;
    out += '<path d="' + g.d + " L" + g.pts[g.pts.length - 1][0] + " " + n.pts[n.pts.length - 1][1] +
      " " + n.d.replace(/^M/, "L").split(" L").reverse().join(" L") + ' Z" class="fill-yellow-100/80"/>';
    out += '<path d="' + n.d + " L" + n.pts[n.pts.length - 1][0] + " " + base + " L" + n.pts[0][0] + " " + base + ' Z" class="fill-green-50"/>';
    out += '<path d="' + g.d + '" class="fill-none stroke-facebook-blue stroke-2"/><path d="' + n.d + '" class="fill-none stroke-kyc-green stroke-2"/>';
    s.labels.forEach(function (l, i2) {
      if (l) out += '<text x="' + (PL + i2 * ((W - PL - PR) / (s.labels.length - 1))) + '" y="' + (H - 6) + '" text-anchor="middle" class="fill-grayish-blue-slate text-[9px]">' + l + "</text>";
    });
    $("#erChart").innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" class="w-full h-auto">' + out + "</svg>";
  }
  $("#erRange").addEventListener("click", function (e) {
    var b = e.target.closest(".er-range");
    if (!b) return;
    $$(".er-range").forEach(function (r) { toggle(r, r === b, RANGE_ON, "text-slate-600"); });
    drawChart(b.dataset.range);
  });

  /* ---------- transactions ---------- */
  var TXN = [
    ["TXN-20001", "APT-3312", "22 Jul", "Rachel Kate", "Clinic Visit", 400, 48, "PAY-8801", "Settled", "10:30 AM", "10:35 AM"],
    ["TXN-20000", "APT-3311", "22 Jul", "Joleen Smith", "Hospital", 800, 96, "PAY-8801", "Settled", "11:00 AM", "11:05 AM"],
    ["TXN-19999", "APT-3309", "22 Jul", "Arjun Mehta", "Video Call", 300, 36, "PAY-8801", "Settled", "12:00 PM", "12:05 PM"],
    ["TXN-19998", "APT-3308", "22 Jul", "Priya Sharma", "Clinic Visit", 400, 48, "PAY-8801", "Settled", "12:30 PM", "12:35 PM"],
    ["TXN-19997", "APT-3307", "22 Jul", "Mohan Das", "Voice Call", 150, 18, "PAY-8801", "Settled", "01:00 PM", "01:05 PM"],
    ["TXN-19996", "APT-3306", "22 Jul", "Nisha Kapoor", "Video Call", 250, 30, "PAY-8801", "Settled", "02:00 PM", "02:05 PM"],
    ["TXN-19995", "APT-3305", "22 Jul", "Steve Lamark", "Home Visit", 550, 66, "PAY-8801", "Settled", "03:00 PM", "03:05 PM"],
    ["TXN-19994", "APT-3304", "22 Jul", "Dolly Paris", "Hospital", 0, 0, "", "Missed", "", ""],
    ["TXN-19993", "APT-3303", "22 Jul", "Josh Kerr", "Video Call", 300, 36, "PAY-8801", "Settled", "04:00 PM", "04:05 PM"],
    ["TXN-19992", "APT-3302", "22 Jul", "Karen Cooper", "Home Visit", 700, 84, "PAY-8801", "Settled", "05:00 PM", "05:05 PM"]
  ];
  function inr(n) { return "₹" + n.toLocaleString("en-IN"); }
  function ini(n) { return n.split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2); }

  $("#erTxnRows").innerHTML = TXN.map(function (t, i) {
    var missed = t[8] === "Missed", net = t[5] - t[6];
    return '<tr class="border-b border-slate-100 text-[12px]">' +
      '<td class="px-4 py-3.5 text-slate-700">' + t[0].replace("-", "–") + "</td>" +
      '<td class="px-3 text-shazam-blue">' + t[1].replace("-", "–") + "</td>" +
      '<td class="px-3 text-slate-700">' + t[2] + "</td>" +
      '<td class="px-3"><span class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-shazam-blue text-white text-[9px] font-semibold flex items-center justify-center">' + ini(t[3]) + "</span>" + t[3] + "</span></td>" +
      '<td class="px-3 text-center">' + chip(MODE, t[4]) + "</td>" +
      '<td class="px-3 text-center">' + inr(t[5]) + "</td>" +
      '<td class="px-3 text-center ' + (missed ? "text-slate-700" : "text-red-500") + '">' + (missed ? "₹0" : "-" + inr(t[6])) + "</td>" +
      '<td class="px-3 text-center font-semibold ' + (missed ? "text-slate-700" : "text-kyc-green") + '">' + inr(net) + "</td>" +
      '<td class="px-3 text-center text-shazam-blue">' + (t[7] ? t[7].replace("-", "–") : "–") + "</td>" +
      '<td class="px-3 text-center">' + chip(STATUS, t[8]) + "</td>" +
      '<td class="px-3 text-center"><button type="button" data-txn="' + i + '" title="View">' + EYE + "</button></td></tr>";
  }).join("");

  /* ---------- payout history: search + filters + table ---------- */
  var PAYOUTS = [
    { id: "PAY-8802", date: "2026-07-29", bank: "HDFC ****4521", n: 8, gross: 3500, status: "Processing" },
    { id: "PAY-8801", date: "2026-07-22", bank: "HDFC ****4521", n: 12, gross: 5400, status: "Paid" },
    { id: "PAY-8790", date: "2026-07-15", bank: "HDFC ****4521", n: 14, gross: 6200, status: "Paid" },
    { id: "PAY-8776", date: "2026-07-08", bank: "HDFC ****4521", n: 10, gross: 4600, status: "Paid" },
    { id: "PAY-8761", date: "2026-07-01", bank: "HDFC ****4521", n: 9, gross: 3900, status: "Paid" }
  ];
  var STATUS_OPTS = ["All Status", "Paid", "Processing", "Pending", "Failed"];
  var PF = { q: "", status: "All Status", from: "", to: "" };
  var OPT = "block w-full text-left text-[13px] px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-shazam-blue ";

  function fmtD(iso) { var p = iso.split("-"); return +p[2] + " " + MONTHS[+p[1] - 1] + " " + p[0]; }
  function comm(p) { return Math.round(p.gross * 0.12); }
  function netOf(p) { return p.gross - comm(p); }

  function renderPayouts() {
    var list = PAYOUTS.filter(function (p) {
      if (PF.q && p.id.toLowerCase().indexOf(PF.q.toLowerCase()) < 0) return false;
      if (PF.status !== "All Status" && p.status !== PF.status) return false;
      if (PF.from && p.date < PF.from) return false;
      if (PF.to && p.date > PF.to) return false;
      return true;
    });
    $("#erPayoutRows").innerHTML = list.length ? list.map(function (p) {
      return '<tr class="border-b border-slate-100"><td class="px-5 py-3.5 text-shazam-blue font-medium">' + p.id.replace("-", "–") + '</td><td class="px-3 text-center">' + fmtD(p.date) + '</td><td class="px-3 text-center">' + p.bank + '</td><td class="px-3 text-center">' + p.n + '</td><td class="px-3 text-center font-semibold text-kyc-green">' + inr(netOf(p)) + '</td><td class="px-3 text-center">' + chip(STATUS, p.status) + '</td><td class="px-3 text-center"><button type="button" data-pay="' + p.id + '" title="View payout">' + EYE + "</button></td></tr>";
    }).join("") : '<tr><td colspan="7" class="text-center text-[13px] text-grayish-blue-slate py-10">No payouts match. Change the search or filters to see more.</td></tr>';
    $("#erPayoutCount").textContent = "Showing " + list.length + " of " + PAYOUTS.length;
    $("#erStatusLabel").textContent = PF.status;
    $("#erDateLabel").textContent = PF.from || PF.to ? (PF.from ? fmtD(PF.from) : "Any") + " – " + (PF.to ? fmtD(PF.to) : "Any") : "Date Range";
  }
  function buildStatusMenu() {
    $("#erStatusMenu").innerHTML = STATUS_OPTS.map(function (o) {
      return '<button type="button" data-status="' + o + '" class="' + OPT + (o === PF.status ? "bg-blue-50 text-shazam-blue" : "text-slate-800") + '">' + o + "</button>";
    }).join("");
  }
  $("#erPayoutSearch").addEventListener("input", function (e) { PF.q = e.target.value.trim(); renderPayouts(); });
  $("#erStatusBtn").addEventListener("click", function () { $("#erDatePop").classList.add("hidden"); $("#erStatusMenu").classList.toggle("hidden"); });
  $("#erStatusMenu").addEventListener("click", function (e) {
    var b = e.target.closest("[data-status]");
    if (!b) return;
    PF.status = b.dataset.status;
    $("#erStatusMenu").classList.add("hidden");
    buildStatusMenu();
    renderPayouts();
  });
  $("#erDateBtn").addEventListener("click", function () { $("#erStatusMenu").classList.add("hidden"); $("#erDatePop").classList.toggle("hidden"); });
  $("#erDateCancel").addEventListener("click", function () { $("#erDatePop").classList.add("hidden"); });
  $("#erDateApply").addEventListener("click", function () {
    var f = $("#erFrom").value, t = $("#erTo").value;
    if (f && t && f > t) { toast("'From' date must be before 'To' date"); return; }
    PF.from = f; PF.to = t;
    $("#erDatePop").classList.add("hidden");
    renderPayouts();
  });
  $("#erPayoutReset").addEventListener("click", function () {
    PF = { q: "", status: "All Status", from: "", to: "" };
    $("#erPayoutSearch").value = ""; $("#erFrom").value = ""; $("#erTo").value = "";
    buildStatusMenu();
    renderPayouts();
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#erStatusBtn, #erStatusMenu")) $("#erStatusMenu").classList.add("hidden");
    if (!e.target.closest("#erDateBtn, #erDatePop")) $("#erDatePop").classList.add("hidden");
  });
  buildStatusMenu();
  renderPayouts();

  /* ---------- payout details popup ---------- */
  var CARD = "rounded-xl border border-slate-200 p-4 mb-3";
  function row(label, val, valCls) {
    return '<div class="flex justify-between py-1.5 text-[12px]"><span class="text-slate-600">' + label + '</span><span class="' + (valCls || "text-dark-inky-blue") + ' font-semibold">' + val + "</span></div>";
  }
  function dot(color, label, time) {
    return '<li class="flex items-center gap-2.5 text-[12px]"><i class="w-2 h-2 rounded-full ' + color + '"></i><b class="font-semibold text-dark-inky-blue">' + label + '</b><span class="ml-auto text-slate-400 text-[11px]">' + time + "</span></li>";
  }
  var curPay = null;
  function openPayout(p) {
    curPay = p;
    var paid = p.status === "Paid", d = fmtD(p.date).slice(0, -5), net = netOf(p), more = p.n - 5;
    var html =
      '<div class="rounded-xl border border-green-200 bg-green-50 p-4 mb-3"><div class="flex items-start justify-between gap-3">' +
      '<div class="flex items-center gap-3"><span class="w-8 h-6 rounded-md border border-green-300 bg-white text-kyc-green text-[11px] font-bold flex items-center justify-center">₹</span><div><p class="text-[13px] font-bold text-dark-inky-blue">' + p.id.replace("-", "–") + '</p><p class="text-[11px] text-grayish-blue-slate">' + p.bank.replace("HDFC", "HDFC Bank") + "</p></div></div>" +
      '<div class="text-right"><p class="text-[22px] font-bold text-kyc-green leading-none">' + inr(net) + '</p><p class="text-[10px] text-grayish-blue-slate mt-1">Net Amount ' + (paid ? "Transferred" : "Pending") + "</p></div></div>" +
      '<div class="border-t border-green-200 mt-3 pt-2.5 flex items-center justify-between text-[10px] text-grayish-blue-slate"><span>Initiated ' + d + " 09:00 AM" + (paid ? " · Received " + d + " 11:30 AM" : " · Awaiting bank credit") + "</span>" + (paid ? '<b class="text-kyc-green">2h 30m · Fast Transfer</b>' : "") + "</div></div>" +

      '<div class="' + CARD + '"><p class="text-[13px] font-bold text-dark-inky-blue mb-1.5">Amount Breakdown</p>' +
      row("Gross", inr(p.gross)) + row("Commission", "-" + inr(comm(p)), "text-red-500") + row("GST", "₹0") + row("Processing", "₹0") + row("Dispute", "₹0") +
      '<div class="border-t border-slate-100 mt-1.5 pt-2.5 flex justify-between"><b class="text-[12px] text-dark-inky-blue">Net Amount</b><b class="text-[16px] text-kyc-green">' + inr(net) + "</b></div></div>" +

      '<div class="' + CARD + '"><div class="flex items-center justify-between mb-2"><p class="text-[13px] font-bold text-dark-inky-blue">Appointments Included (' + p.n + ')</p><button type="button" data-viewall class="text-[11px] font-semibold text-shazam-blue">View All ↗</button></div>' +
      TXN.slice(0, 5).map(function (t) {
        return '<div class="grid grid-cols-[62px_1fr_70px_40px_40px] gap-2 items-center border-b border-slate-100 py-2.5 text-[11px]"><b class="text-dark-inky-blue">' + t[1] + '</b><span class="text-slate-700 truncate">' + t[3] + '</span><span class="text-grayish-blue-slate text-center">' + t[4] + '</span><span class="text-slate-700 text-right">' + inr(t[5]) + '</span><span class="text-kyc-green font-semibold text-right">' + inr(t[5] - t[6]) + "</span></div>";
      }).join("") +
      '<div class="flex items-center justify-between pt-3 text-[11px]"><span class="text-slate-400">' + (more > 0 ? "+ " + more + " more" : "") + '</span><button type="button" data-viewall class="font-semibold text-shazam-blue">View All ↗</button></div></div>' +

      '<div class="' + CARD + '"><p class="text-[13px] font-bold text-dark-inky-blue mb-1.5">Bank Confirmation</p>' +
      row("Bank", "HDFC") + row("Account", "****4521", "text-dark-inky-blue tracking-wide") +
      row("Ref", "NEFT/" + p.date.replace(/-/g, "") + "/00" + (1000 + p.n * 11), "text-dark-inky-blue text-[11px]") +
      row("UTR", "UTR" + p.date.replace(/-/g, "") + "HDFC001", "text-dark-inky-blue text-[11px]") +
      '<p class="text-[11px] mt-1.5 flex items-center gap-1.5 ' + (paid ? "text-kyc-green" : "text-yellow-600") + '"><span class="w-3.5 h-3.5 rounded-full border text-[8px] flex items-center justify-center">' + (paid ? "✓" : "…") + "</span>" + (paid ? "Successfully credited" : "Credit in progress") + "</p></div>" +

      '<div class="' + CARD + '"><p class="text-[13px] font-bold text-dark-inky-blue mb-3">Activity Log</p><ul class="space-y-3">' +
      (paid ? dot("bg-kyc-green", "Amount credited HDFC", "11:30 AM") : "") +
      dot("bg-facebook-blue", "NEFT initiated", "09:05 AM") +
      dot("bg-instant-orange", "Payout auto-generated", "09:00 AM") +
      dot("bg-kyc-green", p.n + " appointments settled", "08:45 AM") + "</ul></div>";

    $("#pdBody").innerHTML = html;
    $("#pdStatus").innerHTML = '<span class="text-[10px] px-2.5 py-0.5 rounded-full border ' + PILL[p.status] + '">' + p.status + "</span>";
    open("m-payout");
  }
  $("#erPayoutRows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-pay]");
    if (!b) return;
    openPayout(PAYOUTS.filter(function (p) { return p.id === b.dataset.pay; })[0]);
  });
  $("#pdBody").addEventListener("click", function (e) {
    if (!e.target.closest("[data-viewall]")) return;
    hide("m-payout");
    $('[data-tab="transactions"]').click();
  });
  $("#pdReceiptBtn").addEventListener("click", function () { toast("Payout receipt " + curPay.id + " - connect to your backend download URL"); });
  $("#pdInvoiceBtn").addEventListener("click", function () { toast("Invoice PDF for " + curPay.id + " - connect to your backend download URL"); });

  /* ---------- invoices ---------- */
  var INVOICES = [
    ["INV–2025–07", "Jul 1–22, 2025", "22 Jul 2025", 318, 124800, 14976],
    ["INV–2025–06", "Jun 2025", "01 Jul 2025", 284, 98400, 11808],
    ["INV–2025–05", "May 2025", "01 Jun 2025", 256, 84200, 10104],
    ["INV–2025–04", "Apr 2025", "01 May 2025", 212, 72400, 8688],
    ["INV–2025–03", "Mar 2025", "01 Apr 2025", 198, 68600, 8232],
    ["INV–2025–02", "Feb 2025", "01 Mar 2025", 184, 58200, 6984],
    ["INV–2025–01", "Jan 2025", "01 Feb 2025", 172, 52400, 6288],
    ["INV–2024–12", "Dec 2024", "01 Jan 2025", 168, 48800, 5856]
  ];
  $("#erInvoiceRows").innerHTML = INVOICES.map(function (v) {
    var net = v[4] - v[5];
    return '<tr class="border-b border-slate-100"><td class="px-5 py-3.5 text-left text-shazam-blue font-medium">' + v[0] + '</td><td class="px-3 text-slate-700">' + v[1] + '</td><td class="px-3 text-slate-700">' + v[2] + '</td><td class="px-3 text-slate-700">' + v[3] + '</td><td class="px-3 text-slate-700">' + inr(v[4]) + '</td><td class="px-3 text-red-500">' + inr(v[5]) + '</td><td class="px-3 text-kyc-green font-semibold">' + inr(net) + '</td><td class="px-3 text-slate-700">Exempt</td><td class="px-3 text-kyc-green font-semibold">' + inr(net) + '</td>' +
      '<td class="px-3"><span class="flex items-center justify-center gap-2 text-[10px] font-semibold"><button type="button" data-dl="' + v[0] + ' PDF" class="text-red-500 cursor-pointer">PDF</button><button type="button" data-dl="' + v[0] + ' CSV" class="text-kyc-green cursor-pointer">CSV</button></span></td></tr>';
  }).join("");

  /* ---------- transaction popup ---------- */
  var cur = null;
  function open(id) { var m = $("#" + id); m.classList.remove("hidden"); m.classList.add("flex"); }
  function hide(id) { var m = $("#" + id); m.classList.add("hidden"); m.classList.remove("flex"); }

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
    $("#tx-status").innerHTML = chip(STATUS, t[8]);
    $("#tx-ref").textContent = t[0].replace("-", "–");
    var steps = [
      ["Appointment completed", t[9]],
      ["Transaction recorded", t[10]],
      ["Payout processed", t[2] + " 2026"],
      ["Settled to bank", t[2] + " 2026"]
    ];
    $("#txTimeline").innerHTML = steps.map(function (s) {
      return '<li class="flex items-center gap-2.5"><span class="w-4 h-4 rounded-full bg-kyc-green text-white text-[9px] flex items-center justify-center">✓</span><b class="font-semibold text-dark-inky-blue">' + s[0] + '</b><span class="text-slate-400 text-[12px]">· ' + (s[1] || "–") + "</span></li>";
    }).join("");
    open("m-txn");
  }
  $("#erTxnRows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-txn]");
    if (b) openTxn(TXN[+b.dataset.txn]);
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

  /* ---------- downloads / export ---------- */
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-dl]");
    if (d) toast(d.dataset.dl + " - connect to your backend download URL");
  });
  $("#erStatementBtn").addEventListener("click", function () { toast("Statement - connect to your backend download URL"); });
  $("#erExportBtn").addEventListener("click", function () {
    var rows = [["Txn ID", "Appt ID", "Date", "Patient", "Mode", "Gross", "Commission", "Net", "Payout ID", "Status"]].concat(TXN.map(function (t) {
      return [t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[5] - t[6], t[7], t[8]];
    }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "earnings-transactions.csv";
    a.click();
  });

  drawChart("monthly");
})();