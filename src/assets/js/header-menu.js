(function () {
  var trigger = document.getElementById('header-user-trigger');
  var popover = document.getElementById('header-user-popover');
  if (!trigger || !popover) return;

  function open() {
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  function toggle() {
    if (popover.hidden) {
      open();
    } else {
      close();
    }
  }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', function (e) {
    if (popover.hidden) return;
    if (trigger.contains(e.target) || popover.contains(e.target)) return;
    close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (popover.hidden) return;
    close();
  });
})();
