(function () {
  document.querySelectorAll("[data-uuid-barcode]").forEach((barcode) => {
    const uuid = barcode.dataset.uuidBarcode;
    const digits = uuid
      .toLowerCase()
      .replace(/[^0-9a-f]/g, "")
      .slice(0, 12);
    const wrapper = barcode.closest(".internal-directory-uuid");
    const value = wrapper.querySelector(".internal-directory-uuid-value");
    const shortenedUuid = `${uuid.slice(0, 8)}...${uuid.slice(-4)}`;

    value.textContent = wrapper.classList.contains("internal-directory-uuid--detail")
      ? uuid
      : shortenedUuid;

    if (wrapper.hasAttribute("data-expand-uuid")) {
      wrapper.tabIndex = 0;
      wrapper.setAttribute("aria-label", `UUID ${uuid}`);
      value.dataset.fullUuid = uuid;

      let copiedLabelTimeout;

      async function copyUuid() {
        await navigator.clipboard.writeText(uuid);
        value.dataset.fullUuid = "Copied!";
        wrapper.setAttribute("data-copied", "");
        wrapper.setAttribute("aria-label", `Copied UUID ${uuid}`);
        window.clearTimeout(copiedLabelTimeout);
        copiedLabelTimeout = window.setTimeout(() => {
          value.dataset.fullUuid = uuid;
          wrapper.removeAttribute("data-copied");
          wrapper.setAttribute("aria-label", `UUID ${uuid}`);
        }, 1500);
      }

      wrapper.addEventListener("click", (event) => {
        event.stopPropagation();
        copyUuid();
      });

      wrapper.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        copyUuid();
      });
    } else {
      value.title = uuid;
    }

    barcode.replaceChildren(
      ...Array.from(digits, (digit, index) => {
        const dot = document.createElement("span");
        dot.style.setProperty("--internal-uuid-dot", `var(--internal-uuid-${digit})`);
        dot.style.zIndex = digits.length - index;
        return dot;
      }),
    );
  });
})();
