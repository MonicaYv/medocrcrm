const roleScene = document.getElementById("roleScene");
const signupScene = document.getElementById("signupScene");
const otpScene = document.getElementById("otpScene");
const dot0 = document.getElementById("dot0");
const dot1 = document.getElementById("dot1");
const dot2 = document.getElementById("dot2");

const screenRole = document.getElementById("screenRole");
const screenSignUp = document.getElementById("screenSignUp");
const screenOtp = document.getElementById("screenOtp");

let selectedSignUpRole = "hospital";
// Hidden input for user type
const userTypeInput = document.getElementById("userType");

// Set default value
if (userTypeInput) {
  userTypeInput.value = selectedSignUpRole;
}

//select role
document.querySelectorAll(".role-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".role-card").forEach((c) => {
      c.classList.remove("selected");
    });

    card.classList.add("selected");

    selectedSignUpRole = card.dataset.role;

    // Update hidden input
    if (userTypeInput) {
      userTypeInput.value = selectedSignUpRole;
    }
  });
});

//switch screens
function showScreen(scene, dotIndex) {
  [screenRole, screenSignUp, screenOtp].forEach((s) =>
    s.classList.remove("active"),
  );
  [roleScene, signupScene, otpScene].forEach((s) => (s.style.display = "none"));
  scene.screenEl.classList.add("active");
  scene.screenEl.classList.add("fade-in");
  scene.illusEl.style.display = "flex";
  [dot0, dot1, dot2].forEach((d) => d.classList.remove("active"));
  [dot0, dot1, dot2][dotIndex].classList.add("active");
}

//role continue btn
document.getElementById("roleContinueBtn").addEventListener("click", () => {
  document.querySelectorAll("#signupTiles .service-tile").forEach((t) => {
    t.classList.toggle("active", t.dataset.tile === selectedSignUpRole);
  });

  // Keep hidden input updated
  if (userTypeInput) {
    userTypeInput.value = selectedSignUpRole;
  }

  showScreen(
    {
      screenEl: screenSignUp,
      illusEl: signupScene,
    },
    1,
  );
});

//go back to role
document.getElementById("backToRoleBtn").addEventListener("click", (e) => {
  e.preventDefault();
  showScreen({ screenEl: screenRole, illusEl: roleScene }, 0);
});

//sign up tiles
document.querySelectorAll("#signupTiles .service-tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    document.querySelectorAll("#signupTiles .service-tile").forEach((t) => {
      t.classList.remove("active");
    });

    tile.classList.add("active");

    selectedSignUpRole = tile.dataset.tile;

    // Update hidden input
    if (userTypeInput) {
      userTypeInput.value = selectedSignUpRole;
    }
  });
});

const phoneInput = document.getElementById("phoneInput");
const continueBtn = document.getElementById("continueBtn");
const otpPhoneDisplay = document.getElementById("otpPhoneDisplay");
const editNumberBtn = document.getElementById("editNumberBtn");

phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  continueBtn.disabled = phoneInput.value.length !== 10;
});

function maskNumber(num) {
  if (num.length < 5) return num + "*****";
  return num.slice(0, 5) + "*****";
}

// continueBtn.addEventListener("click", function () {

//     if (continueBtn.disabled) return;

//     otpPhoneDisplay.textContent = maskNumber(phoneInput.value);

//     showScreen(
//         {
//             screenEl: screenOtp,
//             illusEl: otpScene,
//         },
//         2
//     );

//     startTimer();

//     setTimeout(() => {
//         otpBoxes[0].focus();
//     }, 100);

// });

continueBtn.addEventListener("click", function () {

    if (continueBtn.disabled) return;

    const form = document.getElementById("signupForm");
    const formData = new FormData(form);

    fetch(form.dataset.checkUrl, {

        method: "POST",

        headers: {
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        },

        body: formData

    })

    .then(async response => {

        const data = await response.json();

        if (!response.ok) {
            toastr.error(data.message);
            return;
        }

        otpPhoneDisplay.textContent = maskNumber(phoneInput.value);

        showScreen({
            screenEl: screenOtp,
            illusEl: otpScene
        }, 2);

        startTimer();

        setTimeout(() => {
            otpBoxes[0].focus();
        }, 100);

    })

    .catch(() => {
        toastr.error("Something went wrong.");
    });

});


document.getElementById("doneBtn").addEventListener("click", function () {

    const code = otpBoxes.map(box => box.value).join("");

    if (code.length !== 6) {
        toastr.error("Please enter a 6-digit OTP.");
        return;
    }

    // Temporary OTP
    if (code !== "123456") {
        toastr.error("Invalid OTP");
        return;
    }

    const form = document.getElementById("signupForm");
    const formData = new FormData(form);

    fetch(form.dataset.url, {
        method: "POST",
        headers: {
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        },
        body: formData,
    })
    .then(async response => {

        const data = await response.json();

        if (!response.ok) {
            toastr.error(data.errors.phone_number || data.message);
            return;
        }

        toastr.success("OTP Verified Successfully");

        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = "/";
        }, 2000);

    })
    .catch(() => {
        toastr.error("Something went wrong.");
    });

});


