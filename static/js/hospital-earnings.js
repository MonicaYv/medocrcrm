(function () {
  'use strict';

  var page = document.getElementById('earningsPage');
  if (!page) return;

  var BLUE = '#1f6feb', GREEN = '#10b981';

  /* ---------- Data (replace with API response / Django context) ---------- */
  var data = {
    trend: { labels: ['23 Sep', '24 Sep', '25 Sep', '26 Sep', '27 Sep', '28 Sep', '29 Sep'], values: [42000, 46000, 50000, 52000, 54000, 50000, 48000] },
    line: { labels: ['Jun', 'Jul', 'Aug', 'Sep'], revenue: [1.1, 1.2, 1.35, 1.5], payments: [0.95, 1.1, 1.2, 1.3] },
    topServices: [
      { name: 'General Medicine', value: 92000, label: '₹92K' },
      { name: 'Orthopaedic', value: 74000, label: '₹74K' },
      { name: 'Wound Dressing', value: 50000, label: '₹50K' },
      { name: 'Day-care Services', value: 36000, label: '₹36K' },
      { name: 'Others', value: 24000, label: '₹24K' }
    ],
    categories: [
      { name: 'General Medicine', pct: 34, color: '#2563eb' },
      { name: 'Orthopaedic', pct: 26, color: '#7c3aed' },
      { name: 'Wound Dressing', pct: 17, color: '#10b981' },
      { name: 'Day-care Services', pct: 13, color: '#f59e0b' },
      { name: 'Others', pct: 10, color: '#c4b5fd' }
    ],
    status: [
      { name: 'Cleared', amount: '₹1,82,400', pct: 74, color: '#10b981' },
      { name: 'Pending Clearance', amount: '₹12,600', pct: 5, color: '#f59e0b' },
      { name: 'Processing', amount: '₹51,800', pct: 21, color: '#2563eb' }
    ],
    history: { labels: ['Sep 08', 'Sep 15', 'Sep 22', 'Sep 29'], values: [38000, 44000, 62000, 50000] },
    // amount: number (negative for refunds). ts: ISO datetime.
    transactions: [
      { id: 'TXN-29091', ts: '2026-09-29T10:32', desc: 'General Medicine OPD service earnings', service: 'General Medicine OPD', patient: 'Rohan Mehta', amount: 8400, status: 'Cleared', type: 'Earnings', booking: 'BK-HSP-2393' },
      { id: 'TXN-25689', ts: '2026-09-28T11:10', desc: 'General Medicine OPD service earnings', service: 'General Medicine OPD', patient: 'Anita Rao', amount: 5400, status: 'Cleared', type: 'Earnings', booking: 'BK-HSP-2391' },
      { id: 'TXN-29087', ts: '2026-09-28T09:45', desc: 'Wound Dressing service earnings', service: 'Wound Dressing', patient: 'Suresh Patil', amount: 3000, status: 'Pending clearance', type: 'Earnings', booking: 'BK-HSP-2388' },
      { id: 'TXN-29074', ts: '2026-09-28T08:20', desc: 'Day-care Service earnings', service: 'Day-care Service', patient: 'Meera Joshi', amount: 7000, status: 'Pending clearance', type: 'Earnings', booking: 'BK-HSP-2386' },
      { id: 'TXN-27650', ts: '2026-09-27T16:05', desc: 'Orthopaedic OPD earnings', service: 'Orthopaedic OPD', patient: 'Vikram Shah', amount: 6200, status: 'Cleared', type: 'Earnings', booking: 'BK-HSP-2380' },
      { id: 'TXN-27662', ts: '2026-09-27T13:40', desc: 'Planned Admission earnings', service: 'Planned Admission', patient: 'Kavita Nair', amount: 12000, status: 'Processing', type: 'Earnings', booking: 'BK-HSP-2377' },
      { id: 'TXN-27541', ts: '2026-09-27T11:15', desc: 'Wound Dressing earnings', service: 'Wound Dressing', patient: 'Imran Khan', amount: 2500, status: 'Failed', type: 'Earnings', booking: 'BK-HSP-2371' },
      { id: 'TXN-27498', ts: '2026-09-26T15:30', desc: 'General Medicine OPD refund', service: 'General Medicine OPD', patient: 'Pooja Desai', amount: -1800, status: 'Refund', type: 'Refund', booking: 'BK-HSP-2362' },
      { id: 'TXN-27310', ts: '2026-09-25T12:00', desc: 'Day-care Service earnings', service: 'Day-care Service', patient: 'Rahul Verma', amount: 4500, status: 'Cancelled', type: 'Earnings', booking: 'BK-HSP-2350' },
      { id: 'TXN-26120', ts: '2026-09-12T10:10', desc: 'Orthopaedic OPD earnings', service: 'Orthopaedic OPD', patient: 'Neha Kulkarni', amount: 9000, status: 'Cleared', type: 'Earnings', booking: 'BK-HSP-2290' },
      { id: 'TXN-25110', ts: '2026-08-28T14:25', desc: 'General Medicine OPD service earnings', service: 'General Medicine OPD', patient: 'Arjun Singh', amount: 7600, status: 'Cleared', type: 'Earnings', booking: 'BK-HSP-2201' }
    ],
    // Real app: return only the last 4 digits, never the full account number.
    methods: [
      { id: 1, bank: 'HDFC Bank', holder: 'Lifecare Multispecialty Hospital', number: '50100234564821', ifsc: 'HDFC0001234', type: 'Savings', status: 'Verified', isDefault: true }
    ]
  };
  data.transactions.forEach(function (t) { t.date = new Date(t.ts); });

  /* ---------- Helpers ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var inr = function (v) { return '₹' + Number(v).toLocaleString('en-IN'); };
  var short = function (v) { return v >= 1000 ? '₹' + (v / 1000) + 'K' : '₹' + v; };
  var signed = function (n) { return (n < 0 ? '−' : '+') + inr(Math.abs(n)); };
  var fmtDate = function (d) { return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
  var fmtTime = function (d) { return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // Modals use "hidden" / "flex" utility classes.
  function openEl(el) { el.classList.remove('hidden'); el.classList.add('flex'); el.setAttribute('aria-hidden', 'false'); }
  function closeEl(el) { el.classList.add('hidden'); el.classList.remove('flex'); el.setAttribute('aria-hidden', 'true'); }
  // Swap two class sets on an element.
  function swap(el, on, onCls, offCls) {
    el.classList.remove.apply(el.classList, (on ? offCls : onCls).split(' '));
    el.classList.add.apply(el.classList, (on ? onCls : offCls).split(' '));
  }

  var PILL = {
    'Cleared': 'bg-emerald-50 text-emerald-600', 'Pending clearance': 'bg-amber-50 text-amber-700',
    'Processing': 'bg-blue-50 text-brand', 'Failed': 'bg-red-50 text-red-600',
    'Refund': 'bg-violet-50 text-violet-600', 'Cancelled': 'bg-gray-100 text-gray-600'
  };
  var pill = function (s) { return '<span class="px-2 py-0.5 rounded-md text-s10 font-medium whitespace-nowrap ' + (PILL[s] || '') + '">' + esc(s) + '</span>'; };
  var amtCls = function (n) { return 'e-td font-semibold ' + (n < 0 ? 'text-red-600' : 'text-emerald-600'); };

  /* ---------- Charts ---------- */
  Chart.defaults.color = '#6b7280';
  var charts = {};

  // Same formula as --u in style.css (1px scaled by screen width), so chart text grows with the page.
  function unit() { return Math.min(1.7, Math.max(1.05, 0.00048 * window.innerWidth + 0.38)); }

  function barChart(id, labels, values) {
    return new Chart($(id), {
      type: 'bar',
      data: { labels: labels, datasets: [{ data: values, backgroundColor: BLUE, borderRadius: 3, barPercentage: 0.55 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return inr(c.parsed.y); } } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: short }, grid: { color: '#eef1f5' }, border: { display: false } } }
      }
    });
  }

  function donut(id, items) {
    return new Chart($(id), {
      type: 'doughnut',
      data: { labels: items.map(function (i) { return i.name; }), datasets: [{ data: items.map(function (i) { return i.pct; }), backgroundColor: items.map(function (i) { return i.color; }), borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.label + ': ' + c.parsed + '%'; } } } } }
    });
  }

  function renderCharts() {
    Chart.defaults.font.size = Math.round(10 * unit() * 10) / 10;
    Object.keys(charts).forEach(function (k) { charts[k].destroy(); });
    charts.trend = barChart('trendChart', data.trend.labels, data.trend.values);
    charts.history = barChart('historyChart', data.history.labels, data.history.values);
    charts.line = new Chart($('lineChart'), {
      type: 'line',
      data: {
        labels: data.line.labels,
        datasets: [
          { label: 'Revenue', data: data.line.revenue, borderColor: BLUE, backgroundColor: BLUE, tension: 0.35, pointRadius: 3 },
          { label: 'Customer Payments', data: data.line.payments, borderColor: GREEN, backgroundColor: GREEN, tension: 0.35, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ₹' + c.parsed.y + 'L'; } } } },
        scales: { x: { grid: { display: false } }, y: { ticks: { callback: function (v) { return '₹' + v + 'L'; } }, grid: { color: '#eef1f5' }, border: { display: false } } }
      }
    });
    charts.category = donut('categoryChart', data.categories);
    charts.status = donut('statusChart', data.status);
  }

  function renderTopServices() {
    var max = Math.max.apply(null, data.topServices.map(function (s) { return s.value; }));
    $('topServices').innerHTML = data.topServices.map(function (s) {
      return '<div class="grid grid-cols-[calc(var(--u)*100)_1fr_calc(var(--u)*54)] gap-2.5 items-center text-s115"><span>' + esc(s.name) + '</span>' +
        '<div class="h-3 bg-slate-100 rounded overflow-hidden"><div class="h-full bg-brand rounded" style="width:' + (s.value / max * 100) + '%"></div></div>' +
        '<em class="not-italic text-right font-medium">' + s.label + '</em></div>';
    }).join('');
  }

  function renderLegends() {
    $('categoryLegend').innerHTML = data.categories.map(function (c) {
      return '<div class="flex items-center justify-between gap-2"><span class="flex items-center gap-2"><i class="w-2 h-2 rounded-full inline-block" style="background:' + c.color + '"></i>' + esc(c.name) + '</span><b>' + c.pct + '%</b></div>';
    }).join('');
    $('statusLegend').innerHTML = data.status.map(function (s) {
      return '<div class="flex items-center gap-2"><i class="w-2 h-2 rounded-full inline-block shrink-0" style="background:' + s.color + '"></i><span>' + esc(s.name) + '<small class="block text-s10 text-gray-500">' + s.amount + ' · ' + s.pct + '%</small></span></div>';
    }).join('');
  }

  /* ---------- Tabs ---------- */
  var TAB_ON = 'text-brand border-brand font-medium', TAB_OFF = 'text-gray-500 border-transparent';
  function showTab(name) {
    document.querySelectorAll('#earningsPage .etab').forEach(function (t) { swap(t, t.dataset.tab === name, TAB_ON, TAB_OFF); });
    document.querySelectorAll('#earningsPage .pane').forEach(function (p) { p.classList.toggle('hidden', p.id !== 'pane-' + name); });
    if (name === 'overview') renderCharts();
  }
  document.querySelectorAll('#earningsPage .etab').forEach(function (tab) {
    tab.addEventListener('click', function () { showTab(tab.dataset.tab); });
  });
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-goto]');
    if (go) showTab(go.dataset.goto);
  });

  /* ---------- Transaction rows ---------- */
  function actionBtn(id) { return '<button type="button" class="e-link" data-tx="' + esc(id) + '">View details</button>'; }

  function renderRecent() {
    var rows = data.transactions.slice().sort(function (a, b) { return b.date - a.date; }).slice(0, 4);
    $('txBody').innerHTML = rows.map(function (t) {
      return '<tr><td class="e-td">' + fmtDate(t.date) + '</td><td class="e-td">' + esc(t.desc) + '</td><td class="e-td">' + esc(t.id) + '</td>' +
        '<td class="' + amtCls(t.amount) + '">' + signed(t.amount) + '</td><td class="e-td">' + pill(t.status) + '</td><td class="e-td">' + actionBtn(t.id) + '</td></tr>';
    }).join('');
  }

  /* ---------- Transactions tab: search, filters, sort ---------- */
  var filters = { q: '', range: 'all', status: 'all', service: 'all', sort: 'newest' };
  var resetters = [];

  function filteredTx() {
    var ref = Math.max.apply(null, data.transactions.map(function (t) { return t.date.getTime(); }));
    var days = filters.range === 'all' ? null : Number(filters.range);
    return data.transactions.filter(function (t) {
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      if (filters.service !== 'all' && t.service !== filters.service) return false;
      if (days && t.date.getTime() < ref - days * 864e5) return false;
      if (filters.q && [t.id, t.desc, t.service, t.booking, t.patient].join(' ').toLowerCase().indexOf(filters.q) < 0) return false;
      return true;
    }).sort(function (a, b) { return filters.sort === 'newest' ? b.date - a.date : a.date - b.date; });
  }

  function renderTx() {
    var rows = filteredTx();
    $('txFullBody').innerHTML = rows.map(function (t) {
      return '<tr><td class="e-td">' + fmtDate(t.date) + '</td><td class="e-td">' + esc(t.desc) + '</td><td class="e-td">' + esc(t.service) + '</td><td class="e-td">' + esc(t.id) + '</td>' +
        '<td class="' + amtCls(t.amount) + '">' + signed(t.amount) + '</td><td class="e-td">' + pill(t.status) + '</td><td class="e-td">' + actionBtn(t.id) + '</td></tr>';
    }).join('');
    $('txEmpty').classList.toggle('hidden', rows.length > 0);
    $('txCount').textContent = rows.length ? 'Showing ' + rows.length + ' of ' + data.transactions.length + ' transactions' : '';
  }

  function closeDropdowns() { document.querySelectorAll('[data-dd] .dd-menu').forEach(function (m) { m.classList.add('hidden'); }); }
  document.addEventListener('click', closeDropdowns);

  var ITEM = 'block w-full text-left bg-transparent border-0 px-2.5 py-2 rounded-md text-s115 cursor-pointer hover:bg-slate-100';
  function makeDropdown(id, key, defLabel, options) {
    var el = $(id);
    el.innerHTML = '<button type="button" class="dd-btn e-btn !py-1.5 !px-2.5 text-s11"><span>' + defLabel + '</span>' +
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m6 9 6 6 6-6"/></svg></button>' +
      '<div class="dd-menu hidden absolute left-0 top-full mt-1.5 min-w-[calc(var(--u)*170)] bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-30">' +
      options.map(function (o, i) { return '<button type="button" data-i="' + i + '" class="' + ITEM + '">' + esc(o.l) + '</button>'; }).join('') + '</div>';
    var label = el.querySelector('.dd-btn span'), menu = el.querySelector('.dd-menu');

    function select(i) {
      filters[key] = options[i].v;
      label.textContent = (i === 0 && key !== 'sort') ? defLabel : options[i].l;
      menu.querySelectorAll('button').forEach(function (b, n) { swap(b, n === i, 'text-brand font-semibold', 'text-gray-900'); });
    }
    el.querySelector('.dd-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      var wasHidden = menu.classList.contains('hidden');
      closeDropdowns();
      menu.classList.toggle('hidden', !wasHidden);
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      select(Number(b.dataset.i));
      closeDropdowns();
      renderTx();
    });
    select(0);
    resetters.push(function () { select(0); });
  }

  function buildFilters() {
    resetters = [];
    var services = data.transactions.map(function (t) { return t.service; }).filter(function (s, i, a) { return a.indexOf(s) === i; });
    makeDropdown('ddRange', 'range', 'Date Range', [{ v: 'all', l: 'All time' }, { v: '7', l: 'Last 7 days' }, { v: '30', l: 'Last 30 days' }, { v: '90', l: 'Last 90 days' }]);
    makeDropdown('ddStatus', 'status', 'All Status', [{ v: 'all', l: 'All Status' }].concat(
      ['Cleared', 'Pending clearance', 'Processing', 'Failed', 'Refund', 'Cancelled'].map(function (s) { return { v: s, l: s }; })));
    makeDropdown('ddService', 'service', 'All Services', [{ v: 'all', l: 'All Services' }].concat(services.map(function (s) { return { v: s, l: s }; })));
    makeDropdown('ddSort', 'sort', 'Newest First', [{ v: 'newest', l: 'Newest First' }, { v: 'oldest', l: 'Oldest First' }]);
  }

  $('txSearch').addEventListener('input', function (e) { filters.q = e.target.value.trim().toLowerCase(); renderTx(); });
  $('txFilterBtn').addEventListener('click', function () {
    var panel = $('txFilters');
    var open = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !open);
    panel.classList.toggle('flex', open);
    swap(this, open, 'border-brand text-brand bg-blue-50', 'border-gray-200 text-gray-900 bg-white');
    this.setAttribute('aria-expanded', open);
  });
  $('txReset').addEventListener('click', function () {
    resetters.forEach(function (r) { r(); });
    filters.q = '';
    $('txSearch').value = '';
    renderTx();
  });

  /* ---------- Transaction details modal ---------- */
  var txdModal = $('txdModal');
  var currentTx = null;
  var DOT = { done: 'bg-brand', active: 'bg-brand', todo: 'bg-slate-300', bad: 'bg-red-600' };

  function steps(t) {
    var sub = fmtDate(t.date) + ' · ' + fmtTime(t.date);
    switch (t.status) {
      case 'Cleared': return [['done', 'Submitted', sub], ['done', 'Processing', 'Completed'], ['done', 'Cleared', 'Settled to hospital']];
      case 'Processing': return [['done', 'Submitted', sub], ['active', 'Processing', 'In progress'], ['todo', 'Cleared', 'Pending']];
      case 'Pending clearance': return [['done', 'Submitted', sub], ['active', 'Processing', 'Awaiting clearance'], ['todo', 'Cleared', 'Pending']];
      case 'Failed': return [['done', 'Submitted', sub], ['done', 'Processing', 'Completed'], ['bad', 'Failed', 'Payment could not be completed']];
      case 'Refund': return [['done', 'Submitted', sub], ['done', 'Processing', 'Completed'], ['done', 'Refunded', 'Returned to customer']];
      default: return [['done', 'Submitted', sub], ['bad', 'Cancelled', 'Cancelled before processing']];
    }
  }

  function settlementText(t) {
    var amt = inr(Math.abs(t.amount));
    return { 'Cleared': amt + ' settled', 'Pending clearance': amt + ' pending', 'Processing': amt + ' in process', 'Refund': amt + ' refunded', 'Failed': 'Not settled', 'Cancelled': 'Not settled' }[t.status];
  }

  function row(label, value, cls) {
    return '<div class="flex justify-between gap-3 py-1.5 text-s11 text-gray-500"><span>' + label + '</span><b class="font-medium text-right ' + (cls || 'text-gray-900') + '">' + value + '</b></div>';
  }

  function openDetails(id) {
    currentTx = data.transactions.filter(function (t) { return t.id === id; })[0];
    if (!currentTx) return;
    var t = currentTx;
    $('txdBody').innerHTML =
      '<div class="flex items-center gap-2 font-semibold text-s13 mb-3">' + esc(t.id) + ' ' + pill(t.status) + '</div>' +
      row('Date and time', fmtDate(t.date) + ' · ' + fmtTime(t.date)) +
      row('Transaction type', esc(t.type)) +
      row('Service name', esc(t.service)) +
      row('Gross amount', signed(t.amount), t.amount < 0 ? 'text-red-600' : 'text-emerald-600') +
      row('Settlement', settlementText(t)) +
      row('Booking ID', '<a href="#" class="text-brand font-medium no-underline">' + esc(t.booking) + '</a>') +
      '<div class="font-semibold text-xs mt-3.5 mb-2.5">Activity</div>' +
      steps(t).map(function (s) {
        return '<div class="relative ml-1 pl-4 pb-3.5 border-l border-slate-200 last:border-transparent last:pb-0">' +
          '<i class="absolute -left-[calc(var(--u)*4.5)] top-1 w-2 h-2 rounded-full ' + DOT[s[0]] + '"></i>' +
          '<b class="block text-s115 font-semibold">' + s[1] + '</b><small class="text-s105 text-gray-500">' + esc(s[2]) + '</small></div>';
      }).join('');
    openEl(txdModal);
  }
  function closeDetails() { closeEl(txdModal); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tx]');
    if (b) openDetails(b.dataset.tx);
  });
  $('txdX').addEventListener('click', closeDetails);
  $('txdCancel').addEventListener('click', closeDetails);
  txdModal.addEventListener('click', function (e) { if (e.target === txdModal) closeDetails(); });

  $('txdDownload').addEventListener('click', function () {
    if (!currentTx) return;
    var t = currentTx;
    var csv = [
      ['Transaction ID', 'Date', 'Type', 'Service', 'Amount', 'Status', 'Booking ID'],
      [t.id, fmtDate(t.date) + ' ' + fmtTime(t.date), t.type, t.service, t.amount, t.status, t.booking]
    ].map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = t.id + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  });

  /* ---------- Payment methods ---------- */
  var pmModal = $('pmModal'), pmForm = $('pmForm');
  var pmEditing = null, pmType = 'Savings';

  function getCookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }
  function sendMethod(payload) {
    var url = page.dataset.methodsUrl;
    if (!url) return;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      body: JSON.stringify(payload)
    }).catch(function (e) { console.error('Payout method request failed', e); });
  }

  function renderMethods() {
    var list = $('pmList');
    if (!data.methods.length) { list.innerHTML = '<div class="text-center text-gray-500 py-9 text-xs">No payout methods added yet.</div>'; return; }
    list.innerHTML = data.methods.map(function (m) {
      var last = m.number.slice(-4);
      var ok = m.status === 'Verified';
      return '<div class="flex flex-wrap items-center gap-3.5 border border-gray-200 rounded-xl px-4 py-3.5 mb-2.5">' +
        '<div class="w-[calc(var(--u)*34)] h-[calc(var(--u)*34)] rounded-full bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10 12 4l9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18"/></svg></div>' +
        '<div class="flex-1 min-w-[calc(var(--u)*220)]">' +
          '<div class="flex items-center gap-2 text-s13 mb-1"><b>' + esc(m.bank) + ' — ' + last + '</b>' +
          '<span class="px-2 py-0.5 rounded-md text-s10 font-medium ' + (ok ? PILL['Cleared'] : PILL['Pending clearance']) + '">' + (ok ? '✓ Verified' : 'Pending verification') + '</span></div>' +
          '<div class="text-s11 text-gray-500">Account holder: ' + esc(m.holder) + '</div>' +
          '<div class="text-s11 text-gray-500">•••• ' + last + ' · ' + esc(m.type) + '</div>' +
          (m.isDefault ? '<span class="inline-block mt-1.5 bg-blue-50 text-brand rounded-md px-2 py-0.5 text-s10 font-medium">Default payout method</span>' : '') +
        '</div>' +
        '<div class="flex gap-2"><button type="button" class="e-btn" data-pm-edit="' + m.id + '">Edit Details</button>' +
        '<button type="button" class="e-btn !text-red-600 !border-red-200 hover:!bg-red-50" data-pm-rm="' + m.id + '">Remove</button></div></div>';
    }).join('');
  }

  function setPmType(v) {
    pmType = v;
    $('pmTypeLabel').textContent = v;
    $('pmTypeMenu').querySelectorAll('button').forEach(function (b) { swap(b, b.dataset.v === v, 'text-brand font-semibold', 'text-gray-900'); });
  }
  function clearPmErrors() {
    pmForm.querySelectorAll('[data-f]').forEach(function (f) {
      f.querySelector('input').classList.remove('!border-red-500');
      f.querySelector('.pm-err').textContent = '';
    });
  }
  function pmError(key, msg) {
    var f = pmForm.querySelector('[data-f="' + key + '"]');
    f.querySelector('input').classList.add('!border-red-500');
    f.querySelector('.pm-err').textContent = msg;
  }

  function openPm(id) {
    pmEditing = id ? data.methods.filter(function (m) { return m.id === id; })[0] : null;
    clearPmErrors();
    $('pmTitle').textContent = pmEditing ? 'Edit payout method' : 'Add payout method';
    $('pmHolder').value = pmEditing ? pmEditing.holder : '';
    $('pmBank').value = pmEditing ? pmEditing.bank : '';
    $('pmNumber').value = pmEditing ? pmEditing.number : '';
    $('pmConfirm').value = pmEditing ? pmEditing.number : '';
    $('pmIfsc').value = pmEditing ? pmEditing.ifsc : '';
    setPmType(pmEditing ? pmEditing.type : 'Savings');
    openEl(pmModal);
    $('pmHolder').focus();
  }
  function closePm() { closeEl(pmModal); $('pmTypeMenu').classList.add('hidden'); }

  $('pmAdd').addEventListener('click', function () { openPm(null); });
  $('pmX').addEventListener('click', closePm);
  $('pmCancel').addEventListener('click', closePm);
  pmModal.addEventListener('click', function (e) {
    if (e.target === pmModal) closePm();
    else if (!e.target.closest('#pmType')) $('pmTypeMenu').classList.add('hidden');
  });
  $('pmTypeBtn').addEventListener('click', function () { $('pmTypeMenu').classList.toggle('hidden'); });
  $('pmTypeMenu').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    setPmType(b.dataset.v);
    $('pmTypeMenu').classList.add('hidden');
  });

  document.addEventListener('click', function (e) {
    var ed = e.target.closest('[data-pm-edit]');
    if (ed) openPm(Number(ed.dataset.pmEdit));
    var rm = e.target.closest('[data-pm-rm]');
    if (rm) {
      var id = Number(rm.dataset.pmRm);
      var m = data.methods.filter(function (x) { return x.id === id; })[0];
      if (!m || !window.confirm('Remove ' + m.bank + ' — ' + m.number.slice(-4) + ' as a payout method?')) return;
      data.methods = data.methods.filter(function (x) { return x.id !== id; });
      if (m.isDefault && data.methods.length) data.methods[0].isDefault = true;
      sendMethod({ action: 'remove', id: id });
      renderMethods();
    }
  });

  pmForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearPmErrors();
    var v = {
      holder: $('pmHolder').value.trim(), bank: $('pmBank').value.trim(),
      number: $('pmNumber').value.trim(), confirm: $('pmConfirm').value.trim(),
      ifsc: $('pmIfsc').value.trim().toUpperCase()
    };
    var ok = true;
    if (!v.holder) { pmError('holder', 'Enter the account holder name.'); ok = false; }
    if (!v.bank) { pmError('bank', 'Enter the bank name.'); ok = false; }
    if (!/^\d{9,18}$/.test(v.number)) { pmError('number', 'Enter a valid account number (9–18 digits).'); ok = false; }
    else if (v.confirm !== v.number) { pmError('confirm', 'Account numbers do not match.'); ok = false; }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.ifsc)) { pmError('ifsc', 'Enter a valid IFSC code, for example HDFC0001234.'); ok = false; }
    if (!ok) return;

    var item;
    if (pmEditing) {
      var changed = pmEditing.number !== v.number || pmEditing.ifsc !== v.ifsc;
      item = pmEditing;
      item.holder = v.holder; item.bank = v.bank; item.number = v.number; item.ifsc = v.ifsc; item.type = pmType;
      if (changed) item.status = 'Pending verification';
    } else {
      item = { id: Date.now(), holder: v.holder, bank: v.bank, number: v.number, ifsc: v.ifsc, type: pmType, status: 'Pending verification', isDefault: data.methods.length === 0 };
      data.methods.push(item);
    }
    sendMethod({ action: pmEditing ? 'update' : 'add', method: item });
    closePm();
    renderMethods();
  });

  /* ---------- Refresh ---------- */
  $('refreshBtn').addEventListener('click', function () {
    var url = page.dataset.dataUrl;
    if (!url) { init(); return; }
    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        Object.assign(data, json);
        data.transactions.forEach(function (t) { t.date = new Date(t.ts); });
        init();
      })
      .catch(function (e) { console.error('Refresh failed', e); });
  });

  /* ---------- Export modal ---------- */
  var exportModal = $('exportModal');
  var state = { type: 'earnings', range: '30', format: 'pdf' };
  var GROUP_STYLE = {
    type: ['border-brand bg-blue-50 ring-1 ring-brand', 'border-gray-200 bg-white'],
    range: ['bg-brand border-brand text-white', 'bg-white border-gray-200 text-gray-700'],
    format: ['bg-brand border-brand text-white', 'bg-white border-gray-200 text-gray-700']
  };

  $('openExport').addEventListener('click', function () { openEl(exportModal); });
  $('closeExport').addEventListener('click', function () { closeEl(exportModal); });
  $('cancelExport').addEventListener('click', function () { closeEl(exportModal); });
  exportModal.addEventListener('click', function (e) { if (e.target === exportModal) closeEl(exportModal); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeEl(exportModal); closeDetails(); closePm(); closeDropdowns(); }
  });

  exportModal.querySelectorAll('[data-group]').forEach(function (group) {
    var key = group.dataset.group;
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      group.querySelectorAll('button').forEach(function (b) { swap(b, b === btn, GROUP_STYLE[key][0], GROUP_STYLE[key][1]); });
      state[key] = btn.dataset.value;
      if (key === 'range') {
        var custom = btn.dataset.value === 'custom';
        $('customRange').classList.toggle('hidden', !custom);
        $('customRange').classList.toggle('flex', custom);
      }
    });
  });

  $('submitExport').addEventListener('click', function () {
    var params = new URLSearchParams({ type: state.type, range: state.range, format: state.format });
    if (state.range === 'custom') {
      params.set('from', $('expFrom').value);
      params.set('to', $('expTo').value);
    }
    exportModal.querySelectorAll('input[name="include"]:checked').forEach(function (c) { params.append('include', c.value); });
    var base = page.dataset.exportUrl || '';
    closeEl(exportModal);
    if (!base) { console.warn('Set data-export-url on #earningsPage'); return; }
    window.location.href = base + '?' + params.toString();
  });

  /* ---------- Re-draw charts when the window size changes ---------- */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderCharts, 200);
  });

  /* ---------- Init ---------- */
  function init() {
    renderTopServices();
    renderLegends();
    renderRecent();
    renderMethods();
    buildFilters();
    renderTx();
    renderCharts();
  }
  init();
})();