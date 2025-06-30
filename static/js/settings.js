document.querySelectorAll('[data-field]').forEach(input => {
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie("csrftoken");
    input.addEventListener('change', () => {
        const field = input.dataset.field;
        let value;

        if (input.type === "checkbox") {
        value = input.checked;
        } else {
        value = input.value;
        }

        fetch("update-notification-field/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        },
        body: JSON.stringify({ field, value })
        })
        .then(res => {
        if (!res.ok) throw new Error("Failed to update");
        })
        .catch(err => console.error("Error:", err));
    });
});
