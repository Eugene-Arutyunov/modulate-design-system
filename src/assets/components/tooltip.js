(function () {
  var tooltip = document.querySelector('.m__tooltip');
  if (!tooltip) return;
  var anchor = null;

  function position(tag) {
    var rect = tag.getBoundingClientRect();
    var th = tooltip.offsetHeight;
    var cx = rect.left + rect.width / 2;
    var top = rect.top - th - 6;
    if (top < 8) top = rect.bottom + 6;
    tooltip.style.top = top + 'px';
    tooltip.style.left = cx + 'px';
  }

  document.addEventListener('mouseover', function (e) {
    var tag = e.target.closest('[data-tooltip]');
    if (!tag || !tag.dataset.tooltip) {
      tooltip.hidden = true;
      anchor = null;
      return;
    }
    tooltip.textContent = tag.dataset.tooltip;
    tooltip.hidden = false;
    anchor = tag;
    position(tag);
  });

  document.addEventListener('mouseout', function (e) {
    var to = e.relatedTarget;
    if (!to || !to.closest('[data-tooltip]')) {
      tooltip.hidden = true;
      anchor = null;
    }
  });

  document.addEventListener('scroll', function () {
    if (anchor && !tooltip.hidden) position(anchor);
  }, true);
})();
