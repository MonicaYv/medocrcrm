 (function () {
  var $ = function (id) { return document.getElementById(id); };
  var SERVICES = ['General Medicine OPD', 'Wound Dressing', 'Orthopaedic OPD', 'Day-care Service', 'Planned Admission'];
  var VISITS = ['Hospital visit', 'Home visit', 'Planned admission'];
  var DEPTS = ['Outpatient Block', 'Procedure Room 1', 'Day-care Unit', 'Admissions Desk'];
  var STATUSES = ['Confirmed', 'Awaiting confirmation', 'Checked in', 'In progress', 'Completed'];
  var UP = ['Upcoming', 'Confirmed', 'Awaiting confirmation', 'Reschedule'];
  var COLORS = ['#2563eb', '#d97706', '#7c3aed', '#0d9488', '#dc2626', '#16a34a', '#0891b2', '#1d4ed8'];
  var SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:00 PM'];

  // Demo data (replace with server-rendered JSON / fetch)
  var data = [
    { bid: 'BK-HSP-2393', time: '08:30 AM', name: 'Dolly Paris', sex: 'F', age: 29, svc: SERVICES[0], dept: DEPTS[0], visit: VISITS[0], status: 'Completed', pay: 'Paid', checked: true },
    { bid: 'BK-HSP-2394', time: '08:45 AM', name: 'Steve Lamark', sex: 'M', age: 38, svc: SERVICES[1], dept: DEPTS[1], visit: VISITS[0], status: 'Completed', pay: 'Paid', checked: true },
    { bid: 'BK-HSP-2395', time: '09:00 AM', name: 'Vijay Mehta', sex: 'M', age: 63, svc: SERVICES[1], dept: DEPTS[1], visit: VISITS[0], status: 'In progress', pay: '₹1,200 due', checked: true },
    { bid: 'BK-HSP-2396', time: '09:30 AM', name: 'Kavitha Nair', sex: 'F', age: 41, svc: SERVICES[0], dept: DEPTS[0], visit: VISITS[0], status: 'In progress', pay: 'Not required', checked: true },
    { bid: 'BK-HSP-2399', time: '10:00 AM', name: 'Rajan Mehta', sex: 'M', age: 55, svc: SERVICES[3], dept: DEPTS[2], visit: VISITS[0], status: 'Confirmed', pay: 'Processing' },
    { bid: 'BK-HSP-2400', time: '10:15 AM', name: 'Deepa Shah', sex: 'F', age: 47, svc: SERVICES[4], dept: DEPTS[3], visit: VISITS[2], status: 'Reschedule', pay: 'Pending hospital billing', bed: 'Bed no - 21', adm: '20th Sep 2026', dis: '24 Sep 2026' },
    { bid: 'BK-HSP-2401', time: '10:30 AM', name: 'Rachel Kate', sex: 'F', age: 34, svc: SERVICES[0], dept: DEPTS[0], visit: VISITS[0], status: 'Confirmed', pay: 'Not required' },
    { bid: 'BK-HSP-2402', time: '11:00 AM', name: 'Karen Cooper', sex: 'F', age: 28, svc: SERVICES[1], dept: DEPTS[1], visit: VISITS[0], status: 'Confirmed', pay: '₹1,200 due' },
    { bid: 'BK-HSP-2403', time: '11:30 AM', name: 'Josh Kerr', sex: 'M', age: 45, svc: SERVICES[3], dept: DEPTS[2], visit: VISITS[0], status: 'Confirmed', pay: '₹3,500 due' },
    { bid: 'BK-HSP-2404', time: '02:00 PM', name: 'Meera Shah', sex: 'F', age: 52, svc: SERVICES[2], dept: DEPTS[0], visit: VISITS[0], status: 'Reschedule', pay: 'Not required', noStart: true },
    { bid: 'BK-HSP-2405', time: '03:30 PM', name: 'Anil Kumar', sex: 'M', age: 61, svc: SERVICES[0], dept: DEPTS[0], visit: VISITS[0], status: 'Reschedule', pay: 'Not required' },
    { bid: 'BK-HSP-2500', time: '08:45 AM', name: 'Sonam Sharma', sex: 'F', age: 38, svc: SERVICES[1], dept: DEPTS[1], visit: VISITS[0], status: 'Missed', pay: 'Paid', reason: 'No Check-in recorded', note: 'Booking Missed because of No Check-in recorded · 09:00 AM · Hospital Staff' },
    { bid: 'BK-HSP-2794', time: '09:40 AM', name: 'Steve Lamark', sex: 'M', age: 38, svc: SERVICES[1], dept: DEPTS[1], visit: VISITS[0], status: 'Missed', pay: 'Paid', reason: 'Patient Unavailable', note: 'Booking Missed because of Patient Unavailable · 09:55 AM · Hospital Staff' },
    { bid: 'BK-HSP-2694', time: '10:20 AM', name: 'Steve Lamark', sex: 'M', age: 38, svc: SERVICES[1], dept: DEPTS[1], visit: VISITS[0], status: 'Missed', pay: 'Paid', reason: 'No Check-in recorded', note: 'Booking Missed because of No Check-in recorded · 10:35 AM · Hospital Staff' },
    { bid: 'BK-HSP-2594', time: '02:45 PM', name: 'Steve Lamark', sex: 'M', age: 38, svc: SERVICES[1], dept: DEPTS[1], visit: VISITS[0], status: 'Missed', pay: 'Paid', reason: 'Patient Unavailable', note: 'Booking Missed because of Patient Unavailable · 03:00 PM · Hospital Staff' },
    { bid: 'BK-HSP-2444', time: '08:45 AM', name: 'Sumit Sharma', sex: 'M', age: 38, svc: SERVICES[1], dept: DEPTS[1], visit: VISITS[0], status: 'Cancelled', pay: 'Not Specified', reason: 'Schedule Conflict', note: 'Booking Cancelled due to Schedule Conflict · 09:00 AM · Patient' },
    { bid: 'BK-HSP-2450', time: '09:45 AM', name: 'Kajal Verma', sex: 'F', age: 38, svc: SERVICES[0], dept: DEPTS[0], visit: VISITS[0], status: 'Cancelled', pay: 'Paid', reason: 'Initiated By Patient', note: 'Booking Cancelled by patient · 09:50 AM · Patient' }
  ];

  var TABS = [
    ['all', 'All Today'], ['upcoming', 'Upcoming'], ['missed', 'Missed'],
    ['progress', 'In Progress'], ['completed', 'Completed'], ['cancelled', 'Cancelled']
  ];
  var state = { tab: 'all', q: '', svc: '', visit: '', dept: '', status: '' };
  var cur = null;

  // ---------- helpers ----------
  var ICON = {
    eye: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4l13 8-13 8z"/></svg>',
    redo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12a8 8 0 11-3-6.2"/><path d="M20 4v5h-5"/></svg>',
    ok: '<svg class="text-shazam-blue shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    bad: '<svg class="text-red-500 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>'
  };
  function initials(n) { return n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function color(n) { var s = 0; for (var i = 0; i < n.length; i++) s += n.charCodeAt(i); return COLORS[s % COLORS.length]; }
  function avatar(n, sz) { return '<span class="rounded-full text-white font-semibold flex items-center justify-center shrink-0" style="flex:0 0 auto;width:' + sz + 'px;height:' + sz + 'px;font-size:' + (sz > 34 ? 18 : 13) + 'px;background:' + color(n) + '">' + initials(n) + '</span>'; }
  function badge(s) {
    var m = {
      'Completed': 'border border-kyc-green text-kyc-green bg-white',
      'In progress': 'bg-purple-100 text-purple-600',
      'Cancelled': 'border border-slate-400 text-slate-600 bg-white',
      'Awaiting confirmation': 'border border-yellow-400 text-yellow-600 bg-yellow-50',
      'Reschedule': 'bg-blue-100 text-facebook-blue',
      'Checked in': 'border border-facebook-blue text-facebook-blue bg-white',
      'Confirmed': 'bg-green-100 text-green-700',
      'Upcoming': 'bg-yellow-100 text-yellow-700',
      'Missed': 'border border-red-400 text-red-500 bg-white'
    };
    return '<span class="inline-block text-[12px] px-3 py-0.5 rounded-full whitespace-nowrap ' + (m[s] || '') + '">' + (s === 'Awaiting confirmation' ? 'Awaiting Conf' : s) + '</span>';
  }
  function payCell(p) {
    var cls = /due|Processing/.test(p) ? 'text-instant-orange font-semibold' : 'text-slate-700';
    return '<span class="' + cls + '">' + p + '</span>';
  }
  function toast(msg) {
    var t = $('bkToast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.add('hidden'); }, 2200);
  }
  function openM(id) { var m = $(id); m.classList.remove('hidden'); m.classList.add('flex'); }
  function closeM(id) { var m = $(id); m.classList.add('hidden'); m.classList.remove('flex'); }
  function find(bid) { return data.filter(function (b) { return b.bid === bid; })[0]; }
  function inTab(b, t) {
    if (t === 'all') return true;
    if (t === 'upcoming') return UP.indexOf(b.status) > -1;
    if (t === 'progress') return b.status === 'In progress' || b.status === 'Checked in';
    return b.status.toLowerCase() === t;
  }
  function fillSel(id, label, list) {
    $(id).innerHTML = '<option value="">' + label + '</option>' + list.map(function (x) { return '<option>' + x + '</option>'; }).join('');
  }

  // ---------- list ----------
  function renderTabs() {
    $('bkTabs').innerHTML = TABS.map(function (t) {
      var n = data.filter(function (b) { return inTab(b, t[0]); }).length, on = state.tab === t[0];
      return '<button type="button" data-tab="' + t[0] + '" class="bk-tab flex items-center gap-1.5 text-[15px] py-3 px-1 border-b-2 whitespace-nowrap ' +
        (on ? 'text-shazam-blue border-shazam-blue font-medium' : 'text-slate-600 border-transparent') + '">' + t[1] +
        ' <span class="text-[12px] px-1.5 py-0.5 rounded-full bg-blue-100 text-shazam-blue">' + n + '</span></button>';
    }).join('');
  }
  function filtered() {
    var q = state.q.toLowerCase();
    return data.filter(function (b) {
      if (!inTab(b, state.tab)) return false;
      if (state.svc && b.svc !== state.svc) return false;
      if (state.visit && b.visit !== state.visit) return false;
      if (state.dept && b.dept !== state.dept) return false;
      if (state.status && b.status.toLowerCase() !== state.status.toLowerCase() && !(state.status === 'Checked in' && b.checked)) return false;
      if (q && (b.name + ' ' + b.bid + ' ' + b.svc).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function renderRows() {
    var cancelled = state.tab === 'cancelled' || state.tab === 'missed';
    var heads = ['Time', 'Booking ID', 'Patient', 'Service / Department', 'Visit Type', 'Status', cancelled ? 'Reason' : 'Payment', 'Actions'];
    $('bkHead').innerHTML = heads.map(function (h) { return '<th class="px-3 py-4 font-medium">' + h + '</th>'; }).join('');
    var rows = filtered();
    $('bkEmpty').classList.toggle('hidden', rows.length > 0);
    $('bkRows').innerHTML = rows.map(function (b) {
      var canStart = ['Upcoming', 'Confirmed', 'Awaiting confirmation', 'Reschedule', 'Checked in', 'In progress'].indexOf(b.status) > -1 && !b.noStart;
      var canResched = b.status !== 'Cancelled';
      return '<tr class="border-b border-slate-100 hover:bg-slate-50/60" data-bid="' + b.bid + '">' +
        '<td class="px-3 py-4 font-bold text-dark-inky-blue whitespace-nowrap">' + b.time + '</td>' +
        '<td class="px-3"><button type="button" data-act="view" class="text-facebook-blue font-medium">' + b.bid.replace(/-/g, '–') + '</button></td>' +
        '<td class="px-3"><div class="flex items-center gap-3 w-[210px] mx-auto text-left">' + avatar(b.name, 36) +
          '<div><p class="font-semibold text-dark-inky-blue leading-tight">' + b.name + '</p><p class="text-[13px] text-grayish-blue-slate">' + b.sex + ' · ' + b.age + ' years</p></div></div></td>' +
        '<td class="px-3"><p class="font-semibold text-dark-inky-blue leading-tight">' + b.svc + '</p><p class="text-[13px] text-grayish-blue-slate">' + b.dept + '</p></td>' +
        '<td class="px-3 text-slate-700">' + b.visit + '</td>' +
        '<td class="px-3">' + badge(b.status) + '</td>' +
        '<td class="px-3">' + (cancelled ? '<span class="text-slate-700">' + (b.reason || '-') + '</span>' : payCell(b.pay)) + '</td>' +
        '<td class="px-3"><div class="flex items-center justify-center gap-2">' +
          '<button type="button" data-act="view" title="View" class="text-facebook-blue">' + ICON.eye + '</button>' +
          (canStart ? '<button type="button" data-act="start" title="' + (b.status === 'In progress' ? 'Complete service' : b.status === 'Checked in' ? 'Start service' : 'Check in patient') + '" class="text-kyc-green">' + ICON.play + '</button>' : '') +
          (canResched ? '<button type="button" data-act="resched" title="Reschedule" class="text-yellow-500">' + ICON.redo + '</button>' : '') +
        '</div></td></tr>';
    }).join('');
  }
  function refresh() { renderTabs(); renderRows(); }

  // ---------- detail popup ----------
  function field(l, v) { return '<div class="py-3 border-b border-slate-100 last:border-0"><p class="text-[14px] text-grayish-blue-slate">' + l + '</p><p class="text-[16px] font-bold text-dark-inky-blue mt-1">' + v + '</p></div>'; }
  function timeline(b) {
    var ev = [['Request received', '29 Sep 2026 · 8:12 AM · Hospital Staff', 'ok']];
    var t = b.time;
    if (b.status !== 'Awaiting confirmation') ev.push(['Booking confirmed', '29 Sep 2026 · ' + t + ' · Hospital Staff', 'ok']);
    if (b.checked) ev.push(['Arrival / Check-in', '29 Sep 2026 · ' + (b.arrive || t) + ' · Hospital Staff', 'ok']);
    if (b.status === 'In progress' || b.status === 'Completed') ev.push(['Service started', '29 Sep 2026 · ' + t + ' · Hospital Staff', 'ok']);
    if (b.status === 'Completed') ev.push(['Completed', '29 Sep 2026 · ' + (b.doneAt || t) + ' · Hospital Staff', 'ok']);
    if (b.status === 'Missed') ev.push(['Missed', b.note, 'bad']);
    if (b.status === 'Cancelled') { ev.splice(2); ev.push(['Cancelled', b.note, 'bad']); }
    return ev.map(function (e, i) {
      return '<li class="relative flex gap-2.5 ' + (i < ev.length - 1 ? 'pb-4' : '') + '">' +
        (i < ev.length - 1 ? '<span class="absolute left-[7px] top-5 bottom-0 w-px bg-slate-200"></span>' : '') +
        '<span class="bg-white relative z-[1]">' + ICON[e[2]] + '</span><div><p class="font-bold text-dark-inky-blue">' + e[0] + '</p><p class="text-[13px] text-grayish-blue-slate">' + e[1] + '</p></div></li>';
    }).join('');
  }
  function openDetail(b) {
    cur = b;
    $('dt-id').textContent = b.bid.replace(/-/g, '–');
    $('dt-status').innerHTML = badge(UP.indexOf(b.status) > -1 ? 'Upcoming' : b.status);
    $('dt-avatar').innerHTML = initials(b.name);
    $('dt-avatar').style.background = color(b.name);
    $('dt-name').textContent = b.name;
    $('dt-meta').textContent = b.age + ' years · ' + b.sex;
    var h = field('Service', b.svc) + field('Department / Unit', b.dept);
    if (b.bed) h += field('Bed Assigned', b.bed);
    h += '<div class="py-3 border-b border-slate-100"><p class="text-[14px] text-grayish-blue-slate">Visit type</p><span class="inline-block mt-1.5 text-[13px] font-medium px-3 py-1 rounded-md bg-shazam-blue text-white">' + b.visit + '</span></div>';
    h += field('Scheduled date', 'Tuesday, 29 Sep 2026') + field('Scheduled time', b.time);
    if (b.status === 'Missed') {
      h += field('Booking Status', 'Missed') + field('Reason', b.reason) + field('Follow-Up', 'Contact Patient to Reschedule') +
        '<p class="rounded-lg border border-yellow-400 text-yellow-600 text-[14px] px-4 py-3 mt-3">No arrival or check-in was recorded by the schedule time.</p>';
    } else {
      if (b.adm) h += field('Admitted', b.adm) + field('Discharged', b.dis); else if (b.status !== 'Cancelled') h += field('Assigned room / unit', b.dept);
      if (b.status === 'Cancelled') h += field('Cancellation Reason', b.reason);
      h += field('Booking source', 'Patient app') + field('Payment status', b.pay);
      if (b.status === 'Completed') h += '<div class="py-3"><p class="text-[14px] text-grayish-blue-slate">Invoice</p><button type="button" id="dtInvoice" class="flex items-center gap-2 mt-1 text-[16px] font-bold text-dark-inky-blue"><svg class="text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/></svg>Download</button></div>';
    }
    $('dt-pane-details').innerHTML = h;
    $('dt-pane-activity').innerHTML = timeline(b);
    var cls = 'text-[15px] font-semibold py-[10px] rounded-lg border cursor-pointer transition-colors ';
    var close = '<button type="button" data-close="m-detail" class="flex-1 ' + cls + 'border-gray-400 text-gray-500 bg-white hover:bg-gray-100">Close</button>';
    var primary = function (id, t) { return '<button id="' + id + '" type="button" class="flex-1 ' + cls + 'border-shazam-blue bg-shazam-blue text-white hover:opacity-90">' + t + '</button>'; };
    var outline = function (id, t) { return '<button id="' + id + '" type="button" class="flex-1 ' + cls + 'border-shazam-blue text-shazam-blue bg-white hover:bg-blue-50">' + t + '</button>'; };
    var foot = close;
    if (b.status === 'In progress') foot = primary('dtComplete', 'Complete Service');
    else if (b.status === 'Missed') foot = close + primary('dtResched', 'Reschedule');
    else if (b.status === 'Checked in') foot = close + primary('dtStart', 'Start Service');
    else if (UP.indexOf(b.status) > -1) foot = outline('dtResched', 'Reschedule') + primary('dtCheckin', 'Check-In');
    $('dt-foot').innerHTML = foot;
    setDTab('details');
    openM('m-detail');
  }
  function setDTab(t) {
    document.querySelectorAll('.dt-tab').forEach(function (b) {
      var on = b.dataset.dtab === t;
      b.className = 'dt-tab text-[15px] py-2 border-b-2 ' + (on ? 'text-shazam-blue border-shazam-blue font-medium' : 'text-slate-600 border-transparent font-normal');
    });
    document.querySelectorAll('[data-dpane]').forEach(function (p) { p.classList.add('hidden'); });
    $('dt-pane-' + t).classList.remove('hidden');
  }

  // ---------- reschedule / complete / start ----------
  function openResched(b) {
    cur = b;
    $('rs-name').textContent = b.name;
    $('rs-svc').textContent = b.svc + ' · ' + b.time;
    $('rs-ref').textContent = 'Tuesday, 29 Sep 2026 · ' + b.bid;
    $('rsSlot').innerHTML = SLOTS.map(function (s) { return '<option>' + s + '</option>'; }).join('');
    closeM('m-detail'); openM('m-resched');
  }
  function openComplete(b) {
    cur = b;
    $('cp-name').textContent = b.name;
    $('cp-svc').textContent = b.svc + ' · ' + b.time;
    $('cp-ref').textContent = 'Tuesday, 29 Sep 2026 · ' + b.bid;
    var d = new Date(); $('cpTime').value = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    $('cpNote').value = '';
    closeM('m-detail'); openM('m-complete');
  }
  function startService(b) {
    if (b.status === 'In progress') return openComplete(b);
    if (b.status !== 'Checked in') return openCheckin(b);
    b.status = 'In progress'; b.checked = true;
    closeM('m-detail'); refresh(); toast('Service started for ' + b.name);
  }

  function openCheckin(b) {
    cur = b;
    $('ci-name').textContent = b.name;
    $('ci-svc').textContent = b.svc + ' · ' + b.time;
    $('ci-ref').textContent = 'Tuesday, 29 Sep 2026 · ' + b.bid;
    var d = new Date(); $('ciTime').value = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    $('ciDept').innerHTML = DEPTS.map(function (x) { return '<option' + (x === b.dept ? ' selected' : '') + '>' + x + '</option>'; }).join('');
    $('ciBed').innerHTML = [21, 22, 23, 24, 25].map(function (n) { return '<option' + (n === 22 ? ' selected' : '') + '>Bed no - ' + n + '</option>'; }).join('');
    $('ciQueue').value = '';
    closeM('m-detail'); openM('m-checkin');
  }

  function openCall(b) {
    $('cl-id').textContent = 'REQ-H' + b.bid.slice(-4);
    $('cl-avatar').textContent = initials(b.name); $('cl-avatar').style.background = color(b.name);
    $('cl-name').textContent = b.name;
    $('cl-meta').textContent = b.age + ' yrs · ' + b.sex + ' · xxxx-xx-7845';
    $('cl-svc').textContent = b.svc;
    $('cl-cat').textContent = b.visit === 'Planned admission' ? 'Inpatient Admission' : 'OPD / Daycare';
    $('cl-sched').textContent = '29 Sep 2026 • ' + b.time;
    $('cl-mode').textContent = b.visit === 'Home visit' ? 'Home Service' : 'Visit Hospital';
    openM('m-call');
  }

  // ---------- export ----------
  function exportCsv() {
    var rows = [['Time', 'Booking ID', 'Patient', 'Age', 'Sex', 'Service', 'Department', 'Visit type', 'Status', 'Payment']];
    filtered().forEach(function (b) { rows.push([b.time, b.bid, b.name, b.age, b.sex, b.svc, b.dept, b.visit, b.status, b.pay]); });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'bookings-2026-09-29.csv'; a.click();
    toast('CSV exported');
  }

  // ---------- offer ----------
  function offerPreview() {
    $('pvName').textContent = $('ofName').value.trim() || 'Your offer name';
    $('pvSvc').textContent = $('ofService').value;
    $('pvPrice').textContent = $('ofPrice').value ? '₹ ' + Number($('ofPrice').value).toLocaleString('en-IN') : '₹ ——';
    var v = $('ofValid').value, txt = '';
    if (v) txt = new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    $('pvMeta').textContent = $('ofVis').value + ' · Valid until ' + txt;
  }
  function saveOffer(draft) {
    if (!$('ofName').value.trim() || !$('ofPrice').value) { $('ofError').classList.remove('hidden'); return; }
    $('ofError').classList.add('hidden');
    closeM('m-offer'); toast(draft ? 'Offer saved as draft' : 'Offer published');
    $('ofName').value = ''; $('ofPrice').value = ''; $('ofDesc').value = ''; offerPreview();
  }

  // ---------- init ----------
  fillSel('bkFService', 'All Services', SERVICES);
  fillSel('bkFVisit', 'All Visit type', VISITS);
  fillSel('bkFDept', 'All Department', DEPTS);
  fillSel('bkFStatus', 'All Status', STATUSES);
  $('ofService').innerHTML = SERVICES.map(function (s) { return '<option' + (s === 'Day-care Service' ? ' selected' : '') + '>' + s + '</option>'; }).join('');
  offerPreview();
  refresh();

  document.addEventListener('click', function (e) {
    var t = e.target;
    var tab = t.closest('.bk-tab'); if (tab) { state.tab = tab.dataset.tab; refresh(); return; }
    var act = t.closest('[data-act]');
    if (act) {
      var b = find(act.closest('tr').dataset.bid);
      if (act.dataset.act === 'view') openDetail(b);
      else if (act.dataset.act === 'start') startService(b);
      else openResched(b);
      return;
    }
    var dt = t.closest('.dt-tab'); if (dt) { setDTab(dt.dataset.dtab); return; }
    var cl = t.closest('[data-close]'); if (cl) { closeM(cl.dataset.close); return; }
    if (t.hasAttribute && t.hasAttribute('data-modal')) { closeM(t.id); return; }
    if (t.closest('#bkExportBtn')) { $('bkExportMenu').classList.toggle('hidden'); return; }
    var ex = t.closest('[data-export]');
    if (ex) {
      $('bkExportMenu').classList.add('hidden');
      if (ex.dataset.export === 'csv') exportCsv(); else window.print();
      return;
    }
    if (!t.closest('#bkExportMenu')) $('bkExportMenu').classList.add('hidden');
    if (t.closest('#dtCheckin')) return openCheckin(cur);
    if (t.closest('#ciConfirm')) {
      var cv = $('ciTime').value.split(':'), ch = +cv[0];
      cur.arrive = ('0' + (ch % 12 || 12)).slice(-2) + ':' + cv[1] + ' ' + (ch >= 12 ? 'PM' : 'AM');
      cur.dept = $('ciDept').value; cur.bed = $('ciBed').value; cur.status = 'Checked in'; cur.checked = true;
      closeM('m-checkin'); refresh(); return toast(cur.name + ' checked in');
    }
    if (t.closest('#dtStart')) return startService(cur);
    if (t.closest('#dtComplete')) return openComplete(cur);
    if (t.closest('#dtResched')) return openResched(cur);
    if (t.closest('#dtCall')) return openCall(cur);
    if (t.closest('#clPhone')) return toast('Calling ' + cur.name + '…');
    if (t.closest('#clView')) return toast('Opening Prescription.pdf');
    if (t.closest('#clDraft')) { closeM('m-call'); return toast('Saved as draft'); }
    if (t.closest('#clBid')) { closeM('m-call'); return toast('Bid submitted'); }
    if (t.closest('#dtInvoice')) return toast('Invoice downloaded');
    if (t.closest('#rsConfirm')) {
      cur.time = $('rsSlot').value;
      if (cur.status === 'Missed' || cur.status === 'Reschedule') cur.status = 'Confirmed';
      closeM('m-resched'); refresh(); return toast('Booking rescheduled to ' + cur.time);
    }
    if (t.closest('#cpConfirm')) {
      var v = $('cpTime').value.split(':'), h = +v[0];
      cur.doneAt = ('0' + (h % 12 || 12)).slice(-2) + ':' + v[1] + ' ' + (h >= 12 ? 'PM' : 'AM');
      cur.status = 'Completed'; cur.checked = true;
      closeM('m-complete'); refresh(); return toast('Booking marked completed');
    }
    if (t.closest('#bkFilterBtn')) { var p = $('bkFilterPanel'); p.classList.toggle('hidden'); p.classList.toggle('flex'); return; }
    if (t.closest('#bkFReset')) {
      state.svc = state.visit = state.dept = state.status = '';
      ['bkFService', 'bkFVisit', 'bkFDept', 'bkFStatus'].forEach(function (i) { $(i).value = ''; });
      return refresh();
    }
    if (t.closest('#bkOfferBtn')) return openM('m-offer');
    if (t.closest('#ofDraft')) return saveOffer(true);
    if (t.closest('#ofPublish')) return saveOffer(false);
  });

  $('bkSearch').addEventListener('input', function (e) { state.q = e.target.value; renderRows(); });
  $('bkFService').addEventListener('change', function (e) { state.svc = e.target.value; renderRows(); });
  $('bkFVisit').addEventListener('change', function (e) { state.visit = e.target.value; renderRows(); });
  $('bkFDept').addEventListener('change', function (e) { state.dept = e.target.value; renderRows(); });
  $('bkFStatus').addEventListener('change', function (e) { state.status = e.target.value; renderRows(); });
  ['ofName', 'ofService', 'ofPrice', 'ofValid', 'ofVis'].forEach(function (i) {
    $(i).addEventListener('input', offerPreview); $(i).addEventListener('change', offerPreview);
  });
})();