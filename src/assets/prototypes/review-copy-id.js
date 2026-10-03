(function () {
  document.querySelectorAll('[data-copy-review-id]').forEach(function (control) {
    let timeout;
    let originalText;
    control.setAttribute('aria-live', 'polite');
    async function copy(event) {
      event.preventDefault();
      event.stopPropagation();
      const id = control.closest('[data-moderation-review]')?.dataset.conversationId || control.dataset.copyReviewId;
      if (originalText === undefined) originalText = control.textContent;
      try {
        await navigator.clipboard.writeText(id);
        control.textContent = 'Copied!';
        control.setAttribute('aria-label', 'Copied ID ' + id);
      } catch {
        control.textContent = 'Could not copy';
      }
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        control.textContent = originalText;
        originalText = undefined;
        control.setAttribute('aria-label', 'Copy conversation ID ' + id);
      }, 1500);
    }
    control.addEventListener('click', copy);
    control.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') copy(event);
    });
  });
})();
