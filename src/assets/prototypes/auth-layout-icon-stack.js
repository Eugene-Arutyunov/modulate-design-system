const stack = document.querySelector(".auth-layout__icon-stack");

if (stack) {
  stack.dataset.stackFocus = "velma";

  stack.querySelectorAll(".auth-layout__icon-hover-zone[data-term]").forEach(
    (zone) => {
      zone.addEventListener("pointerenter", () => {
        stack.dataset.stackFocus = zone.dataset.term;
      });
    },
  );
}
