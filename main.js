const { app, BrowserWindow, ipcMain, protocol, webContents, shell, session, dialog, net } = require('electron')
const path = require('path')
const fs   = require('fs')

protocol.registerSchemesAsPrivileged([
  { scheme: 'divo', privileges: { standard: true, secure: true, supportFetchAPI: true } }
])

app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')

let mainWindow
const downloadItems = new Map()
const pendingPerms  = new Map()

// ── Config persistante
const configPath = path.join(app.getPath('userData'), 'config.json')
let config = { adblock: true }
try { Object.assign(config, JSON.parse(fs.readFileSync(configPath, 'utf-8'))) } catch {}
function saveConfig() { try { fs.writeFileSync(configPath, JSON.stringify(config)) } catch {} }

// ── Adblocker
const blocklistPath = path.join(app.getPath('userData'), 'blocklist_v2.txt')
const BLOCKLIST_URL = 'https://small.oisd.nl/domainswild'
const BLOCKLIST_TTL = 7 * 24 * 60 * 60 * 1000
let blockedDomains = new Set()

function parseBlocklist(text) {
  const set = new Set()
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t[0] === '#' || t[0] === '!') continue
    const parts = t.split(/\s+/)
    const domain = parts[parts.length - 1].toLowerCase().replace(/^\*\./, '')
    if (domain.includes('.') && domain !== 'localhost' && !/^\d+\.\d+\.\d+/.test(domain)) set.add(domain)
  }
  blockedDomains = set
}

async function refreshBlocklist() {
  try {
    const res = await net.fetch(BLOCKLIST_URL)
    if (!res.ok) return
    const text = await res.text()
    fs.writeFileSync(blocklistPath, text, 'utf-8')
    parseBlocklist(text)
  } catch {}
}

function initBlocklist() {
  if (fs.existsSync(blocklistPath)) {
    try {
      parseBlocklist(fs.readFileSync(blocklistPath, 'utf-8'))
      if (Date.now() - fs.statSync(blocklistPath).mtimeMs > BLOCKLIST_TTL) refreshBlocklist()
      return
    } catch {}
  }
  refreshBlocklist()
}

function setupAdblocker() {
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    if (!config.adblock || !blockedDomains.size || details.resourceType === 'mainFrame') {
      callback({}); return
    }
    const scheme = details.url.split(':')[0]
    if (scheme === 'arc' || scheme === 'file' || scheme === 'chrome-extension') {
      callback({}); return
    }
    try {
      const parts = new URL(details.url).hostname.toLowerCase().split('.')
      for (let i = 0; i < parts.length - 1; i++) {
        if (blockedDomains.has(parts.slice(i).join('.'))) { callback({ cancel: true }); return }
      }
    } catch {}
    callback({})
  })
}

// ── CSS anti-pub générique (toutes les pages)
const GENERIC_AD_CSS = `
  ins.adsbygoogle, .adsbygoogle, [data-ad-slot], [data-ad-client],
  [id^="div-gpt-ad"], [id*="google_ads_iframe"], [id*="AdSense"],
  [class*="adsbygoogle"], [class*="google-ads"], [class*="googleads"],
  iframe[src*="googlesyndication"], iframe[src*="doubleclick"],
  iframe[src*="adnxs.com"], iframe[src*="taboola"], iframe[src*="outbrain"],
  iframe[src*="mgid.com"], iframe[src*="revcontent"], iframe[src*="popads"],
  iframe[src*="popcash"], iframe[src*="exoclick"], iframe[src*="trafficjunky"],
  .ad-container, .ads-container, .ad-wrapper, .ad-banner, .ad-slot,
  .ad-unit, .advertisement, .advert, #carbonads, .carbonads,
  [class*="pub_300x"], [class*="pub_728x"], [class*="pub_160x"],
  .overlay-ads, .popup-ad, .popunder-ad { display: none !important; }
`

