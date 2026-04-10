(function () {
  var KEY = document.body.dataset.themeStorageKey || 'prototype-theme';
  var btns = document.querySelectorAll('.theme-toggle');
  if (!btns.length) return;

  function isDark() {
    return document.documentElement.style.colorScheme === 'dark';
  }

  function updateToggles() {
    btns.forEach(function (btn) {
      btn.setAttribute('aria-checked', isDark() ? 'true' : 'false');
    });
  }

  updateToggles();

  function handleClick() {
    if (isDark()) {
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem(KEY, 'light');
    } else {
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem(KEY, 'dark');
    }
    updateToggles();
  }

  btns.forEach(function (btn) {
    btn.addEventListener('click', handleClick);
  });
})();
