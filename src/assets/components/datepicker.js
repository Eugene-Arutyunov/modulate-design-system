document.addEventListener('click', (e) => {
  const datepicker = e.target.closest('.m__datepicker.S');
  if (!datepicker) return;
  const input = datepicker.querySelector('input[type="date"]');
  if (!input || e.target === input) return;
  input.showPicker?.();
});