// ── YouTube ad blocker
const YT_AD_CSS = `
  .ytp-ad-overlay-container, .ytp-ad-image-overlay, .ytp-ad-text-overlay,
  ytd-action-companion-ad-renderer, ytd-ad-slot-renderer,
  ytd-promoted-sparkles-web-renderer, ytd-promoted-video-renderer,
  ytd-search-pyv-renderer, ytd-display-ad-renderer,
  ytd-promoted-sparkles-text-search-renderer, ytd-statement-banner-renderer,
  #masthead-ad, .ytd-banner-promo-renderer { display: none !important; }
`
const YT_AD_JS = `(function(){
  if (window.__dv) return; window.__dv = 1;
  function skip() {
    const btn = document.querySelector('.ytp-skip-ad-button,.ytp-ad-skip-button,.ytp-ad-skip-button-modern');
    if (btn) { btn.click(); return; }
    const vid = document.querySelector('video');
    const ad  = document.querySelector('.ytp-ad-player-overlay-instream-info,.ytp-ad-simple-ad-badge');
    if (vid && ad) { vid.muted = true; vid.playbackRate = 16; if (vid.duration) vid.currentTime = vid.duration - 0.1; }
    else if (vid && vid.playbackRate !== 1) { vid.playbackRate = 1; vid.muted = false; }
  }
  new MutationObserver(skip).observe(document.documentElement, { childList: true, subtree: true });
  skip();
})()`

// ── Extensions
const extensionsDir = path.join(app.getPath('userData'), 'extensions')
if (!fs.existsSync(extensionsDir)) fs.mkdirSync(extensionsDir, { recursive: true })

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d)
  }
}

function getExtIcon(ext) {
  const action = ext.manifest.browser_action || ext.manifest.action
  const icons = action?.default_icon || ext.manifest.icons
  if (!icons) return null
  if (typeof icons === 'string') return `chrome-extension://${ext.id}/${icons}`
  const size = icons['16'] || icons['19'] || icons['32'] || icons['48'] || Object.values(icons)[0]
  return `chrome-extension://${ext.id}/${size}`
}

function serializeExt(ext) {
  return {
    id: ext.id,
    name: ext.name,
    version: ext.manifest.version || '?',
    icon: getExtIcon(ext),
    hasPopup: !!(ext.manifest.browser_action?.default_popup || ext.manifest.action?.default_popup),
    popupPath: ext.manifest.browser_action?.default_popup || ext.manifest.action?.default_popup || null,
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 600, minHeight: 500,
    frame: false, show: false, backgroundColor: '#1c1c1e',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
      webviewTag: true, backgroundThrottling: false, spellcheck: false,
    }
  })

  mainWindow.loadFile('renderer/index.html')
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('enter-full-screen', () => mainWindow.webContents.send('fullscreen-change', true))
  mainWindow.on('leave-full-screen',  () => mainWindow.webContents.send('fullscreen-change', false))
}

