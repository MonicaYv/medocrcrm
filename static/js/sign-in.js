const phoneInput = document.getElementById("phoneInput");
const continueBtn = document.getElementById("continueBtn");
const screenSignIn = document.getElementById("screenSignIn");
const screenOtp = document.getElementById("screenOtp");
const signinScene = document.getElementById("signinScene");
const otpScene = document.getElementById("otpScene");
const dot0 = document.getElementById("dot0");
const dot1 = document.getElementById("dot1");
const otpPhoneDisplay = document.getElementById("otpPhoneDisplay");
const editNumberBtn = document.getElementById("editNumberBtn");

// enable Continue only with 10 digit number
phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  continueBtn.disabled = phoneInput.value.length !== 10;
});

// service tiles
document.querySelectorAll(".service-tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    document
      .querySelectorAll(".service-tile")
      .forEach((t) => t.classList.remove("active"));
    tile.classList.add("active");
  });
});

function maskNumber(num) {
  if (num.length < 5) return num + "*****";
  return num.slice(0, 5) + "*****";
}

function goToOtp() {
  screenSignIn.classList.remove("active");
  screenOtp.classList.add("active");
  screenOtp.classList.add("fade-in");
  signinScene.style.display = "none";
  otpScene.style.display = "flex";
  dot0.classList.remove("active");
  dot1.classList.add("active");
  otpPhoneDisplay.textContent = maskNumber(phoneInput.value || "81022");
  startTimer();
  setTimeout(() => document.querySelector(".otp-box").focus(), 100);
}

function goToSignIn() {
  screenOtp.classList.remove("active");
  screenSignIn.classList.add("active");
  screenSignIn.classList.add("fade-in");
  otpScene.style.display = "none";
  signinScene.style.display = "flex";
  dot1.classList.remove("active");
  dot0.classList.add("active");
}

//login screen - continue btn
let redirectUrl = "";
continueBtn.addEventListener("click", function () {

    if (continueBtn.disabled) return;

    const form = document.getElementById("loginForm");
    const formData = new FormData(form);

    fetch(form.dataset.checkUrl, {
        method: "POST",
        headers: {
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {

        if (!data.success) {
            toastr.error(data.message);
            return;
        }

        // toastr.success(data.message);

        otpPhoneDisplay.textContent = maskNumber(phoneInput.value);

        goToOtp();

    })
    .catch(() => {
        toastr.error("Something went wrong.");
    });

});

//otp screen - done btn
document.getElementById("doneBtn").addEventListener("click", function () {

    const otp = otpBoxes.map(box => box.value).join("");

    if (otp.length !== 6) {
        toastr.error("Please enter 6 digit OTP.");
        return;
    }

    const form = document.getElementById("loginForm");
    const formData = new FormData(form);

    formData.append("otp", otp);

    fetch(form.dataset.loginUrl, {
        method: "POST",
        headers: {
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {

        if (!data.success) {
            toastr.error(data.message);
            return;
        }

        toastr.success(data.message);

        setTimeout(() => {
            window.location.href = data.redirect;
        }, 1000);

    })
    .catch(() => {
        toastr.error("Something went wrong.");
    });

});



editNumberBtn.addEventListener("click", (e) => {
  e.preventDefault();
  goToSignIn();
});

// OTP boxes: auto advance / backspace / paste
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

// resend timer
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

document.getElementById("resendLink").addEventListener("click", (e) => {
  e.preventDefault();
  startTimer();
  otpBoxes.forEach((b) => {
    b.value = "";
    b.classList.remove("filled");
  });
  otpBoxes[0].focus();
});

// document.getElementById("doneBtn").addEventListener("click", () => {
//   const code = otpBoxes.map((b) => b.value).join("");
//   if (code.length === 6) {
//     alert("OTP verified: " + code);
//   } else {
//     otpBoxes.find((b) => !b.value)?.focus();
//   }
// });
