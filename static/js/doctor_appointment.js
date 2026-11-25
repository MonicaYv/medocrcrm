(function () {
    var $ = function (s) {
      return document.querySelector(s);
    };
    var $$ = function (s) {
      return Array.prototype.slice.call(document.querySelectorAll(s));
    };
    var esc = function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c];
      });
    };
    var MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    var STATUS = {
      completed: "Completed",
      progress: "In Progress",
      confirmed: "Confirmed",
      pending: "Pending",
      awaiting: "Awaiting Bid",
      bidsent: "Bid Submitted",
      cancelled: "Cancelled",
      declined: "Declined",
      missed: "Missed",
    };
    var PENDING = ["awaiting", "bidsent"];
    var LOC = {
      "Clinic Visit": "MedOCR Clinic, New Delhi",
      "Hospital Visit": "Sunrise Hospital, OPD A",
      "Home Visit": "Patient home",
      "Video Call": "Online",
      "Voice Call": "Online",
    };
    var KEY = "aptSampleRows4";
    var TODAY = "2026-10-12";
    var NOW = "2026-10-12T16:30";

    /* ---- Tailwind class tokens (full literals so the Tailwind scanner can see them; shazam-blue comes from your theme) ---- */
    var BTN =
      "text-sm font-semibold px-[18px] py-[9px] rounded-lg border cursor-pointer transition-colors ";
    var B = {
      def:
        BTN + "border-shazam-blue text-shazam-blue bg-white hover:bg-blue-50",
      primary:
        BTN + "border-shazam-blue bg-shazam-blue text-white hover:opacity-90",
      gray: BTN + "border-gray-400 text-gray-500 bg-white hover:bg-gray-100",
      danger:
        BTN + "border-[#ff3b3b] bg-[#ff3b3b] text-white hover:bg-[#e62e2e]",
      dangero: BTN + "border-[#ff3b3b] text-[#ff3b3b] bg-white hover:bg-red-50",
    };
    var INPUT =
      "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-shazam-blue focus:ring-[3px] focus:ring-blue-100";
    var NOTE =
      "bg-blue-50 border border-blue-100 text-shazam-blue text-[16px] px-4 py-3 rounded-[10px]";
    var PCARD =
      "flex items-center gap-3.5 bg-slate-50 border border-slate-200 rounded-xl px-[18px] py-3.5 mb-[18px]";
    var AV =
      "rounded-full bg-shazam-blue text-white font-semibold flex items-center justify-center shrink-0";
   var SLOT =
  "min-w-[230px] shrink-0 border border-slate-200 border-l-4 border-l-shazam-blue rounded-[10px] px-4 py-3 text-left bg-white shadow-md hover:border-shazam-blue";
    var LI =
      "relative mb-[18px] before:content-[''] before:absolute before:-left-[29px] before:top-1 before:w-2.5 before:h-2.5 before:rounded-full before:bg-shazam-blue";
    var TAB_BASE = "text-[14px] py-3 border-b-2 whitespace-nowrap";
    var TAB_ON = "text-shazam-blue border-shazam-blue font-medium";
    var TAB_OFF = "text-slate-600 border-transparent font-normal";
    var MAIN_ON = "text-shazam-blue border-shazam-blue font-semibold";
    var MAIN_OFF = "text-slate-600 border-transparent font-normal";
    var PILL = {
      completed: "bg-green-50 text-green-700 border-green-200",
      confirmed: "bg-green-50 text-green-500 border-green-100",
      progress: "bg-amber-50 text-yellow-500 border-yellow-200",
      pending: "bg-orange-50 text-orange-600 border-orange-200",
      awaiting: "bg-amber-50 text-yellow-500 border-yellow-100",
      bidsent: "bg-blue-50 text-blue-600 border-blue-200",
      cancelled: "bg-gray-200 text-gray-500 border-gray-300",
      declined: "bg-gray-200 text-gray-500 border-gray-300",
      missed: "bg-cyan-50 text-cyan-500 border-cyan-100",
      draft: "bg-gray-200 text-gray-500 border-transparent",
    };
    var SLOT_TXT = {
      completed: "text-green-700",
      progress: "text-yellow-500",
      confirmed: "text-green-500",
      pending: "text-orange-600",
      cancelled: "text-gray-500",
      missed: "text-cyan-500",
    };
    function setCls(el, on, onCls, offCls) {
      onCls.split(" ").forEach(function (c) {
        el.classList.toggle(c, on);
      });
      offCls.split(" ").forEach(function (c) {
        el.classList.toggle(c, !on);
      });
    }
    function mark(el) {
      el.classList.remove("border-slate-200");
      el.classList.add("border-red-500");
    }
    function unerr(el) {
      if (el && el.classList && el.classList.contains("border-red-500")) {
        el.classList.remove("border-red-500");
        el.classList.add("border-slate-200");
      }
    }

    var I = {
      eye: '<svg class="w-5 h-5 cursor-pointer text-shazam-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
      doc: '<svg class="w-5 h-5 cursor-pointer text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
      dl: '<svg class="w-5 h-5 cursor-pointer text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>',
      go: '<svg class="w-5 h-5 cursor-pointer text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 8l4 4-4 4M13 8l4 4-4 4"/></svg>',
      check:
        '<svg class="w-5 h-5 cursor-pointer text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
      cam: '<svg class="w-5 h-5 cursor-pointer text-shazam-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/></svg>',
      resch:
        '<svg class="w-5 h-5 cursor-pointer text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 01-15.5 6.2M3 12a9 9 0 0115.5-6.2M18 3v4h-4M6 21v-4h4"/></svg>',
      cdoc: '<svg class="w-5 h-5 cursor-pointer text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
      chev: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
    };

    function seed() {
      function r(n, name, age, g, issue, urg, time, mode, fee, st) {
        return {
          id: "APT-" + n,
          pid: "PAT-" + n,
          name: name,
          age: age,
          gender: g,
          issue: issue,
          urgency: urg,
          date: TODAY,
          time: time,
          dur: 30,
          mode: mode,
          fee: fee,
          status: st,
          loc: LOC[mode],
          reason: issue,
          summary: "",
          rating: "",
          rx: null,
          activity: [],
        };
      }
      var a = [
        r(
          3301,
          "Rachel Kate",
          25,
          "Female",
          "Respiratory review",
          "Normal",
          "09:00",
          "Clinic Visit",
          400,
          "completed",
        ),
        r(
          3302,
          "Karen Cooper",
          41,
          "Female",
          "Vascular follow-up",
          "Normal",
          "09:30",
          "Home Visit",
          500,
          "progress",
        ),
        r(
          3303,
          "Josh Kerr",
          52,
          "Male",
          "Diabetes review",
          "Normal",
          "10:00",
          "Video Call",
          700,
          "progress",
        ),
        r(
          3304,
          "Dolly Paris",
          36,
          "Female",
          "Kidney stone follow-up",
          "Priority",
          "10:30",
          "Hospital Visit",
          300,
          "confirmed",
        ),
        r(
          3305,
          "Steve Lamark",
          47,
          "Male",
          "Back pain",
          "Normal",
          "11:00",
          "Home Visit",
          200,
          "confirmed",
        ),
        r(
          3306,
          "Nisha Kapoor",
          29,
          "Female",
          "Anxiety follow-up",
          "Normal",
          "11:30",
          "Video Call",
          400,
          "confirmed",
        ),
        r(
          3307,
          "Mohan Das",
          58,
          "Male",
          "Fever and cold",
          "Normal",
          "12:00",
          "Voice Call",
          500,
          "confirmed",
        ),
        r(
          3308,
          "Priya Sharma",
          31,
          "Female",
          "Skin rash",
          "Normal",
          "12:30",
          "Clinic Visit",
          700,
          "confirmed",
        ),
      
        r(
          3310,
          "Sunita Rao",
          62,
          "Female",
          "Joint pain",
          "Priority",
          "15:00",
          "Hospital Visit",
          600,
          "confirmed",
        ),
        r(
          3311,
          "Vikram Joshi",
          39,
          "Male",
          "Migraine review",
          "Normal",
          "16:30",
          "Video Call",
          500,
          "confirmed",
        ),
        r(
          3312,
          "Meera Nair",
          27,
          "Female",
          "Allergy consult",
          "Normal",
          "17:30",
          "Voice Call",
          300,
          "confirmed",
        ),
      ];
      a[0].rating = "5/5";
      function u(n, p, name, age, g, issue, urg, time, mode, fee, date) {
        var x = r(n, name, age, g, issue, urg, time, mode, fee, "confirmed");
        x.pid = "PAT-" + p;
        x.date = date || "2026-10-13";
        return x;
      }
      a.push(
        u(
          3401,
          3301,
          "Rachel Kate",
          25,
          "Female",
          "Respiratory review",
          "Normal",
          "09:00",
          "Clinic Visit",
          400,
        ),
        u(
          3402,
          3302,
          "Karen Cooper",
          41,
          "Female",
          "Vascular follow-up",
          "Normal",
          "09:30",
          "Home Visit",
          500,
        ),
        u(
          3403,
          3303,
          "Josh Kerr",
          52,
          "Male",
          "Diabetes review",
          "Normal",
          "10:00",
          "Video Call",
          700,
        ),
        u(
          3404,
          3304,
          "Dolly Paris",
          36,
          "Female",
          "Kidney stone follow-up",
          "Priority",
          "10:30",
          "Hospital Visit",
          300,
        ),
        u(
          3405,
          3305,
          "Steve Lamark",
          47,
          "Male",
          "Back pain",
          "Normal",
          "11:00",
          "Home Visit",
          200,
        ),
        u(
          3406,
          3306,
          "Nisha Kapoor",
          29,
          "Female",
          "Anxiety follow-up",
          "Normal",
          "11:30",
          "Video Call",
          400,
        ),
        u(
          3407,
          3307,
          "Mohan Das",
          58,
          "Male",
          "Fever and cold",
          "Normal",
          "12:00",
          "Voice Call",
          500,
        ),
        u(
          3408,
          3308,
          "Priya Sharma",
          31,
          "Female",
          "Skin rash",
          "Normal",
          "12:30",
          "Clinic Visit",
          700,
        ),
        u(
          3409,
          3309,
          "Amit Verma",
          44,
          "Male",
          "Blood pressure check",
          "Normal",
          "14:00",
          "Clinic Visit",
          400,
          "2026-10-14",
        ),
        u(
          3410,
          3310,
          "Sunita Rao",
          62,
          "Female",
          "Joint pain",
          "Priority",
          "15:00",
          "Hospital Visit",
          600,
          "2026-10-14",
        ),
        u(
          3411,
          3311,
          "Vikram Joshi",
          39,
          "Male",
          "Migraine review",
          "Normal",
          "16:30",
          "Video Call",
          500,
          "2026-10-15",
        ),
        u(
          3412,
          3312,
          "Meera Nair",
          27,
          "Female",
          "Allergy consult",
          "Normal",
          "17:30",
          "Voice Call",
          300,
          "2026-10-15",
        ),
      );

      /* ---- Pending tab: incoming patient requests (REQ-xxx) ---- */
      function q(n, name, age, g, issue, urg, time, mode, fee) {
        var x = r(n, name, age, g, issue, urg, time, mode, fee, "awaiting");
        x.id = "REQ-" + n;
        x.pid = "PAT-R0" + (n - 500);
        x.date = "2026-10-13";
        x.requirements = "Sample patient request for consultation.";
        x.bid = null;
        return x;
      }
      a.push(
        q(
          501,
          "Ravi Shankar",
          34,
          "Male",
          "Respiratory review",
          "Priority",
          "09:00",
          "Clinic Visit",
          800,
        ),
        q(
          502,
          "Anita Bose",
          46,
          "Female",
          "Vascular follow-up",
          "Normal",
          "10:00",
          "Hospital Visit",
          400,
        ),
        q(
          503,
          "Rohit Das",
          55,
          "Male",
          "Diabetes review",
          "Normal",
          "11:00",
          "Home Visit",
          550,
        ),
        q(
          504,
          "Geeta Iyer",
          38,
          "Female",
          "Kidney stone follow-up",
          "Normal",
          "12:00",
          "Video Call",
          300,
        ),
        q(
          505,
          "Manoj Kumar",
          49,
          "Male",
          "Back pain",
          "Normal",
          "14:00",
          "Voice Call",
          500,
        ),
        q(
          506,
          "Shweta Jain",
          30,
          "Female",
          "Anxiety follow-up",
          "Normal",
          "15:00",
          "Clinic Visit",
          350,
        ),
      );

      /* ---- History: completed / cancelled / missed ---- */
      function hist(
        n,
        p,
        name,
        age,
        g,
        issue,
        urg,
        time,
        mode,
        fee,
        st,
        date,
        note,
        rx,
      ) {
        var x = r(n, name, age, g, issue, urg, time, mode, fee, st);
        x.pid = "PAT-" + p;
        x.date = date;
        if (st === "cancelled")
          x.cancel = cancelInfo(note.replace(/^Cancelled: /, ""), date);
        if (st === "missed")
          x.noshow = {
            cls: "Patient no-show",
            reason: note.replace(/^Marked as missed: /, ""),
          };
        if (rx)
          x.rx = {
            dx: "Illustrative sample entry",
            meds: [],
            instr: "Illustrative sample entry",
            clin: "Dr. Aarav Shah",
            final: true,
          };
        return x;
      }
      a.push(
        hist(
          3280,
          3301,
          "Rachel Kate",
          25,
          "Female",
          "Respiratory review",
          "Normal",
          "09:00",
          "Clinic Visit",
          400,
          "completed",
          "2026-10-11",
          "",
          1,
        ),
        hist(
          3279,
          3302,
          "Karen Cooper",
          41,
          "Female",
          "Vascular follow-up",
          "Normal",
          "11:00",
          "Hospital Visit",
          500,
          "completed",
          "2026-10-10",
          "",
          1,
        ),
        hist(
          3278,
          3303,
          "Josh Kerr",
          52,
          "Male",
          "Diabetes review",
          "Normal",
          "11:00",
          "Home Visit",
          700,
          "completed",
          "2026-10-10",
          "",
          1,
        ),
        hist(
          3277,
          3304,
          "Dolly Paris",
          36,
          "Female",
          "Kidney stone follow-up",
          "Priority",
          "14:00",
          "Video Call",
          300,
          "completed",
          "2026-10-09",
          "",
          0,
        ),
        hist(
          3276,
          3305,
          "Steve Lamark",
          47,
          "Male",
          "Back pain",
          "Normal",
          "14:00",
          "Voice Call",
          200,
          "completed",
          "2026-10-09",
          "",
          1,
        ),
        hist(
          3275,
          3306,
          "Nisha Kapoor",
          29,
          "Female",
          "Anxiety follow-up",
          "Normal",
          "12:00",
          "Clinic Visit",
          400,
          "completed",
          "2026-10-08",
          "",
          1,
        ),
        hist(
          3274,
          3307,
          "Mohan Das",
          58,
          "Male",
          "Fever and cold",
          "Normal",
          "15:00",
          "Hospital Visit",
          500,
          "completed",
          "2026-10-08",
          "",
          1,
        ),
        hist(
          3273,
          3308,
          "Priya Sharma",
          31,
          "Female",
          "Skin rash",
          "Normal",
          "10:00",
          "Clinic Visit",
          700,
          "completed",
          "2026-10-07",
          "",
          0,
        ),
        hist(
          3272,
          3309,
          "Amit Verma",
          44,
          "Male",
          "Blood pressure check",
          "Normal",
          "16:00",
          "Video Call",
          400,
          "completed",
          "2026-10-07",
          "",
          1,
        ),
        hist(
          3271,
          3310,
          "Sunita Rao",
          62,
          "Female",
          "Joint pain",
          "Priority",
          "09:30",
          "Hospital Visit",
          600,
          "completed",
          "2026-10-06",
          "",
          1,
        ),

        hist(
          3266,
          3312,
          "Meera Nair",
          27,
          "Female",
          "Allergy consult",
          "Normal",
          "17:30",
          "Voice Call",
          300,
          "cancelled",
          "2026-10-11",
          "Cancelled: Patient request",
        ),
        hist(
          3265,
          3311,
          "Vikram Joshi",
          39,
          "Male",
          "Migraine review",
          "Normal",
          "16:00",
          "Video Call",
          500,
          "cancelled",
          "2026-10-11",
          "Cancelled: Schedule conflict",
        ),
        hist(
          3264,
          3309,
          "Amit Verma",
          44,
          "Male",
          "Blood pressure check",
          "Normal",
          "14:00",
          "Clinic Visit",
          400,
          "cancelled",
          "2026-10-10",
          "Cancelled: Doctor unavailable",
        ),
        hist(
          3263,
          3308,
          "Priya Sharma",
          31,
          "Female",
          "Skin rash",
          "Normal",
          "12:30",
          "Clinic Visit",
          700,
          "cancelled",
          "2026-10-09",
          "Cancelled: Patient request",
        ),
        hist(
          3262,
          3307,
          "Mohan Das",
          58,
          "Male",
          "Fever and cold",
          "Normal",
          "12:00",
          "Voice Call",
          500,
          "cancelled",
          "2026-10-09",
          "Cancelled: Schedule conflict",
        ),
        hist(
          3261,
          3305,
          "Steve Lamark",
          47,
          "Male",
          "Back pain",
          "Normal",
          "11:00",
          "Home Visit",
          200,
          "cancelled",
          "2026-10-08",
          "Cancelled: Patient request",
        ),
        hist(
          3260,
          3306,
          "Nisha Kapoor",
          29,
          "Female",
          "Anxiety follow-up",
          "Normal",
          "11:30",
          "Video Call",
          400,
          "cancelled",
          "2026-10-08",
          "Cancelled: Other",
        ),

        hist(
          3254,
          3312,
          "Meera Nair",
          27,
          "Female",
          "Allergy consult",
          "Normal",
          "17:30",
          "Voice Call",
          300,
          "missed",
          "2026-10-09",
          "Marked as missed: Patient did not attend",
        ),
        hist(
          3253,
          3311,
          "Vikram Joshi",
          39,
          "Male",
          "Migraine review",
          "Normal",
          "16:30",
          "Video Call",
          500,
          "missed",
          "2026-10-08",
          "Marked as missed: Patient unreachable",
        ),
        hist(
          3252,
          3310,
          "Sunita Rao",
          62,
          "Female",
          "Joint pain",
          "Priority",
          "15:00",
          "Hospital Visit",
          600,
          "missed",
          "2026-10-07",
          "Marked as missed: Patient arrived too late",
        ),
        hist(
          3251,
          3309,
          "Amit Verma",
          44,
          "Male",
          "Blood pressure check",
          "Normal",
          "14:00",
          "Clinic Visit",
          400,
          "missed",
          "2026-10-06",
          "Marked as missed: Patient did not attend",
        ),
      );
      return a;
    }
    function loadRows() {
      try {
        var s = localStorage.getItem(KEY);
        if (s) return JSON.parse(s);
      } catch (e) {}
      return seed();
    }
    function saveRows() {
      try {
        localStorage.setItem(KEY, JSON.stringify(S.rows));
      } catch (e) {}
    }

    var S = {
      rows: loadRows(),
      tab: "today",
      q: "",
      page: 1,
      size: 8,
      date: TODAY,
      f: {
        mode: "All mode",
        status: "All Status",
        urgency: "All Urgency",
        time: "All Time",
      },
      cur: null,
      rxFrom: null,
      discardFor: null,
    };

    var OPTS = {
      mode: [
        "All mode",
        "Clinic Visit",
        "Hospital Visit",
        "Home Visit",
        "Video Call",
        "Voice Call",
      ],
      status: [
        "All Status",
        "Confirmed",
        "In Progress",
        "Awaiting Bid",
        "Bid Submitted",
        "Completed",
        "Cancelled",
        "Declined",
        "Missed",
      ],
      urgency: ["All Urgency", "Normal", "Priority"],
      time: ["All Time", "Morning", "Afternoon", "Evening"],
    };

    function fmtDate(iso) {
      var p = iso.split("-");
      return +p[2] + " " + MONTHS[+p[1] - 1] + " " + p[0];
    }
    function fmtTime(t) {
      var p = t.split(":"),
        h = +p[0];
      return (h % 12 || 12) + ":" + p[1] + " " + (h >= 12 ? "PM" : "AM");
    }
    function initials(n) {
      return n
        .split(/\s+/)
        .map(function (w) {
          return w[0];
        })
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    function pill(st, label, big) {
      return (
        '<span class="inline-flex items-center leading-none rounded-full border font-medium whitespace-nowrap ' +
        (big ? "text-xs px-3 py-1.5 " : "text-xs px-2.5 py-1 ") +
        PILL[st] +
        '">' +
        (label || STATUS[st]) +
        "</span>"
      );
    }
    function byId(id) {
      return S.rows.filter(function (a) {
        return a.id === id;
      })[0];
    }
    function isReq(st) {
      return PENDING.indexOf(st) > -1 || st === "declined";
    }
    function deadline(a) {
      var p = a.time.split(":"),
        h = +p[0] - 1;
      return (
        fmtDate(a.date) +
        ", " +
        fmtTime((h < 10 ? "0" : "") + h + ":" + p[1]).toLowerCase()
      );
    }
    function toast(msg) {
      var t = $("#aptToast");
      t.textContent = msg;
      t.classList.remove("hidden");
      clearTimeout(toast.h);
      toast.h = setTimeout(function () {
        t.classList.add("hidden");
      }, 2400);
    }
    function pcard(a, st) {
      st = st || a.status;
      return (
        '<div class="' +
        PCARD +
        '"><span class="' +
        AV +
        ' w-12 h-12 text-base">' +
        initials(a.name) +
        '</span><div><div class="flex items-center gap-2"><b class="text-base">' +
        esc(a.name) +
        "</b>" +
        pill(st) +
        '</div><div class="text-xs text-slate-500 mt-0.5">' +
        a.id +
        " · " +
        a.pid +
        "</div></div></div>"
      );
    }
    function kv(pairs) {
      return (
        '<dl class="grid grid-cols-2 gap-x-7 gap-y-[18px] mb-3">' +
        pairs
          .map(function (p) {
            return (
              '<div><dt class="text-[14px] text-slate-400 mb-[3px]">' +
              p[0] +
              '</dt><dd class="text-sm text-slate-900 font-medium">' +
              esc(p[1]) +
              "</dd></div>"
            );
          })
          .join("") +
        "</dl>"
      );
    }

    /* ---------- list rendering ---------- */
    function hourOf(a) {
      return +a.time.split(":")[0];
    }
    function match(a) {
      var t = S.tab;
      if (t === "today" && (a.date !== S.date || isReq(a.status))) return false;
      if (t === "upcoming" && !(a.status === "confirmed" && a.date > TODAY))
        return false;
      if (t === "pending" && PENDING.indexOf(a.status) < 0) return false;
      if (
        t === "cancelled" &&
        a.status !== "cancelled" &&
        a.status !== "declined"
      )
        return false;
      if ((t === "completed" || t === "missed") && a.status !== t) return false;
      var q = S.q.toLowerCase();
      if (
        q &&
        (a.name + " " + a.id + " " + a.issue).toLowerCase().indexOf(q) < 0
      )
        return false;
      if (S.f.mode !== "All mode" && a.mode !== S.f.mode) return false;
      if (S.f.status !== "All Status" && STATUS[a.status] !== S.f.status)
        return false;
      if (S.f.urgency !== "All Urgency" && a.urgency !== S.f.urgency)
        return false;
      var h = hourOf(a);
      if (S.f.time === "Morning" && h >= 12) return false;
      if (S.f.time === "Afternoon" && (h < 12 || h >= 17)) return false;
      if (S.f.time === "Evening" && h < 17) return false;
      return true;
    }
    function actions(a) {
      var s = a.status,
        h =
          '<button type="button" data-act="view" title="View details">' +
          I.eye +
          "</button>";
      if (s === "completed") {
        if (a.rx && a.rx.final)
          h +=
            '<button type="button" data-act="dl" title="Download prescription">' +
            I.dl +
            "</button>";
        else
          h +=
            '<button type="button" data-act="rx" title="Write prescription">' +
            I.doc +
            "</button>";
      } else if (s === "progress")
        h +=
          '<button type="button" data-act="complete" title="Complete consultation">' +
          I.check +
          "</button>";
      else if (s === "confirmed") {
        if (a.mode === "Video Call" || a.mode === "Voice Call")
          h +=
            '<button type="button" data-act="call" title="Join call">' +
            I.cam +
            "</button>";
        else
          h +=
            '<button type="button" data-act="start" title="Start appointment">' +
            I.go +
            "</button>";
      } else if (s === "awaiting")
        h +=
          '<button type="button" data-act="bid" class="text-[14px] font-bold text-green-600">Submit Bid</button>';
      else if (s === "bidsent")
        h += '<span class="text-[14px] text-slate-500">Bid sent</span>';
      else if (s === "missed")
        h +=
          '<button type="button" data-act="resch" title="Reschedule">' +
          I.resch +
          "</button>";
      else if (s === "cancelled")
        h +=
          '<button type="button" data-act="cdet" title="Cancellation details">' +
          I.cdoc +
          "</button>";
      return (
        '<div class="flex items-center justify-center gap-3">' + h + "</div>"
      );
    }
    function updateCounts() {
      var c = {
          today: 0,
          upcoming: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
          missed: 0,
        },
        fees = 0;
      S.rows.forEach(function (a) {
        if (a.date === TODAY && !isReq(a.status)) c.today++;
        if (a.status === "confirmed" && a.date > TODAY) c.upcoming++;
        if (PENDING.indexOf(a.status) > -1) c.pending++;
        if (a.status === "completed") {
          c.completed++;
          fees += +a.fee || 0;
        }
        if (a.status === "cancelled" || a.status === "declined") c.cancelled++;
        if (a.status === "missed") c.missed++;
      });
      $$(".apt-tab").forEach(function (b) {
        b.querySelector(".apt-cnt").textContent = c[b.dataset.tab];
      });
      var pad = function (n) {
        return n < 10 ? "0" + n : "" + n;
      };
      $("#aptStatToday").textContent = c.today;
      $("#aptStatUpcoming").textContent = c.upcoming;
      $("#aptStatPending").textContent = pad(c.pending);
      $("#aptStatCompleted").textContent = pad(c.completed);
      $("#aptFees").textContent = "₹" + fees.toLocaleString("en-IN");
    }
    function render() {
      var list = S.rows.filter(match);
      var pages = Math.max(1, Math.ceil(list.length / S.size));
      if (S.page > pages) S.page = pages;
      var start = (S.page - 1) * S.size,
        view = list.slice(start, start + S.size);
      $("#aptRows").innerHTML = view.length
        ? view
            .map(function (a) {
              return (
                '<tr class="border-b border-slate-100" data-id="' +
                a.id +
                '">' +
                '<td class="px-5 py-3"><div class="flex items-center gap-3"><span class="' +
                AV +
                ' w-9 h-9 text-xs">' +
                initials(a.name) +
                '</span><div><div class="text-[14px] font-semibold">' +
                esc(a.name) +
                '</div><div class="text-[14px] text-slate-400">' +
                a.id +
                "</div></div></div></td>" +
                '<td class="px-3 py-3 text-center"><div class="text-[14px]">' +
                esc(a.issue) +
                '</div><span class="inline-block text-[14px] px-2 py-0.5 rounded-md mt-1 ' +
                (a.urgency === "Priority"
                  ? "bg-red-50 text-red-500"
                  : "bg-blue-50 text-blue-600") +
                '">' +
                a.urgency +
                "</span></td>" +
                '<td class="px-3 py-3 text-center"><div class="text-[14px]">' +
                fmtDate(a.date) +
                '</div><div class="text-[14px] text-slate-400">' +
                fmtTime(a.time) +
                " · " +
                a.dur +
                " min</div></td>" +
                '<td class="px-3 py-3 text-center text-[14px]">' +
                a.mode +
                "</td>" +
                '<td class="px-3 py-3 text-center text-[14px]">₹' +
                a.fee +
                "</td>" +
                '<td class="px-3 py-3 text-center">' +
                pill(a.status) +
                "</td>" +
                '<td class="px-3 py-3">' +
                actions(a) +
                "</td></tr>"
              );
            })
            .join("")
        : '<tr><td colspan="7" class="text-center text-[14px] text-slate-500 py-10">No appointments match. Change the tab, date or filters to see more.</td></tr>';
      var total = list.length;
      $("#aptShowing").textContent = total
        ? "Showing " +
          (start + 1) +
          "-" +
          (start + view.length) +
          " of " +
          total
        : "Showing 0 of 0";
      $("#aptPageInfo").textContent = S.page + "/" + pages;
      $("#aptPrev").className =
        "border border-slate-200 rounded-lg px-3 py-1.5 " +
        (S.page > 1 ? "text-slate-700" : "text-slate-400");
      $("#aptNext").className =
        "border border-slate-200 rounded-lg px-3 py-1.5 " +
        (S.page < pages ? "text-slate-700" : "text-slate-400");
      $$(".apt-tab").forEach(function (b) {
        var on = b.dataset.tab === S.tab;
        setCls(b, on, MAIN_ON, MAIN_OFF);
      });
      var slots = S.rows
        .filter(function (a) {
          return a.date === S.date && !isReq(a.status);
        })
        .sort(function (x, y) {
          return x.time < y.time ? -1 : 1;
        });
      $("#aptSlots").innerHTML = slots.length
        ? slots
            .map(function (a) {
              var col = SLOT_TXT[a.status];
              return (
                '<button type="button" class="apt-slot ' +
                SLOT +
                '" data-id="' +
                a.id +
                '"><div class="text-[14px] font-semibold">' +
                fmtTime(a.time) +
                '</div><div class="text-[14px] font-semibold">' +
                esc(a.name) +
                '</div><div class="flex justify-between gap-3 text-[14px]"><span class="text-slate-500">' +
                a.mode +
                '</span><span class="' +
                col +
                '">' +
                STATUS[a.status] +
                "</span></div></button>"
              );
            })
            .join("")
        : '<p class="text-[14px] text-slate-500">No appointments scheduled for this date.</p>';
      $("#aptDaily").classList.toggle("hidden", S.tab !== "today");
      $("#aptPendingNote").classList.toggle("hidden", S.tab !== "pending");
      updateCounts();
      saveRows();
    }

    /* ---------- modal helpers ---------- */
    var dirty = {};
    function open(id) {
      var m = $("#" + id);
      m.classList.remove("hidden");
      m.classList.add("flex");
    }
    function isOpen(id) {
      return $("#" + id).classList.contains("flex");
    }
    function hide(id) {
      var m = $("#" + id);
      m.classList.add("hidden");
      m.classList.remove("flex");
      dirty[id] = false;
    }
    function tryClose(id) {
      var m = $("#" + id);
      if (m.dataset.guard && dirty[id]) {
        S.discardFor = id;
        open("m-discard");
        return;
      }
      hide(id);
    }
    document.addEventListener("click", function (e) {
      var c = e.target.closest("[data-close]");
      if (c) {
        var id = c.dataset.close;
        if (id === "m-discard") hide(id);
        else tryClose(id);
        return;
      }
      if (
        e.target.hasAttribute &&
        e.target.hasAttribute("data-modal") &&
        e.target.id !== "m-discard"
      )
        tryClose(e.target.id);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openM = $$("[data-modal].flex").pop();
      if (openM) {
        if (openM.id === "m-discard") hide("m-discard");
        else tryClose(openM.id);
      }
    });
    var FORMS = {
      bookForm: "m-book",
      rxForm: "m-rx",
      completeForm: "m-complete",
      reschForm: "m-resch",
      missForm: "m-miss",
      cancelForm: "m-cancel",
      bidForm: "m-bid",
      declineForm: "m-decline",
      followForm: "m-follow",
    };
    Object.keys(FORMS).forEach(function (f) {
      $("#" + f).addEventListener("input", function (e) {
        dirty[FORMS[f]] = true;
        unerr(e.target);
      });
    });
    $("#discardConfirmBtn").addEventListener("click", function () {
      hide("m-discard");
      if (S.discardFor) {
        hide(S.discardFor);
        S.discardFor = null;
      }
    });
    function require(ids) {
      var ok = true;
      ids.forEach(function (i) {
        var el = $("#" + i);
        if (!String(el.value).trim()) {
          mark(el);
          ok = false;
        }
      });
      if (!ok) toast("Fill in the required fields marked *");
      return ok;
    }

    /* ---------- list interactions ---------- */
    $("#aptTabs").addEventListener("click", function (e) {
      var b = e.target.closest(".apt-tab");
      if (b) {
        S.tab = b.dataset.tab;
        S.page = 1;
        render();
      }
    });
    $("#aptDate").addEventListener("change", function (e) {
      S.date = e.target.value || TODAY;
      S.tab = "today";
      S.page = 1;
      render();
    });
    $("#aptSearch").addEventListener("input", function (e) {
      S.q = e.target.value;
      S.page = 1;
      render();
    });
    $("#aptFilterBtn").addEventListener("click", function () {
      var f = $("#aptFilters");
      f.classList.toggle("hidden");
      f.classList.toggle("flex");
    });
    $("#aptPrev").addEventListener("click", function () {
      if (S.page > 1) {
        S.page--;
        render();
      }
    });
    $("#aptNext").addEventListener("click", function () {
      S.page++;
      render();
    });
    $("#aptPageSize").addEventListener("change", function (e) {
      S.size = +e.target.value;
      S.page = 1;
      render();
    });
    $("#aptResetData").addEventListener("click", function () {
      S.rows = seed();
      S.tab = "today";
      S.date = TODAY;
      $("#aptDate").value = TODAY;
      render();
      toast("Sample data reset");
    });

    function buildDD() {
      $$("[data-dd]").forEach(function (w) {
        var k = w.dataset.dd;
        w.innerHTML =
          '<button type="button" class="' +
          INPUT +
          ' flex items-center justify-between gap-6 !py-2 !text-[14px] !w-auto"><span>' +
          S.f[k] +
          "</span>" +
          I.chev +
          '</button><div class="apt-dd-menu hidden absolute top-[calc(100%+6px)] left-0 z-30 min-w-[170px] bg-white border border-slate-200 rounded-[14px] p-2 shadow-[0_10px_30px_rgba(15,23,42,.12)]">' +
          OPTS[k]
            .map(function (o) {
              return (
                '<button type="button" class="block w-full text-left text-[14px] px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-shazam-blue ' +
                (o === S.f[k]
                  ? "bg-blue-50 text-shazam-blue"
                  : "text-slate-800") +
                '" data-v="' +
                o +
                '">' +
                o +
                "</button>"
              );
            })
            .join("") +
          "</div>";
      });
    }
    document.addEventListener("click", function (e) {
      var w = e.target.closest("[data-dd]");
      $$(".apt-dd-menu").forEach(function (m) {
        if (!w || !w.contains(m)) m.classList.add("hidden");
      });
      if (!w) return;
      var opt = e.target.closest("[data-v]");
      if (opt) {
        S.f[w.dataset.dd] = opt.dataset.v;
        S.page = 1;
        buildDD();
        render();
        return;
      }
      if (e.target.closest("button"))
        w.querySelector(".apt-dd-menu").classList.toggle("hidden");
    });
    $("#aptResetFilters").addEventListener("click", function () {
      S.f = {
        mode: "All mode",
        status: "All Status",
        urgency: "All Urgency",
        time: "All Time",
      };
      S.q = "";
      $("#aptSearch").value = "";
      buildDD();
      render();
    });

    $("#aptRows").addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var a = byId(b.closest("tr").dataset.id);
      S.cur = a;
      ({
        view: openDetails,
        rx: openRx,
        complete: openComplete,
        start: openStart,
        call: openCall,
        bid: openBid,
        resch: openResch,
        dl: downloadRx,
        cdet: openCancelDetails,
      })[b.dataset.act](a);
    });
    $("#aptSlots").addEventListener("click", function (e) {
      var b = e.target.closest(".apt-slot");
      if (b) openDetails(byId(b.dataset.id));
    });

    $("#aptExportBtn").addEventListener("click", function () {
      var head = [
        "Appointment",
        "Patient",
        "Issue",
        "Date",
        "Time",
        "Mode",
        "Fee",
        "Status",
      ];
      var rows = S.rows.filter(match).map(function (a) {
        return [
          a.id,
          a.name,
          a.issue,
          a.date,
          a.time,
          a.mode,
          a.fee,
          STATUS[a.status],
        ];
      });
      var csv = [head]
        .concat(rows)
        .map(function (r) {
          return r
            .map(function (c) {
              return '"' + String(c).replace(/"/g, '""') + '"';
            })
            .join(",");
        })
        .join("\n");
      var l = document.createElement("a");
      l.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      l.download = "appointments.csv";
      l.click();
    });

    /* ---------- Book Appointment -> Review -> Confirm ---------- */
    $("#aptBookBtn").addEventListener("click", function () {
      ["bk-name", "bk-age", "bk-reason"].forEach(function (i) {
        $("#" + i).value = "";
        unerr($("#" + i));
      });
      $("#bk-pid").value = "PAT-" + Date.now();
      $("#bk-mode").value = "Clinic Visit";
      $("#bk-loc").value = LOC["Clinic Visit"];
      dirty["m-book"] = false;
      open("m-book");
    });
    $("#bk-mode").addEventListener("change", function (e) {
      $("#bk-loc").value = LOC[e.target.value];
    });
    function bookData() {
      return {
        name: $("#bk-name").value.trim(),
        pid: $("#bk-pid").value.trim(),
        age: $("#bk-age").value,
        gender: $("#bk-gender").value,
        mode: $("#bk-mode").value,
        date: $("#bk-date").value,
        time: $("#bk-time").value,
        dur: +$("#bk-dur").value,
        fee: +$("#bk-fee").value,
        loc: $("#bk-loc").value,
        reason: $("#bk-reason").value.trim(),
      };
    }
    $("#bookReviewBtn").addEventListener("click", function () {
      if (
        !require([
          "bk-name",
          "bk-pid",
          "bk-age",
          "bk-date",
          "bk-time",
          "bk-dur",
          "bk-fee",
          "bk-reason",
        ])
      )
        return;
      var d = bookData();
      $("#bookReviewBody").innerHTML = kv([
        ["Patient", d.name],
        ["Patient ID", d.pid],
        ["Age / Gender", d.age + " / " + d.gender],
        ["Mode", d.mode],
        ["Date / Time", fmtDate(d.date) + " · " + fmtTime(d.time)],
        ["Duration", d.dur + " minutes"],
        ["Fee", "₹" + d.fee],
        ["Location", d.loc || "-"],
        ["Reason", d.reason],
      ]);
      open("m-bookreview");
    });
    $("#bookConfirmBtn").addEventListener("click", function () {
      var d = bookData(),
        n = String(Date.now()).slice(-5);
      S.rows.unshift({
        id: "APT-" + n,
        pid: d.pid,
        name: d.name,
        age: d.age,
        gender: d.gender,
        issue: d.reason,
        urgency: "Normal",
        date: d.date,
        time: d.time,
        dur: d.dur,
        mode: d.mode,
        fee: d.fee,
        status: "confirmed",
        loc: d.loc,
        reason: d.reason,
        summary: "",
        rating: "",
        rx: null,
        activity: [],
      });
      hide("m-bookreview");
      hide("m-book");
      S.tab = d.date === S.date ? "today" : "upcoming";
      S.page = 1;
      render();
      toast("Appointment booked for " + fmtDate(d.date));
    });

    /* ---------- Details modal (layout depends on status) ---------- */
    function openDetails(a) {
      S.cur = a;
      if (a.id.indexOf("REQ-") === 0) {
        openRequest(a);
        return;
      }
      var done = a.status === "completed",
        st = a.status;
      var tabs = done
        ? [
            ["overview", "Overview"],
            ["summary", "Consultation Summary"],
            ["rx", "Prescription"],
            ["invoice", "Invoice"],
            ["activity", "Activity"],
          ]
        : st === "cancelled"
          ? [
              ["overview", "Overview"],
              ["cancellation", "Cancellation"],
              ["payment", "Payment Status"],
              ["activity", "Activity"],
            ]
          : st === "missed"
            ? [
                ["overview", "Overview"],
                ["noshow", "No-Show Details"],
                ["activity", "Activity"],
              ]
            : [
                ["overview", "Overview"],
                ["records", "Patient Records"],
                ["activity", "Activity"],
              ];
      $("#dt-title").textContent = done
        ? "Completed Consultation"
        : st === "cancelled"
          ? "Cancelled Appointment"
          : st === "missed"
            ? "Missed Appointment"
            : "Appointment Details";
      $("#dt-sub").textContent = a.id + " · " + a.name;
      $("#dtTabs").innerHTML = tabs
        .map(function (t, i) {
          return (
            '<button type="button" data-pane="' +
            t[0] +
            '" class="' +
            TAB_BASE +
            " " +
            (i ? TAB_OFF : TAB_ON) +
            '"' +
            (i ? "" : ' data-on="1"') +
            ">" +
            t[1] +
            "</button>"
          );
        })
        .join("");
      var f;
      if (done)
        f =
          '<button type="button" class="' +
          B.def +
          '" data-ft="invoice">Invoice</button><button type="button" class="' +
          B.primary +
          '" data-ft="write">Write Px</button>';
      else if (a.status === "confirmed")
        f =
          '<button type="button" class="' +
          B.primary +
          '" data-ft="start">Start Appointment</button><button type="button" class="' +
          B.def +
          '" data-ft="resch">Reschedule</button><button type="button" class="' +
          B.def +
          '" data-ft="miss">Mark No Show</button><button type="button" class="' +
          B.dangero +
          '" data-ft="cancel">Cancel</button>';
      else if (a.status === "progress")
        f =
          '<button type="button" class="' +
          B.primary +
          '" data-ft="complete">Complete Consultation</button>';
      else if (a.status === "missed")
        f =
          '<button type="button" class="' +
          B.def +
          '" data-ft="follow">Record Follow-Up</button><button type="button" class="' +
          B.primary +
          '" data-ft="resch">Reschedule</button>';
      else if (a.status === "cancelled")
        f =
          '<button type="button" class="' +
          B.gray +
          '" data-ft="cdet">Cancel Details</button>';
      else
        f =
          '<button type="button" class="' +
          B.gray +
          '" data-close="m-details">Close</button>';
      $("#dtFoot").innerHTML = f;
      paneRender("overview");
      open("m-details");
    }
    function paymentText(a) {
      if (a.status === "completed") return "Paid via payment provider";
      if (a.status === "cancelled" || a.status === "missed")
        return "Paid via payment provider";
      return "Pending";
    }
    function invoiceKv(a) {
      return (
        kv([
          ["Invoice number", "INV-" + a.id],
          ["Patient", a.name],
          ["Appointment", a.id],
          ["Consultation date", fmtDate(a.date)],
          ["Mode", a.mode],
          ["Consultation fee", "₹" + a.fee],
          ["Payment status", paymentText(a)],
          [
            "Provider transaction",
            a.status === "completed" ? "TXN-" + a.id : "-",
          ],
        ]) +
        '<div class="' +
        NOTE +
        ' mt-2">Sample invoice. No money is held by this CRM.</div>'
      );
    }
    function paneRender(p) {
      var a = S.cur,
        h = "";
      if (p === "overview") {
        h =
          pcard(a, a.status === "completed" ? "confirmed" : a.status) +
          kv([
            ["Patient ID", a.pid],
            ["Age / Gender", a.age + " / " + a.gender],
            ["Appointment ID", a.id],
            ["Date / Time", fmtDate(a.date) + " · " + fmtTime(a.time)],
            ["Duration", a.dur + " minutes"],
            ["Consultation mode", a.mode],
            ["Health issue", a.issue],
            ["Urgency", a.urgency],
            ["Fee", "₹" + a.fee],
            ["Location", a.loc],
            ["Status", STATUS[a.status]],
            ["Payment", paymentText(a)],
          ]);
      } else if (p === "records") {
        var prev = S.rows.filter(function (x) {
          return x.pid === a.pid && x.id !== a.id;
        });
        h =
          pcard(a) +
          '<h4 class="text-[15px] font-bold mb-3">Earlier appointments</h4>' +
          (prev.length
            ? '<ul class="space-y-2">' +
              prev
                .map(function (x) {
                  return (
                    '<li class="flex justify-between items-center border border-slate-200 rounded-lg px-4 py-3 text-[14px]"><span>' +
                    x.id +
                    " · " +
                    esc(x.issue) +
                    " · " +
                    fmtDate(x.date) +
                    "</span>" +
                    pill(x.status) +
                    "</li>"
                  );
                })
                .join("") +
              "</ul>"
            : '<p class="text-[14px] text-slate-500">No earlier records for this patient.</p>');
      } else if (p === "summary") {
        h =
          '<h4 class="text-[17px] font-bold">Consultation summary</h4><p class="text-[15px] mb-5">' +
          (a.summary ? esc(a.summary) : "No consultation notes recorded.") +
          "</p>" +
          kv([
            [
              "Completed on",
              a.status === "completed"
                ? fmtDate(a.date) + ", " + fmtTime(a.time).toLowerCase()
                : "-",
            ],
            ["Duration", a.dur + " minutes (sample)"],
            ["Rating", a.rating || "-"],
          ]) +
          '<button type="button" class="' +
          B.def +
          '" id="dtViewSummary">View Summary</button>';
      } else if (p === "rx") {
        var fin = a.rx && a.rx.final;
        h =
          pill(fin ? "completed" : "draft", fin ? "Final" : "Draft", true) +
          '<h4 class="text-[18px] mt-2 mb-5">Prescription for ' +
          esc(a.name) +
          " · " +
          a.id +
          '</h4><div class="flex gap-3"><button type="button" class="' +
          B.def +
          '" id="dtPreviewRx">Preview Prescription</button>' +
          (fin
            ? '<button type="button" class="' +
              B.def +
              '" id="dtDlRx">Download</button>'
            : '<button type="button" class="' +
              B.def +
              '" id="dtEditRx">Write / Edit Rx</button>') +
          "</div>";
      } else if (p === "cancellation") {
        h = cancelKv(a);
      } else if (p === "payment") {
        var ci = a.cancel || cancelInfo("Other", a.date);
        h =
          kv([
            ["Payment provider", "Sample payment provider"],
            ["Original fee", "₹" + a.fee],
            ["Refund status", ci.refund],
            ["Transaction reference", "TXN-" + a.id],
          ]) +
          '<div class="' +
          NOTE +
          ' mt-2">Informational provider status. No funds are held in this CRM.</div>';
      } else if (p === "noshow") {
        var ns = a.noshow || {
          cls: "Patient no-show",
          reason: "Patient did not attend",
        };
        h =
          kv([
            ["Classification", ns.cls],
            ["Reason", ns.reason],
            ["Original appointment", fmtDate(a.date) + " " + fmtTime(a.time)],
            ["Replacement", a.replacedBy || "Not rescheduled"],
          ]) +
          '<div class="' +
          NOTE +
          ' mt-2">No automatic rating deduction is applied.</div>';
      } else if (p === "invoice") {
        h = invoiceKv(a);
      } else {
        var acts = a.activity.slice();
        if (a.status === "cancelled" || a.status === "missed")
          acts.push({ t: "Sample appointment record created" });
        h = acts.length
          ? '<ul class="relative pl-[22px] border-l-2 border-blue-100 ml-1">' +
            acts
              .map(function (x) {
                var meta = [x.by, x.at].filter(Boolean).join(" · ");
                return (
                  '<li class="' +
                  LI +
                  '"><b class="text-[15px]">' +
                  esc(x.t) +
                  "</b>" +
                  (meta
                    ? '<div class="text-[14px] text-slate-500">' +
                      esc(meta) +
                      "</div>"
                    : "") +
                  "</li>"
                );
              })
              .join("") +
            "</ul>"
          : '<p class="text-[14px] text-slate-500">No activity yet. Saving a draft, rescheduling or cancelling adds an entry here.</p>';
      }
      $("#dtBody").innerHTML = h;
    }
    $("#dtTabs").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      $$("#dtTabs button").forEach(function (x) {
        setCls(x, x === b, TAB_ON, TAB_OFF);
        if (x === b) x.setAttribute("data-on", "1");
        else x.removeAttribute("data-on");
      });
      paneRender(b.dataset.pane);
    });
    $("#dtBody").addEventListener("click", function (e) {
      if (e.target.id === "dtViewSummary") openSummary(S.cur);
      if (e.target.id === "dtPreviewRx") {
        S.rxFrom = "details";
        openPreview(S.cur.rx || emptyRx());
      }
      if (e.target.id === "dtEditRx") {
        hide("m-details");
        openRx(S.cur);
      }
      if (e.target.id === "dtDlRx") downloadRx(S.cur);
    });
    $("#dtFoot").addEventListener("click", function (e) {
      var b = e.target.closest("[data-ft]");
      if (!b) return;
      var a = S.cur,
        k = b.dataset.ft;
      if (k === "invoice") {
        openInvoice(a);
        return;
      }
      if (k === "cdet") {
        openCancelDetails(a);
        return;
      }
      if (k === "follow") {
        openFollow(a);
        return;
      }
      hide("m-details");
      ({
        write: openRx,
        start: openStart,
        resch: openResch,
        miss: openMiss,
        cancel: openCancel,
        complete: openComplete,
      })[k](a);
    });

    function openSummary(a) {
      $("#summaryBody").innerHTML =
        pcard(a, a.status === "completed" ? "confirmed" : a.status) +
        kv([
          ["Consultation date", fmtDate(a.date)],
          ["Mode", a.mode],
          [
            "Completed",
            a.status === "completed"
              ? fmtDate(a.date) + ", " + fmtTime(a.time).toLowerCase()
              : "-",
          ],
          ["Duration", a.dur + " minutes"],
          ["Clinician", "Dr. Aarav Shah"],
        ]) +
        '<h4 class="text-[16px] font-bold">Recorded clinical notes</h4><p class="text-[15px]">' +
        (a.summary ? esc(a.summary) : "Not recorded") +
        "</p>";
      $("#summaryStartBtn").classList.toggle(
        "hidden",
        a.status !== "confirmed",
      );
      open("m-summary");
    }
    $("#summaryStartBtn").addEventListener("click", function () {
      hide("m-summary");
      hide("m-details");
      openStart(S.cur);
    });

    function openInvoice(a) {
      $("#invoiceBody").innerHTML =
        pcard(a, a.status === "completed" ? "confirmed" : a.status) +
        invoiceKv(a);
      $("#invoicePdfBtn").dataset.pdfUrl =
        ""; /* set to your backend invoice PDF URL */
      open("m-invoice");
    }
    $("#invoicePdfBtn").addEventListener("click", function (e) {
      var u = e.target.dataset.pdfUrl;
      if (u) window.location.href = u;
      else window.print();
    });

    /* ---------- Write Prescription -> Preview -> Finalize ---------- */
    function emptyRx() {
      return {
        dx: "",
        meds: [],
        instr: "",
        clin: "Dr. Aarav Shah",
        final: false,
      };
    }
    function medRow(m) {
      m = m || {};
      return (
        '<div class="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-3" data-med><input class="' +
        INPUT +
        '" data-f="n" value="' +
        esc(m.n) +
        '"><input class="' +
        INPUT +
        '" data-f="d" value="' +
        esc(m.d) +
        '"><input class="' +
        INPUT +
        '" data-f="f" value="' +
        esc(m.f) +
        '"><input class="' +
        INPUT +
        '" data-f="u" value="' +
        esc(m.u) +
        '"><button type="button" data-rm class="h-[42px] rounded-lg border border-red-200 text-red-500">✕</button></div>'
      );
    }
    function openRx(a) {
      S.cur = a;
      var r = a.rx || emptyRx();
      $("#rxPatient").innerHTML = pcard(a);
      $("#rx-dx").value = r.dx;
      $("#rx-instr").value = r.instr;
      $("#rx-clin").value = r.clin || "Dr. Aarav Shah";
      $("#rxMeds").innerHTML = (r.meds.length ? r.meds : [{}])
        .map(medRow)
        .join("");
      dirty["m-rx"] = false;
      open("m-rx");
    }
    $("#rxAddMed").addEventListener("click", function () {
      $("#rxMeds").insertAdjacentHTML("beforeend", medRow());
      dirty["m-rx"] = true;
    });
    $("#rxMeds").addEventListener("click", function (e) {
      if (!e.target.closest("[data-rm]")) return;
      var row = e.target.closest("[data-med]");
      if ($$("#rxMeds [data-med]").length > 1) row.remove();
      else
        $$("#rxMeds input").forEach(function (i) {
          i.value = "";
        });
      dirty["m-rx"] = true;
    });
    function readRx() {
      var meds = $$("#rxMeds [data-med]")
        .map(function (r) {
          var g = function (k) {
            return r.querySelector('[data-f="' + k + '"]').value.trim();
          };
          return { n: g("n"), d: g("d"), f: g("f"), u: g("u") };
        })
        .filter(function (m) {
          return m.n || m.d || m.f || m.u;
        });
      return {
        dx: $("#rx-dx").value.trim(),
        meds: meds,
        instr: $("#rx-instr").value.trim(),
        clin: $("#rx-clin").value.trim(),
        final: false,
      };
    }
    $("#rxSaveDraft").addEventListener("click", function () {
      var a = S.cur;
      a.rx = readRx();
      log(a, "Prescription draft", a.rx.clin);
      hide("m-rx");
      render();
      toast("Prescription draft saved");
    });
    $("#rxReviewBtn").addEventListener("click", function () {
      if (!require(["rx-dx", "rx-instr", "rx-clin"])) return;
      S.rxFrom = "form";
      openPreview(readRx());
    });
    function openPreview(r) {
      var a = S.cur;
      $("#rxPreviewBody").innerHTML =
        '<div class="border border-slate-200 rounded-xl p-6"><h4 class="text-[18px] font-semibold text-shazam-blue">MedOCR · Prescription</h4>' +
        '<p class="text-[14px] text-slate-400 mt-1 mb-4">ILLUSTRATIVE SAMPLE DATA · NOT A CLINICAL DOCUMENT</p>' +
        pcard(a) +
        kv([
          ["Date", fmtDate(a.date)],
          ["Clinician", r.clin || "Dr. Aarav Shah"],
          ["Diagnosis", r.dx || "—"],
          ["Status", r.final ? "Final" : "Draft"],
        ]) +
        '<h4 class="text-[16px] font-bold mt-4 mb-2">Recorded medicines</h4><div class="border border-slate-200 rounded-lg overflow-hidden"><table class="w-full text-[14px]"><thead class="bg-slate-50 text-slate-500 uppercase text-[14px]"><tr><th class="text-left p-3">Medicine</th><th class="text-left p-3">Dose</th><th class="text-left p-3">Frequency</th><th class="text-left p-3">Duration</th></tr></thead><tbody>' +
        (r.meds.length
          ? r.meds
              .map(function (m) {
                return (
                  '<tr class="border-t border-slate-100"><td class="p-3">' +
                  esc(m.n) +
                  '</td><td class="p-3">' +
                  esc(m.d) +
                  '</td><td class="p-3">' +
                  esc(m.f) +
                  '</td><td class="p-3">' +
                  esc(m.u) +
                  "</td></tr>"
                );
              })
              .join("")
          : '<tr><td colspan="4" class="p-5 text-center italic text-slate-400">No active medications transcribed yet</td></tr>') +
        '</tbody></table></div><h4 class="text-[16px] font-bold mt-5">Instructions</h4><p class="text-[14px] mt-1 min-h-[24px]">' +
        esc(r.instr) +
        "</p></div>";
      $("#rxEditDraft").classList.toggle("hidden", !!r.final);
      $("#rxFinalize").classList.toggle(
        "hidden",
        !(!r.final && r.dx && r.instr),
      );
      open("m-rxpreview");
    }
    $("#rxEditDraft").addEventListener("click", function () {
      hide("m-rxpreview");
      if (!isOpen("m-rx")) {
        hide("m-details");
        openRx(S.cur);
      }
    });
    $("#rxFinalize").addEventListener("click", function () {
      var a = S.cur,
        r = S.rxFrom === "form" ? readRx() : a.rx;
      r.final = true;
      a.rx = r;
      log(a, "Prescription finalized", r.clin);
      hide("m-rxpreview");
      hide("m-rx");
      render();
      if (isOpen("m-details")) paneRender("rx");
      toast("Prescription finalized");
    });
    function downloadRx(a) {
      var r = a.rx || emptyRx();
      var lines = [
        "MedOCR - Prescription (illustrative sample, not a clinical document)",
        "Appointment: " + a.id,
        "Patient: " + a.name + " (" + a.pid + ")",
        "Date: " + fmtDate(a.date),
        "Clinician: " + (r.clin || "Dr. Aarav Shah"),
        "Diagnosis: " + r.dx,
        "",
        "Medicines:",
      ]
        .concat(
          r.meds.length
            ? r.meds.map(function (m) {
                return "- " + [m.n, m.d, m.f, m.u].join(" | ");
              })
            : ["- none recorded"],
        )
        .concat(["", "Instructions: " + r.instr]);
      /* swap for your backend prescription PDF URL when ready */
      var l = document.createElement("a");
      l.href = URL.createObjectURL(
        new Blob([lines.join("\n")], { type: "text/plain" }),
      );
      l.download = "prescription-" + a.id + ".txt";
      l.click();
    }

    /* ---------- Complete Consultation -> Review ---------- */
    function openComplete(a) {
      S.cur = a;
      $("#cpPatient").innerHTML = pcard(a);
      $("#cp-dur").value = a.dur;
      $("#cp-summary").value = "";
      $("#cp-rx").selectedIndex = 0;
      ["cp-dur", "cp-summary"].forEach(function (i) {
        unerr($("#" + i));
      });
      dirty["m-complete"] = false;
      open("m-complete");
    }
    $("#cpReviewBtn").addEventListener("click", function () {
      if (!require(["cp-dur", "cp-summary"])) return;
      $("#cpReviewBody").innerHTML =
        pcard(S.cur) +
        kv([
          ["Actual duration", $("#cp-dur").value + " minutes"],
          ["Prescription status", $("#cp-rx").value],
        ]) +
        '<h4 class="text-[14px] font-bold">Consultation summary</h4><p class="text-[14px] mt-1">' +
        esc($("#cp-summary").value) +
        "</p>";
      open("m-cpreview");
    });
    $("#cpConfirmBtn").addEventListener("click", function () {
      var a = S.cur;
      a.status = "completed";
      a.dur = +$("#cp-dur").value;
      a.summary = $("#cp-summary").value.trim();
      var openNow = $("#cp-rx").value === "Create now";
      hide("m-cpreview");
      hide("m-complete");
      render();
      toast("Consultation completed");
      if (openNow) openRx(a);
    });

    /* ---------- Start Appointment / Join call ---------- */
    function future(a) {
      return a.date + "T" + a.time > NOW;
    }
    function openStart(a) {
      S.cur = a;
      $("#startBody").innerHTML =
        pcard(a) +
        kv([
          ["Mode", a.mode],
          ["Scheduled", fmtDate(a.date) + " " + fmtTime(a.time)],
          ["Location", a.loc],
        ]) +
        (future(a)
          ? '<div class="' +
            NOTE +
            ' mt-2">This appointment cannot start before its scheduled time in the sample workspace.</div>'
          : "");
      open("m-start");
    }
    function begin(a) {
      if (future(a)) {
        toast("This appointment cannot start before its scheduled time.");
        return false;
      }
      a.status = "progress";
      log(a, "Appointment started");
      render();
      toast("Appointment started");
      return true;
    }
    $("#startConfirmBtn").addEventListener("click", function () {
      if (begin(S.cur)) hide("m-start");
    });

    function openCall(a) {
      S.cur = a;
      var voice = a.mode === "Voice Call";
      $("#callTitle").textContent = voice
        ? "Join Voice Call"
        : "Join Video Call";
      $("#callBody").innerHTML =
        pcard(a) +
        '<div class="rounded-2xl text-white text-center py-10 px-4 bg-shazam-blue"><div class="mx-auto rounded-full bg-white flex items-center justify-center text-[30px] font-bold w-[92px] h-[92px] text-shazam-blue">' +
        initials(a.name) +
        "</div>" +
        '<div class="text-[18px] font-semibold mt-4">' +
        (voice ? "Voice Call" : "Video Call") +
        ' · Device Check</div><div class="text-[14px] opacity-90 mt-2">Simulation preview — no real call is placed</div></div>' +
        '<div class="flex gap-3 mt-4"><button type="button" class="' +
        B.def +
        '" data-test="Microphone">Test Microphone</button>' +
        (voice
          ? ""
          : '<button type="button" class="' +
            B.def +
            '" data-test="Camera">Test Camera</button>') +
        "</div>" +
        '<div class="' +
        NOTE +
        ' mt-4">No camera or microphone permission is requested. This demonstrates the consultation flow.</div>';
      open("m-call");
    }
    $("#callBody").addEventListener("click", function (e) {
      var t = e.target.closest("[data-test]");
      if (t) {
        t.textContent = t.dataset.test + " OK ✓";
      }
    });
    $("#callEnterBtn").addEventListener("click", function () {
      if (begin(S.cur)) hide("m-call");
    });

    /* ---------- Reschedule / Mark missed / Cancel: form -> review -> confirm ---------- */
    function log(a, t, by) {
      a.activity.unshift({
        t: t,
        by: by || "Dr. Aarav Shah",
        at: new Date().toLocaleString("en-GB").replace(",", ""),
      });
    }
    var pendingOk = null;
    function review(title, okLabel, html, ok, danger) {
      $("#cfTitle").textContent = title;
      $("#cfBody").innerHTML = html;
      var b = $("#cfOkBtn");
      b.textContent = okLabel;
      b.className = danger ? B.danger : B.primary;
      pendingOk = ok;
      open("m-confirm");
    }
    $("#cfOkBtn").addEventListener("click", function () {
      hide("m-confirm");
      if (pendingOk) {
        var f = pendingOk;
        pendingOk = null;
        f();
      }
    });
    function clearErr(form) {
      $$("#" + form + " .border-red-500").forEach(unerr);
    }

    function openResch(a) {
      S.cur = a;
      $("#rsPatient").innerHTML = pcard(a);
      clearErr("reschForm");
      $("#rs-date").value = a.status === "missed" ? "2026-10-17" : a.date;
      $("#rs-time").value = a.time;
      $("#rs-dur").value = a.dur;
      $("#rs-mode").value = a.mode;
      $("#rs-reason").value = "";
      dirty["m-resch"] = false;
      open("m-resch");
    }
    $("#rsReviewBtn").addEventListener("click", function () {
      if (!require(["rs-date", "rs-time", "rs-dur", "rs-reason"])) return;
      var a = S.cur,
        d = $("#rs-date").value,
        t = $("#rs-time").value,
        du = +$("#rs-dur").value,
        m = $("#rs-mode").value,
        why = $("#rs-reason").value.trim();
      review(
        "Review Reschedule",
        "Confirm Reschedule",
        kv([
          ["Current slot", fmtDate(a.date) + " " + fmtTime(a.time)],
          ["New slot", fmtDate(d) + " " + fmtTime(t)],
          ["Duration", du + " minutes"],
          ["Mode", m],
          ["Reason", why],
        ]),
        function () {
          var target = a;
          if (a.status === "missed") {
            target = JSON.parse(JSON.stringify(a));
            target.id = a.id + "-R";
            target.status = "confirmed";
            target.activity = [];
            a.replacedBy = target.id;
            S.rows.unshift(target);
            log(a, "Linked replacement " + target.id + " created");
            log(target, "Replacement for " + a.id);
          }
          target.date = d;
          target.time = t;
          target.dur = du;
          target.mode = m;
          target.loc = LOC[m];
          log(
            target,
            "Rescheduled to " +
              fmtDate(d) +
              " " +
              fmtTime(t) +
              " (" +
              why +
              ")",
          );
          hide("m-resch");
          S.tab = d === S.date ? "today" : d > TODAY ? "upcoming" : S.tab;
          S.page = 1;
          render();
          toast("Appointment rescheduled to " + fmtDate(d));
        },
      );
    });

    function openMiss(a) {
      S.cur = a;
      $("#msPatient").innerHTML = pcard(a);
      clearErr("missForm");
      $("#ms-class").selectedIndex = 0;
      $("#ms-reason").value = "";
      dirty["m-miss"] = false;
      open("m-miss");
    }
    $("#msReviewBtn").addEventListener("click", function () {
      if (!require(["ms-reason"])) return;
      var a = S.cur,
        c = $("#ms-class").value,
        why = $("#ms-reason").value.trim();
      review(
        "Review No-Show",
        "Mark as Missed",
        kv([
          ["Patient", a.name],
          ["Scheduled", fmtDate(a.date) + " " + fmtTime(a.time)],
          ["Classification", c],
          ["Recorded reason", why],
        ]),
        function () {
          a.status = "missed";
          a.noshow = { cls: c, reason: why };
          log(a, "Marked as missed: " + c + " (" + why + ")");
          hide("m-miss");
          render();
          toast("Appointment marked as missed");
        },
        true,
      );
    });

    function openCancel(a) {
      S.cur = a;
      $("#cnPatient").innerHTML = pcard(a);
      clearErr("cancelForm");
      $("#cn-reason").selectedIndex = 0;
      $("#cn-expl").value = "";
      dirty["m-cancel"] = false;
      open("m-cancel");
    }
    $("#cnReviewBtn").addEventListener("click", function () {
      if (!require(["cn-expl"])) return;
      var a = S.cur,
        c = $("#cn-reason").value,
        why = $("#cn-expl").value.trim();
      review(
        "Review Cancellation",
        "Cancel Appointment",
        kv([
          ["Appointment", a.id],
          ["Patient", a.name],
          ["Slot", fmtDate(a.date) + " " + fmtTime(a.time)],
          ["Reason", c],
          ["Explanation", why],
        ]) +
          '<div class="' +
          NOTE +
          ' mt-2">Refund status is reported by the payment provider. This CRM does not hold funds or execute refunds.</div>',
        function () {
          a.status = "cancelled";
          a.cancel = cancelInfo(c);
          log(a, "Cancelled: " + c + " (" + why + ")");
          hide("m-cancel");
          render();
          toast("Appointment cancelled");
        },
        true,
      );
    });

    /* ---------- CANCELLED TAB: details popup / MISSED TAB: follow-up ---------- */
    function nowLabel() {
      return fmtDate(TODAY) + ", " + fmtTime(NOW.split("T")[1]).toLowerCase();
    }
    function cancelInfo(reason, iso) {
      var pat = reason === "Patient request";
      return {
        by: pat ? "Patient" : "Doctor",
        on: iso ? fmtDate(iso) + ", 10:00 am" : nowLabel(),
        reason: pat ? "Patient requested cancellation" : reason,
        refund: "Provider processing",
      };
    }
    function cancelKv(a) {
      var ci = a.cancel || cancelInfo("Other", a.date);
      return kv([
        ["Appointment ID", a.id],
        ["Date / Time", fmtDate(a.date) + " · " + fmtTime(a.time)],
        ["Cancelled by", ci.by],
        ["Cancelled on", ci.on],
        ["Reason", ci.reason],
        ["Original fee", "₹" + a.fee],
        ["Provider refund status", ci.refund],
      ]);
    }
    function openCancelDetails(a) {
      S.cur = a;
      $("#cdetBody").innerHTML =
        pcard(a) +
        cancelKv(a) +
        '<div class="' +
        NOTE +
        ' mt-2">Cancelled appointments are read-only.</div>';
      open("m-cdet");
    }
    function openFollow(a) {
      S.cur = a;
      $("#fwPatient").innerHTML = pcard(a);
      clearErr("followForm");
      $("#fw-note").value = "";
      dirty["m-follow"] = false;
      open("m-follow");
    }
    $("#fwSaveBtn").addEventListener("click", function () {
      if (!require(["fw-note"])) return;
      var a = S.cur;
      log(a, "Follow-up recorded: " + $("#fw-note").value.trim());
      hide("m-follow");
      render();
      if (isOpen("m-details")) {
        var on = $("#dtTabs [data-on]");
        paneRender(on ? on.dataset.pane : "overview");
      }
      toast("Follow-up note saved");
    });

    /* ---------- PENDING TAB: Appointment Request / Submit Bid / Decline ---------- */
    function openRequest(a) {
      S.cur = a;
      $("#rq-sub").textContent = a.id + " · " + a.name;
      var pairs = [
        ["Issue", a.issue],
        ["Requested date", fmtDate(a.date) + " " + fmtTime(a.time)],
        ["Mode", a.mode],
        ["Budget", "₹" + a.fee],
        ["Urgency", a.urgency],
        ["Requirements", a.requirements || "-"],
        ["Response deadline", deadline(a)],
        ["Status", STATUS[a.status]],
      ];
      if (a.bid)
        pairs.push(
          ["Your bid", "₹" + a.bid.fee + " · " + a.bid.dur + " min"],
          ["Proposed slot", fmtDate(a.bid.date) + " " + fmtTime(a.bid.time)],
          ["Offer details", a.bid.details],
        );
      if (a.status === "declined")
        pairs.push(["Decline reason", a.declineReason || "-"]);
      $("#rqBody").innerHTML = pcard(a) + kv(pairs);
      $("#rqFoot").innerHTML =
        a.status === "awaiting"
          ? '<button type="button" class="' +
            B.gray +
            '" data-close="m-req">Cancel</button><button type="button" class="' +
            B.dangero +
            '" data-rq="decline">Decline</button><button type="button" class="' +
            B.primary +
            '" data-rq="bid">Submit Bid</button>'
          : '<button type="button" class="' +
            B.gray +
            '" data-close="m-req">Close</button>';
      open("m-req");
    }
    $("#rqFoot").addEventListener("click", function (e) {
      var b = e.target.closest("[data-rq]");
      if (!b) return;
      hide("m-req");
      if (b.dataset.rq === "decline") openDecline(S.cur);
      else openBid(S.cur);
    });

    function openBid(a) {
      S.cur = a;
      $("#bdPatient").innerHTML = pcard(a);
      clearErr("bidForm");
      $("#bdInfo").innerHTML = kv([
        ["Patient budget", "₹" + a.fee],
        ["Consultation mode", a.mode],
        ["Requested slot", fmtDate(a.date) + " " + fmtTime(a.time)],
      ]);
      $("#bd-fee").value = a.fee;
      $("#bd-dur").value = a.dur;
      $("#bd-date").value = a.date;
      $("#bd-time").value = a.time;
      $("#bd-details").value = "";
      dirty["m-bid"] = false;
      open("m-bid");
    }
    $("#bdReviewBtn").addEventListener("click", function () {
      if (!require(["bd-fee", "bd-dur", "bd-date", "bd-time", "bd-details"]))
        return;
      var a = S.cur,
        fee = +$("#bd-fee").value,
        du = +$("#bd-dur").value,
        d = $("#bd-date").value,
        t = $("#bd-time").value,
        det = $("#bd-details").value.trim();
      if (fee <= 0 || du < 5) {
        toast("Enter a valid fee and duration (min 5 minutes)");
        return;
      }
      review(
        "Review Bid",
        "Submit Bid",
        pcard(a) +
          kv([
            ["Patient budget", "₹" + a.fee],
            ["Your fee", "₹" + fee],
            ["Duration", du + " minutes"],
            ["Mode", a.mode],
            ["Proposed slot", fmtDate(d) + " " + fmtTime(t)],
            ["Offer details", det],
          ]) +
          '<div class="' +
          NOTE +
          ' mt-2">Submitting records your offer. Patient acceptance is required before an appointment is confirmed.</div>',
        function () {
          a.bid = { fee: fee, dur: du, date: d, time: t, details: det };
          a.status = "bidsent";
          log(
            a,
            "Bid submitted: ₹" + fee + " for " + fmtDate(d) + " " + fmtTime(t),
          );
          hide("m-bid");
          render();
          toast("Bid submitted. Awaiting patient acceptance");
        },
      );
    });

    function openDecline(a) {
      S.cur = a;
      $("#dcPatient").innerHTML = pcard(a);
      clearErr("declineForm");
      $("#dc-reason").value = "";
      dirty["m-decline"] = false;
      open("m-decline");
    }
    $("#dcConfirmBtn").addEventListener("click", function () {
      if (!require(["dc-reason"])) return;
      var a = S.cur,
        why = $("#dc-reason").value.trim();
      a.status = "declined";
      a.declineReason = why;
      log(a, "Request declined: " + why);
      hide("m-decline");
      render();
      toast("Request declined");
    });

    buildDD();
    render();
  })();