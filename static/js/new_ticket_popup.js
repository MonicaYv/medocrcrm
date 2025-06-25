function openPopup() {
    const modal = document.getElementById("ticketPopup");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closePopup() {
    const modal = document.getElementById("ticketPopup");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}