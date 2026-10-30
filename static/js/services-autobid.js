
document.addEventListener("DOMContentLoaded", () => {
    const toggles = document.querySelectorAll(".autobid-toggle");

    if (!toggles.length) return;

    const API_URL = "/appointment/autobid-toggle";

    // Match the login page's Toastr configuration.
    if (typeof toastr !== "undefined") {
        toastr.options = {
            closeButton: true,
            progressBar: true,
            positionClass: "toast-top-right",
            timeOut: 5000,
            extendedTimeOut: 1000,
            preventDuplicates: true
        };
    }

    function notify(type, message) {
        if (typeof toastr === "undefined") {
            console.error("Toastr is unavailable:", message);
            return;
        }

        toastr[type](message, "Auto Bid");
    }

    function getCSRFToken() {
        const match = document.cookie.match(
            /(?:^|;\s*)csrftoken=([^;]*)/
        );

        return match ? decodeURIComponent(match[1]) : "";
    }

    // Parse JSON safely, even if Django returns an HTML error page.
    async function parseResponse(response) {
        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            console.error(
                "Autobid API returned a non-JSON response:",
                text.slice(0, 500)
            );

            throw new Error(
                response.status >= 500
                    ? "Server error. Please try again later."
                    : "Unable to process the request."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                "Unable to update Auto Bid."
            );
        }

        return data;
    }

    // Load saved status silently. Do not show a toast on page refresh.
    async function loadAutobidStatus() {
        toggles.forEach(toggle => {
            toggle.disabled = true;
        });

        try {
            const response = await fetch(API_URL, {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json"
                }
            });

            const data = await parseResponse(response);

            toggles.forEach(toggle => {
                toggle.checked = Boolean(data.autobid_enabled);
            });
        } catch (error) {
            // Avoid showing an error toast just because the page loaded.
            console.error("Unable to load Auto Bid status:", error);
        } finally {
            toggles.forEach(toggle => {
                toggle.disabled = false;
            });
        }
    }

    // Update Auto Bid only when the user changes a toggle.
    toggles.forEach(toggle => {
        toggle.addEventListener("change", async () => {
            const requestedState = toggle.checked;
            const previousState = !requestedState;

            toggles.forEach(item => {
                item.disabled = true;
            });

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRFToken": getCSRFToken()
                    },
                    body: JSON.stringify({
                        enable: requestedState
                    })
                });

                const data = await parseResponse(response);

                const savedState = Boolean(data.autobid_enabled);

                // Keep both toggles in sync.
                toggles.forEach(item => {
                    item.checked = savedState;
                });

                notify(
                    "success",
                    data.message ||
                        (savedState
                            ? "Auto Bid enabled successfully."
                            : "Auto Bid disabled successfully.")
                );
            } catch (error) {
                // Restore the previous state if the request fails.
                toggles.forEach(item => {
                    item.checked = previousState;
                });

                notify("error", error.message);

                console.error("Auto Bid update failed:", error);
            } finally {
                toggles.forEach(item => {
                    item.disabled = false;
                });
            }
        });
    });

    loadAutobidStatus();
});
