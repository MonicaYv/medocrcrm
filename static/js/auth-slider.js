(function () {
  const scenes = Array.from(document.querySelectorAll(".illus-scene"));
  const dots = Array.from(document.querySelectorAll(".dots span"));

  if (scenes.length < 3 || dots.length !== scenes.length) return;

  let activeIndex = 0;
  let timerId;
  let isHovered = false;

  function setActiveSlide(index) {
    activeIndex = (index + scenes.length) % scenes.length;

    scenes.forEach((scene, sceneIndex) => {
      scene.classList.toggle("active", sceneIndex === activeIndex);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === activeIndex);
    });
  }

  function startAutoSlide() {
    clearInterval(timerId);
    if (isHovered) return;
    timerId = setInterval(() => {
      setActiveSlide(activeIndex + 1);
    }, 4000);
  }

  dots.forEach((dot, dotIndex) => {
    dot.setAttribute("role", "button");
    dot.setAttribute("tabindex", "0");
    dot.setAttribute("aria-label", `Show illustration ${dotIndex + 1}`);
    dot.addEventListener("click", () => {
      setActiveSlide(dotIndex);
      startAutoSlide();
    });
    dot.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveSlide(dotIndex);
        startAutoSlide();
      }
    });
  });

  const panel = document.querySelector(".illus-panel");
  panel.addEventListener("mouseenter", () => {
    isHovered = true;
    clearInterval(timerId);
  });
  panel.addEventListener("mouseleave", () => {
    isHovered = false;
    startAutoSlide();
  });

  window.setAuthSlide = (index) => {
    setActiveSlide(index);
    startAutoSlide();
  };

  setActiveSlide(0);
  startAutoSlide();
})();
