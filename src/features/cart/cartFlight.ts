export function animateCartFlight(source: HTMLElement | null): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const card = source?.closest<HTMLElement>('[data-cart-flight-card]');
  const image = card?.querySelector<HTMLImageElement>('img');
  const target = document.querySelector<HTMLElement>('[data-cart-target]');
  if (!image || !target || !image.currentSrc && !image.src) return;

  const start = image.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  if (!start.width || !start.height || !end.width || !end.height) return;

  const flyer = image.cloneNode() as HTMLImageElement;
  flyer.alt = '';
  flyer.setAttribute('aria-hidden', 'true');
  Object.assign(flyer.style, {
    position: 'fixed',
    zIndex: '100',
    left: `${start.left}px`,
    top: `${start.top}px`,
    width: `${start.width}px`,
    height: `${start.height}px`,
    objectFit: 'cover',
    borderRadius: '8px',
    pointerEvents: 'none',
    margin: '0',
  });
  document.body.appendChild(flyer);

  const deltaX = end.left + end.width / 2 - (start.left + start.width / 2);
  const deltaY = end.top + end.height / 2 - (start.top + start.height / 2);
  const scaleX = Math.max(0.15, Math.min(0.5, end.width / start.width));
  const scaleY = Math.max(0.15, Math.min(0.5, end.height / start.height));
  const animation = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
        opacity: 0.25,
      },
    ],
    { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  );
  void animation.finished.then(
    () => flyer.remove(),
    () => flyer.remove()
  );
}
