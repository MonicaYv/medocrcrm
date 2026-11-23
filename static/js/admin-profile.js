document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("admin-profile-photo-input");
  if (!input) return;

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

      let image = document.getElementById("admin-profile-photo");
      if (!image) {
        image = document.createElement("img");
        image.id = "admin-profile-photo";
        image.alt = "";
        image.style.cssText = "width:48px;height:48px;border-radius:8px;object-fit:cover;border:2px solid #1d6fe8";
        input.parentElement.insertBefore(image, input);
      }
      image.src = `${result.image_url}?v=${Date.now()}`;
      image.style.display = "";
      const fallback = document.getElementById("admin-profile-photo-fallback");
      if (fallback) fallback.style.display = "none";
      const sidebarImage = document.getElementById("sidebar-profile-photo");
      if (sidebarImage) {
        sidebarImage.src = `${result.image_url}?v=${Date.now()}`;
        sidebarImage.classList.remove("hidden");
      }
      document.getElementById("sidebar-profile-initials")?.classList.add("hidden");
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
