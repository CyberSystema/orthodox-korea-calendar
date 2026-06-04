// ─────────────────────────────────────────────────────────────
// Iframe auto-resize support
// ─────────────────────────────────────────────────────────────
// When this app is loaded inside an <iframe>, it measures its own
// content height and posts it to the parent window so the parent can
// size the iframe to fit the content exactly — no inner scroll bars.
//
// Parent pages opt in with a tiny listener (see README "Embedding"):
//
//   window.addEventListener('message', (e) => {
//     if (!e.data || e.data.type !== 'okc:resize') return;
//     for (const f of document.getElementsByTagName('iframe')) {
//       if (f.contentWindow === e.source) { f.style.height = e.data.height + 'px'; break; }
//     }
//   });

const RESIZE_MESSAGE = 'okc:resize';
const REQUEST_MESSAGE = 'okc:request-size';

/** Full height of the rendered content, independent of the iframe's height. */
function measureHeight(): number {
  const doc = document.documentElement;
  const body = document.body;
  return Math.ceil(
    Math.max(
      body?.scrollHeight ?? 0,
      body?.offsetHeight ?? 0,
      doc?.scrollHeight ?? 0,
      doc?.offsetHeight ?? 0,
    ),
  );
}

export function initEmbedAutoResize(): void {
  // Only relevant when embedded in another browsing context.
  if (typeof window === 'undefined' || window.parent === window) return;

  const view =
    new URL(window.location.href).searchParams.get('view') === 'today' ? 'today' : 'calendar';

  let lastHeight = -1;
  let frame = 0;

  const post = () => {
    frame = 0;
    const height = measureHeight();
    if (height === 0 || height === lastHeight) return;
    lastHeight = height;
    window.parent.postMessage({ type: RESIZE_MESSAGE, height, view }, '*');
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(post);
  };

  // Content box of <html> tracks the rendered content height (the iframe
  // viewport never stretches it because html/body height stays auto), so a
  // ResizeObserver here fires whenever the content grows or shrinks.
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(schedule);
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);
  }

  // Backup for DOM swaps that don't change the observed nodes' own box.
  const mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { subtree: true, childList: true });

  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);

  // Let a parent explicitly re-request the current height after it (re)attaches.
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === REQUEST_MESSAGE) {
      lastHeight = -1;
      schedule();
    }
  });

  schedule();
}
