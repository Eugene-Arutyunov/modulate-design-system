(function () {
  var input = document.querySelector('[data-credits-input]');
  var payLabelEl = document.querySelector('[data-credits-pay-label]');
  var payButton = document.querySelector('[data-credits-pay]');
  var presetCards = document.querySelectorAll('[data-credits-preset]');
  var wasOverLimit = false;
  var lastAcceptedCustomValue = '';

  if (!input || !payLabelEl || !presetCards.length) return;

  var maxCustomCredits = parseCredits(input.dataset.creditsMax);
  var maxCustomDigits = String(maxCustomCredits).length;

  function formatUSD(credits) {
    return '$' + (credits * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseCredits(value) {
    return Math.max(0, parseInt(String(value).replace(/\D/g, ''), 10) || 0);
  }

  function formatCreditsInput(value) {
    var digits = String(value).replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function updateCustomValidity(shouldReport) {
    var credits = parseCredits(input.value);
    var isOverLimit = maxCustomCredits > 0 && credits > maxCustomCredits;

    input.toggleAttribute('data-touched', input.value !== '');
    input.setAttribute('aria-invalid', String(isOverLimit));
    input.setCustomValidity(isOverLimit ? 'Enter 1,000,000 credits or fewer.' : '');

    if (isOverLimit && shouldReport && !wasOverLimit) {
      input.reportValidity();
    }

    wasOverLimit = isOverLimit;
  }

  function updatePayLabel(credits) {
    payLabelEl.textContent = formatUSD(parseCredits(credits));
  }

  function update(shouldReport) {
    updateCustomValidity(shouldReport);
    updatePayLabel(input.value);
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
      lastAcceptedCustomValue = '';
      radio.checked = true;
      updateCustomValidity(false);
      updatePayLabel(radio.value);
    }
  }

  input.addEventListener('focus', function () {
    clearPresets();
    lastAcceptedCustomValue = input.value;
    update(false);
  });

  input.addEventListener('input', function () {
    clearPresets();
    var digits = input.value.replace(/\D/g, '');
    var formattedValue = formatCreditsInput(input.value);

    if (maxCustomDigits > 0 && digits.length > maxCustomDigits) {
      input.value = lastAcceptedCustomValue;
      input.setAttribute('aria-invalid', 'true');
      input.toggleAttribute('data-touched', true);
      update(true);
      return;
    }

    input.value = formattedValue;
    lastAcceptedCustomValue = formattedValue;
    update(true);
  });

  if (payButton) {
    payButton.addEventListener('click', function () {
      updateCustomValidity(false);

      if (!input.checkValidity()) {
        input.reportValidity();
      }
    });
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

  var initialPreset = document.querySelector('input[name="credits-preset"]:checked');
  updatePayLabel(initialPreset ? initialPreset.value : input.value);
})();
