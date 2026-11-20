// Screen readers can't see inside the game canvas, so important text is also put in a
// hidden "live region" in the page (see index.html), which screen readers read aloud.

let region: HTMLElement | null = null;
let last = '';

export function announce(message: string): void {
  if (typeof document === 'undefined') return;
  region ??= document.getElementById('sr-announcer');
  if (!region || !message) return;
  // Clearing first makes screen readers repeat a message even if it's the same as last time.
  region.textContent = '';
  const text = message === last ? `${message} ` : message;
  last = text;
  window.setTimeout(() => {
    if (region) region.textContent = text;
  }, 60);
}
