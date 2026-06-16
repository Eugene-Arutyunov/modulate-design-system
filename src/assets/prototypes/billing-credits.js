(function () {
  var input = document.querySelector('[data-credits-input]');
  var payLabelEl = document.querySelector('[data-credits-pay-label]');

  function formatUSD(credits) {
    return '$' + (credits * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function update() {
    var val = Math.max(0, parseInt(input.value, 10) || 0);
    payLabelEl.textContent = formatUSD(val);
  }

  var presetCards = document.querySelectorAll('[data-credits-preset]');

  function updatePresetActive() {
    presetCards.forEach(function (card) {
      var radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = card.dataset.creditsPreset === input.value;
      }
    });
  }

  input.addEventListener('input', function () {
    update();
    updatePresetActive();
  });

  function selectPreset(card) {
    if (!card) return;
    input.value = card.dataset.creditsPreset;
    update();
    updatePresetActive();
  }

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
