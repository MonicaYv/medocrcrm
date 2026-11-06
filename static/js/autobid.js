
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("autobid-toggle");

    if (!toggle) return;

    const API_URL = "/appointment/autobid-toggle";

    // Configure Toastr to match the login page
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 5000,
        extendedTimeOut: 1000,
        preventDuplicates: true
    };
    
    async function parseApiResponse(response) {
        const text = await response.text();

        try {
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(
                "Autobid API returned a non-JSON response:",
                text
            );

            throw new Error(
                `Server error (${response.status}). Check the Django terminal.`
            );
        }
    }

    // Load current Autobid status
    async function loadAutobidStatus() {
        toggle.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Don't show a toaster on page refresh
                console.warn("Autobid status:", data.detail);
                toggle.checked = false;
                return;
            }

            toggle.checked = data.autobid_enabled;

        } catch (error) {
            // Log the error without showing a toaster
            console.error("Unable to load Autobid status:", error);
            toggle.checked = false;

        } finally {
            toggle.disabled = false;
        }
    }


    // Enable or disable Autobid
    toggle.addEventListener("change", async () => {
        const previousState = !toggle.checked;
        const enable = toggle.checked;

        toggle.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify({ enable })
            });

            const data = await parseApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.detail || "Unable to update Autobid"
                );
            }

            toggle.checked = data.autobid_enabled;

            toastr.success(
                data.message ||
                    (enable ? "Autobid enabled" : "Autobid disabled"),
                "Autobid"
            );

        } catch (error) {
            toggle.checked = previousState;

            toastr.error(error.message, "Autobid");
            console.error("Autobid update error:", error);

        } finally {
            toggle.disabled = false;
        }
    });

    function getCSRFToken() {
        const match = document.cookie.match(
            /(?:^|;\s*)csrftoken=([^;]*)/
        );

        return match ? decodeURIComponent(match[1]) : "";
    }

    loadAutobidStatus();
});

// ===== Home page tabs / filter pills =====
(function () {
  var MAP = {
    scheduled: ['scheduled', 'accepted', 'confirmed', 'pending'],
    sample: ['sample collected', 'sample_collected', 'collected'],
    processing: ['processing', 'in progress', 'in_progress'],
    completed: ['completed', 'complete', 'done'],
    awaiting: ['awaiting review', 'awaiting_review'],
    ready: ['ready to share', 'ready', 'ready_to_share'],
    new: ['new', 'pending', 'enquiry'],
    bid: ['bid submitted', 'bid_submitted', 'accepted']
  };

  function matches(status, key) {
    if (key === 'all') return true;
    return (MAP[key] || [key]).indexOf((status || '').toLowerCase().trim()) !== -1;
  }

  function init(group, btnSel, activeOn, activeOff) {
    var scope = group.closest('.bg-white') || document;
    var rows = Array.prototype.slice.call(scope.querySelectorAll(group.getAttribute('data-row')));
    var empty = scope.querySelector(group.getAttribute('data-empty'));
    var btns = group.querySelectorAll(btnSel);

    btns.forEach(function (b) {
      var n = rows.filter(function (r) {
        return matches(r.getAttribute('data-status'), b.getAttribute('data-filter'));
      }).length;
      var c = b.querySelector('.tab-count');
      if (c) c.textContent = n;
    });

    function apply(key) {
      var shown = 0;
      rows.forEach(function (r) {
        var ok = matches(r.getAttribute('data-status'), key);
        r.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle('hidden', shown !== 0 || rows.length === 0);
      btns.forEach(function (b) {
        var on = b.getAttribute('data-filter') === key;
        activeOn.forEach(function (c) { b.classList.toggle(c, on); });
        activeOff.forEach(function (c) { b.classList.toggle(c, !on); });
      });
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); });
    });
  }

  function start() {
    document.querySelectorAll('.hs-tabs').forEach(function (g) {
      init(g, '.hs-tab',
        ['border-[#2F6FED]', 'text-[#2F6FED]', 'font-medium'],
        ['border-transparent', 'text-[#8A94A6]', 'font-normal']);
    });
    document.querySelectorAll('.hs-pills').forEach(function (g) {
      init(g, '.hs-pill',
        ['bg-[#EAF0FB]', 'text-[#2F6FED]', 'font-medium'],
        ['bg-[#F1F4F9]', 'text-[#8A94A6]', 'font-normal']);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
// ===== New Test Requests: search + filters =====
(function () {
  function start() {
    var search = document.getElementById('req-search');
    if (!search) return;
    var visit = document.getElementById('req-visit');
    var test = document.getElementById('req-test');
    var reset = document.getElementById('req-reset');
    var rows = Array.prototype.slice.call(document.querySelectorAll('.req-row'));
    var empty = document.getElementById('req-empty');

    // fill the "All tests" dropdown from the rows on the page
    var seen = {};
    rows.forEach(function (r) {
      var t = r.getAttribute('data-test');
      if (t && !seen[t]) {
        seen[t] = true;
        var o = document.createElement('option');
        o.value = t.toLowerCase(); o.textContent = t;
        test.appendChild(o);
      }
    });

    function apply() {
      var q = search.value.toLowerCase().trim();
      var v = visit.value, t = test.value;
      rows.forEach(function (r) {
        var ok = (!q || r.getAttribute('data-search').indexOf(q) !== -1) &&
                 (!v || r.getAttribute('data-visit') === v) &&
                 (!t || (r.getAttribute('data-test') || '').toLowerCase() === t);
        r.style.display = ok ? '' : 'none';
      });
    }
    search.addEventListener('input', apply);
    visit.addEventListener('change', apply);
    test.addEventListener('change', apply);
    reset.addEventListener('click', function () {
      search.value = ''; visit.value = ''; test.value = ''; apply();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();