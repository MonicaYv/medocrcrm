(function () {
  'use strict';

  /* ================= helpers ================= */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = $('#pharmacyEarnings');
  if (!root) return;

  var fmt = function (v) { return '₹' + Number(v).toLocaleString('en-IN'); };
  var fmtA = function (v) {
    var r = Math.round(v * 100) / 100;
    return '₹' + r.toLocaleString('en-IN', { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 });
  };
  var fmt2 = function (v) { return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function axis(v) {
    if (v === 0) return '₹0';
    if (v >= 100000) return '₹' + (Math.round(v / 10000) / 10) + 'L';
    return '₹' + (v / 1000) + 'k';
  }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  var toastTimer;
  function toast(msg) {
    var t = $('#peToast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 2400);
  }
  function openModal(id) { $('#' + id).classList.add('open'); }
  function closeModal(id) { $('#' + id).classList.remove('open'); }
  $$('.pe-modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(m.id); });
    $$('[data-pe-close]', m).forEach(function (b) { b.addEventListener('click', function () { closeModal(m.id); }); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('.pe-modal.open').forEach(function (m) { closeModal(m.id); });
    $$('.pe-menu.open').forEach(function (m) { m.classList.remove('open'); });
  });
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ================= charts (pure SVG, no library) ================= */
  function niceTicks(max) {
    var raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), steps = [1, 2, 2.5, 5, 10], step = mag * 10;
    for (var i = 0; i < steps.length; i++) { if (steps[i] * mag >= raw) { step = steps[i] * mag; break; } }
    var top = Math.ceil(max / step) * step, t = [];
    for (var v = 0; v <= top + 0.001; v += step) t.push(v);
    return t;
  }

  function renderBars(el, o) {
    var W = 900, H = o.h || 250, pl = 58, pr = 16, pt = 12, pb = o.subs ? 52 : 34;
    var ticks = niceTicks(Math.max.apply(null, o.values)), top = ticks[ticks.length - 1];
    var n = o.values.length, cw = (W - pl - pr) / n, bw = Math.min(o.bw || 30, cw * 0.5);
    var y = function (v) { return pt + (H - pt - pb) * (1 - v / top); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="w-full h-auto" role="img" aria-label="' + esc(o.aria || 'Bar chart') + '">';
    ticks.forEach(function (t) {
      var yy = y(t).toFixed(1);
      s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '" stroke="#e8edf3" />' +
        '<text x="' + (pl - 10) + '" y="' + (Number(yy) + 4) + '" text-anchor="end" font-size="11" fill="#8a97ab">' + axis(t) + '</text>';
    });
    o.values.forEach(function (v, i) {
      var cx = pl + cw * i + cw / 2, x0 = cx - bw / 2, y0 = y(0), y1 = y(v);
      s += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'V' + (y1 + 4).toFixed(1) + 'a4 4 0 0 1 4 -4h' + (bw - 8).toFixed(1) +
        'a4 4 0 0 1 4 4V' + y0.toFixed(1) + 'Z" fill="#2f80ed"><title>' + esc(o.labels[i]) + ': ' + fmt(v) + '</title></path>';
      s += '<text x="' + cx.toFixed(1) + '" y="' + (y0 + 18).toFixed(1) + '" text-anchor="middle" font-size="11" fill="#5b6b80">' + esc(o.labels[i]) + '</text>';
      if (o.subs) s += '<text x="' + cx.toFixed(1) + '" y="' + (y0 + 33).toFixed(1) + '" text-anchor="middle" font-size="10" fill="#8a97ab">' + esc(o.subs[i]) + '</text>';
    });
    el.innerHTML = s + '</svg>';
  }

  function renderDonut(id, items, big, small) {
    var el = $('#' + id), R = 62, C = 2 * Math.PI * R, off = 0;
    var s = '<div class="relative w-[160px] h-[160px] shrink-0"><svg viewBox="0 0 160 160" class="w-[160px] h-[160px] -rotate-90" role="img">';
    items.forEach(function (it) {
      var len = C * it.pct / 100;
      s += '<circle cx="80" cy="80" r="' + R + '" fill="none" stroke="' + it.color + '" stroke-width="22" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"><title>' + esc(it.name) + ' ' + it.pct + '%</title></circle>';
      off += len;
    });
    s += '</svg><div class="absolute inset-0 flex flex-col items-center justify-center text-center"><b class="text-[20px] leading-tight">' + big + '</b><span class="text-[10px] text-[#8a97ab]">' + small + '</span></div></div>';
    s += '<ul class="space-y-3 text-[12px]">';
    items.forEach(function (it) {
      s += '<li class="flex items-center gap-2"><i class="inline-block h-2 w-2 rounded-full" style="background:' + it.color + '"></i><span class="w-[130px] text-[#344054]">' + esc(it.name) + '</span><b>' + it.pct + '%</b></li>';
    });
    el.innerHTML = s + '</ul>';
  }

  function renderMeds() {
    var meds = [['Paracetamol 500mg', 85000], ['Vitamin D3 1000 IU', 65000], ['ORS Solution', 42000], ['Cough Syrup', 32000], ['Multivitamin Tablets', 24000]];
    var max = meds[0][1];
    $('#peMeds').innerHTML = meds.map(function (m) {
      return '<li class="flex items-center gap-3 text-[12px]"><span class="w-[130px] shrink-0 text-[#344054]">' + m[0] + '</span>' +
        '<span class="h-2.5 flex-1 rounded-full bg-[#eef2f7]"><i class="block h-full rounded-full bg-[#2f80ed]" style="width:' + (m[1] / max * 100).toFixed(1) + '%"></i></span>' +
        '<b class="w-[52px] text-right">₹' + (m[1] / 1000) + 'K</b></li>';
    }).join('');
  }

  /* ================= revenue trend + date filter ================= */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS7 = ['23Sep', '24Sep', '25Sep', '26Sep', '27Sep', '28Sep', '29Sep'];
  var DAILY = [29200, 33600, 35100, 36800, 37900, 38400, 35800];
  var RANGES = {
    month: { label: 'This Month · 1–29 Sep 2026', sub: '23–29 Sep 2026', labels: DAYS7, values: DAILY },
    week: { label: 'Last 7 Days · 23–29 Sep 2026', sub: '23–29 Sep 2026', labels: DAYS7, values: DAILY },
    days30: { label: 'Last 30 Days · 30 Aug–29 Sep 2026', sub: '30 Aug–29 Sep 2026', labels: ['30Aug', '4Sep', '9Sep', '14Sep', '19Sep', '24Sep', '29Sep'], values: [98000, 104000, 96000, 112000, 108000, 118000, 121000] }
  };
  var currentRange = 'month';

  function renderTrend() {
    var r = RANGES[currentRange];
    $('#peDateLabel').textContent = r.label;
    $('#peTrendSub').textContent = r.sub + ' · Total ' + fmt(sum(r.values));
    renderBars($('#peTrend'), { labels: r.labels, values: r.values, bw: 30, h: 250, aria: 'Revenue trend' });
    $$('#peDateMenu [data-range]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-range') === currentRange); });
  }

  function parseDate(v) { var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dm(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function customRange(from, to) {
    var days = Math.round((to - from) / 86400000) + 1;
    var buckets = Math.min(7, days), size = Math.ceil(days / buckets), labels = [], values = [];
    for (var i = 0; i < buckets; i++) {
      var d = new Date(from.getTime() + i * size * 86400000);
      labels.push(d.getDate() + MONTHS[d.getMonth()]);
      values.push(Math.round(30000 * size * (0.85 + 0.3 * (((i * 37 + days * 13) % 100) / 100)) / 100) * 100);
    }
    var txt = dm(from) + ' – ' + dm(to) + ' ' + to.getFullYear();
    return { label: 'Custom · ' + txt, sub: txt, labels: labels, values: values };
  }

  var dateMenu = $('#peDateMenu'), exportMenu = $('#peExportMenu');
  $('#peDateBtn').addEventListener('click', function (e) { e.stopPropagation(); exportMenu.classList.remove('open'); dateMenu.classList.toggle('open'); });
  $('#peExportBtn').addEventListener('click', function (e) { e.stopPropagation(); dateMenu.classList.remove('open'); exportMenu.classList.toggle('open'); });
  dateMenu.addEventListener('click', function (e) { e.stopPropagation(); });
  document.addEventListener('click', function () { dateMenu.classList.remove('open'); exportMenu.classList.remove('open'); });

  $$('#peDateMenu [data-range]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-range');
      if (k === 'custom') { $('#peCustomBox').classList.remove('hidden'); return; }
      $('#peCustomBox').classList.add('hidden');
      currentRange = k;
      renderTrend();
      dateMenu.classList.remove('open');
    });
  });
  $('#peCustomCancel').addEventListener('click', function () { $('#peCustomBox').classList.add('hidden'); dateMenu.classList.remove('open'); });
  $('#peCustomApply').addEventListener('click', function () {
    var f = $('#peFrom').value, t = $('#peTo').value;
    if (!f || !t) { toast('Select both dates'); return; }
    if (f > t) { toast('From date cannot be after To date'); return; }
    RANGES.custom = customRange(parseDate(f), parseDate(t));
    currentRange = 'custom';
    renderTrend();
    $('#peCustomBox').classList.add('hidden');
    dateMenu.classList.remove('open');
  });

  /* ================= transactions data ================= */
  var TXNS = [
    { id: 'TXN-001', order: 'ORD-10345', cust: 'Priya Singh', prod: 'Paracetamol 500mg (Strip)', net: 450, st: 'Delivered', dt: '29 Sep 2026, 9:00 AM', day: '29 Sep 2026', ref: 'SETT-0929-01', ful: 'Home Delivery', orders: 1 },
    { id: 'TXN-002', order: 'ORD-10344', cust: 'Rahul Sharma', prod: 'Vitamin D3 1000 IU', net: 1200, st: 'Pending', dt: '29 Sep 2026, 8:20 AM', day: '29 Sep 2026', ref: 'SETT-0929-02', ful: 'Stock Pickup', orders: 1 },
    { id: 'TXN-003', order: 'ORD-10343', cust: 'Amit Kumar', prod: 'Cough Syrup', net: 320, st: 'Processing', dt: '28 Sep 2026, 6:45 PM', day: '28 Sep 2026', ref: 'SETT-0928-03', ful: 'Home Delivery', orders: 1 },
    { id: 'TXN-004', order: 'ORD-10342', cust: 'Neha Gupta', prod: 'Multivitamin Tablets', net: 800, st: 'Delivered', dt: '28 Sep 2026, 4:10 PM', day: '28 Sep 2026', ref: 'SETT-0928-02', ful: 'Home Delivery', orders: 2 },
    { id: 'TXN-005', order: 'ORD-10341', cust: 'Sneha Iyer', prod: 'Azithromycin 500mg', net: 1150, st: 'Delivered', dt: '27 Sep 2026, 2:30 PM', day: '27 Sep 2026', ref: 'SETT-0927-02', ful: 'Stock Pickup', orders: 1 },
    { id: 'TXN-006', order: 'ORD-10340', cust: 'Vikram Joshi', prod: 'ORS Solution', net: 240, st: 'Cancelled', dt: '27 Sep 2026, 11:15 AM', day: '27 Sep 2026', ref: 'SETT-0927-01', ful: 'Home Delivery', orders: 1 },
    { id: 'TXN-007', order: 'ORD-10339', cust: 'Pooja Mehta', prod: 'Pantop 40mg', net: 560, st: 'Refund', dt: '26 Sep 2026, 5:05 PM', day: '26 Sep 2026', ref: 'REF-0926-01', ful: 'Home Delivery', orders: 1 },
    { id: 'TXN-008', order: 'ORD-10338', cust: 'Karan Desai', prod: 'Metformin 500mg', net: 640, st: 'Delivered', dt: '26 Sep 2026, 10:40 AM', day: '26 Sep 2026', ref: 'SETT-0926-01', ful: 'Stock Pickup', orders: 1 },
    { id: 'TXN-009', order: 'ORD-10337', cust: 'Anita Rao', prod: 'Cetirizine 10mg', net: 180, st: 'Delivered', dt: '25 Sep 2026, 3:25 PM', day: '25 Sep 2026', ref: 'SETT-0925-02', ful: 'Home Delivery', orders: 1 },
    { id: 'TXN-010', order: 'ORD-10336', cust: 'Farhan Shaikh', prod: 'Atorva 10mg', net: 920, st: 'Delivered', dt: '25 Sep 2026, 9:50 AM', day: '25 Sep 2026', ref: 'SETT-0925-01', ful: 'Home Delivery', orders: 1 }
  ];
  function txn(id) { return TXNS.filter(function (t) { return t.id === id; })[0]; }
  function pill(s) { return '<span class="pe-pill ' + s.toLowerCase() + '">' + s + '</span>'; }

  function amtCell(t) {
    if (t.st === 'Cancelled') return '<span class="text-[#9aa5b6] line-through">' + fmt(t.net) + '</span>';
    if (t.st === 'Refund') return '<b class="text-[#ef4444]">-' + fmt(t.net) + '</b>';
    return '<b class="text-[#16a34a]">' + (t.st === 'Delivered' ? '+' : '') + fmt(t.net) + '</b>';
  }
  function rowsHtml(list) {
    return list.map(function (t) {
      return '<tr><td>' + t.order.replace('-', ' - ') + '</td><td>' + esc(t.cust) + '</td><td>' + esc(t.prod) + '</td><td>' + amtCell(t) + '</td><td>' + pill(t.st) +
        '</td><td><button type="button" data-txn="' + t.id + '" class="text-[12px] text-[#1683ff] hover:underline">View details</button></td></tr>';
    }).join('');
  }

  var showAll = false;
  function renderTables() {
    $('#peRecentBody').innerHTML = rowsHtml(TXNS.slice(0, 4));
    $('#peTxnBody').innerHTML = rowsHtml(showAll ? TXNS : TXNS.slice(0, 8));
    $('#peToggleAll').textContent = showAll ? 'Show less ←' : 'View all transactions →';
  }
  $('#peToggleAll').addEventListener('click', function () { showAll = !showAll; renderTables(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-txn]');
    if (b) openTxn(b.getAttribute('data-txn'));
  });

  /* ================= tabs ================= */
  var tabs = $$('#peTabs .pe-tab');
  function showTab(name) {
    tabs.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === name); });
    $$('[data-pe-pane]').forEach(function (p) { p.classList.toggle('hidden', p.id !== 'pe-' + name); });
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); }); });
  $$('.peGoTxn').forEach(function (b) {
    b.addEventListener('click', function () { showTab('transactions'); $('#peTabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  });
  $('#peViewReports').addEventListener('click', function (e) { /* set the real reports URL in the href */ if (this.getAttribute('href') === '#') e.preventDefault(); });

  /* ================= header actions ================= */
  $('#peExportCsv').addEventListener('click', function () {
    var rows = [['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Date']].concat(TXNS.map(function (t) { return [t.order, t.cust, t.prod, t.net, t.st, t.dt]; }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    download('pharmacy-earnings.csv', csv, 'text/csv');
    exportMenu.classList.remove('open');
    toast('Statement downloaded');
  });
  $('#peExportPdf').addEventListener('click', function () { exportMenu.classList.remove('open'); window.print(); });
  $('#peRefresh').addEventListener('click', function () {
    var ic = $('#peRefreshIcon');
    ic.classList.remove('pe-spin'); void ic.offsetWidth; ic.classList.add('pe-spin');
    renderTrend(); renderTables();
    toast('Earnings refreshed');
  });

  /* ================= transaction popup ================= */
  function calc(t) {
    var fee = Math.round(t.net * 0.12), gst = fee * 18 / 118;
    return { fee: fee, gst: gst, base: fee - gst, gross: t.net + fee };
  }
  var ICONS = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>',
    doc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /></svg>',
    wallet: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12h5" /></svg>',
    alert: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>',
    cart: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 11.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.5L21 7H6" /></svg>'
  };
  function step(icon, bg, color, title, desc) {
    return '<li><span class="ic" style="background:' + bg + ';color:' + color + '">' + icon + '</span><span><b class="block text-[15px] leading-tight">' + title + '</b><span class="mt-1 block text-[13px] text-[#5b6b80]">' + desc + '</span></span></li>';
  }
  function firstStep(t) {
    var m = {
      Delivered: ['Settlement Completed', 'Your ledger has been successfully settled', '#22c55e', '#fff'],
      Pending: ['Settlement Pending', 'Waiting for payment confirmation', '#f59e0b', '#fff'],
      Processing: ['Settlement Processing', 'Your payout is being processed', '#1683ff', '#fff'],
      Cancelled: ['Order Cancelled', 'No settlement was generated for this order', '#ef4444', '#fff'],
      Refund: ['Refund Issued', 'The amount was refunded to the customer', '#f59e0b', '#fff']
    }[t.st];
    return step(ICONS.check, m[2], m[3], m[0], m[1]);
  }

  var curTxn = null;
  function openTxn(id) {
    var t = txn(id);
    if (!t) return;
    curTxn = t;
    var c = calc(t), settled = t.st === 'Delivered';
    var credit = settled ? t.net : 0, debit = t.st === 'Refund' ? t.net : 0;

    $('#pxId').textContent = t.id.replace('-', ' - ');
    $('#pxStatus').innerHTML = pill(t.st === 'Delivered' ? 'Settled' : t.st);
    $('#pxDate').textContent = t.dt;
    $('#pxRef').textContent = t.ref;
    $('#pxCredit').textContent = fmt(credit);
    $('#pxDebit').textContent = fmt(debit);
    $('#pxBal').textContent = fmt(settled ? t.net : 0);
    $('#pxFul').textContent = t.ful;
    $('#pxSumNote').textContent = t.ful + ' Batch · This record is illustrative demo ledger data';

    var voided = t.st === 'Cancelled';
    var rows = [
      ['Gross Settlement Value', c.gross, voided ? 'Voided' : 'Credited'],
      ['Platform Fee', c.base, voided ? 'Voided' : 'Deducted'],
      ['GST (18%)', c.gst, voided ? 'Voided' : 'Deducted'],
      ['Net Payout', t.net, voided ? 'Voided' : (t.st === 'Refund' ? 'Refunded' : 'Credited')]
    ];
    $('#pxLedger').innerHTML = rows.map(function (r) {
      return '<tr><td class="whitespace-nowrap text-[12px] font-semibold text-[#5b6b80]">' + t.dt.replace(', ', '  ') + '</td><td class="text-[12px] font-semibold text-[#5b6b80]">' + r[0] + '</td><td class="text-[12px]">' + fmtA(r[1]) + '</td><td>' + pill(r[2]) + '</td></tr>';
    }).join('');

    $('#pxTimeline').innerHTML =
      firstStep(t) +
      step(ICONS.doc, '#e1f0ff', '#1683ff', 'Ledger Generated', 'Ledger ' + t.id.replace('-', ' ') + ' has been generated') +
      step(ICONS.wallet, '#ece9ff', '#6d5bd0', 'Payout Initiated', 'Amount of ' + fmtA(t.net) + ' has been initiated for payout.') +
      step(ICONS.alert, '#ffe9d6', '#f97316', 'Deductions Applied', fmtA(c.fee) + ' (platform fee + 18% GST) has been deducted.') +
      step(ICONS.cart, '#e1f0ff', '#1683ff', 'Order Processed', 'Order ' + t.order.replace('-', ' - ') + ' has been processed.');

    var tick = '<span class="pe-tick">' + ICONS.check + '</span>';
    $('#pxMiniTimeline').innerHTML =
      '<li>' + tick + '<span><b class="block text-[14px] text-[#1683ff]">Order Received</b><span class="mt-1 block text-[14px] text-[#5b6b80]">' + t.dt + '</span></span></li>' +
      '<li>' + tick + '<span><b class="block text-[14px] text-[#1683ff]">Cleared</b><span class="mt-1 block text-[14px] text-[#5b6b80]">Demo settlement cleared</span></span></li>';

    showPTab('summary');
    openModal('peTxnModal');
  }

  var pTabs = $$('#pxTabs .pe-tab');
  function showPTab(name) {
    pTabs.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-ptab') === name); });
    $$('[data-ppane]').forEach(function (p) { p.classList.toggle('hidden', p.id !== 'px-' + name); });
    $('#pxBelowSummary').classList.toggle('hidden', name !== 'summary');
    $('#pxBelowNote').classList.toggle('hidden', name === 'summary');
  }
  pTabs.forEach(function (b) { b.addEventListener('click', function () { showPTab(b.getAttribute('data-ptab')); }); });

  /* ================= receipt popup ================= */
  $('#pxReceiptBtn').addEventListener('click', function () {
    var t = curTxn, c = calc(t);
    $('#prTxn').textContent = t.id.replace('-', ' ');
    $('#prStatus').innerHTML = pill(t.st === 'Delivered' ? 'Paid' : t.st);
    $('#prPeriod').textContent = t.day + ' (' + t.orders + (t.orders > 1 ? ' Orders)' : ' Order)');
    $('#prGross').textContent = fmt2(c.gross);
    $('#prGst').textContent = 'Incl. 18% GST (' + fmt2(c.gst) + ')';
    $('#prFee').textContent = '-' + fmt2(c.fee);
    $('#prNet').textContent = fmt2(t.net);
    openModal('peReceiptModal');
  });
  $('#prDownload').addEventListener('click', function () {
    var t = curTxn, c = calc(t);
    var lines = [
      'MedPlus Pharmacy - Settlement Receipt',
      'GSTIN: 27AABCM8492K1Z5 | DL No: 20B/21B-MH-409281',
      '',
      'Transaction: ' + t.id + ' (' + t.ref + ')',
      'Date: ' + t.dt,
      'Status: ' + t.st,
      '',
      'Gross Order Settlement Value : ' + fmt2(c.gross),
      'Platform & Facilitation Charges (incl. 18% GST ' + fmt2(c.gst) + ') : -' + fmt2(c.fee),
      'Net Settled Payout (HDFC Bank Ltd. xxxx 4821) : ' + fmt2(t.net),
      '',
      'Illustrative demo data.'
    ];
    download('receipt-' + t.id + '.txt', lines.join('\n'));
    closeModal('peReceiptModal');
    toast('Receipt for ' + t.id + ' downloaded');
  });

  /* ================= payment methods ================= */
  var methods = [{ id: 1, bank: 'HDFC Bank', holder: 'MedPlus Pharmacy', last4: '4821', ifsc: 'HDFC0001234', type: 'Savings', verified: true, primary: true }];
  var nextId = 2, editingId = null, removingId = null;
  var SHIELD = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>';

  function renderMethods() {
    var list = $('#peMethodList');
    if (!methods.length) {
      list.innerHTML = '<div class="pe-card px-5 py-10 text-center text-[14px] pe-mute">No payment method added yet. Add a bank account to receive your payouts.</div>';
      return;
    }
    list.innerHTML = methods.map(function (m) {
      return '<div class="pe-card flex flex-wrap items-center justify-between gap-4 px-5 py-4">' +
        '<div class="flex items-start gap-3"><span class="mt-0.5">' + SHIELD + '</span><div>' +
        '<div class="flex flex-wrap items-center gap-3"><b class="text-[14px]">' + esc(m.bank) + ' •••• ' + m.last4 + '</b>' +
        (m.verified ? '<span class="rounded-full bg-[#e3f6ec] px-3 py-1 text-[11px] text-[#16a34a]">✓ Verified</span>' : '<span class="pe-pill pending">Verification pending</span>') + '</div>' +
        '<p class="mt-1.5 text-[13px] pe-mute">Account holder: ' + esc(m.holder) + '</p>' +
        '<p class="mt-2 text-[13px] font-semibold">•••• ' + m.last4 + '</p>' +
        '<div class="mt-2">' + (m.primary
          ? '<span class="rounded-full bg-[#dfeeff] px-3 py-1 text-[11px] text-[#1683ff]">Default payout method</span>'
          : '<button type="button" data-set-default="' + m.id + '" class="text-[12px] font-medium text-[#1683ff] hover:underline">Set as default</button>') + '</div>' +
        '</div></div>' +
        '<div class="flex items-center gap-3"><button type="button" data-edit-method="' + m.id + '" class="pe-btn !h-[40px] !px-4">Edit Details</button>' +
        '<button type="button" data-remove-method="' + m.id + '" class="pe-btn pe-btn-danger !h-[40px] !px-5">Remove</button></div></div>';
    }).join('');
  }

  var acctType = 'Savings';
  function setType(t) {
    acctType = t;
    $('#pmTypeLabel').textContent = t;
    $$('#pmTypeMenu .pm-type').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-type') === t); });
  }
  $('#pmTypeBtn').addEventListener('click', function (e) { e.stopPropagation(); $('#pmTypeMenu').classList.toggle('open'); });
  $$('#pmTypeMenu .pm-type').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); setType(b.getAttribute('data-type')); $('#pmTypeMenu').classList.remove('open'); });
  });
  $('#peMethodModal').addEventListener('click', function () { $('#pmTypeMenu').classList.remove('open'); });

  function pmError(msg) { var p = $('#pmError'); p.textContent = msg; p.classList.remove('hidden'); }

  function openMethodForm(id) {
    editingId = id;
    var m = methods.filter(function (x) { return x.id === id; })[0];
    $('#pmTitle').textContent = m ? 'Edit payout method' : 'Add payout method';
    $('#pmHolder').value = m ? m.holder : 'MedPlus Pharmacy';
    $('#pmBank').value = m ? m.bank : '';
    // full account numbers are never kept in the browser; leave blank to keep the saved one
    $('#pmAcc').value = '';
    $('#pmAcc2').value = '';
    $('#pmAcc').placeholder = m ? '•••• ' + m.last4 + ' (leave blank to keep)' : 'Enter account number';
    $('#pmAcc2').placeholder = m ? 'Re-enter only if changing' : 'Re-enter account number';
    $('#pmIfsc').value = m ? m.ifsc || '' : '';
    setType(m ? m.type || 'Savings' : 'Savings');
    $('#pmTypeMenu').classList.remove('open');
    $('#pmError').classList.add('hidden');
    openModal('peMethodModal');
    $('#pmHolder').focus();
  }
  $('#peAddMethod').addEventListener('click', function () { openMethodForm(null); });

  $('#pmSave').addEventListener('click', function () {
    var holder = $('#pmHolder').value.trim(), bank = $('#pmBank').value.trim();
    var acc = $('#pmAcc').value.trim(), acc2 = $('#pmAcc2').value.trim();
    var ifsc = $('#pmIfsc').value.trim().toUpperCase();
    var m = editingId ? methods.filter(function (x) { return x.id === editingId; })[0] : null;

    if (!holder) return pmError('Enter the account holder name.');
    if (!bank) return pmError('Enter the bank name.');
    if (!m || acc || acc2) {
      if (!/^\d{9,18}$/.test(acc)) return pmError('Account number must be 9 to 18 digits.');
      if (acc !== acc2) return pmError('Account numbers do not match.');
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return pmError('Enter a valid IFSC code, for example HDFC0001234.');

    var last4 = acc ? acc.slice(-4) : m.last4;
    if (m) {
      m.holder = holder; m.bank = bank; m.last4 = last4; m.ifsc = ifsc; m.type = acctType;
      m.verified = false; // changed details go back through verification
      toast('Saved. Verification may take 1–2 business days');
    } else {
      methods.push({ id: nextId++, bank: bank, holder: holder, last4: last4, ifsc: ifsc, type: acctType, verified: false, primary: !methods.length });
      toast('Payout method added. Verification may take 1–2 business days');
    }
    closeModal('peMethodModal');
    renderMethods();
  });

  $('#peMethodList').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit-method]');
    var rm = e.target.closest('[data-remove-method]');
    var df = e.target.closest('[data-set-default]');
    if (ed) openMethodForm(Number(ed.getAttribute('data-edit-method')));
    if (rm) {
      removingId = Number(rm.getAttribute('data-remove-method'));
      var m = methods.filter(function (x) { return x.id === removingId; })[0];
      $('#rmText').textContent = m.bank + ' •••• ' + m.last4 + ' will be removed from your payout destinations.' + (m.primary && methods.length > 1 ? ' The next account will become the default.' : '');
      openModal('peRemoveModal');
    }
    if (df) {
      var id = Number(df.getAttribute('data-set-default'));
      methods.forEach(function (x) { x.primary = x.id === id; });
      renderMethods();
      toast('Default payout method changed');
    }
  });
  $('#rmConfirm').addEventListener('click', function () {
    var wasPrimary = methods.filter(function (x) { return x.id === removingId; })[0].primary;
    methods = methods.filter(function (x) { return x.id !== removingId; });
    if (wasPrimary && methods.length) methods[0].primary = true;
    closeModal('peRemoveModal');
    renderMethods();
    toast('Payment method removed');
  });

  /* ================= init ================= */
  renderTrend();
  renderMeds();
  renderDonut('peCat', [
    { name: 'Medical Devices', pct: 40, color: '#2f80ed' },
    { name: 'Prescription Medicines', pct: 30, color: '#8b3dff' },
    { name: 'Health & Wellness', pct: 18, color: '#16a34a' },
    { name: 'Personal Care', pct: 12, color: '#f97316' }
  ], '₹3.48L', 'Total Revenue');
  renderDonut('peOrderStatus', [
    { name: 'Delivered', pct: 68, color: '#2f80ed' },
    { name: 'Pending', pct: 18, color: '#f59e0b' },
    { name: 'Cancelled', pct: 14, color: '#16a34a' }
  ], '1,240', 'Total Orders');
  renderDonut('pePayStatus', [
    { name: 'Online Payment', pct: 65, color: '#2f80ed' },
    { name: 'COD', pct: 35, color: '#8b3dff' }
  ], '₹2.46L', 'Total Received');
  renderBars($('#peHistory'), {
    labels: ['Jun', 'Jul', 'Aug', 'Sep'],
    subs: ['₹1.48L', '₹1.70L', '₹1.9L', '₹1.62L'],
    values: [148000, 170000, 190000, 162000],
    bw: 44, h: 240, aria: 'Payment history'
  });
  renderTables();
  renderMethods();
})();