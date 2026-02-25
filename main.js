const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const remote = require('@electron/remote/main')

remote.initialize()

function createWindow(filePath = null) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'XaviEdit',
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  remote.enable(win.webContents)

  win.loadFile('editor.html')
  win.setMenuBarVisibility(false)

  if (filePath) {
    win.webContents.on('did-finish-load', () => {
      win.webContents.send('open-file', filePath)
    })
  }
}

app.whenReady().then(() => {
  // process.argv: [electron, app, ...args]
  // Unity calls: XaviEdit.exe "path/to/Script.cs" -line 10
  const args = process.argv.slice(2)
  const filePath = args.find(a => !a.startsWith('-')) || null
  createWindow(filePath)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

