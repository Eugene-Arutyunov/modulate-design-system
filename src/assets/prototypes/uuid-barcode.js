(function () {
  document.querySelectorAll("[data-uuid-barcode]").forEach((barcode) => {
    const uuid = barcode.dataset.uuidBarcode;
    const digits = uuid
      .toLowerCase()
      .replace(/[^0-9a-f]/g, "")
      .slice(0, 12);
    const wrapper = barcode.closest(".internal-directory-uuid");
    const value = wrapper.querySelector(".internal-directory-uuid-value");

    value.textContent = wrapper.classList.contains("internal-directory-uuid--detail")
      ? uuid
      : `${uuid.slice(0, 8)}...${uuid.slice(-4)}`;
    value.title = uuid;

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
