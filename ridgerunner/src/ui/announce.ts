// A hidden live region for screen readers. Call this for anything a sighted player would see
// happen, so it reaches someone using a screen reader too.
let region: HTMLElement | null = null;

function get(): HTMLElement {
  if (region) return region;
  const el = document.createElement('div');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('role', 'status');
  el.style.position = 'absolute';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.overflow = 'hidden';
  el.style.clip = 'rect(0 0 0 0)';
  document.body.appendChild(el);
  region = el;
  return el;
}

export function announce(text: string): void {
  try {
    get().textContent = text;
  } catch {
    // no DOM
  }
}
