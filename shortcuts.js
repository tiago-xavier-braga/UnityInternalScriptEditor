// ── shortcuts.js ──────────────────────────────────────────────────────────────
// Global keyboard shortcuts that work regardless of which element has focus.
// Per-editor shortcuts (Tab, Ctrl+S, Ctrl+W) live in editor.js / onKeyDown.

document.addEventListener('keydown', e => {
  if (!e.ctrlKey && !e.metaKey) return;

  switch (e.key) {
    case 'n':
      e.preventDefault();
      newFile();
      break;

    case 'o':
      e.preventDefault();
      openFile();
      break;

    // Ctrl+Tab / Ctrl+Shift+Tab — cycle through tabs
    case 'Tab':
      e.preventDefault();
      if (!tabs.length) return;
      const idx  = tabs.findIndex(t => t.id === activeId);
      const step = e.shiftKey ? -1 : 1;
      const next = (idx + step + tabs.length) % tabs.length;
      activateTab(tabs[next].id);
      break;
  }
});
