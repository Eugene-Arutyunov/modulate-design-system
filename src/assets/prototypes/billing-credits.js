(function () {
  var input = document.querySelector('[data-credits-input]');
  var payLabelEl = document.querySelector('[data-credits-pay-label]');
  var customRow = document.querySelector('[data-credits-custom-row]');
  var otherButton = document.querySelector('[data-credits-other]');

  if (!input || !payLabelEl || !customRow || !otherButton) return;

  function formatUSD(credits) {
    return '$' + (credits * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function update() {
    var val = Math.max(0, parseInt(input.value, 10) || 0);
    payLabelEl.textContent = formatUSD(val);
  }

  function setCustomRowOpen(isOpen) {
    customRow.hidden = !isOpen;
    otherButton.setAttribute('aria-expanded', String(isOpen));
    otherButton.setAttribute('aria-pressed', String(isOpen));

    if (isOpen) {
      input.focus();
      input.select();
    }
  }

  var presetCards = document.querySelectorAll('[data-credits-preset]');

  presetCards.forEach(function (card) {
    card.addEventListener('click', function () {
      setCustomRowOpen(false);
    });
  });

  otherButton.addEventListener('click', function () {
    setCustomRowOpen(true);
  });

  input.addEventListener('input', function () {
    update();
  });

  update();
  setCustomRowOpen(false);
})();
