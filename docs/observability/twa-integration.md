# TWA Integration — Overlay Suppression (Stub)

- Overlay must hide when:
  - `openInvoice()` is invoked (payments), or
  - Any modal/dialog flow is active.
- Hook via a thin TWA adapter:
  - Wrap `openInvoice()` and MainButton callbacks to toggle overlay visibility.
  - Fallback: manual hide when `document.visibilityState !== 'visible'`.

_No code in this PR — next PR adds the adapter._