// //final save data via ajax
// continueBtn.addEventListener("click", function () {
//   if (continueBtn.disabled) return;

//   const form = document.getElementById("signupForm");
//   const formData = new FormData(form);

//   fetch(form.dataset.url, {
//     method: "POST",
//     headers: {
//       "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
//     },
//     body: formData,
//   })
//     .then((response) => {
//       return response.json();
//     })
//     .then((data) => {
//       if (data.success) {
//         form.dataset.userId = data.user_id;
//         otpPhoneDisplay.textContent = maskNumber(phoneInput.value);
//         showScreen(
//           {
//             screenEl: screenOtp,
//             illusEl: otpScene,
//           },
//           2,
//         );

//         startTimer();

//         setTimeout(() => {
//           otpBoxes[0].focus();
//         }, 100);
//       } else {
//         toastr.error(data.errors.phone_number || data.message);
//         // alert(JSON.stringify(data.errors));
//       }
//     })
//     .catch((error) => {        
//         toastr.error("Something went wrong.");
//         //console.log(error);
//     });
// });

editNumberBtn.addEventListener("click", (e) => {
  e.preventDefault();
  showScreen({ screenEl: screenSignUp, illusEl: signupScene }, 1);
});

// OTP boxes
const otpBoxes = Array.from(document.querySelectorAll(".otp-box"));
otpBoxes.forEach((box, i) => {
  box.addEventListener("input", () => {
    box.value = box.value.replace(/\D/g, "").slice(0, 1);
    box.classList.toggle("filled", box.value.length === 1);
    if (box.value && otpBoxes[i + 1]) otpBoxes[i + 1].focus();
  });
  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && otpBoxes[i - 1]) {
      otpBoxes[i - 1].focus();
    }
  });
  box.addEventListener("paste", (e) => {
    e.preventDefault();
    const digits = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 4)
      .split("");
    digits.forEach((d, idx) => {
      if (otpBoxes[idx]) {
        otpBoxes[idx].value = d;
        otpBoxes[idx].classList.add("filled");
      }
    });
    if (otpBoxes[digits.length]) otpBoxes[digits.length].focus();
  });
});

//otp timer
let timerInterval;
function startTimer() {
  clearInterval(timerInterval);
  let seconds = 34;
  const timerEl = document.getElementById("timer");
  const resendLink = document.getElementById("resendLink");
  resendLink.classList.add("hidden");
  timerEl.parentElement.classList.remove("hidden");
  timerEl.textContent = "00:" + String(seconds).padStart(2, "0");
  timerInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(timerInterval);
      timerEl.parentElement.classList.add("hidden");
      resendLink.classList.remove("hidden");
    } else {
      timerEl.textContent = "00:" + String(seconds).padStart(2, "0");
    }
  }, 1000);
}

//resend otp
document.getElementById("resendLink").addEventListener("click", (e) => {
  e.preventDefault();
  startTimer();
  otpBoxes.forEach((b) => {
    b.value = "";
    b.classList.remove("filled");
  });
  otpBoxes[0].focus();
});

// Verify OTP
// document.getElementById("doneBtn").addEventListener("click", function () {
//   const code = otpBoxes.map((box) => box.value).join("");

//   if (code.length !== 6) {
//     alert("Please enter 6 digit OTP.");
//     return;
//   }

//   // Temporary OTP for testing
//   if (code !== "123456") {
//     alert("Invalid OTP");
//     return;
//   }

//   alert("OTP Verified Successfully");
//   window.location.href = this.dataset.url;
// });

// On close btn redirect for login if closebtn exists
const closeBtn = document.getElementById("closeBtn");

if (closeBtn) {
    closeBtn.addEventListener("click", function () {
        window.location.href = this.dataset.url;
    });
}


// GAuth
const googleSignupBtn = document.getElementById("googleSignupBtn");

if (googleSignupBtn) {
    googleSignupBtn.addEventListener("click", function () {
        const userType = document.getElementById("userType").value;

        window.location.href =
            `/user/google/login/?mode=signup&role=${encodeURIComponent(userType)}`;
    });
}

// const googleSignupBtn = document.getElementById("googleSignupBtn");

// if (googleSignupBtn) {
//     googleSignupBtn.addEventListener("click", function () {
//         console.log("Google signup button clicked!");

//         const userType = document.getElementById("userType").value;

//         console.log("Selected role:", userType);

//         window.location.href =
//             `/user/google/login/?mode=signup&role=${encodeURIComponent(userType)}`;
//     });
// }
