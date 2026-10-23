document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("admin-profile-photo-input");
  const image = document.getElementById("admin-profile-photo");
  if (!input || !image) return;

  input.addEventListener("change", async function () {
    const photo = input.files && input.files[0];
    if (!photo) return;

    const formData = new FormData();
    formData.append("profile_photo", photo);

    try {
      const response = await fetch(input.dataset.uploadUrl, {
        method: "POST",
        headers: {
          "X-CSRFToken":
            document.querySelector('meta[name="csrf-token"]')?.content || "",
        },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to upload the profile picture.");
      }

      image.src = `${result.image_url}?v=${Date.now()}`;
      if (window.toastr) {
        window.toastr.success("Admin profile picture updated.");
      }
    } catch (error) {
      if (window.toastr) {
        window.toastr.error(error.message || "Unable to upload the profile picture.");
      } else {
        console.error("Lab admin profile photo upload failed:", error);
      }
    } finally {
      input.value = "";
    }
  });
});
