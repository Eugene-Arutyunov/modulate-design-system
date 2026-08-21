(function () {
  // The key is also read by the inline restore script in nav-island.html.
  var STORAGE_KEY = 'nav-island-open';
  var island = document.querySelector('.nav-island');
  if (!island) return;

  function setOpen(open) {
    island.classList.toggle('is-open', open);
    try {
      if (open) {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }

  var closeBtn = island.querySelector('.nav-island__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      setOpen(false);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (!event.altKey || event.metaKey || event.ctrlKey) return;
    // event.code: on macOS Option-N types "ñ", so event.key is unreliable.
    if (event.code !== 'KeyN') return;
    // Only typing fields swallow the shortcut: a focused <select> (e.g.
    // a sidebar picker after choosing an option) must not block it.
    var target = event.target;
    if (
      target &&
      ((target.matches && target.matches('input, textarea')) ||
        target.isContentEditable)
    ) {
      return;
    }
    event.preventDefault();
    setOpen(!island.classList.contains('is-open'));
  });
})();
