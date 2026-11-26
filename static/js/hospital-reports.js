(function () {
  'use strict';

  var root = document.getElementById('hospitalReportsPage');
  if (!root) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ================= config ================= */
  // The dates in the Figma are "23-29 Sep 2026". Change to `new Date()` to use live dates.
  var REPORT_END = new Date(2026, 8, 29);
  var HOSPITAL = 'Lifecare Multispeciality Hospital';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ================= demo data (replace via HospitalReports.setData) ================= */
  var BASE = {
    services: [['general', 'General Medicine OPD', 26], ['wound', 'Wound Dressing', 18], ['ortho', 'Orthopaedic OPD', 17], ['daycare', 'Day-care Service', 13], ['other', 'Other Hospital Services', 10]],
    booking: {
      stats: [1248, 1102, 146, 87],
      delta: [[12, 1], [10, 1], [8, 0], [5, 0]],
      trend: [9, 10, 11, 12, 13, 14, 15],
      status: [62, 10, 6, 6],
      tat: { avg: '7.4 hours', sla: '91.6%', overdue: 39, buckets: [126, 176, 102, 24] }
    },
    offers: { cats: [['General', 4, 2], ['Wound', 3, 1], ['Orthopaedic', 2, 2], ['Day-care', 1, 1], ['Other', 2, 0]], active: 2 },
    bids: {
      stats: [324, 182, 98, 44],
      delta: [[12, 1], [8, 1], [6, 0], [5, 0]],
      trend: [64, 76, 82, 95, 98, 103, 113],
      status: [62, 10, 6],
      conv: { cur: [37, 41, 45, 48], prev: [31, 34, 38, 41] },
      tat: { cur: [24, 28, 22, 30], prev: [15, 18, 14, 20] }
    },
    revenue: {
      stats: [432500, 3475, 18.5, 28750],
      delta: [[12, 1], [8, 1], [2.1, 1], [6, 0]],
      trend: [310000, 330000, 360000, 380000, 400000, 420000, 450000],
      prev: [250000, 255000, 290000, 290000, 310000, 320000, 330000],
      pay: [['UPI', 52], ['Card', 34], ['Net Banking', 14]],
      dept: [['General Medicine', 170000], ['Surgery', 105000], ['Orthopaedic', 75000], ['Cardiology', 50000], ['Others', 32500]]
    },
    tx: [
      ['TRX-1024', 'Paracetamol 500mg', 'General Medicine', 12000, 'Paid', '29 Sep 2026, 11:45 AM'],
      ['TRX-1023', 'Amoxicillin 500mg', 'Medicine', 8500, 'Paid', '29 Sep 2026, 10:20 AM'],
      ['TRX-1022', 'Metformin 500mg', 'Diabetes Care', 10000, 'Pending', '28 Sep 2026, 04:15 PM'],
      ['TRX-1021', 'Atorvastatin 10mg', 'Cardiology', 9200, 'Paid', '28 Sep 2026, 12:05 PM'],
      ['TRX-1020', 'Ibuprofen 400mg', 'Orthopaedic', 6400, 'Paid', '27 Sep 2026, 05:30 PM']
    ]
  };

  /* ================= state ================= */
  var S = { view: 'booking', preset: 'week', from: null, to: null, service: '', visit: '', txAll: false };
  var SERVICE_OPTS = [['', 'All services']].concat(BASE.services.map(function (s) { return [s[0], s[1]]; }));
  var VISIT_OPTS = [['', 'All visit types'], ['home', 'Home'], ['hospital', 'Hospital']];
  var VIEW_OPTS = [['booking', 'Booking View'], ['bids', 'Bids View'], ['revenue', 'Revenue View']];
  var PRESET_LABEL = { today: 'Today', week: 'Last 7 days', '30days': 'Last 30 days', month: 'This Month', custom: 'Custom' };

  /* ================= helpers ================= */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function fmt(v) { return '₹' + Number(v).toLocaleString('en-IN'); }
  function fmtS(v) { return '₹ ' + Number(v).toLocaleString('en-IN'); }
  function num(v) { return Number(v).toLocaleString('en-IN'); }
  function lakh(v) { return v >= 100000 ? '₹' + (v / 100000).toFixed(1) + 'L' : '₹' + (v / 1000).toFixed(1) + 'k'; }
  function axisMoney(v) { return v === 0 ? '₹0' : (v >= 100000 ? '₹' + (Math.round(v / 10000) / 10) + 'L' : '₹' + (v / 1000) + 'k'); }
  function pick(arr, n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(arr[Math.round(i * (arr.length - 1) / Math.max(1, n - 1))]);
    return out;
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function iso(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parseIso(v) { var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  var toastTimer;
  function toast(msg) {
    var t = $('#hrToast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ================= icons ================= */
  var P = {
    cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M9 15l2 2 4-4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    rupee: '<path d="M7 4h11M7 9h11M10 4c4.5 0 6 1.7 6 4.7S14.5 13 10 13H7l8 7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
    up: '<path d="M7 17L17 7M9 7h8v8"/>',
    down: '<path d="M7 7l10 10M17 9v8H9"/>',
    bars: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'
  };
  function ic(name, size, color, sw) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + P[name] + '</svg>';
  }

  /* ================= date range ================= */
  function range() {
    var end = new Date(REPORT_END), start = new Date(end);
    if (S.preset === 'week') start.setDate(end.getDate() - 6);
    else if (S.preset === '30days') start.setDate(end.getDate() - 29);
    else if (S.preset === 'month') start = new Date(end.getFullYear(), end.getMonth(), 1);
    else if (S.preset === 'custom' && S.from && S.to) { start = S.from; end = S.to; }
    return { start: start, end: end, days: Math.round((end - start) / 864e5) + 1, label: PRESET_LABEL[S.preset] };
  }
  function rangeText(r) {
    var a = r.start, b = r.end, y = b.getFullYear();
    if (r.days === 1) return b.getDate() + ' ' + MON[b.getMonth()] + ' ' + y;
    if (a.getFullYear() === y && a.getMonth() === b.getMonth()) return a.getDate() + '–' + b.getDate() + ' ' + MON[b.getMonth()] + ' ' + y;
    if (a.getFullYear() === y) return a.getDate() + ' ' + MON[a.getMonth()] + ' – ' + b.getDate() + ' ' + MON[b.getMonth()] + ' ' + y;
    return a.getDate() + ' ' + MON[a.getMonth()] + ' ' + a.getFullYear() + ' – ' + b.getDate() + ' ' + MON[b.getMonth()] + ' ' + y;
  }
  function xLabels(r, n, sep) {
    if (r.days === 1) return ['9AM', '11AM', '1PM', '3PM', '5PM', '7PM', '9PM'];
    var out = [];
    for (var i = 0; i < n; i++) {
      var d = new Date(r.start.getTime() + Math.round(i * r.days / n) * 864e5);
      out.push(d.getDate() + sep + MON[d.getMonth()]);
    }
    return out;
  }

  /* ================= numbers for the current filters ================= */
  function calc() {
    var r = range(), days = r.days;
    var svcRow = BASE.services.filter(function (s) { return s[0] === S.service; })[0];
    var svcShare = svcRow ? svcRow[2] / sum(BASE.services.map(function (s) { return s[2]; })) : 1;
    var visit = S.visit === 'home' ? 0.35 : S.visit === 'hospital' ? 0.65 : 1;
    var sv = svcShare * visit, f = days / 7 * sv;
    var n = days === 1 ? 7 : Math.min(7, days), size = days / n;
    var sc = function (x) { return Math.round(x * f); };
    var B = BASE.booking, D = BASE.bids, R = BASE.revenue, O = BASE.offers;
    var M = { r: r, f: f, n: n, range: rangeText(r), lab: xLabels(r, n, ''), lab2: xLabels(r, n, ' ') };

    M.stats = B.stats.map(sc);
    M.trend = pick(B.trend, n).map(function (v) { return Math.round(v * size * sv); });
    M.status = B.status.map(sc);
    M.statusTotal = sum(M.status);
    M.services = BASE.services.filter(function (s) { return !S.service || s[0] === S.service; })
      .map(function (s) { return [s[1], Math.round(s[2] * days / 7 * visit)]; });
    M.cats = O.cats.map(function (k) { return [k[0], sc(k[1]), sc(k[2])]; });
    M.won = sum(M.cats.map(function (k) { return k[1]; }));
    M.lost = sum(M.cats.map(function (k) { return k[2]; }));
    M.answered = M.won + M.lost;
    M.rate = M.answered ? (M.won / M.answered * 100).toFixed(1) : '0.0';
    M.tat = { avg: B.tat.avg, sla: B.tat.sla, overdue: sc(B.tat.overdue), buckets: B.tat.buckets.map(sc) };

    M.bstats = D.stats.map(sc);
    M.btrend = pick(D.trend, n).map(function (v) { return Math.round(v * size * sv); });
    M.bstatus = D.status.map(sc);
    M.bstatusTotal = sum(M.bstatus);

    M.rev = [sc(R.stats[0]), R.stats[1], R.stats[2], sc(R.stats[3])];
    M.rtrend = pick(R.trend, n).map(function (v) { return Math.round(v * size * sv); });
    M.rprev = pick(R.prev, n).map(function (v) { return Math.round(v * size * sv); });
    M.dept = R.dept.map(function (d) { return [d[0], Math.round(d[1] * f)]; });
    return M;
  }

  /* ================= chart helpers (pure SVG) ================= */
  var uid = 0;
  function niceTicks(max, steps, maxInt) {
    for (var mag = 1; mag <= 1e9; mag *= 10) {
      for (var i = 0; i < steps.length; i++) {
        var st = steps[i] * mag;
        if (Math.ceil(max / st) <= maxInt) {
          var top = Math.ceil(max / st) * st, t = [];
          for (var v = 0; v <= top + 1e-9; v += st) t.push(v);
          return t;
        }
      }
    }
    return [0, max];
  }
  function roundBar(x, y0, y1, w, r) {
    r = Math.min(r, w / 2, Math.max(0, y0 - y1));
    return 'M' + x.toFixed(1) + ' ' + y0.toFixed(1) + 'V' + (y1 + r).toFixed(1) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' -' + r + 'h' + (w - 2 * r).toFixed(1) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'V' + y0.toFixed(1) + 'Z';
  }

  function barSvg(o) {
    var W = 720, H = 250, pl = o.yTitle ? 64 : 50, pr = 10, pt = 12, pb = 32;
    var t = niceTicks(Math.max.apply(null, o.values.concat([1])), o.steps || [1, 2, 5, 10], 4), top = t[t.length - 1];
    var n = o.values.length, cw = (W - pl - pr) / n, bw = Math.min(34, cw * 0.5);
    var y = function (v) { return pt + (H - pt - pb) * (1 - v / top); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="' + esc(o.aria) + '">';
    t.forEach(function (v) {
      var yy = y(v).toFixed(1);
      s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '" stroke="#eef1f5"/><text x="' + (pl - 12) + '" y="' + (Number(yy) + 4) + '" text-anchor="end" font-size="11" fill="#6b7a90">' + v + '</text>';
    });
    if (o.yTitle) s += '<text transform="translate(14 ' + ((pt + H - pb) / 2) + ') rotate(-90)" text-anchor="middle" font-size="10" fill="#8a97ab">' + o.yTitle + '</text>';
    o.values.forEach(function (v, i) {
      var cx = pl + cw * i + cw / 2;
      s += '<path d="' + roundBar(cx - bw / 2, y(0), y(v), bw, 3) + '" fill="#3b82f6"><title>' + esc(o.labels[i]) + ': ' + v + '</title></path>';
      s += '<text x="' + cx.toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="#6b7a90">' + esc(o.labels[i]) + '</text>';
    });
    return s + '</svg>';
  }

  function smoothPath(p) {
    var d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function linePath(p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(''); }

  function lineSvg(o) {
    var W = 720, H = o.h || 250, pl = o.pl || 56, pr = 14, pt = o.dl ? 30 : 14, pb = 30, pad = o.pad || 26;
    var tk = o.ticks, top = tk[tk.length - 1], n = o.xl.length, gid = 'hrg' + (uid++);
    var x = function (i) { return pl + pad + (n > 1 ? i * (W - pl - pr - 2 * pad) / (n - 1) : (W - pl - pr - 2 * pad) / 2); };
    var y = function (v) { return pt + (H - pt - pb) * (1 - v / top); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="' + esc(o.aria) + '">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1683ff" stop-opacity=".28"/><stop offset="1" stop-color="#1683ff" stop-opacity=".02"/></linearGradient></defs>';
    tk.forEach(function (v) {
      var yy = y(v).toFixed(1);
      s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '" stroke="#eef1f5"/><text x="' + (pl - 12) + '" y="' + (Number(yy) + 4) + '" text-anchor="end" font-size="10" fill="#8a97ab">' + o.fmtTick(v) + '</text>';
    });
    o.xl.forEach(function (l, i) { s += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#6b7a90">' + esc(l) + '</text>'; });
    o.series.forEach(function (ser) {
      var pts = ser.v.map(function (v, i) { return [x(i), y(v)]; });
      var d = o.smooth ? smoothPath(pts) : linePath(pts);
      if (ser.area) s += '<path d="' + d + 'L' + x(n - 1).toFixed(1) + ' ' + y(0).toFixed(1) + 'L' + x(0).toFixed(1) + ' ' + y(0).toFixed(1) + 'Z" fill="url(#' + gid + ')"/>';
      s += '<path d="' + d + '" fill="none" stroke="' + ser.c + '" stroke-width="' + (ser.w || 2) + '" stroke-linejoin="round" stroke-linecap="round"' + (ser.dash ? ' stroke-dasharray="' + ser.dash + '"' : '') + '/>';
      pts.forEach(function (p, i) {
        var big = ser.big && (i === 0 || i === pts.length - 1);
        if (ser.r || big) s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (big ? 5.5 : ser.r) + '" fill="' + ser.c + '"><title>' + esc(o.xl[i]) + ': ' + (ser.tip ? ser.tip(ser.v[i]) : ser.v[i]) + '</title></circle>';
        if (ser.dl) s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] - 10).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="600" fill="#344054">' + ser.dl(ser.v[i]) + '</text>';
      });
    });
    return s + '</svg>';
  }

  function groupSvg(cats) {
    var W = 440, H = 130, base = 100, max = Math.max.apply(null, [1].concat(cats.map(function (k) { return Math.max(k[1], k[2]); })));
    var cw = W / cats.length, h = function (v) { return v / max * 80; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="Won and lost bids by service">';
    cats.forEach(function (k, i) {
      var cx = cw * i + cw / 2;
      if (k[1] > 0) s += '<path d="' + roundBar(cx - 14, base, base - h(k[1]), 12, 2) + '" fill="#16a34a"><title>' + k[0] + ' won: ' + k[1] + '</title></path>';
      if (k[2] > 0) s += '<path d="' + roundBar(cx + 2, base, base - h(k[2]), 12, 2) + '" fill="#ef4444"><title>' + k[0] + ' lost: ' + k[2] + '</title></path>';
      s += '<text x="' + cx.toFixed(1) + '" y="120" text-anchor="middle" font-size="10" fill="#6b7a90">' + esc(k[0]) + '</text>';
    });
    return s + '</svg>';
  }

  function donut(items, big, small, valFmt) {
    var total = sum(items.map(function (i) { return i.v; })), R = 60, C = 2 * Math.PI * R, off = 0;
    var s = '<div class="hr-donut"><div class="ring"><svg width="160" height="160" viewBox="0 0 160 160" role="img">';
    if (!total) s += '<circle cx="80" cy="80" r="60" fill="none" stroke="#eef2f7" stroke-width="24"/>';
    items.forEach(function (it) {
      var len = total ? C * it.v / total : 0;
      s += '<circle cx="80" cy="80" r="60" fill="none" stroke="' + it.c + '" stroke-width="24" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"><title>' + esc(it.n) + '</title></circle>';
      off += len;
    });
    s += '</svg><div class="ctr"><b>' + big + '</b><span>' + small + '</span></div></div><ul class="hr-legend">';
    items.forEach(function (it) { s += '<li><i style="background:' + it.c + '"></i><span>' + esc(it.n) + '</span><b>' + valFmt(it.v) + '</b></li>'; });
    return s + '</ul></div>';
  }

  function hbars(rows, o) {
    if (!rows.length) return '<p class="hr-sub" style="margin-top:24px">No data for this selection.</p>';
    var max = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    return '<div class="hr-hbars">' + rows.map(function (r, i) {
      var col = o.alt ? (i % 2 ? '#8bb8f7' : '#2f80ed') : '#0b8bff';
      return '<div class="hr-hrow"><span class="nm">' + esc(r[0]) + '</span><span class="tr"><i style="width:' + Math.max(r[1] / max * 100, 2).toFixed(1) + '%;background:' + col + '"></i></span><b>' + (o.money ? fmtS(r[1]) : r[1]) + '</b></div>';
    }).join('') + '</div>';
  }

  /* ================= card builders ================= */
  function stat(icon, bg, color, label, value, d) {
    return '<article class="hr-card hr-stat"><span class="info">' + ic('info', 14) + '</span>' +
      '<div class="top"><span class="ico" style="background:' + bg + ';color:' + color + '">' + ic(icon, 18) + '</span><span class="lbl">' + label + '</span></div>' +
      '<div class="val">' + value + '</div><div class="dl ' + (d[1] ? 'up' : 'down') + '">' + ic(d[1] ? 'up' : 'down', 12) + ' ' + d[0] + '% <em>vs last period</em></div></article>';
  }
  function card(title, sub, body, o) {
    o = o || {};
    return '<article class="hr-card"' + (o.style ? ' style="' + o.style + '"' : '') + '><div class="hr-card-head"><div><h2 class="hr-h">' + (o.icon || '') + title + '</h2>' + (sub ? '<p class="hr-sub">' + sub + '</p>' : '') + '</div>' + (o.right || '') + '</div>' + body + '</article>';
  }
  function legendDots(items) {
    return '<div style="display:flex;flex-wrap:wrap;gap:14px;font-size:10px;color:#667085">' + items.map(function (i) {
      return '<span style="display:flex;align-items:center;gap:5px"><i style="width:8px;height:8px;border-radius:999px;background:' + i[1] + ';display:inline-block"></i>' + i[0] + '</span>';
    }).join('') + '</div>';
  }
  function statusCard(title, M, items, total, unit) {
    return card(title, 'Breakdown by status · period total ' + total, donut(items, total, unit, function (v) { return v; }), {});
  }
  function offersCard(M) {
    var kp = '<div class="hr-kpis"><div><b>' + M.answered + '</b><span>Answered</span></div><div><b class="up">' + M.won + '</b><span>Won</span></div><div><b class="down">' + M.lost + '</b><span>Lost</span></div><div><b>' + M.rate + '%</b><span>Win rate</span></div></div>';
    var body = kp + '<div style="margin-top:14px;border-top:1px solid #eef1f5;padding-top:12px">' + groupSvg(M.cats) + '</div>' +
      '<p class="hr-note">' + BASE.offers.active + ' active bids awaiting customer response are excluded from answered bid totals.</p>';
    return card('Offers &amp; Bids Performance', 'Answered bids · selected period', body, { right: '<a class="hr-link" data-go="bids">View Offers &amp; Bids →</a>' });
  }
  function servicesCard(title, sub, M) {
    return card(title, sub, hbars(M.services, { alt: true }), {});
  }

  /* ================= views ================= */
  function bookingHtml(M) {
    var B = BASE.booking, d = B.delta, s = M.stats;
    var h = '<section class="hr-grid hr-g4">' +
      stat('cal', '#e8f1ff', '#1683ff', 'Total Bookings', num(s[0]), d[0]) +
      stat('check', '#e6f8ee', '#16a34a', 'Completed Bookings', num(s[1]), d[1]) +
      stat('clock', '#fff6dc', '#f5b400', 'Pending Bookings', num(s[2]), d[2]) +
      stat('ban', '#ffe8e8', '#ef4444', 'Cancelled Bookings', num(s[3]), d[3]) + '</section>';

    h += '<section class="hr-grid hr-g2">' +
      card('Bookings Trend', (M.n === 7 && M.r.days <= 7 ? 'Daily bookings' : 'Bookings') + ' · ' + M.range,
        '<div style="margin-top:14px">' + barSvg({ labels: M.lab, values: M.trend, yTitle: 'Number of Bookings', steps: [1, 2, 4, 5, 10], aria: 'Bookings trend' }) + '</div>') +
      statusCard('Booking Status', M, [
        { n: 'Completed', v: M.status[0], c: '#16a34a' }, { n: 'Upcoming / Confirmed', v: M.status[1], c: '#2f80ed' },
        { n: 'Checked-in / In-progress', v: M.status[2], c: '#8b5cf6' }, { n: 'Cancelled / No-show', v: M.status[3], c: '#ef4444' }
      ], M.statusTotal, 'Bookings') + '</section>';

    h += '<section class="hr-grid hr-g2">' + servicesCard('Bookings by Service', 'Booking volume by service', M) + offersCard(M) + '</section>';

    var T = M.tat, tot = sum(T.buckets) || 1, cols = ['#2fc654', '#0789f5', '#ff8c1f', '#ff3737'], names = ['0-4 hrs', '4-8 hrs', '8-24 hrs', '&gt;24 hrs'];
    h += card('Turnaround Time', 'Completed Booking by report completion time',
      '<div class="hr-chips"><span class="hr-chip blue">Avg TAT : ' + T.avg + '</span><span class="hr-chip green">With SLA : ' + T.sla + '</span><span class="hr-chip red">Overdue: ' + T.overdue + ' orders</span></div>' +
      '<div class="hr-tat">' + T.buckets.map(function (v, i) {
        return '<div style="flex:' + Math.max(v / tot * 100, 12).toFixed(1) + ' 1 0;background:' + cols[i] + '"><b>' + names[i] + '</b>' + (i === 3 ? v : v + ' Bookings') + '</div>';
      }).join('') + '</div>' +
      '<p class="hr-note" style="display:flex;align-items:center;gap:6px;margin-top:10px">' + ic('info', 12) + 'SLA target varies by test and package</p>',
      { icon: '', right: '<span style="color:#9aa5b6">' + ic('info', 15) + '</span>' }).replace('hr-h">', 'hr-h">');
    return h;
  }

  function bidsHtml(M) {
    var D = BASE.bids, d = D.delta, s = M.bstats;
    var h = '<section class="hr-grid hr-g4">' +
      stat('cal', '#e8f1ff', '#1683ff', 'Total Bids', num(s[0]), d[0]) +
      stat('check', '#e6f8ee', '#16a34a', 'Accepted Bids', num(s[1]), d[1]) +
      stat('clock', '#fff6dc', '#f5b400', 'Pending Bids', num(s[2]), d[2]) +
      stat('ban', '#ffe8e8', '#ef4444', 'Rejected Bids', num(s[3]), d[3]) + '</section>';

    h += '<section class="hr-grid hr-g2">' +
      card('Bid Trend', 'Total bids over the selected period',
        '<div style="margin-top:14px">' + barSvg({ labels: M.lab2, values: M.btrend, steps: [1, 2, 5, 10], aria: 'Bid trend' }) + '</div>', { icon: '<span style="color:#1683ff;display:flex">' + ic('bars', 16) + '</span>' }) +
      statusCard('Bids Status', M, [
        { n: 'Accepted', v: M.bstatus[0], c: '#16a34a' }, { n: 'Expire', v: M.bstatus[1], c: '#2f80ed' }, { n: 'Rejected', v: M.bstatus[2], c: '#ef4444' }
      ], M.bstatusTotal, 'Bids') + '</section>';

    h += '<section class="hr-grid hr-g2">' + servicesCard('Bids by Service', 'Bid volume by service', M) + offersCard(M) + '</section>';

    var wk = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    h += '<section class="hr-grid hr-g2">' +
      card('Bid Conversion Rate', '', '<div style="margin-top:10px">' + lineSvg({
        xl: wk, ticks: [0, 25, 50, 75], fmtTick: function (v) { return v === 0 ? '0' : v + '%'; }, aria: 'Bid conversion rate', h: 260,
        series: [{ v: D.conv.prev, c: '#22c55e', r: 3, tip: function (v) { return v + '%'; } }, { v: D.conv.cur, c: '#1683ff', r: 3, tip: function (v) { return v + '%'; } }]
      }) + '</div>', { right: legendDots([['Current Period', '#1683ff'], ['Previous Period', '#22c55e']]) }) +
      card('Turnaround Time', 'Average hours to complete reports, current vs previous period, by week', '<div style="margin-top:10px">' + lineSvg({
        xl: wk, ticks: [0, 10, 20, 30, 40], fmtTick: function (v) { return v; }, smooth: true, aria: 'Turnaround time', h: 260,
        series: [{ v: D.tat.prev, c: '#64748b', w: 1.5, dash: '3 3' }, { v: D.tat.cur, c: '#1683ff', w: 2, big: true, tip: function (v) { return v + ' hrs'; } }]
      }) + '</div><div style="margin-top:6px">' + legendDots([['Current Period', '#1683ff'], ['Previous Period', '#64748b']]) + '</div>') + '</section>';
    return h;
  }

  function revenueHtml(M) {
    var R = BASE.revenue, d = R.delta;
    var h = '<section class="hr-grid hr-g4">' +
      stat('rupee', '#e8f1ff', '#1683ff', 'Total Revenue', fmt(M.rev[0]), d[0]) +
      stat('rupee', '#e6f8ee', '#16a34a', 'Avg Revenue per Booking', fmt(M.rev[1]), d[1]) +
      stat('clock', '#fff6dc', '#f5b400', 'Revenue Growth', M.rev[2] + '%', d[2]) +
      stat('ban', '#ffe8e8', '#ef4444', 'Cancelled Revenue', fmt(M.rev[3]), d[3]) + '</section>';

    var max = Math.max.apply(null, M.rtrend.concat(M.rprev, [1])), tk = niceTicks(max, [1, 2, 2.5, 5, 10], 5);
    var payTotal = M.rev[0], cols = ['#1683ff', '#6d5bf6', '#22c55e'];
    h += '<section class="hr-grid hr-g2">' +
      card('Revenue Trend', 'Your revenue over the selected period', '<div style="margin-top:14px">' + lineSvg({
        xl: M.lab2, ticks: tk, fmtTick: axisMoney, dl: true, smooth: false, aria: 'Revenue trend', h: 250, pl: 58,
        series: [{ v: M.rprev, c: '#6d5bf6', w: 1.5, dash: '4 4', r: 2.5 }, { v: M.rtrend, c: '#1683ff', w: 2, r: 3.5, area: true, dl: lakh, tip: fmt }]
      }) + '</div>', {
        icon: '<span style="color:#1683ff;display:flex">' + ic('bars', 16) + '</span>',
        right: legendDots([['Revenue', '#1683ff'], ['Previous Period [ ' + M.r.label + ' ]', '#6d5bf6']])
      }) +
      card('Payment Method Breakdown', 'Share of payments received', donut(R.pay.map(function (p, i) { return { n: p[0], v: p[1], c: cols[i] }; }), '₹ ' + num(payTotal), 'Total', function (v) { return v.toFixed(1) + '%'; }),
        { icon: '<span style="color:#1683ff;display:flex">' + ic('rupee', 16) + '</span>' }) + '</section>';

    h += card('Revenue by Department', 'Contribution by department', hbars(M.dept, { money: true }), { icon: '<span style="color:#1683ff;display:flex">' + ic('grid', 16) + '</span>' });

    var rows = S.txAll ? BASE.tx : BASE.tx.slice(0, 3);
    h += '<article class="hr-card" style="padding:0;overflow:hidden"><div class="hr-card-head" style="padding:18px 20px 14px"><div><h2 class="hr-h"><span style="color:#1683ff;display:flex">' + ic('clock', 18) + '</span>Recent Transactions</h2><p class="hr-sub">Latest revenue transactions</p></div>' +
      '<a class="hr-link" id="hrTxToggle" style="font-size:12px">' + (S.txAll ? 'Show less' : 'View All') + ' →</a></div>' +
      '<div class="hr-scroll"><table class="hr-table"><thead><tr><th>Transaction ID</th><th>Medicine</th><th>Department</th><th>Amount</th><th>Status</th><th>Date &amp; Time</th></tr></thead><tbody>' +
      rows.map(function (t) {
        return '<tr><td>' + t[0] + '</td><td><b style="color:#111c2e">' + esc(t[1]) + '</b></td><td>' + esc(t[2]) + '</td><td><b style="color:#111c2e">' + fmtS(t[3]) + '</b></td><td><span class="hr-pill ' + t[4].toLowerCase() + '">' + t[4] + '</span></td><td>' + t[5] + '</td></tr>';
      }).join('') + '</tbody></table></div></article>';
    return h;
  }

  /* ================= render ================= */
  var lastM = null;
  function render() {
    var M = lastM = calc();
    $('#hrViewBooking').innerHTML = bookingHtml(M);
    $('#hrViewBids').innerHTML = bidsHtml(M);
    $('#hrViewRevenue').innerHTML = revenueHtml(M);
    $('#hrViewBooking').hidden = S.view !== 'booking';
    $('#hrViewBids').hidden = S.view !== 'bids';
    $('#hrViewRevenue').hidden = S.view !== 'revenue';
    $('#hrDateLabel').textContent = M.r.label + ' · ' + M.range;
  }
  function changed() {
    render();
    document.dispatchEvent(new CustomEvent('hospitalReportFilterChange', {
      detail: { preset: S.preset, start: iso(lastM.r.start), end: iso(lastM.r.end), service: S.service, visit: S.visit, view: S.view }
    }));
  }

  /* ================= dropdowns ================= */
  function closeMenus() { $$('.hr-menu.open').forEach(function (m) { m.classList.remove('open'); }); }
  $$('.hr-dd').forEach(function (dd) {
    var menu = $('.hr-menu', dd);
    $('[data-toggle]', dd).addEventListener('click', function (e) {
      e.stopPropagation();
      var was = menu.classList.contains('open');
      closeMenus();
      if (!was) menu.classList.add('open');
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
  });
  document.addEventListener('click', closeMenus);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeMenus();
    closeExport();
  });

  function fillMenu(id, opts, get, set) {
    var dd = $('#' + id), menu = $('.hr-menu', dd);
    menu.innerHTML = opts.map(function (o) { return '<button type="button" class="hr-opt' + (o[0] === get() ? ' active' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('');
    $$('.hr-opt', menu).forEach(function (b) {
      b.addEventListener('click', function () {
        set(b.getAttribute('data-v'));
        $('[data-label]', dd).textContent = b.textContent;
        $$('.hr-opt', menu).forEach(function (x) { x.classList.toggle('active', x === b); });
        menu.classList.remove('open');
      });
    });
  }
  fillMenu('hrServiceDd', SERVICE_OPTS, function () { return S.service; }, function (v) { S.service = v; changed(); });
  fillMenu('hrVisitDd', VISIT_OPTS, function () { return S.visit; }, function (v) { S.visit = v; changed(); });
  fillMenu('hrViewDd', VIEW_OPTS, function () { return S.view; }, function (v) { S.view = v; changed(); });

  function setView(v) {
    S.view = v;
    var o = VIEW_OPTS.filter(function (x) { return x[0] === v; })[0];
    $('#hrViewDd [data-label]').textContent = o[1];
    $$('#hrViewDd .hr-opt').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-v') === v); });
    changed();
  }

  /* date dropdown */
  $$('#hrDateDd [data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.getAttribute('data-preset');
      $$('#hrDateDd [data-preset]').forEach(function (x) { x.classList.toggle('active', x === b); });
      if (p === 'custom') {
        $('#hrCustomBox').style.display = 'block';
        var r = range();
        $('#hrFrom').value = iso(r.start); $('#hrTo').value = iso(r.end);
        return;
      }
      $('#hrCustomBox').style.display = 'none';
      S.preset = p; S.from = S.to = null;
      closeMenus();
      changed();
    });
  });
  $('#hrCustomCancel').addEventListener('click', function () { $('#hrCustomBox').style.display = 'none'; closeMenus(); });
  $('#hrCustomApply').addEventListener('click', function () {
    var f = $('#hrFrom').value, t = $('#hrTo').value;
    if (!f || !t) { toast('Select both dates'); return; }
    if (f > t) { toast('From date cannot be after To date'); return; }
    S.preset = 'custom'; S.from = parseIso(f); S.to = parseIso(t);
    $('#hrCustomBox').style.display = 'none';
    closeMenus();
    changed();
  });

  $('#hrRefresh').addEventListener('click', function () {
    var i = $('#hrRefreshIcon');
    i.classList.remove('hr-spin'); void i.getBoundingClientRect(); i.classList.add('hr-spin');
    changed();
    toast('Report refreshed');
  });

  root.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); setView(go.getAttribute('data-go')); return; }
    if (e.target.closest('#hrTxToggle')) { S.txAll = !S.txAll; render(); }
  });

  /* ================= export ================= */
  var modal = $('#hrExportModal'), exType = 'Full Performance Report', exFormat = 'pdf';
  function closeExport() { modal.classList.remove('open'); }
  $('#hrOpenExport').addEventListener('click', function () {
    var r = range();
    $('#hrExFrom').value = iso(r.start); $('#hrExTo').value = iso(r.end);
    $('#hrExError').style.display = 'none';
    modal.classList.add('open');
  });
  $$('[data-hr-close]', modal).forEach(function (b) { b.addEventListener('click', closeExport); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeExport(); });
  $$('.hr-type', modal).forEach(function (b) {
    b.addEventListener('click', function () {
      exType = b.getAttribute('data-type');
      $$('.hr-type', modal).forEach(function (x) { x.classList.toggle('active', x === b); });
    });
  });
  $$('#hrFormats button').forEach(function (b) {
    b.addEventListener('click', function () {
      exFormat = b.getAttribute('data-format');
      $$('#hrFormats button').forEach(function (x) { x.classList.toggle('active', x === b); });
    });
  });

  function note(text) { return { title: text.t, head: ['Note'], rows: [[text.m]] }; }
  function exportTables(sections) {
    var M = calc(), out = [], B = BASE.booking, D = BASE.bids, R = BASE.revenue;
    if (sections.indexOf('kpi') >= 0) {
      out.push({ title: 'Overview & KPI', head: ['Metric', 'Value'], rows: [
        ['Total Bookings', M.stats[0]], ['Completed Bookings', M.stats[1]], ['Pending Bookings', M.stats[2]], ['Cancelled Bookings', M.stats[3]],
        ['Total Bids', M.bstats[0]], ['Accepted Bids', M.bstats[1]], ['Pending Bids', M.bstats[2]], ['Rejected Bids', M.bstats[3]],
        ['Total Revenue', fmt(M.rev[0])], ['Avg Revenue per Booking', fmt(M.rev[1])], ['Revenue Growth', M.rev[2] + '%'], ['Cancelled Revenue', fmt(M.rev[3])]
      ] });
    }
    if (sections.indexOf('earnings') >= 0) {
      out.push({ title: 'Revenue by Department', head: ['Department', 'Revenue'], rows: M.dept.map(function (d) { return [d[0], fmt(d[1])]; }) });
      out.push({ title: 'Payment Methods', head: ['Method', 'Share'], rows: R.pay.map(function (p) { return [p[0], p[1].toFixed(1) + '%']; }) });
      out.push({ title: 'Recent Transactions', head: ['Transaction ID', 'Medicine', 'Department', 'Amount', 'Status', 'Date & Time'], rows: BASE.tx.map(function (t) { return [t[0], t[1], t[2], fmt(t[3]), t[4], t[5]]; }) });
    }
    if (sections.indexOf('appointments') >= 0) {
      out.push({ title: 'Bookings Trend', head: ['Period', 'Bookings'], rows: M.lab2.map(function (l, i) { return [l, M.trend[i]]; }) });
      out.push({ title: 'Booking Status', head: ['Status', 'Count'], rows: [['Completed', M.status[0]], ['Upcoming / Confirmed', M.status[1]], ['Checked-in / In-progress', M.status[2]], ['Cancelled / No-show', M.status[3]]] });
      out.push({ title: 'Bookings by Service', head: ['Service', 'Bookings'], rows: M.services });
    }
    if (sections.indexOf('patients') >= 0) out.push(note({ t: 'Patient list', m: 'Patient-level rows are not part of the demo data. Connect this section to your server export.' }));
    if (sections.indexOf('bids') >= 0) {
      out.push({ title: 'Bid Trend', head: ['Period', 'Bids'], rows: M.lab2.map(function (l, i) { return [l, M.btrend[i]]; }) });
      out.push({ title: 'Bid Status', head: ['Status', 'Count'], rows: [['Accepted', M.bstatus[0]], ['Expire', M.bstatus[1]], ['Rejected', M.bstatus[2]]] });
      out.push({ title: 'Bid Conversion Rate', head: ['Week', 'Current Period', 'Previous Period'], rows: D.conv.cur.map(function (v, i) { return ['Week ' + (i + 1), v + '%', D.conv.prev[i] + '%']; }) });
    }
    if (sections.indexOf('orders') >= 0) out.push(note({ t: 'Order History', m: 'Order-level rows are not part of the demo data. Connect this section to your server export.' }));
    return out;
  }

  $('#hrExGenerate').addEventListener('click', function () {
    var sections = $$('#hrSections input:checked').map(function (c) { return c.value; });
    if (!sections.length) { $('#hrExError').style.display = 'block'; return; }
    var tables = exportTables(sections);
    var f = $('#hrExFrom').value, t = $('#hrExTo').value;
    var period = f && t ? f + ' to ' + t : lastM.range;
    var stamp = new Date().toLocaleString('en-IN');
    var base = exType.replace(/\s+/g, '_') + '_' + iso(new Date());

    if (exFormat === 'csv') {
      var q = function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; };
      var csv = [q(exType), q(HOSPITAL), q('Period: ' + period), q('Generated: ' + stamp), ''];
      tables.forEach(function (tb) {
        csv.push(q(tb.title)); csv.push(tb.head.map(q).join(','));
        tb.rows.forEach(function (r) { csv.push(r.map(q).join(',')); });
        csv.push('');
      });
      download(base + '.csv', csv.join('\n'), 'text/csv');
    } else {
      var html = '<h2>' + esc(exType) + '</h2><p>' + esc(HOSPITAL) + '<br>Period: ' + esc(period) + '<br>Generated: ' + esc(stamp) + '</p>' +
        tables.map(function (tb) {
          return '<h3>' + esc(tb.title) + '</h3><table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:12px"><tr>' +
            tb.head.map(function (h) { return '<th style="background:#eef5ff;text-align:left">' + esc(h) + '</th>'; }).join('') + '</tr>' +
            tb.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
        }).join('');
      if (exFormat === 'xls') {
        download(base + '.xls', '<html><head><meta charset="utf-8"></head><body style="font-family:Arial">' + html + '</body></html>', 'application/vnd.ms-excel');
      } else {
        var w = window.open('', '_blank');
        if (!w) { toast('Allow pop-ups to download the PDF'); return; }
        w.document.write('<html><head><title>' + esc(base) + '</title><meta charset="utf-8"></head><body style="font-family:Arial;padding:24px">' + html + '</body></html>');
        w.document.close(); w.focus();
        setTimeout(function () { w.print(); }, 300);
      }
    }
    closeExport();
    toast('Report generated');
  });

  /* ================= public hook for your backend ================= */
  // HospitalReports.setData({ booking: {...}, bids: {...}, revenue: {...}, services: [...], tx: [...] })
  // replaces the matching blocks of the demo data above and re-renders.
  window.HospitalReports = {
    setData: function (patch) { Object.keys(patch || {}).forEach(function (k) { BASE[k] = patch[k]; }); render(); },
    render: render,
    getState: function () { return JSON.parse(JSON.stringify(S)); }
  };

  /* ================= init ================= */
  var qs = new URLSearchParams(window.location.search);
  if (qs.get('view') && VIEW_OPTS.some(function (v) { return v[0] === qs.get('view'); })) setView(qs.get('view'));
  else render();
})();