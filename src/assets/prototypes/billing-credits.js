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

  function updatePayLabel(credits) {
    var val = Math.max(0, parseInt(credits, 10) || 0);
    payLabelEl.textContent = formatUSD(val);
  }

  function clearPresets() {
    presetCards.forEach(function (card) {
      var radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = false;
      }
    });
  }

  function selectPreset(card) {
    if (!card) return;
    var radio = card.querySelector('input[type="radio"]');
    if (radio) {
      input.value = '';
      radio.checked = true;
      updatePayLabel(radio.value);
    }
  }

  input.addEventListener('focus', function () {
    clearPresets();
    update();
  });

  input.addEventListener('input', function () {
    clearPresets();
    update();
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

  var initialPreset = document.querySelector('input[name="credits-preset"]:checked');
  updatePayLabel(initialPreset ? initialPreset.value : input.value);
})();
