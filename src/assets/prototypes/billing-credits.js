(function () {
  var input = document.querySelector('[data-credits-input]');
  var payLabelEl = document.querySelector('[data-credits-pay-label]');
  var presetCards = document.querySelectorAll('[data-credits-preset]');

  if (!input || !payLabelEl || !presetCards.length) return;

  function formatUSD(credits) {
    return '$' + (credits * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function update() {
    var val = Math.max(0, parseInt(input.value, 10) || 0);
    payLabelEl.textContent = formatUSD(val);
  }

  function updatePresetActive() {
    presetCards.forEach(function (card) {
      var radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = radio.value === input.value;
      }
    });
  }

  function selectPreset(card) {
    if (!card) return;
    var radio = card.querySelector('input[type="radio"]');
    if (radio) {
      input.value = radio.value;
      radio.checked = true;
      update();
    }
  }

  input.addEventListener('input', function () {
    update();
    updatePresetActive();
  });

  presetCards.forEach(function (card) {
    var radio = card.querySelector('input[type="radio"]');

    card.addEventListener('click', function () {
      selectPreset(card);
    });

    if (radio) {
      radio.addEventListener('change', function () {
        if (!radio.checked) return;
        selectPreset(card);
      });
    }
  });

  update();
  updatePresetActive();
})();
