// ── tabs.js ───────────────────────────────────────────────────────────────────
// Manages the tab state array and all tab-related DOM operations.
// Exposes: newFile(), activateTab(), closeTab()

let tabs = [];
let activeId = null;
let nextId = 1;

// Creates a new tab, optionally pre-filled with content.
// fromOpen = true means the file came from disk (not dirty).
function newFile(name = 'untitled', content = '', fromOpen = false) {
  const ext = name.split('.').pop().toLowerCase();
  const tab = {
    id:       nextId++,
    name,
    content,
    ext,
    lang:     detectLang(name),
    dirty:    !fromOpen,
    filePath: null,
  };

  tabs.push(tab);
  _renderTabButton(tab);
  _renderEditorPane(tab);
  activateTab(tab.id);

  document.getElementById('empty-hint')?.remove();
}

function activateTab(id) {
  activeId = id;

  document.querySelectorAll('.tab')
    .forEach(t => t.classList.toggle('active', +t.dataset.id === id));
  document.querySelectorAll('.editor-pane')
    .forEach(p => p.classList.toggle('active', p.id === `pane-${id}`));

  const tab = _getTab(id);
  if (!tab) return;

  document.getElementById('s-lang').textContent = tab.lang;
  updateGutter(id);
  updateStatus(id);
  setTimeout(() => document.getElementById(`ta-${id}`)?.focus(), 0);
}

function closeTab(e, id) {
  e.stopPropagation();
  const tab = _getTab(id);
  if (tab?.dirty && !confirm(`Close "${tab.name}" without saving?`)) return;

  tabs = tabs.filter(t => t.id !== id);
  document.querySelector(`.tab[data-id="${id}"]`)?.remove();
  document.getElementById(`pane-${id}`)?.remove();

  if (activeId === id) {
    const next = tabs[tabs.length - 1];
    if (next) {
      activateTab(next.id);
    } else {
      activeId = null;
      _showEmptyHint();
    }
  }
}

function markDirty(id) {
  const tab = _getTab(id);
  if (!tab) return;
  tab.dirty = true;
  document.getElementById(`tdirty-${id}`).textContent = '●';
}

function markClean(id) {
  const tab = _getTab(id);
  if (!tab) return;
  tab.dirty = false;
  document.getElementById(`tdirty-${id}`).textContent = '';
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _getTab(id) {
  return tabs.find(t => t.id === id);
}

function _renderTabButton(tab) {
  const bar = document.getElementById('tabbar');
  const btn = document.getElementById('new-tab-btn');

  const el = document.createElement('div');
  el.className = 'tab';
  el.dataset.id = tab.id;
  el.onclick = () => activateTab(tab.id);
  el.innerHTML = `
    <span class="tab-name" id="tname-${tab.id}">${escHtml(tab.name)}</span>
    <span class="tab-dirty" id="tdirty-${tab.id}">${tab.dirty ? '●' : ''}</span>
    <button class="tab-close" onclick="closeTab(event, ${tab.id})">✕</button>`;

  bar.insertBefore(el, btn);
}

function _renderEditorPane(tab) {
  const area = document.getElementById('editor-area');
  const pane = document.createElement('div');
  pane.className = 'editor-pane';
  pane.id = `pane-${tab.id}`;
  pane.innerHTML = `
    <div class="editor-wrap" id="wrap-${tab.id}">
      <div class="gutter" id="gutter-${tab.id}">1</div>
      <div class="code-container" id="cc-${tab.id}">
        <div class="hl-overlay" id="hl-${tab.id}"></div>
        <textarea class="code-area" id="ta-${tab.id}" spellcheck="false">${escHtml(tab.content)}</textarea>
      </div>
    </div>`;
  area.appendChild(pane);

  // Bind all editor events for this pane
  const ta = pane.querySelector('textarea');
  ta.addEventListener('input',  () => onInput(tab.id));
  ta.addEventListener('keydown', e => onKeyDown(e, tab.id));
  ta.addEventListener('click',  () => updateCursor(tab.id));
  ta.addEventListener('keyup',  () => updateCursor(tab.id));
  ta.addEventListener('scroll', () => syncScroll(tab.id));
  window.addEventListener('resize', () => syncScroll(tab.id));

  updateGutter(tab.id);
  updateHighlight(tab.id);
}

function _showEmptyHint() {
  const area = document.getElementById('editor-area');
  if (area.querySelector('.empty-hint')) return;
  const hint = document.createElement('div');
  hint.className = 'empty-hint';
  hint.id = 'empty-hint';
  hint.innerHTML = `
    <span class="big">📄</span>
    <span>Open a file or create a new one</span>
    <button class="menu-btn" style="border:1px solid var(--border);margin-top:4px" onclick="newFile()">New File</button>`;
  area.appendChild(hint);
}
