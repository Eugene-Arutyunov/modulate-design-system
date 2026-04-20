document.addEventListener('change', (e) => {
  if (e.target.matches('.m__select-compact select')) {
    const valueEl = e.target.closest('.m__select')?.querySelector('.m__select__value');
    if (valueEl) valueEl.textContent = e.target.options[e.target.selectedIndex].text;
  }
});

document.addEventListener('blur', (e) => {
  if (e.target.matches('.m__textfield input') && !e.target.validity.valid) {
    e.target.dataset.touched = '';
  }
}, true);

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('.m__textfield input') && el.validity.valid) {
    delete el.dataset.touched;
  }
});
