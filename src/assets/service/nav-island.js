(function () {
  var btn = document.querySelector('.nav-island__close');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var island = btn.closest('.nav-island');
    if (island) {
      island.style.display = 'none';
    }
  });
})();
