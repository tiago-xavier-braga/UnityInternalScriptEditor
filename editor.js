// ── editor.js ─────────────────────────────────────────────────────────────────
// Handles all in-editor interactions: input, keydown, scroll sync,
// gutter updates, cursor tracking, and highlight refresh.

function onInput(id) {
  const ta  = document.getElementById(`ta-${id}`);
  const tab = tabs.find(t => t.id === id);
  if (!ta || !tab) return;

  tab.content = ta.value;
  markDirty(id);
  updateGutter(id);
  updateHighlight(id);
  updateStatus(id);
}

function onKeyDown(e, id) {
  const ta = document.getElementById(`ta-${id}`);
  if (!ta) return;

  // Tab → insert 4 spaces (no focus loss)
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = s + 4;
    onInput(id);
    return;
  }

  if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveFile(); }
  if (e.key === 'w' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); closeTab(e, activeId); }
  if (e.key === 't' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); newFile(); }
}

function syncScroll(id) {
  const ta     = document.getElementById(`ta-${id}`);
  const gutter = document.getElementById(`gutter-${id}`);
  const hl     = document.getElementById(`hl-${id}`);
  if (!ta) return;

  if (gutter) gutter.style.marginTop = `${-ta.scrollTop}px`;
  if (hl)     hl.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
}

function updateGutter(id) {
  const ta     = document.getElementById(`ta-${id}`);
  const gutter = document.getElementById(`gutter-${id}`);
  if (!ta || !gutter) return;

  const lineCount = ta.value.split('\n').length;
  gutter.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  // Keep status bar in sync while we're here
  if (id === activeId) {
    document.getElementById('s-lines').textContent = `${lineCount} lines`;
  }
}

function updateHighlight(id) {
  const ta  = document.getElementById(`ta-${id}`);
  const hl  = document.getElementById(`hl-${id}`);
  const tab = tabs.find(t => t.id === id);
  if (!ta || !hl || !tab) return;

  hl.innerHTML = tokenize(ta.value, tab.ext);
}

function updateCursor(id) {
  const ta = document.getElementById(`ta-${id}`);
  if (!ta) return;

  const before = ta.value.slice(0, ta.selectionStart).split('\n');
  const ln  = before.length;
  const col = before[before.length - 1].length + 1;
  document.getElementById('s-cursor').textContent = `Ln ${ln}, Col ${col}`;
}

function updateStatus(id) {
  const ta  = document.getElementById(`ta-${id}`);
  const tab = tabs.find(t => t.id === id);
  if (!ta || !tab) return;

  document.getElementById('s-lines').textContent = `${ta.value.split('\n').length} lines`;
  document.getElementById('s-lang').textContent  = tab.lang;
}

// Shared utility
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
