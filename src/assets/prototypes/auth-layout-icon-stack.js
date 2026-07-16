const stack = document.querySelector(".auth-layout__icon-stack");

if (stack) {
  stack.querySelectorAll(".auth-layout__icon-hover-zone[data-term]").forEach(
    (zone) => {
      zone.addEventListener("pointerenter", () => {
        stack.dataset.stackFocus = zone.dataset.term;
      });
    },
  );

  const zones = stack.querySelector(".auth-layout__icon-hover-zones");

  if (zones) {
    zones.addEventListener("pointerleave", () => {
      delete stack.dataset.stackFocus;
    });
  }
}
