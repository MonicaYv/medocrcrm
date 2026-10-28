
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
