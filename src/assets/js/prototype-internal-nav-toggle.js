(function () {
  var STORAGE_KEY = 'prototype-internal-nav-hidden';
  var BODY_CLASS = 'prototype-hide-internal-nav';
  var btn = document.getElementById('prototype-internal-nav-toggle');

  function applyFromStorage() {
    try {
      var hidden = localStorage.getItem(STORAGE_KEY) === '1';
      if (hidden) {
        document.body.classList.add(BODY_CLASS);
      } else {
        document.body.classList.remove(BODY_CLASS);
      }
      if (btn) {
        btn.setAttribute('aria-checked', hidden ? 'false' : 'true');
      }
    } catch (e) {
      /* ignore */
    }
  }

  function toggle() {
    try {
      var hidden = localStorage.getItem(STORAGE_KEY) === '1';
      if (hidden) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, '1');
      }
    } catch (err) {
      document.body.classList.toggle(BODY_CLASS);
      if (btn) {
        btn.setAttribute(
          'aria-checked',
          document.body.classList.contains(BODY_CLASS) ? 'false' : 'true'
        );
      }
      return;
    }
    applyFromStorage();
  }

  if (btn) {
    btn.addEventListener('click', toggle);
  }

  applyFromStorage();
})();