app.whenReady().then(async () => {
  initBlocklist()
  setupAdblocker()

  // ── Charger les extensions installées
  const extSubdirs = fs.readdirSync(extensionsDir, { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => path.join(extensionsDir, d.name))
  for (const extPath of extSubdirs) {
    try { await session.defaultSession.loadExtension(extPath, { allowFileAccess: true }) }
    catch (e) { console.error('Extension load failed:', extPath, e.message) }
  }
  // ── Protocole divo://
  protocol.handle('divo', (request) => {
    const url = new URL(request.url)
    const file = url.hostname === 'newtab'    ? 'newtab.html'
               : url.hostname === 'settings'  ? 'settings.html'
               : null
    if (file) {
      return new Response(
        fs.readFileSync(path.join(__dirname, 'renderer', file), 'utf-8'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }
    return new Response('Not found', { status: 404 })
  })

  // ── Téléchargements
  session.defaultSession.on('will-download', (_, item) => {
    const id = Date.now()
    item.setSavePath(path.join(app.getPath('downloads'), item.getFilename()))
    downloadItems.set(id, item)
    mainWindow.webContents.send('dl-start', { id, filename: item.getFilename(), total: item.getTotalBytes() })
    item.on('updated', (_, state) => {
      mainWindow.webContents.send('dl-update', { id, state, received: item.getReceivedBytes(), total: item.getTotalBytes() })
    })
    item.once('done', (_, state) => {
      mainWindow.webContents.send('dl-done', { id, state, filename: item.getFilename(), savePath: item.getSavePath() })
      downloadItems.delete(id)
    })
  })

  // ── Permissions
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback, details) => {
    if (permission === 'fullscreen') { callback(true); return }
    const key = Date.now() + '-' + Math.random()
    pendingPerms.set(key, callback)
    const labels = {
      media:           'Caméra et/ou Microphone',
      geolocation:     'Localisation',
      notifications:   'Notifications',
      'clipboard-read': 'Presse-papiers (lecture)',
      'clipboard-sanitized-write': 'Presse-papiers (écriture)',
    }
    mainWindow.webContents.send('permission-request', {
      key,
      permission,
      label: labels[permission] || permission,
      origin: (() => { try { return new URL(details?.requestingUrl || wc.getURL()).hostname } catch { return 'ce site' } })()
    })
  })

  // ── Nouvelles fenêtres → onglets + injection pub
  app.on('web-contents-created', (_, contents) => {
    if (contents.getType() === 'webview') {
      contents.on('did-finish-load', () => {
        if (!config.adblock) return
        const url = contents.getURL()
        if (!url || url.startsWith('chrome') || url.startsWith('arc') || url.startsWith('file')) return
        contents.insertCSS(GENERIC_AD_CSS).catch(() => {})
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          contents.insertCSS(YT_AD_CSS).catch(() => {})
          contents.executeJavaScript(YT_AD_JS).catch(() => {})
        }
      })
      contents.setWindowOpenHandler(({ url }) => {
        if (config.adblock && url) {
          try {
            const parts = new URL(url).hostname.toLowerCase().split('.')
            for (let i = 0; i < parts.length - 1; i++) {
              if (blockedDomains.has(parts.slice(i).join('.'))) return { action: 'deny' }
            }
          } catch {}
        }
        if (mainWindow && url) mainWindow.webContents.send('open-new-tab', url)
        return { action: 'deny' }
      })
    }
  })

  createWindow()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

ipcMain.on('window-minimize',    () => mainWindow.minimize())
ipcMain.on('window-maximize',    () => { mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize() })
ipcMain.on('window-close',       () => mainWindow.close())
ipcMain.on('toggle-fullscreen',  () => mainWindow.setFullScreen(!mainWindow.isFullScreen()))
ipcMain.on('open-file',          (_, p) => shell.showItemInFolder(p))
ipcMain.on('open-dl-folder',     () => shell.openPath(app.getPath('downloads')))
ipcMain.on('focus-webview',      (_, id) => { const wc = webContents.fromId(id); if (wc) wc.focus() })
ipcMain.on('answer-permission',  (_, key, granted) => {
  const cb = pendingPerms.get(key)
  if (cb) { cb(granted); pendingPerms.delete(key) }
})

// ── Adblock IPC
ipcMain.handle('adblock-status', () => config.adblock)
ipcMain.handle('adblock-toggle', (_, enabled) => { config.adblock = !!enabled; saveConfig(); return config.adblock })

// ── Extensions IPC
ipcMain.handle('ext-list', () => session.defaultSession.getAllExtensions().map(serializeExt))

ipcMain.handle('ext-install', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Sélectionner le dossier de l\'extension',
    properties: ['openDirectory'],
  })
  if (canceled || !filePaths.length) return { error: 'cancelled' }
  const src = filePaths[0]
  const manifestPath = path.join(src, 'manifest.json')
  if (!fs.existsSync(manifestPath)) return { error: 'no-manifest' }
  let manifest
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) }
  catch { return { error: 'invalid-manifest' } }
  const safeName = (manifest.name || 'extension').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
  const dest = path.join(extensionsDir, safeName + '_' + Date.now())
  try {
    copyDirSync(src, dest)
    const ext = await session.defaultSession.loadExtension(dest, { allowFileAccess: true })
    return { success: true, ext: serializeExt(ext) }
  } catch (e) {
    try { fs.rmSync(dest, { recursive: true, force: true }) } catch {}
    return { error: e.message }
  }
})

ipcMain.handle('ext-remove', (_, extId) => {
  const ext = session.defaultSession.getAllExtensions().find(e => e.id === extId)
  if (!ext) return { error: 'not-found' }
  const extPath = ext.path
  session.defaultSession.removeExtension(extId)
  try { fs.rmSync(extPath, { recursive: true, force: true }) } catch {}
  return { success: true }
})

ipcMain.handle('ext-popup', (_, extId, x, y) => {
  const ext = session.defaultSession.getAllExtensions().find(e => e.id === extId)
  if (!ext) return
  const popupPath = ext.manifest.browser_action?.default_popup || ext.manifest.action?.default_popup
  if (!popupPath) return
  const popup = new BrowserWindow({
    width: 380, height: 550, x, y,
    frame: false, resizable: false, show: false,
    parent: mainWindow, modal: false,
    webPreferences: { nodeIntegration: false, contextIsolation: false },
  })
  popup.loadURL(`chrome-extension://${extId}/${popupPath}`)
  popup.webContents.once('did-finish-load', () => {
    popup.webContents.executeJavaScript(
      '[document.body.scrollWidth, document.body.scrollHeight]'
    ).then(([w, h]) => {
      popup.setSize(Math.max(200, Math.min(800, w || 380)), Math.max(80, Math.min(600, h || 400)))
      popup.show()
    }).catch(() => popup.show())
  })
  popup.on('blur', () => popup.close())
})