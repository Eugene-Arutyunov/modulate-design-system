// Tables are rendered by Eleventy. Only image enhancement runs in the browser.
const updateFade = image => {
  const frame = image.closest('.ui-viz__image-frame');
  frame?.classList.toggle('ui-viz__image-frame--cropped', image.clientHeight > frame.clientHeight + 1);
};
const observer = new ResizeObserver(entries => entries.forEach(({target}) => updateFade(target)));
for (const image of document.querySelectorAll('.ui-viz__image-frame img')) {
  image.addEventListener('load', () => updateFade(image));
  image.addEventListener('error', () => {
    const pair = image.closest('.ui-viz__comparison-state');
    const figure = image.closest('figure');
    const placeholder = document.createElement('p');
    placeholder.className = 'ui-viz__empty'; placeholder.textContent = '—';
    image.closest('a')?.replaceWith(placeholder);
    figure?.querySelector('.ui-viz__capture-url')?.replaceChildren();
    pair?.querySelector('.ui-viz__differences')?.remove();
    observer.unobserve(image);
  });
  observer.observe(image);
  if (image.complete) updateFade(image);
}
