// ── files.js ──────────────────────────────────────────────────────────────────
// Handles all file I/O: opening files from disk and saving them.
// In Electron: saves silently using fs.writeFileSync (no dialog on Ctrl+S).
// In browser:  falls back to a download link.
// Also listens for 'open-file' from main.js (triggered by Unity's CLI args).

// Handle file path sent by main.js when Unity opens a script
if (typeof require !== 'undefined') {
  const { ipcRenderer } = require('electron');
  ipcRenderer.on('open-file', (event, filePath) => {
    _openFileFromPath(filePath);
  });
}

function openFile() {
  // Use Electron's native open dialog to guarantee we get the real OS path
  if (typeof require !== 'undefined') {
    const { dialog } = require('@electron/remote');
    const result = dialog.showOpenDialogSync({
      title: 'Open File',
      properties: ['openFile'],
      filters: [
        { name: 'Script Files', extensions: ['cs', 'js', 'ts', 'py', 'cpp', 'c', 'h', 'java', 'lua', 'rb', 'go', 'rs'] },
        { name: 'All Files',    extensions: ['*'] },
      ]
    });
    if (!result || result.length === 0) return;
    _openFileFromPath(result[0]);
  } else {
    // Browser fallback
    document.getElementById('file-input').click();
  }
}

function handleFileOpen(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const content = ev.target.result;
    newFile(file.name, content, true);

    const tab = tabs[tabs.length - 1];

    // file.path is the real OS path in Electron
    // If not available, prompt user on first save
    tab.filePath = file.path ? file.path : null;

    const ta = document.getElementById(`ta-${tab.id}`);
    if (ta) {
      ta.value    = content;
      tab.content = content;
      markClean(tab.id);
      updateGutter(tab.id);
      updateHighlight(tab.id);
    }
  };

  reader.readAsText(file);
  e.target.value = '';
}

function saveFile() {
  const tab = tabs.find(t => t.id === activeId);
  if (!tab) return;

  const ta      = document.getElementById(`ta-${activeId}`);
  const content = ta?.value ?? tab.content;

  // Not in Electron — use browser download fallback
  if (typeof require === 'undefined') {
    _saveBrowser(tab, content);
    return;
  }

  const fs = require('fs');

  // Has a known path — overwrite silently
  if (tab.filePath) {
    try {
      fs.writeFileSync(tab.filePath, content, 'utf8');
      markClean(tab.id);
    } catch (err) {
      alert(`Failed to save file:\n${err.message}`);
    }
    return;
  }

  // No path yet — show Save As dialog
  const { dialog } = require('electron').remote
    || (() => { try { return require('@electron/remote'); } catch(_){} return {}; })();

  if (!dialog) {
    // Last resort fallback if dialog is unavailable
    _saveBrowser(tab, content);
    return;
  }

  const chosenPath = dialog.showSaveDialogSync({
    title: 'Save File',
    defaultPath: tab.name,
    filters: [
      { name: 'C# Files',    extensions: ['cs'] },
      { name: 'All Files',   extensions: ['*'] },
    ]
  });

  if (!chosenPath) return; // user cancelled

  try {
    fs.writeFileSync(chosenPath, content, 'utf8');
    tab.filePath = chosenPath;
    tab.name     = chosenPath.split(/[\\/]/).pop();
    document.getElementById(`tname-${tab.id}`).textContent = tab.name;
    markClean(tab.id);
  } catch (err) {
    alert(`Failed to save file:\n${err.message}`);
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _openFileFromPath(filePath) {
  const fs      = require('fs');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const name    = filePath.split(/[\\/]/).pop();

    newFile(name, content, true);

    const tab    = tabs[tabs.length - 1];
    tab.filePath = filePath;

    const ta = document.getElementById(`ta-${tab.id}`);
    if (ta) {
      ta.value    = content;
      tab.content = content;
      markClean(tab.id);
      updateGutter(tab.id);
      updateHighlight(tab.id);
    }
  } catch (err) {
    alert(`Failed to open file:\n${err.message}`);
  }
}

function _saveBrowser(tab, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = tab.name;
  a.click();
  markClean(tab.id);
}


