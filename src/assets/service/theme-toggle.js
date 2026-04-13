(function () {
  var KEY = document.body.dataset.themeStorageKey || 'prototype-theme';
  var btns = document.querySelectorAll('.theme-toggle');
  if (!btns.length) return;

  function updateToggles() {
    var isDark = document.body.classList.contains('dark-mode');
    btns.forEach(function (btn) {
      btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
    });
  }

  updateToggles();

  function handleClick() {
    var isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem(KEY, 'light');
    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem(KEY, 'dark');
    }
    updateToggles();
  }

  btns.forEach(function (btn) {
    btn.addEventListener('click', handleClick);
  });
})();
