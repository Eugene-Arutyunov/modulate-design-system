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

  var presetBtns = document.querySelectorAll('[data-credits-preset]');

  function updatePresetActive() {
    presetBtns.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.creditsPreset === input.value ? 'true' : 'false');
    });
  }

  input.addEventListener('input', function () {
    update();
    updatePresetActive();
  });

  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      input.value = btn.dataset.creditsPreset;
      update();
      updatePresetActive();
    });
  });

  update();
  updatePresetActive();
})();
