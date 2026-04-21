document.addEventListener('click', (e) => {
  const compact = e.target.closest('.m__datepicker-compact');
  if (!compact) return;
  const input = compact.querySelector('input[type="date"]');
  if (!input || e.target === input) return;
  input.showPicker?.();
});
