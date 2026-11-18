 (function () {
  'use strict';

  /* ---------- helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (v) { return '₹' + Number(v).toLocaleString('en-IN'); };
  var root = $('#earningsPage');
  if (!root) return;

  var toastTimer;
  function toast(msg) {
    var t = $('#erToast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 2400);
  }
  function openModal(id) { var m = $('#' + id); m.classList.remove('hidden'); m.classList.add('flex'); }
  function closeModal(id) { var m = $('#' + id); m.classList.add('hidden'); m.classList.remove('flex'); }

  var TAB_ON = ['text-shazam-blue', 'border-shazam-blue', 'font-medium'];
  var TAB_OFF = ['text-slate-600', 'border-transparent', 'font-normal'];
  function setActive(btns, active, on, off) {
    btns.forEach(function (b) {
      var isOn = b === active;
      on.forEach(function (c) { b.classList.toggle(c, isOn); });
      off.forEach(function (c) { b.classList.toggle(c, !isOn); });
    });
  }

  var STATUS_CLS = {
    Settled: 'bg-green-50 text-kyc-green border-green-200',
    Paid: 'bg-green-50 text-kyc-green border-green-200',
    Available: 'bg-green-50 text-kyc-green border-green-200',
    Processing: 'bg-yellow-50 text-yellow-600 border-yellow-300',
    Failed: 'bg-red-50 text-red-500 border-red-200',
    Reversed: 'bg-red-50 text-red-500 border-red-200'
  };
  function badge(s) {
    return '<span class="inline-block text-[12px] px-2.5 py-0.5 rounded-full border whitespace-nowrap ' + (STATUS_CLS[s] || 'bg-slate-50 text-slate-600 border-slate-200') + '">' + s + '</span>';
  }
  var EYE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>';
  var DL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>';

  /* ---------- modal wiring ---------- */
  $$('[data-modal]').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(m.id); });
  });
  $$('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { closeModal(b.getAttribute('data-close')); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('[data-modal]').forEach(function (m) { closeModal(m.id); });
  });

  /* ---------- main tabs ---------- */
  var tabs = $$('.er-tab');
  function showTab(name) {
    setActive(tabs, tabs.filter(function (t) { return t.getAttribute('data-tab') === name; })[0], TAB_ON, TAB_OFF);
    $$('[data-pane]').forEach(function (p) { p.classList.toggle('hidden', p.id !== 'er-' + name); });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { showTab(t.getAttribute('data-tab')); }); });
  $('#erViewAll').addEventListener('click', function () { showTab('transactions'); });

  /* ---------- invoice sub tabs ---------- */
  var subs = $$('.er-sub');
  subs.forEach(function (s) {
    s.addEventListener('click', function () {
      setActive(subs, s, TAB_ON, TAB_OFF);
      var name = s.getAttribute('data-sub');
      $$('[data-subpane]').forEach(function (p) { p.classList.toggle('hidden', p.id !== 'er-sub-' + name); });
    });
  });

  /* ---------- header: date range / presets ---------- */
  var PRESETS = {
    today: 'Jul 22, 2025',
    '7d': 'Jul 16 - Jul 22, 2025',
    '30d': 'Jun 23 - Jul 22, 2025',
    '3m': 'Apr 23 - Jul 22, 2025'
  };
  var PRESET_ON = ['bg-white', 'text-shazam-blue', 'border-shazam-blue', 'font-medium'];
  var PRESET_OFF = ['bg-slate-50', 'text-slate-600', 'border-slate-200'];
  var presets = $$('.er-preset');
  function setPreset(btn) {
    presets.forEach(function (b) {
      var on = b === btn;
      PRESET_ON.forEach(function (c) { b.classList.toggle(c, on); });
      PRESET_OFF.forEach(function (c) { b.classList.toggle(c, !on); });
    });
  }
  function setPeriod(label) {
    $('#erDateLabel').textContent = label;
    $('#stPeriod').textContent = label;
  }
  presets.forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-preset');
      setPreset(b);
      if (key === 'custom') { $('#erDatePop').classList.remove('hidden'); return; }
      $('#erDatePop').classList.add('hidden');
      setPeriod(PRESETS[key]);
    });
  });
  $('#erDateBtn').addEventListener('click', function () { $('#erDatePop').classList.toggle('hidden'); });
  $('#erDateCancel').addEventListener('click', function () { $('#erDatePop').classList.add('hidden'); });
  $('#erDateApply').addEventListener('click', function () {
    var f = $('#erFrom').value, t = $('#erTo').value;
    if (!f || !t) { toast('Select both dates'); return; }
    if (f > t) { toast('From date cannot be after To date'); return; }
    setPeriod(f + ' to ' + t);
    $('#erDatePop').classList.add('hidden');
  });
  setPreset(presets[2]);
  setPeriod('Jul 1 - Jul 22, 2025');

  /* ---------- statement / export popups ---------- */
  function openStatement() { openModal('m-statement'); }
  function openExport() {
    $$('#exList input').forEach(function (c) { c.checked = false; });
    $('#exError').classList.add('hidden');
    openModal('m-export');
  }
  $('#erStatementBtn').addEventListener('click', openStatement);
  $('#erChartDoc').addEventListener('click', openStatement);
  $('#erExportBtn').addEventListener('click', openExport);
  $('#erChartDl').addEventListener('click', openExport);
  $('#erGenStatement').addEventListener('click', openStatement);
  $('#stDownload').addEventListener('click', function () {
    closeModal('m-statement');
    toast('Statement downloaded');
  });
  $('#exGenerate').addEventListener('click', function () {
    var picked = $$('#exList input:checked').map(function (c) { return c.value; });
    if (!picked.length) { $('#exError').classList.remove('hidden'); return; }
    closeModal('m-export');
    toast('Export generated: ' + picked.join(', '));
  });

  /* ---------- earnings trend chart ---------- */
  var DAILY = [6000, 6200, 5800, 6400, 6900, 5900, 6300, 7200, 6100, 6500, 5700, 6000, 6600, 5900, 6300, 7000, 6200, 5800, 6100, 6400, 5700, 4000];
  function sum(a, from, to) { return a.slice(from, to).reduce(function (x, y) { return x + y; }, 0); }
  function series(gross, labels) {
    var comm = gross.map(function (g) { return Math.round(g * 0.08); });
    var net = gross.map(function (g, i) { return g - comm[i]; });
    return { labels: labels, gross: gross, comm: comm, net: net };
  }
  var TREND = {
    daily: series(DAILY, DAILY.map(function (_, i) { return 'Jul ' + (i + 1); })),
    weekly: series(
      [sum(DAILY, 0, 7), sum(DAILY, 7, 14), sum(DAILY, 14, 21), sum(DAILY, 21, 22)],
      ['Jul 1-7', 'Jul 8-14', 'Jul 15-21', 'Jul 22']
    ),
    monthly: series(
      [112000, 98000, 121000, 128000, 119000, 131000, 135000],
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    )
  };
  var UNIT = { daily: '/day', weekly: '/week', monthly: '/month' };

  function niceMax(m) {
    var mag = Math.pow(10, Math.floor(Math.log10(m)));
    var steps = [1, 1.2, 1.4, 1.6, 2, 3, 4, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) { if (steps[i] * mag >= m) return steps[i] * mag; }
    return 10 * mag;
  }
  function tick(v) { return v === 0 ? '₹0' : '₹' + (v >= 1000 ? Math.round(v / 100) / 10 + 'k' : v); }

  function renderChart(range) {
    var d = TREND[range];
    var W = 640, H = 260, pl = 46, pr = 12, pt = 12, pb = 28;
    var n = d.gross.length;
    var max = niceMax(Math.max.apply(null, d.gross));
    var x = function (i) { return pl + (n === 1 ? 0 : i * (W - pl - pr) / (n - 1)); };
    var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
    var line = function (arr) {
      return arr.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    };
    var band = 'M' + d.gross.map(function (v, i) { return x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' L') +
      ' L' + d.net.map(function (v, i) { return x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).reverse().join(' L') + ' Z';

    var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="w-full h-auto" role="img" aria-label="Earnings trend">';
    [0, 0.5, 1].forEach(function (f) {
      var v = max * f, yy = y(v).toFixed(1);
      out += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '" class="stroke-slate-200" stroke-dasharray="3 4" />';
      out += '<text x="' + (pl - 8) + '" y="' + (Number(yy) + 3) + '" text-anchor="end" class="fill-slate-400 text-[12px]">' + tick(v) + '</text>';
    });
    var every = n > 12 ? 4 : 1;
    d.labels.forEach(function (l, i) {
      if (i % every === 0) out += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" class="fill-slate-400 text-[12px]">' + l + '</text>';
    });
    out += '<path d="' + band + '" class="fill-yellow-200/60 stroke-none" />';
    out += '<path d="' + line(d.comm) + '" class="fill-none stroke-fuchsia-pink stroke-2 [stroke-linejoin:round]" />';
    out += '<path d="' + line(d.net) + '" class="fill-none stroke-kyc-green stroke-2 [stroke-linejoin:round]" />';
    out += '<path d="' + line(d.gross) + '" class="fill-none stroke-facebook-blue stroke-2 [stroke-linejoin:round]" />';
    d.gross.forEach(function (v, i) {
      out += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="5" class="fill-transparent hover:fill-facebook-blue"><title>' +
        d.labels[i] + ' | Gross ' + fmt(v) + ' | Commission ' + fmt(d.comm[i]) + ' | Net ' + fmt(d.net[i]) + '</title></circle>';
    });
    out += '</svg>';
    $('#erChart').innerHTML = out;

    var hi = d.gross.indexOf(Math.max.apply(null, d.gross));
    var lo = d.gross.indexOf(Math.min.apply(null, d.gross));
    var avg = Math.round(sum(d.gross, 0, n) / n);
    $('#erHigh').textContent = 'Highest: ' + d.labels[hi] + ' ' + fmt(d.gross[hi]);
    $('#erLow').textContent = 'Lowest: ' + d.labels[lo] + ' ' + fmt(d.gross[lo]);
    $('#erAvg').textContent = 'Avg: ' + fmt(avg) + UNIT[range];
  }
  var ranges = $$('.er-range');
  ranges.forEach(function (b) {
    b.addEventListener('click', function () {
      ranges.forEach(function (r) {
        var on = r === b;
        ['bg-white', 'text-shazam-blue', 'shadow-sm', 'font-medium'].forEach(function (c) { r.classList.toggle(c, on); });
        r.classList.toggle('text-slate-600', !on);
      });
      renderChart(b.getAttribute('data-range'));
    });
  });
  renderChart('daily');

  /* ---------- transactions data ---------- */
  var TXNS = [
    { id: 'TXN-001', dt: '1 Jul 9:00 AM', ref: 'SETT-0701-01', type: 'Order Settlement', desc: 'Home Delivery Batch', cr: 6000, db: 0, bal: 6000, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-002', dt: '1 Jul 9:00 AM', ref: 'SETT-0701-01', type: 'Platform Commission', desc: '8% on ₹6,000', cr: 0, db: 480, bal: 5520, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-003', dt: '3 Jul 10:00 AM', ref: 'SETT-0703-01', type: 'Order Settlement', desc: 'Home Delivery', cr: 6200, db: 0, bal: 11720, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-004', dt: '3 Jul 10:00 AM', ref: 'COM-0703-01', type: 'Platform Commission', desc: '8% on ₹6,200', cr: 0, db: 496, bal: 11224, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-005', dt: '5 Jul 10:00 AM', ref: 'SETT-0705-01', type: 'Order Settlement', desc: 'Stock Pickup Batch', cr: 6500, db: 0, bal: 17724, st: 'Settled', ful: 'Stock Pick Up' },
    { id: 'TXN-006', dt: '5 Jul 10:00 AM', ref: 'COM-0705-01', type: 'Platform Commission', desc: '8% on ₹6,500', cr: 0, db: 520, bal: 17204, st: 'Settled', ful: 'Stock Pick Up' },
    { id: 'TXN-007', dt: '6 Jul 10:00 AM', ref: 'PAY-2400', type: 'Payout Requested', desc: 'HDFC •••• 4521', cr: 0, db: 8200, bal: 9004, st: 'Failed', ful: 'Bank transfer' },
    { id: 'TXN-008', dt: '7 Jul 10:00 AM', ref: 'REV-PAY-2400', type: 'Payout Reversed', desc: 'Failed reversal PAY-2400', cr: 8200, db: 0, bal: 17204, st: 'Reversed', ful: 'Bank transfer' },
    { id: 'TXN-009', dt: '9 Jul 9:00 AM', ref: 'SETT-0709-01', type: 'Order Settlement', desc: 'Batch', cr: 6500, db: 0, bal: 23704, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-010', dt: '9 Jul 9:00 AM', ref: 'COM-0709-01', type: 'Platform Commission', desc: '8% on ₹6,500', cr: 0, db: 520, bal: 23184, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-011', dt: '12 Jul 9:00 AM', ref: 'SETT-0712-01', type: 'Order Settlement', desc: 'Batch', cr: 6300, db: 0, bal: 29484, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-012', dt: '12 Jul 9:00 AM', ref: 'COM-0712-01', type: 'Platform Commission', desc: '8% on ₹6,300', cr: 0, db: 504, bal: 28980, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-013', dt: '12 Jul 9:00 AM', ref: 'PAY-2399', type: 'Payout Requested', desc: 'HDFC •••• 4521', cr: 0, db: 12000, bal: 16980, st: 'Settled', ful: 'Bank transfer' },
    { id: 'TXN-014', dt: '20 Jul 2:30 PM', ref: 'REF-ORD-3287', type: 'Refund Adjustment', desc: 'Customer refund', cr: 0, db: 420, bal: 16560, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-015', dt: '22 Jul 9:00 AM', ref: 'SETT-0722-05', type: 'Order Settlement', desc: 'Home Delivery Batch', cr: 4200, db: 0, bal: 20760, st: 'Settled', ful: 'Home Delivery' },
    { id: 'TXN-016', dt: '22 Jul 9:00 AM', ref: 'COM-0722-05', type: 'Platform Commission', desc: '8% on ₹4,200', cr: 0, db: 336, bal: 20424, st: 'Settled', ful: 'Home Delivery' }
  ];
  var TYPE_GROUP = {
    all: null,
    earnings: ['Order Settlement'],
    commissions: ['Platform Commission'],
    refunds: ['Refund Adjustment', 'Payout Reversed']
  };
  var txType = 'all';

  function renderTxns() {
    var q = $('#erTxnSearch').value.trim().toLowerCase();
    var st = $('#erTxnStatus').value;
    var group = TYPE_GROUP[txType];
    var rows = TXNS.filter(function (t) {
      if (group && group.indexOf(t.type) < 0) return false;
      if (st && t.st !== st) return false;
      if (q && (t.id + t.ref + t.type + t.desc).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    $('#erTxnRows').innerHTML = rows.length ? rows.map(function (t) {
      return '<tr class="border-b border-slate-100">' +
        '<td class="px-4 py-3.5 text-slate-700">' + t.dt + '</td>' +
        '<td><button type="button" data-txn="' + t.id + '" class="text-shazam-blue font-medium hover:underline">' + t.id + '</button></td>' +
        '<td class="text-slate-600">' + t.ref + '</td>' +
        '<td class="text-slate-700 px-2">' + t.type + '</td>' +
        '<td class="text-slate-600 px-2">' + t.desc + '</td>' +
        '<td class="text-kyc-green font-medium">' + (t.cr ? '+' + fmt(t.cr) : '—') + '</td>' +
        '<td class="text-red-500 font-medium">' + (t.db ? '-' + fmt(t.db) : '—') + '</td>' +
        '<td class="text-dark-inky-blue font-medium">' + fmt(t.bal) + '</td>' +
        '<td>' + badge(t.st) + '</td>' +
        '<td><button type="button" data-txn="' + t.id + '" class="text-shazam-blue" title="View">' + EYE + '</button></td></tr>';
    }).join('') : '<tr><td colspan="10" class="px-4 py-10 text-slate-400 text-[15px]">No transactions found</td></tr>';
    $('#erTxnCount').textContent = 'Showing ' + rows.length + ' of ' + TXNS.length + ' transactions';
  }
  var txTypeBtns = $$('.er-txtype');
  txTypeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      txType = b.getAttribute('data-txtype');
      setActive(txTypeBtns, b, TAB_ON, TAB_OFF);
      renderTxns();
    });
  });
  $('#erTxnSearch').addEventListener('input', renderTxns);
  $('#erTxnStatus').addEventListener('change', renderTxns);
  renderTxns();

  /* recent ledger on overview */
  function renderRecent() {
    var ids = ['TXN-015', 'TXN-016', 'TXN-014'];
    var names = { 'TXN-015': 'Order Settlement', 'TXN-016': 'Platform Commission', 'TXN-014': 'Refund Adjustment' };
    $('#erRecent').innerHTML = ids.map(function (id) {
      var t = TXNS.filter(function (x) { return x.id === id; })[0];
      var amt = t.cr ? '<span class="text-kyc-green font-semibold">+' + fmt(t.cr) + '</span>' : '<span class="text-red-500 font-semibold">-' + fmt(t.db) + '</span>';
      return '<li><button type="button" data-txn="' + id + '" class="w-full flex items-center gap-3 py-3 text-left">' +
        '<span class="w-5 h-5 rounded-full border-2 border-kyc-green text-kyc-green flex items-center justify-center shrink-0"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-10" /></svg></span>' +
        '<span class="flex-1 leading-tight"><span class="block text-[15px] font-semibold text-dark-inky-blue">' + names[id] + '</span><span class="block text-[13px] text-grayish-blue-slate">' + t.dt + ' ' + t.ref + '</span></span>' +
        amt + '<span class="text-[12px] px-2 py-0.5 rounded-md border bg-green-50 text-kyc-green border-green-200">Settled</span>' +
        '<svg class="text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg></button></li>';
    }).join('');
  }
  renderRecent();

  /* ---------- transaction popup ---------- */
  var ACTIVITY = {
    'Order Settlement': [['Receive Stock', 'Order delivered / stock received'], ['Cleared', 'Demo settlement cleared']],
    'Platform Commission': [['Commission calculated', '8% of gross eligible sale'], ['Deducted', 'Deducted from settlement']],
    'Payout Requested': [['Payout requested', 'Sent to linked bank account'], ['Bank processing', 'Awaiting bank confirmation']],
    'Payout Reversed': [['Payout failed', 'Bank rejected the transfer'], ['Reversed', 'Amount returned to available balance']],
    'Refund Adjustment': [['Refund raised', 'Customer refund approved'], ['Adjusted', 'Adjusted against earnings']]
  };
  var txTabBtns = $$('.tx-tab');
  function showTxTab(name) {
    setActive(txTabBtns, txTabBtns.filter(function (b) { return b.getAttribute('data-txtab') === name; })[0], TAB_ON, TAB_OFF);
    $$('[data-txpane]').forEach(function (p) { p.classList.toggle('hidden', p.id !== 'tx-pane-' + name); });
  }
  txTabBtns.forEach(function (b) { b.addEventListener('click', function () { showTxTab(b.getAttribute('data-txtab')); }); });

  var currentTxn = null;
  function openTxn(id) {
    var t = TXNS.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    currentTxn = t;
    $('#tx-type').textContent = t.type;
    $('#tx-id').textContent = t.id.replace('-', ' - ');
    $('#tx-status').innerHTML = badge(t.st);
    $('#tx-date').textContent = t.dt;
    $('#tx-ref').textContent = t.ref;
    $('#tx-credit').textContent = fmt(t.cr);
    $('#tx-debit').textContent = fmt(t.db);
    $('#tx-bal').textContent = fmt(t.bal);
    $('#tx-ful').textContent = t.ful;
    $('#tx-l-type').textContent = t.type;
    $('#tx-l-ref').textContent = t.ref;
    $('#tx-l-desc').textContent = t.desc;
    $('#tx-l-bal').textContent = fmt(t.bal);
    $('#tx-note').textContent = t.desc + '  This record is illustrative demo ledger data';
    var steps = (ACTIVITY[t.type] || ACTIVITY['Order Settlement']).slice();
    if (t.st === 'Failed') steps[1] = ['Failed', 'Bank rejected the transfer'];
    if (t.st === 'Processing') steps[1] = ['Processing', 'Awaiting confirmation'];
    var html = steps.map(function (s, i) {
      return '<li class="flex items-start gap-2.5"><span class="w-5 h-5 mt-0.5 rounded-full border-2 border-shazam-blue text-shazam-blue flex items-center justify-center shrink-0"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-10" /></svg></span>' +
        '<span class="leading-tight"><span class="block text-[14px] font-semibold text-shazam-blue">' + s[0] + '</span><span class="block text-[14px] text-slate-600 mt-0.5">' + (i === 0 ? t.dt : s[1]) + '</span></span></li>';
    }).join('');
    $('#txTimeline').innerHTML = html;
    $('#tx-pane-activity').innerHTML = html;
    showTxTab('summary');
    openModal('m-txn');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-txn]');
    if (b) openTxn(b.getAttribute('data-txn'));
  });
  $('#txReceiptBtn').addEventListener('click', function () {
    if (currentTxn) toast('Receipt for ' + currentTxn.id + ' downloaded');
  });

  /* ---------- payout history ---------- */
  var PAYOUTS = [
    { id: 'PAY-2399', date: '12 Jul 2025', bank: 'HDFC •••• 4521', orders: 58, amt: 12000, st: 'Paid' },
    { id: 'PAY-2398', date: '3 Jul 2025', bank: 'HDFC •••• 4521', orders: 74, amt: 18000, st: 'Paid' },
    { id: 'PAY-2400', date: '6 Jul 2025', bank: 'HDFC •••• 4521', orders: 31, amt: 8200, st: 'Failed' }
  ];
  function renderPayouts() {
    var q = $('#erPayoutSearch').value.trim().toLowerCase();
    var st = $('#erPayoutStatus').value;
    var rows = PAYOUTS.filter(function (p) {
      return (!st || p.st === st) && (!q || p.id.toLowerCase().indexOf(q) >= 0);
    });
    $('#erPayoutRows').innerHTML = rows.length ? rows.map(function (p) {
      return '<tr class="border-b border-slate-100"><td class="px-5 py-3.5 text-left text-shazam-blue font-medium">' + p.id + '</td><td>' + p.date + '</td><td>' + p.bank + '</td><td>' + p.orders + '</td><td class="font-medium text-dark-inky-blue">' + fmt(p.amt) + '</td><td>' + badge(p.st) + '</td>' +
        '<td><button type="button" data-pay="' + p.id + '" class="text-shazam-blue" title="Download receipt">' + DL + '</button></td></tr>';
    }).join('') : '<tr><td colspan="7" class="px-4 py-10 text-slate-400 text-[15px]">No payouts found</td></tr>';
    $('#erPayoutCount').textContent = 'Showing ' + rows.length + ' of ' + PAYOUTS.length + ' payouts';
  }
  $('#erPayoutSearch').addEventListener('input', renderPayouts);
  $('#erPayoutStatus').addEventListener('change', renderPayouts);
  $('#erPayoutReset').addEventListener('click', function () {
    $('#erPayoutSearch').value = '';
    $('#erPayoutStatus').value = '';
    renderPayouts();
  });
  renderPayouts();
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pay]');
    if (b) toast('Payout receipt ' + b.getAttribute('data-pay') + ' downloaded');
  });

  /* ---------- commission invoices ---------- */
  var INVOICES = [
    { no: 'INV-2025-07-001', period: '1-22 Jul 2025', issued: '22 Jul 2025', gross: 135000, rate: '8%', comm: 10800, st: 'Available' },
    { no: 'INV-2025-06-001', period: '1-30 Jun 2025', issued: '30 Jun 2025', gross: 152000, rate: '8%', comm: 12160, st: 'Paid' },
    { no: 'INV-2025-05-001', period: '1-31 May 2025', issued: '31 May 2025', gross: 119000, rate: '8%', comm: 9520, st: 'Paid' }
  ];
  function renderInvoices() {
    var q = $('#erInvSearch').value.trim().toLowerCase();
    var st = $('#erInvStatus').value;
    var rows = INVOICES.filter(function (i) {
      return (!st || i.st === st) && (!q || (i.no + i.period).toLowerCase().indexOf(q) >= 0);
    });
    $('#erInvoiceRows').innerHTML = rows.length ? rows.map(function (i) {
      return '<tr class="border-b border-slate-100"><td class="px-4 py-3.5 text-shazam-blue font-medium">' + i.no + '</td><td>' + i.period + '</td><td>' + i.issued + '</td><td class="font-semibold text-dark-inky-blue">' + fmt(i.gross) + '</td><td>' + i.rate + '</td><td>' + fmt(i.comm) + '</td><td>' + badge(i.st) + '</td>' +
        '<td><div class="flex items-center justify-center gap-3"><button type="button" data-inv-preview="' + i.no + '" class="text-[13px] px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Preview</button>' +
        '<button type="button" data-inv-dl="' + i.no + '" class="text-slate-600 hover:text-shazam-blue" title="Download">' + DL + '</button></div></td></tr>';
    }).join('') : '<tr><td colspan="8" class="px-4 py-10 text-slate-400 text-[15px]">No invoices found</td></tr>';
  }
  $('#erInvSearch').addEventListener('input', renderInvoices);
  $('#erInvStatus').addEventListener('change', renderInvoices);
  $('#erInvDateBtn').addEventListener('click', function () { $('#erDateBtn').click(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  renderInvoices();
  document.addEventListener('click', function (e) {
    var p = e.target.closest('[data-inv-preview]');
    if (p) toast('Opening preview of ' + p.getAttribute('data-inv-preview'));
    var d = e.target.closest('[data-inv-dl]');
    if (d) toast('Invoice ' + d.getAttribute('data-inv-dl') + ' downloaded');
  });

  /* ---------- banking destinations ---------- */
  var banks = [{ id: 1, name: 'HDFC Bank.....4251', holder: 'Rakesh Gupta Verified Demo', primary: true }];
  var nextBankId = 2;
  var editingId = null;
  var BOX = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></svg>';

  function renderBanks() {
    $('#bkList').innerHTML = banks.map(function (b) {
      var nameHtml = editingId === b.id
        ? '<input id="bkEditInput" type="text" value="' + b.name.replace(/"/g, '&quot;') + '" class="border border-slate-200 rounded-lg px-3 py-1.5 text-[16px] text-slate-800 bg-white outline-none focus:border-shazam-blue focus:ring-[3px] focus:ring-blue-100 w-full max-w-[240px]" />'
        : '<p class="text-[18px] font-semibold text-dark-inky-blue">' + b.name + '</p>';
      var canRemove = !b.primary;
      return '<li class="rounded-xl border border-slate-200 bg-white p-4"><div class="flex flex-wrap items-center gap-3">' +
        '<span class="w-10 h-10 rounded-lg border border-shazam-blue text-shazam-blue flex items-center justify-center shrink-0">' + BOX + '</span>' +
        '<div class="flex-1 min-w-[160px] leading-tight">' + nameHtml + '<p class="text-[14px] text-grayish-blue-slate mt-1">' + b.holder + '</p></div>' +
        (b.primary ? '<span class="text-[12px] px-2.5 py-0.5 rounded-md border border-kyc-green text-kyc-green bg-green-50">Primary</span>'
          : '<button type="button" data-bk-primary="' + b.id + '" class="text-[13px] px-3 py-1 rounded-md border border-shazam-blue text-shazam-blue hover:bg-blue-50">Set Primary</button>') +
        '<button type="button" data-bk-edit="' + b.id + '" class="text-[14px] font-medium px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">' + (editingId === b.id ? 'Save Name' : 'Edit Display Name') + '</button>' +
        '<button type="button" data-bk-remove="' + b.id + '" ' + (canRemove ? '' : 'disabled ') + 'class="text-[14px] font-medium px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 ' + (canRemove ? 'hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'opacity-50 cursor-not-allowed') + '">Remove</button>' +
        '</div></li>';
    }).join('');
  }
  $('#erBankBtn').addEventListener('click', function () { editingId = null; renderBanks(); openModal('m-bank'); });
  $('#bkList').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-bk-edit]');
    var rm = e.target.closest('[data-bk-remove]');
    var pr = e.target.closest('[data-bk-primary]');
    if (ed) {
      var id = Number(ed.getAttribute('data-bk-edit'));
      if (editingId === id) {
        var v = $('#bkEditInput').value.trim();
        if (v) banks.filter(function (b) { return b.id === id; })[0].name = v;
        editingId = null;
        toast('Display name updated');
      } else { editingId = id; }
      renderBanks();
      if (editingId) $('#bkEditInput').focus();
    }
    if (rm && !rm.disabled) {
      var rid = Number(rm.getAttribute('data-bk-remove'));
      banks = banks.filter(function (b) { return b.id !== rid; });
      renderBanks();
      toast('Destination removed');
    }
    if (pr) {
      var pid = Number(pr.getAttribute('data-bk-primary'));
      banks.forEach(function (b) { b.primary = b.id === pid; });
      renderBanks();
      toast('Primary destination changed');
    }
  });
  $('#bkAdd').addEventListener('click', function () { $('#bkForm').classList.remove('hidden'); $('#bkName').focus(); });
  $('#bkCancelAdd').addEventListener('click', function () {
    $('#bkForm').classList.add('hidden');
    $('#bkError').classList.add('hidden');
  });
  $('#bkSaveAdd').addEventListener('click', function () {
    var name = $('#bkName').value.trim();
    var last4 = $('#bkLast4').value.trim();
    if (!name || !/^\d{4}$/.test(last4)) { $('#bkError').classList.remove('hidden'); return; }
    banks.push({ id: nextBankId++, name: name + '.....' + last4, holder: 'Rakesh Gupta Verified Demo', primary: false });
    $('#bkName').value = '';
    $('#bkLast4').value = '';
    $('#bkError').classList.add('hidden');
    $('#bkForm').classList.add('hidden');
    renderBanks();
    toast('Destination added');
  });
})();