// ============================================================
// DIVO BROWSER — renderer/app.js
// ============================================================

document.getElementById('btn-close').addEventListener('click', () => window.bridge.close())
document.getElementById('btn-minimize').addEventListener('click', () => window.bridge.minimize())
document.getElementById('btn-maximize').addEventListener('click', () => window.bridge.maximize())

const NEWTAB_URL = window.bridge.newtabUrl
const SETTINGS_URL = window.bridge.settingsUrl

// ── DOM
const webview       = document.getElementById('webview')
const urlInput      = document.getElementById('url-input')
const btnBack       = document.getElementById('btn-back')
const btnForward    = document.getElementById('btn-forward')
const btnReload     = document.getElementById('btn-reload')
const btnMute       = document.getElementById('btn-mute')
const essentialsList = document.getElementById('essentials-list')
const tabsList      = document.getElementById('tabs-list')
const archiveList      = document.getElementById('archive-list')
const archiveSection   = document.getElementById('archive-section')
const favoritesList    = document.getElementById('favorites-list')
const favoritesSection = document.getElementById('favorites-section')
const spacesList    = document.getElementById('spaces-list')
const contextMenu   = document.getElementById('context-menu')
const progressBar   = document.getElementById('progress-bar')
const findBar       = document.getElementById('find-bar')
const findInput     = document.getElementById('find-input')
const findCount     = document.getElementById('find-count')
const historyPanel  = document.getElementById('history-panel')
const dlBar         = document.getElementById('dl-bar')
const dlList        = document.getElementById('dl-list')
const tabsSection   = document.querySelector('.tabs-section')
const sidebar       = document.querySelector('.sidebar')
const permBar       = document.getElementById('permission-bar')
const permText      = document.getElementById('perm-text')
const appName       = document.getElementById('app-name')

// ── Icônes
const ICON_RELOAD = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`
const ICON_STOP   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
const ICON_AUDIO  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
const ICON_MUTED  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`
const ICON_LOCK   = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`

const ICO = {
  rename:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  pin:      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  bookmark: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
  sleep:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  openTab:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  close:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
}

const SPACE_COLORS = ['#0a84ff', '#34c759', '#ff9f0a', '#bf5af2', '#ff453a', '#ff6b35', '#30d158', '#64d2ff']

// ── Virtual list — rend uniquement les items visibles
const ITEM_H = 30

class VirtualList {
  constructor(scrollEl, listEl) {
    this.scrollEl = scrollEl
    this.listEl   = listEl
    this.items    = []
    this.buildFn  = null
    this._raf     = null
    this._key     = ''
    scrollEl.addEventListener('scroll', () => {
      if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = null; this._flush() })
    }, { passive: true })
  }

  update(items, buildFn) {
    this.items   = items
    this.buildFn = buildFn
    this._key    = ''   // toujours forcer le re-render des items visibles
    this._flush()
  }

  _flush() {
    const n = this.items.length
    if (!n) { this.listEl.style.cssText = ''; this.listEl.replaceChildren(); return }
    const scrollTop = this.scrollEl.scrollTop
    const viewH     = this.scrollEl.clientHeight || 400
    const start     = Math.max(0, Math.floor(scrollTop / ITEM_H) - 5)
    const end       = Math.min(n, Math.ceil((scrollTop + viewH) / ITEM_H) + 5)
    const key       = `${start}:${end}:${n}`
    if (key === this._key) return
    this._key = key
    this.listEl.style.cssText = `position:relative;height:${n * ITEM_H}px`
    const frag = document.createDocumentFragment()
    for (let i = start; i < end; i++) {
      const el = this.buildFn(this.items[i])
      el.style.cssText = `position:absolute;top:${i * ITEM_H}px;left:0;right:0;height:${ITEM_H}px`
      frag.appendChild(el)
    }
    this.listEl.replaceChildren(frag)
  }
}

const DEFAULT_ESSENTIALS = [
  { id: 'e1', title: 'Google',  url: 'https://www.google.com',  favicon: 'https://www.google.com/favicon.ico' },
  { id: 'e2', title: 'YouTube', url: 'https://www.youtube.com', favicon: 'https://www.youtube.com/favicon.ico' },
  { id: 'e3', title: 'GitHub',  url: 'https://github.com',      favicon: 'https://github.com/favicon.ico' },
]

// ── Virtual list pour les onglets (seule liste pouvant devenir très longue)
const tabsVL = new VirtualList(tabsSection, tabsList)

// ── État
let essentials      = []
let favorites       = []
let tabs            = []
let spaces          = []
let activeTabId     = null
let activeSpaceId   = null
let activeEssentialId = null
let closedTabs      = []
let archiveTimer    = null
let webviewReady    = false
let isLoading       = false
let saveTimer       = null
let essClickTimer   = null
let ctxTargetId     = null
let ctxType         = null
let zoomLevel       = 1.0
let progressTimer   = null
let historyData     = []
let sidebarVisible  = true
let downloads       = new Map()
let dragId          = null
let dragType        = null
let isResizing      = false
let resizeStartX    = 0
let resizeStartW    = 0
let globalMuted     = false
let globalPlaying   = false
let pendingPermKey  = null


// ============================================================
// HELPERS
// ============================================================

function isNewtab(url)   { return !url || url === NEWTAB_URL || url.includes('newtab.html') }
function isSettings(url) { return url === SETTINGS_URL || url.includes('settings.html') }
function isSpecial(url)  { return isNewtab(url) || isSettings(url) }
function displayUrl(url) { return isSpecial(url) ? '' : url }

function getActiveTabs()   { return tabs.filter(t => t.spaceId === activeSpaceId && !t.archived) }
function getArchivedTabs() { return tabs.filter(t => t.spaceId === activeSpaceId && t.archived) }

function getSearchUrl(query) {
  const engine  = localStorage.getItem('divo-search-engine') || 'google'
  const engines = {
    google: 'https://www.google.com/search?q=', duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=', qwant: 'https://www.qwant.com/?q=',
    brave: 'https://search.brave.com/search?q=',
  }
  return (engines[engine] || engines.google) + encodeURIComponent(query)
}

function getHomepageUrl() {
  const hp = localStorage.getItem('divo-homepage') || 'newtab'
  if (hp === 'google') return 'https://www.google.com'
  if (hp === 'duckduckgo') return 'https://duckduckgo.com'
  return NEWTAB_URL
}

function getArchiveThreshold() {
  const map = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '3d': 259200000, '7d': 604800000 }
  return map[localStorage.getItem('divo-auto-archive')] || 0
}

function activeTabIsPrivate() {
  if (activeEssentialId) return false
  return tabs.find(t => t.id === activeTabId)?.private || false
}

function updatePrivateUI() {
  const priv = activeTabIsPrivate()
  document.body.classList.toggle('private-active', priv)
  appName.textContent = priv ? 'Navigation privée' : 'Divo'
  appName.classList.toggle('private', priv)
}


// ============================================================
// PERSISTENCE
// ============================================================

function saveState() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const curSpace = spaces.find(s => s.id === activeSpaceId)
      if (curSpace) curSpace.activeTabId = activeTabId
      localStorage.setItem('arc-essentials', JSON.stringify(essentials))
      localStorage.setItem('arc-favorites',  JSON.stringify(favorites))
      localStorage.setItem('arc-tabs',       JSON.stringify(tabs.filter(t => !t.private)))
      localStorage.setItem('arc-spaces',     JSON.stringify(spaces))
      localStorage.setItem('arc-active-space', activeSpaceId || '')
      localStorage.setItem('arc-active-ess',   activeEssentialId || '')
    } catch {}
  }, 400)
}

function loadState() {
  const VERSION = '3'
  if (localStorage.getItem('arc-version') !== VERSION) {
    localStorage.clear(); localStorage.setItem('arc-version', VERSION)
  }
  try {
    // Spaces
    const ss = localStorage.getItem('arc-spaces')
    spaces = ss ? JSON.parse(ss) : []
    if (!spaces.length) spaces = [{ id: 'sp_default', name: 'Principal', color: SPACE_COLORS[0], activeTabId: null }]
    activeSpaceId = localStorage.getItem('arc-active-space') || spaces[0].id
    if (!spaces.find(s => s.id === activeSpaceId)) activeSpaceId = spaces[0].id

    // Essentials
    const se = localStorage.getItem('arc-essentials')
    essentials = se ? JSON.parse(se) : structuredClone(DEFAULT_ESSENTIALS)

    // Favorites — migration: ajoute spaceId si absent
    const sf = localStorage.getItem('arc-favorites')
    favorites = sf ? JSON.parse(sf).map(f => ({ ...f, spaceId: f.spaceId || spaces[0].id })) : []

    // Tabs — migrate legacy tabs without spaceId / lastUsed
    const st = localStorage.getItem('arc-tabs')
    const parsed = st ? JSON.parse(st) : []
    tabs = parsed.map(t => ({
      ...t,
      spaceId:  t.spaceId  || spaces[0].id,
      lastUsed: t.lastUsed || Date.now(),
      archived: t.archived || false,
      scrollY:  t.scrollY  || 0,
      unloaded: t.unloaded || false,
    }))
    if (!tabs.length) {
      tabs = [{ id: 't_default', title: 'Nouvel onglet', url: NEWTAB_URL, favicon: null, spaceId: spaces[0].id, lastUsed: Date.now(), archived: false }]
    }

    // Active state
    const sae = localStorage.getItem('arc-active-ess')
    const curSpace = spaces.find(s => s.id === activeSpaceId)
    if (sae && essentials.find(e => e.id === sae)) {
      activeEssentialId = sae; activeTabId = null
    } else {
      const activeTabs = getActiveTabs()
      const savedTabId = curSpace?.activeTabId || localStorage.getItem('arc-active-tab')
      activeTabId = (savedTabId && activeTabs.find(t => t.id === savedTabId))
        ? savedTabId
        : activeTabs[0]?.id || null
      if (!activeTabId) {
        const newTab = { id: 't' + Date.now(), title: 'Nouvel onglet', url: NEWTAB_URL, favicon: null, spaceId: activeSpaceId, lastUsed: Date.now(), archived: false }
        tabs.push(newTab); activeTabId = newTab.id
      }
    }
  } catch {
    spaces = [{ id: 'sp_default', name: 'Principal', color: SPACE_COLORS[0], activeTabId: null }]
    activeSpaceId = spaces[0].id
    essentials = structuredClone(DEFAULT_ESSENTIALS)
    tabs = [{ id: 't_default', title: 'Nouvel onglet', url: NEWTAB_URL, favicon: null, spaceId: activeSpaceId, lastUsed: Date.now(), archived: false }]
    activeTabId = 't_default'
  }
}


// ============================================================
// NAVIGATION
// ============================================================

function normalizeUrl(raw) {
  raw = raw.trim()
  if (!raw) return NEWTAB_URL
  if (raw === 'divo://settings') return SETTINGS_URL
  if (raw.startsWith('divo://') || raw.startsWith('file://') ||
    raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (/^[\w-]+\.[\w.-]+/.test(raw) && !raw.includes(' ')) return 'https://' + raw
  return getSearchUrl(raw)
}

function navigate(url) {
  url = normalizeUrl(url)
  urlInput.value = displayUrl(url)
  if (webviewReady) webview.loadURL(url).catch(() => {})
  else webview.src = url
  saveState()
}

function updateNavButtons() {
  if (!webviewReady) return
  btnBack.disabled    = !webview.canGoBack()
  btnForward.disabled = !webview.canGoForward()
}

function updateTitlebarFavicon() {
  const el = document.getElementById('titlebar-favicon'); if (!el) return
  const favicon = activeEssentialId
    ? essentials.find(e => e.id === activeEssentialId)?.favicon
    : tabs.find(t => t.id === activeTabId)?.favicon
  if (favicon && !activeTabIsPrivate()) { el.src = favicon; el.classList.add('shown') }
  else { el.src = ''; el.classList.remove('shown') }
}

function updateMuteBtn() {
  if (!btnMute) return
  if (globalMuted) {
    btnMute.innerHTML = ICON_MUTED; btnMute.style.color = '#ff453a'
    btnMute.style.opacity = '1'; btnMute.title = 'Activer le son'
  } else if (globalPlaying) {
    btnMute.innerHTML = ICON_AUDIO; btnMute.style.color = '#0a84ff'
    btnMute.style.opacity = '1'; btnMute.title = 'Couper le son'
  } else {
    btnMute.innerHTML = ICON_AUDIO; btnMute.style.color = ''
    btnMute.style.opacity = '0'; btnMute.title = 'Couper le son'
  }
}


// ============================================================
// ONGLETS
// ============================================================

function activateTab(id) {
  const t = tabs.find(x => x.id === id); if (!t) return
  const wasEssential = !!activeEssentialId
  const wasArchived  = t.archived
  if (t.archived) t.archived = false
  t.lastUsed = Date.now()
  t._resumeScroll = !!(t.scrollY && t.scrollY > 0 && !t.unloaded)
  if (t.unloaded) t.unloaded = false
  activeTabId = id; activeEssentialId = null
  navigate(t.url)
  if (wasEssential) renderEssentials()
  renderTabs()
  if (wasArchived)  renderArchived()
  if (webviewReady) webview.setAudioMuted(t.muted || false)
  globalMuted = t.muted || false; globalPlaying = false
  updateTitlebarFavicon(); updateMuteBtn(); updatePrivateUI()
}

function unloadTab(id) {
  const tab = tabs.find(t => t.id === id)
  if (!tab || tab.private || isSpecial(tab.url)) return
  const isActive = id === activeTabId && !activeEssentialId
  function doUnload() {
    tab.unloaded = true
    if (isActive && webviewReady) webview.loadURL('about:blank').catch(() => {})
    saveState(); renderTabs()
  }
  if (isActive && webviewReady) {
    webview.executeJavaScript('window.scrollY').then(y => {
      if (typeof y === 'number' && y >= 0) tab.scrollY = y
      doUnload()
    }).catch(doUnload)
  } else {
    doUnload()
  }
}

function startScrollSaver() {
  setInterval(() => {
    if (!webviewReady || !activeTabId || activeEssentialId) return
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab || isSpecial(tab.url) || tab.unloaded) return
    webview.executeJavaScript('window.scrollY').then(y => {
      if (typeof y === 'number' && y >= 0) tab.scrollY = y
    }).catch(() => {})
  }, 2000)
}

function closeTab(id) {
  const activeTabs = getActiveTabs()
  const activeIdx  = activeTabs.findIndex(t => t.id === id)
  const idx        = tabs.findIndex(t => t.id === id); if (idx === -1) return
  const tab = tabs[idx]
  if (!tab.private) {
    closedTabs.push({ url: tab.url, title: tab.title, favicon: tab.favicon, spaceId: tab.spaceId })
    if (closedTabs.length > 20) closedTabs.shift()
  }
  tabs.splice(idx, 1)
  const remaining = getActiveTabs()
  if (!remaining.length) { createTab(); return }
  if (activeTabId === id) activateTab(remaining[Math.max(0, activeIdx - 1)].id)
  else { saveState(); render() }
}

function createTab(url = null, isPrivate = false) {
  if (url === null) url = isPrivate ? NEWTAB_URL : getHomepageUrl()
  const id = 't' + Date.now()
  tabs.push({ id, title: isPrivate ? 'Navigation privée' : 'Nouvel onglet', url, favicon: null, private: isPrivate, spaceId: activeSpaceId, lastUsed: Date.now(), archived: false })
  activateTab(id)
}

function startRenameTab(id) {
  const tab = tabs.find(t => t.id === id); if (!tab) return
  const li  = tabsList.querySelector(`[data-id="${id}"]`); if (!li) return
  startRenameInline(li.querySelector('.tab-title'), tab, () => { saveState(); renderTabs() })
}

function restoreClosedTab() {
  if (!closedTabs.length) return
  const t  = closedTabs.pop()
  const id = 't' + Date.now()
  tabs.push({ id, title: t.title || 'Onglet restauré', url: t.url, favicon: t.favicon || null, spaceId: t.spaceId || activeSpaceId, lastUsed: Date.now(), archived: false })
  activateTab(id)
}

function pinTabAsEssential(id) {
  const tab = tabs.find(t => t.id === id)
  if (!tab || isSpecial(tab.url) || tab.private) return
  const url = normalizeUrl(tab.url)
  if (essentials.find(e => e.url === url)) return
  essentials.push({ id: 'e' + Date.now(), title: tab.title || url, url, favicon: tab.favicon })
  saveState(); renderEssentials()
}


// ============================================================
// ESSENTIALS
// ============================================================

function activateEssential(id) {
  const e = essentials.find(x => x.id === id); if (!e) return
  const wasTab = !!activeTabId
  activeEssentialId = id; activeTabId = null
  navigate(e.url)
  renderEssentials()
  if (wasTab) renderTabs()
  if (webviewReady) webview.setAudioMuted(false)
  globalMuted = false; globalPlaying = false
  updateTitlebarFavicon(); updateMuteBtn(); updatePrivateUI()
}

function addCurrentPageAsEssential() {
  const url = normalizeUrl(urlInput.value)
  if (isSpecial(url) || essentials.find(e => e.url === url)) return
  let title  = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return 'Page' } })()
  let favicon = null
  if (activeTabId && !activeEssentialId) {
    const tab = tabs.find(t => t.id === activeTabId)
    if (tab) { title = tab.title || title; favicon = tab.favicon }
  }
  essentials.push({ id: 'e' + Date.now(), title, url, favicon })
  saveState(); renderEssentials()
}

function unloadEssential(id) {
  if (activeEssentialId !== id) return
  activeEssentialId = null
  const at = getActiveTabs()
  at.length ? activateTab(at[0].id) : createTab()
}

function removeEssential(id) {
  const idx = essentials.findIndex(e => e.id === id); if (idx === -1) return
  essentials.splice(idx, 1)
  if (activeEssentialId === id) {
    activeEssentialId = null
    const at = getActiveTabs()
    at.length ? activateTab(at[0].id) : createTab()
  }
  saveState(); renderEssentials()
}

function startRenameEssential(id) {
  const ess = essentials.find(e => e.id === id); if (!ess) return
  const li  = essentialsList.querySelector(`[data-id="${id}"]`); if (!li) return
  startRenameInline(li.querySelector('.tab-title'), ess, () => { saveState(); renderEssentials() })
}

function openEssentialInTab(id) {
  const e = essentials.find(x => x.id === id); if (e) createTab(e.url)
}


// ============================================================
// FAVORIS
// ============================================================

function addCurrentPageAsFavorite() {
  const url = normalizeUrl(urlInput.value)
  if (isSpecial(url) || favorites.find(f => f.url === url)) return
  let title  = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return 'Page' } })()
  let favicon = null
  if (activeEssentialId) {
    const ess = essentials.find(e => e.id === activeEssentialId)
    if (ess) { title = ess.title || title; favicon = ess.favicon }
  } else if (activeTabId) {
    const tab = tabs.find(t => t.id === activeTabId)
    if (tab) { title = tab.title || title; favicon = tab.favicon }
  }
  favorites.push({ id: 'f' + Date.now(), title, url, favicon, spaceId: activeSpaceId })
  saveState(); renderFavorites()
}

function removeFavorite(id) {
  favorites = favorites.filter(f => f.id !== id)
  saveState(); renderFavorites()
}

function openFavorite(id) {
  const f = favorites.find(x => x.id === id); if (!f) return
  createTab(f.url)
}

function addTabAsFavorite(tabId) {
  const tab = tabs.find(t => t.id === tabId); if (!tab || isSpecial(tab.url) || tab.private) return
  if (favorites.some(f => f.url === tab.url && f.spaceId === activeSpaceId)) return
  favorites.push({ id: 'f' + Date.now(), title: tab.title || tab.url, url: tab.url, favicon: tab.favicon || null, spaceId: activeSpaceId })
  saveState(); renderFavorites()
}

function moveTabToSpace(tabId, targetSpaceId) {
  const tab = tabs.find(t => t.id === tabId); if (!tab) return
  tab.spaceId = targetSpaceId
  if (activeTabId === tabId) {
    const remaining = getActiveTabs()
    if (remaining.length) activateTab(remaining[0].id)
    else createTab()
  } else {
    saveState(); renderTabs()
  }
}

function startRenameFavorite(id) {
  const fav = favorites.find(f => f.id === id); if (!fav) return
  const li  = favoritesList.querySelector(`[data-id="${id}"]`); if (!li) return
  startRenameInline(li.querySelector('.tab-title'), fav, () => { saveState(); renderFavorites() })
}

function renderFavorites() {
  const frag = document.createDocumentFragment()
  for (const f of favorites.filter(f => f.spaceId === activeSpaceId)) {
    const li = document.createElement('li')
    li.className = 'tab-item'
    li.dataset.id = f.id
    const faviconHtml = f.favicon
      ? `<img class="tab-favicon" src="${f.favicon}" loading="lazy" draggable="false" onerror="this.style.display='none'">`
      : `<div class="tab-favicon-placeholder"></div>`
    li.innerHTML = `${faviconHtml}<span class="tab-title">${f.title}</span><button class="tab-close" data-remove-fav="${f.id}">✕</button>`
    frag.appendChild(li)
  }
  favoritesList.replaceChildren(frag)
}


// ============================================================
// SPACES
// ============================================================

function switchSpace(id) {
  if (id === activeSpaceId) return
  const curSpace = spaces.find(s => s.id === activeSpaceId)
  if (curSpace) curSpace.activeTabId = activeTabId
  activeSpaceId = id; activeEssentialId = null
  const newSpace = spaces.find(s => s.id === id)
  const at = getActiveTabs()
  if (newSpace?.activeTabId && at.find(t => t.id === newSpace.activeTabId)) {
    activateTab(newSpace.activeTabId)
  } else if (at.length) {
    activateTab(at[0].id)
  } else {
    createTab()
  }
  saveState()
}

function createSpace() {
  const color = SPACE_COLORS[spaces.length % SPACE_COLORS.length]
  const id    = 'sp_' + Date.now()
  spaces.push({ id, name: 'Espace ' + (spaces.length + 1), color, activeTabId: null })
  switchSpace(id)
  requestAnimationFrame(() => startRenameSpace(id))
}

function renameSpace(id) { startRenameSpace(id) }

function deleteSpace(id) {
  if (spaces.length <= 1) return
  const idx = spaces.findIndex(s => s.id === id); if (idx === -1) return
  tabs      = tabs.filter(t => t.spaceId !== id)
  favorites = favorites.filter(f => f.spaceId !== id)
  spaces.splice(idx, 1)
  if (activeSpaceId === id) {
    activeSpaceId = spaces[Math.max(0, idx - 1)].id
    const at = getActiveTabs()
    if (at.length) { activeTabId = at[0].id; navigate(at[0].url) }
    else createTab()
  }
  saveState(); render()
}

function renderSpaces() {
  const frag = document.createDocumentFragment()
  for (const space of spaces) {
    const btn = document.createElement('button')
    btn.className = 'space-pill' + (space.id === activeSpaceId ? ' active' : '')
    btn.dataset.spaceId = space.id
    btn.title = space.name
    const dot = document.createElement('span')
    dot.className = 'space-color-dot'
    dot.style.background = space.color
    const lbl = document.createElement('span')
    lbl.className = 'space-pill-name'
    lbl.textContent = space.name
    btn.appendChild(dot); btn.appendChild(lbl)
    btn.addEventListener('click', () => switchSpace(space.id))
    btn.addEventListener('dblclick', e => { e.preventDefault(); if (space.id === activeSpaceId) startRenameSpace(space.id) })
    btn.addEventListener('contextmenu', e => { e.preventDefault(); showContextMenu(e.clientX, e.clientY, space.id, 'space') })
    frag.appendChild(btn)
  }
  spacesList.replaceChildren(frag)
}

function startRenameSpace(id) {
  const space = spaces.find(s => s.id === id); if (!space) return
  const btn   = spacesList.querySelector(`[data-space-id="${id}"]`); if (!btn) return
  const nameEl = btn.querySelector('.space-pill-name'); if (!nameEl) return
  const input  = document.createElement('input')
  input.type = 'text'; input.value = space.name; input.className = 'space-rename-input'
  nameEl.replaceWith(input); input.focus(); input.select()
  let done = false
  function commit() {
    if (done) return; done = true
    const v = input.value.trim(); if (v) space.name = v
    saveState(); renderSpaces()
  }
  input.addEventListener('blur', commit)
  input.addEventListener('click', e => e.stopPropagation())
  input.addEventListener('keydown', e => {
    e.stopPropagation()
    if (e.key === 'Enter') { input.blur(); return }
    if (e.key === 'Escape') { done = true; renderSpaces() }
  })
}


// ============================================================
// AUTO-ARCHIVE
// ============================================================

function checkAutoArchive() {
  const threshold = getArchiveThreshold(); if (!threshold) return
  const now = Date.now(); let changed = false
  for (const tab of tabs) {
    if (tab.archived || tab.private || tab.id === activeTabId) continue
    if (tab.lastUsed && now - tab.lastUsed > threshold) { tab.archived = true; changed = true }
  }
  if (changed) { saveState(); renderTabs(); renderArchived() }
}

function startArchiveTimer() {
  clearInterval(archiveTimer)
  if (getArchiveThreshold()) archiveTimer = setInterval(checkAutoArchive, 5 * 60 * 1000)
}

function unarchiveTab(id) {
  const tab = tabs.find(t => t.id === id); if (!tab) return
  tab.archived  = false
  tab.lastUsed  = Date.now()
  activateTab(id)
}

function renderArchived() {
  const archived = getArchivedTabs()
  if (!archived.length) { archiveSection.style.display = 'none'; return }
  archiveSection.style.display = ''
  const label = archiveSection.querySelector('.section-label')
  if (label) label.textContent = `Archivés (${archived.length})`
  const frag = document.createDocumentFragment()
  for (const t of archived) {
    const li = document.createElement('li')
    li.className = 'tab-item archived-tab'
    li.dataset.id = t.id
    const faviconHtml = t.favicon
      ? `<img class="tab-favicon" src="${t.favicon}" loading="lazy" draggable="false" onerror="this.style.display='none'">`
      : `<div class="tab-favicon-placeholder"></div>`
    li.innerHTML = `${faviconHtml}<span class="tab-title">${t.title}</span><button class="tab-close" data-del="${t.id}">✕</button>`
    li.addEventListener('click', e => { if (!e.target.closest('[data-del]')) unarchiveTab(t.id) })
    li.querySelector('[data-del]').addEventListener('click', () => {
      tabs = tabs.filter(x => x.id !== t.id); saveState(); renderArchived()
    })
    frag.appendChild(li)
  }
  archiveList.replaceChildren(frag)
}


// ============================================================
// RENAME INLINE
// ============================================================

function startRenameInline(titleEl, obj, onDone) {
  if (!titleEl) return
  const input = document.createElement('input')
  input.type = 'text'; input.value = obj.title; input.className = 'rename-input'
  titleEl.replaceWith(input); input.focus(); input.select()
  let done = false
  function commit() {
    if (done) return; done = true
    const v = input.value.trim(); if (v) obj.title = v; onDone()
  }
  input.addEventListener('blur', commit)
  input.addEventListener('keydown', e => {
    e.stopPropagation()
    if (e.key === 'Enter') { input.blur(); return }
    if (e.key === 'Escape') { done = true; onDone() }
  })
}


// ============================================================
// AFFICHAGE
// ============================================================

function renderEssentials() {
  const frag = document.createDocumentFragment()
  for (const e of essentials) {
    const li = document.createElement('li')
    li.className = 'tab-item' + (activeEssentialId === e.id ? ' active' : '')
    li.dataset.id = e.id; li.draggable = true
    li.innerHTML = `
      <img class="tab-favicon" src="${e.favicon || ''}" loading="lazy" draggable="false" onerror="this.style.display='none'">
      <span class="tab-title">${e.title}</span>
      <button class="tab-close" data-unload-ess="${e.id}">✕</button>
    `
    frag.appendChild(li)
  }
  essentialsList.replaceChildren(frag)
}

function buildTabItem(t) {
  const li = document.createElement('li')
  li.className = 'tab-item'
    + (activeTabId === t.id && !activeEssentialId ? ' active' : '')
    + (t.playing ? ' playing' : '') + (t.muted ? ' muted' : '')
    + (t.private ? ' private' : '') + (t.unloaded ? ' unloaded' : '')
  li.dataset.id = t.id; li.draggable = true
  const faviconHtml = t.private
    ? `<div class="tab-favicon-private">${ICON_LOCK}</div>`
    : t.favicon
      ? `<img class="tab-favicon" src="${t.favicon}" loading="lazy" draggable="false" onerror="this.style.display='none'">`
      : `<div class="tab-favicon-placeholder"></div>`
  li.innerHTML = `
    ${faviconHtml}
    <span class="tab-title">${t.title}</span>
    <button class="tab-mute" data-mute="${t.id}" title="${t.muted ? 'Activer le son' : 'Couper le son'}">${t.muted ? ICON_MUTED : ICON_AUDIO}</button>
    <button class="tab-close" data-close="${t.id}">✕</button>
  `
  return li
}

function renderTabs() {
  tabsVL.update(getActiveTabs(), buildTabItem)
}

function render() { renderSpaces(); renderEssentials(); renderFavorites(); renderTabs(); renderArchived() }


// ============================================================
// CONTEXT MENU
// ============================================================

function buildContextMenu(type) {
  if (type === 'space') {
    const only = spaces.length <= 1
    contextMenu.innerHTML = `
      <button class="ctx-item" data-action="rename-space">${ICO.rename} Renommer</button>
      <div class="ctx-divider"></div>
      <button class="ctx-item danger" data-action="delete-space" ${only ? 'disabled style="opacity:.4;pointer-events:none"' : ''}>${ICO.close} Supprimer l'espace</button>
    `
    return
  }
  if (type === 'favorite') {
    contextMenu.innerHTML = `
      <button class="ctx-item" data-action="rename">${ICO.rename} Renommer</button>
      <div class="ctx-divider"></div>
      <button class="ctx-item danger" data-action="remove-favorite">${ICO.close} Retirer des favoris</button>
    `
    return
  }
  if (type === 'tab') {
    const tab = tabs.find(t => t.id === ctxTargetId)
    const alreadyFav = !!(tab && !isSpecial(tab.url) && !tab.private && favorites.some(f => f.url === tab.url && f.spaceId === activeSpaceId))
    const otherSpaces = spaces.filter(s => s.id !== activeSpaceId)
    let html = `
      <button class="ctx-item" data-action="rename">${ICO.rename} Renommer</button>
      <button class="ctx-item" data-action="pin">${ICO.pin} Épingler en Essential</button>
    `
    if (!alreadyFav && tab && !isSpecial(tab.url) && !tab.private) {
      html += `<button class="ctx-item" data-action="add-favorite">${ICO.bookmark} Ajouter aux favoris</button>`
    }
    if (tab && !tab.private && !isSpecial(tab.url) && !tab.unloaded) {
      html += `<button class="ctx-item" data-action="unload-tab">${ICO.sleep} Décharger l'onglet</button>`
    }
    if (otherSpaces.length) {
      html += `<div class="ctx-divider"></div><div class="ctx-label">Déplacer vers</div>`
      for (const s of otherSpaces) {
        html += `<button class="ctx-item" data-action="move-space" data-target-space="${s.id}"><span class="ctx-space-dot" style="background:${s.color}"></span>${s.name}</button>`
      }
    }
    html += `<div class="ctx-divider"></div><button class="ctx-item danger" data-action="close">${ICO.close} Fermer l'onglet</button>`
    contextMenu.innerHTML = html
    return
  }
  contextMenu.innerHTML = `
    <button class="ctx-item" data-action="rename">${ICO.rename} Renommer</button>
    <button class="ctx-item" data-action="open-tab">${ICO.openTab} Ouvrir dans un onglet</button>
    <div class="ctx-divider"></div>
    <button class="ctx-item danger" data-action="remove-essential">${ICO.close} Retirer des Essentials</button>
  `
}

function showContextMenu(x, y, id, type) {
  ctxTargetId = id; ctxType = type; buildContextMenu(type)
  contextMenu.classList.add('visible')
  requestAnimationFrame(() => {
    const w = contextMenu.offsetWidth, h = contextMenu.offsetHeight
    contextMenu.style.left = Math.max(4, Math.min(x, window.innerWidth  - w - 4)) + 'px'
    contextMenu.style.top  = Math.max(4, Math.min(y, window.innerHeight - h - 4)) + 'px'
  })
}

function hideContextMenu() { contextMenu.classList.remove('visible'); ctxTargetId = null; ctxType = null }


// ============================================================
// HISTORIQUE
// ============================================================

function loadHistory() {
  try { historyData = JSON.parse(localStorage.getItem('arc-history') || '[]') }
  catch { historyData = [] }
}

function saveHistory() {
  try { localStorage.setItem('arc-history', JSON.stringify(historyData.slice(0, 300))) }
  catch {}
}

function addToHistory(url, title, favicon) {
  if (isSpecial(url) || !url || activeTabIsPrivate()) return
  historyData = historyData.filter(h => h.url !== url)
  historyData.unshift({ url, title: title || url, favicon: favicon || null, time: Date.now() })
  saveHistory()
}

function renderHistory() {
  const list = document.getElementById('history-list')
  if (!historyData.length) { list.innerHTML = '<div class="history-empty">Aucun historique</div>'; return }
  const frag = document.createDocumentFragment()
  let lastDay = ''
  for (const item of historyData) {
    const d = new Date(item.time); const dayKey = d.toDateString()
    if (dayKey !== lastDay) {
      lastDay = dayKey
      const lbl = document.createElement('div'); lbl.className = 'history-day'
      const today = new Date().toDateString(); const yest = new Date(Date.now() - 86400000).toDateString()
      lbl.textContent = dayKey === today ? "Aujourd'hui" : dayKey === yest ? 'Hier'
        : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      frag.appendChild(lbl)
    }
    const el = document.createElement('div'); el.className = 'history-item'
    el.innerHTML = `
      ${item.favicon ? `<img src="${item.favicon}" onerror="this.style.display='none'">` : '<div style="width:15px"></div>'}
      <div class="history-item-info">
        <div class="history-item-title">${item.title}</div>
        <div class="history-item-url">${item.url}</div>
      </div>
      <div class="history-item-time">${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
    `
    el.addEventListener('click', () => { navigate(item.url); closeHistory() })
    frag.appendChild(el)
  }
  list.replaceChildren(frag)
}

function openHistory()   { loadHistory(); renderHistory(); historyPanel.classList.add('visible') }
function closeHistory()  { historyPanel.classList.remove('visible') }
function toggleHistory() { historyPanel.classList.contains('visible') ? closeHistory() : openHistory() }


// ============================================================
// TÉLÉCHARGEMENTS
// ============================================================

function renderDownloads() {
  if (downloads.size === 0) { dlBar.classList.remove('visible'); document.getElementById('btn-downloads').classList.remove('active'); return }
  dlBar.classList.add('visible')
  const frag = document.createDocumentFragment()
  for (const [id, dl] of downloads) {
    const pct  = dl.total ? Math.round(dl.received / dl.total * 100) : 0
    const done = dl.state === 'completed'
    const fail = dl.state === 'cancelled' || dl.state === 'interrupted'
    const el   = document.createElement('div'); el.className = 'dl-item'; el.dataset.id = id
    el.innerHTML = `
      <div class="dl-item-top">
        <span class="dl-name" title="${dl.filename}">${dl.filename}</span>
        <span class="dl-status ${done ? 'done' : fail ? 'error' : ''}">${done ? 'Terminé' : fail ? 'Annulé' : pct + '%'}</span>
      </div>
      ${!done && !fail ? `<div class="dl-progress-track"><div class="dl-progress-fill" style="width:${pct}%"></div></div>` : ''}
    `
    if (done) el.addEventListener('click', () => window.bridge.openFile(dl.savePath))
    frag.appendChild(el)
  }
  dlList.replaceChildren(frag)
}


// ============================================================
// PROGRESSION
// ============================================================

function startProgress() {
  clearTimeout(progressTimer)
  progressBar.style.transition = 'none'; progressBar.style.width = '0%'
  progressBar.classList.add('active')
  let val = 0
  function tick() {
    val += (88 - val) * 0.18 + Math.random() * 4; val = Math.min(val, 88)
    progressBar.style.transition = 'width .35s ease-out'; progressBar.style.width = val + '%'
    progressTimer = setTimeout(tick, 350 + Math.random() * 300)
  }
  setTimeout(tick, 60)
}

function completeProgress() {
  clearTimeout(progressTimer)
  progressBar.style.transition = 'width .15s ease-out'; progressBar.style.width = '100%'
  setTimeout(() => {
    progressBar.style.transition = 'opacity .3s'
    progressBar.classList.remove('active')
    setTimeout(() => { progressBar.style.width = '0%' }, 350)
  }, 200)
}


// ============================================================
// RECHERCHE DANS LA PAGE
// ============================================================

function openFind() { findBar.classList.add('visible'); findInput.focus(); if (findInput.value) findInput.select() }
function closeFind() {
  findBar.classList.remove('visible'); findCount.textContent = ''
  findCount.classList.remove('no-result')
  if (webviewReady) webview.stopFindInPage('clearSelection')
}
function doFind(fwd = true) {
  const text = findInput.value.trim(); if (!text || !webviewReady) return
  webview.findInPage(text, { forward: fwd, findNext: true })
}


// ============================================================
// ZOOM
// ============================================================

function applyZoom(f) {
  zoomLevel = Math.max(0.25, Math.min(5, Math.round(f * 10) / 10))
  if (webviewReady) webview.setZoomFactor(zoomLevel)
}
function zoomIn()    { applyZoom(zoomLevel + 0.1) }
function zoomOut()   { applyZoom(zoomLevel - 0.1) }
function zoomReset() { applyZoom(1.0) }


// ============================================================
// SIDEBAR
// ============================================================

function toggleSidebar() {
  sidebarVisible = !sidebarVisible
  sidebar.classList.toggle('collapsed', !sidebarVisible)
  localStorage.setItem('arc-sidebar-visible', sidebarVisible)
}


// ============================================================
// DRAG & DROP
// ============================================================

function clearDragStyles() {
  document.querySelectorAll('.dragging, .drag-over-top, .drag-over-bottom')
    .forEach(el => el.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom'))
}
function applyDragOver(targetEl, clientY) {
  clearDragStyles(); if (!targetEl) return
  const rect = targetEl.getBoundingClientRect()
  targetEl.classList.add(clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom')
}
function reorder(arr, srcId, tgtId, clientY, tgtEl) {
  const rect = tgtEl.getBoundingClientRect(); const after = clientY >= rect.top + rect.height / 2
  const srcIdx = arr.findIndex(x => x.id === srcId); const [item] = arr.splice(srcIdx, 1)
  const newTgt = arr.findIndex(x => x.id === tgtId); arr.splice(after ? newTgt + 1 : newTgt, 0, item)
}


// ============================================================
// RACCOURCIS CLAVIER
// ============================================================

function handleShortcut(mod, shift, alt, code) {
  if (mod && !shift && code === 'KeyT') { createTab(); return true }
  if (mod && shift && code === 'KeyT') { restoreClosedTab(); return true }
  if (mod && shift && code === 'KeyN') { createTab(null, true); return true }
  if (mod && code === 'KeyW') { if (!activeEssentialId && activeTabId) closeTab(activeTabId); return true }
  if (mod && code === 'KeyL') { urlInput.focus(); urlInput.select(); return true }
  if (mod && code === 'KeyR') { if (webviewReady) shift ? webview.reloadIgnoringCache() : webview.reload(); return true }
  if (mod && code === 'KeyF') { openFind(); return true }
  if (mod && code === 'KeyH') { toggleHistory(); return true }
  if (mod && code === 'KeyB') { toggleSidebar(); return true }
  if (mod && code === 'KeyD') { addCurrentPageAsEssential(); return true }
  if (code === 'F3')  { openFind(); return true }
  if (code === 'F5')  { if (webviewReady) webview.reload(); return true }
  if (code === 'F11') { window.bridge.toggleFullscreen(); return true }
  if (code === 'F12') { if (webviewReady) webview.openDevTools(); return true }
  if (alt && code === 'ArrowLeft')  { if (webviewReady && webview.canGoBack())    webview.goBack();    return true }
  if (alt && code === 'ArrowRight') { if (webviewReady && webview.canGoForward()) webview.goForward(); return true }
  if (mod && (code === 'Equal'  || code === 'NumpadAdd'))      { zoomIn();    return true }
  if (mod && (code === 'Minus'  || code === 'NumpadSubtract')) { zoomOut();   return true }
  if (mod && (code === 'Digit0' || code === 'Numpad0'))        { zoomReset(); return true }
  if (code === 'Escape') {
    if (permBar.classList.contains('visible'))    { permBar.classList.remove('visible'); return true }
    if (findBar.classList.contains('visible'))    { closeFind();   return true }
    if (historyPanel.classList.contains('visible')) { closeHistory(); return true }
    if (document.activeElement === urlInput) { urlInput.blur(); return true }
    if (isLoading && webviewReady) { webview.stop(); return true }
  }
  if (mod && code === 'Tab' && !activeEssentialId) {
    const at = getActiveTabs()
    if (at.length > 1) {
      const idx = at.findIndex(t => t.id === activeTabId)
      activateTab(at[shift ? (idx - 1 + at.length) % at.length : (idx + 1) % at.length].id)
      return true
    }
  }
  return false
}


// ============================================================
// ÉVÉNEMENTS — SIDEBAR
// ============================================================

essentialsList.addEventListener('click', e => {
  const closeBtn = e.target.closest('[data-unload-ess]')
  if (closeBtn) { unloadEssential(closeBtn.dataset.unloadEss); return }
  const item = e.target.closest('.tab-item'); if (!item) return
  clearTimeout(essClickTimer)
  essClickTimer = setTimeout(() => activateEssential(item.dataset.id), 220)
})
essentialsList.addEventListener('dblclick', e => {
  clearTimeout(essClickTimer)
  const item = e.target.closest('.tab-item'); if (item) startRenameEssential(item.dataset.id)
})
essentialsList.addEventListener('contextmenu', e => {
  e.preventDefault()
  const item = e.target.closest('.tab-item')
  if (item) showContextMenu(e.clientX, e.clientY, item.dataset.id, 'essential')
})

favoritesList.addEventListener('click', e => {
  const removeBtn = e.target.closest('[data-remove-fav]')
  if (removeBtn) { removeFavorite(removeBtn.dataset.removeFav); return }
  const item = e.target.closest('.tab-item'); if (!item) return
  openFavorite(item.dataset.id)
})
favoritesList.addEventListener('dblclick', e => {
  const item = e.target.closest('.tab-item'); if (item) startRenameFavorite(item.dataset.id)
})
favoritesList.addEventListener('contextmenu', e => {
  e.preventDefault()
  const item = e.target.closest('.tab-item')
  if (item) showContextMenu(e.clientX, e.clientY, item.dataset.id, 'favorite')
})

tabsList.addEventListener('click', e => {
  const muteBtn  = e.target.closest('[data-mute]')
  const closeBtn = e.target.closest('[data-close]')
  const item     = e.target.closest('.tab-item')
  if (muteBtn) {
    const tab = tabs.find(t => t.id === muteBtn.dataset.mute)
    if (tab) {
      tab.muted = !tab.muted
      if (activeTabId === tab.id && webviewReady) webview.setAudioMuted(tab.muted)
      if (activeTabId === tab.id) { globalMuted = tab.muted; updateMuteBtn() }
      saveState(); renderTabs()
    }
    return
  }
  if (closeBtn) { closeTab(closeBtn.dataset.close); return }
  if (item) { activateTab(item.dataset.id) }
})
tabsList.addEventListener('contextmenu', e => {
  e.preventDefault()
  const item = e.target.closest('.tab-item')
  if (item) showContextMenu(e.clientX, e.clientY, item.dataset.id, 'tab')
})

document.addEventListener('click', e => { if (!contextMenu.contains(e.target)) hideContextMenu() })
document.addEventListener('contextmenu', e => {
  if (!contextMenu.contains(e.target) && !tabsList.contains(e.target) && !essentialsList.contains(e.target) && !favoritesList.contains(e.target) && !spacesList.contains(e.target))
    hideContextMenu()
})
contextMenu.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]'); if (!btn || !ctxTargetId) return
  const action = btn.dataset.action, targetId = ctxTargetId, type = ctxType
  hideContextMenu()
  switch (action) {
    case 'rename':
      if (type === 'tab')       startRenameTab(targetId)
      else if (type === 'essential') startRenameEssential(targetId)
      else if (type === 'favorite')  startRenameFavorite(targetId)
      break
    case 'pin':              pinTabAsEssential(targetId); break
    case 'add-favorite':    addTabAsFavorite(targetId); break
    case 'unload-tab':      unloadTab(targetId); break
    case 'move-space':      moveTabToSpace(targetId, btn.dataset.targetSpace); break
    case 'open-tab':         openEssentialInTab(targetId); break
    case 'close':            closeTab(targetId); break
    case 'remove-essential': removeEssential(targetId); break
    case 'remove-favorite':  removeFavorite(targetId); break
    case 'rename-space':     renameSpace(targetId); break
    case 'delete-space':     deleteSpace(targetId); break
  }
})

document.getElementById('btn-add-space').addEventListener('click', createSpace)
document.getElementById('history-close').addEventListener('click', closeHistory)
document.getElementById('history-clear').addEventListener('click', () => { historyData = []; saveHistory(); renderHistory() })

window.bridge.onDlStart(d => {
  downloads.set(d.id, { filename: d.filename, received: 0, total: d.total, state: 'progressing', savePath: '' })
  renderDownloads()
})
window.bridge.onDlUpdate(d => {
  const dl = downloads.get(d.id); if (!dl) return
  dl.received = d.received; dl.total = d.total; dl.state = d.state; renderDownloads()
})
window.bridge.onDlDone(d => {
  const dl = downloads.get(d.id); if (!dl) return
  dl.state = d.state; dl.savePath = d.savePath; renderDownloads()
  if (d.state === 'completed') setTimeout(() => { downloads.delete(d.id); renderDownloads() }, 8000)
})
document.getElementById('dl-folder-btn').addEventListener('click', () => window.bridge.openDlFolder())
document.getElementById('dl-close-btn').addEventListener('click', () => {
  downloads.clear(); renderDownloads()
  document.getElementById('btn-downloads').classList.remove('active')
})

urlInput.addEventListener('focus', () => urlInput.select())
urlInput.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return
  const url = normalizeUrl(urlInput.value)
  if (activeTabId && !activeEssentialId) {
    const tab = tabs.find(t => t.id === activeTabId); if (tab) tab.url = url
  }
  navigate(url)
})

btnBack.addEventListener('click',    () => { if (webviewReady && webview.canGoBack())    webview.goBack() })
btnForward.addEventListener('click', () => { if (webviewReady && webview.canGoForward()) webview.goForward() })
btnReload.addEventListener('click',  () => { if (!webviewReady) return; isLoading ? webview.stop() : webview.reload() })
btnMute.addEventListener('click', () => {
  globalMuted = !globalMuted
  if (webviewReady) webview.setAudioMuted(globalMuted)
  if (activeTabId && !activeEssentialId) {
    const tab = tabs.find(t => t.id === activeTabId)
    if (tab) { tab.muted = globalMuted; saveState(); renderTabs() }
  }
  updateMuteBtn()
})

document.getElementById('btn-toggle-sidebar').addEventListener('click', toggleSidebar)
document.getElementById('btn-new-private').addEventListener('click', () => createTab(null, true))
document.getElementById('btn-downloads').addEventListener('click', () => {
  const btn = document.getElementById('btn-downloads')
  const visible = dlBar.classList.toggle('visible')
  btn.classList.toggle('active', visible)
})
document.getElementById('btn-add-essential').addEventListener('click', addCurrentPageAsEssential)
document.getElementById('btn-add-favorite').addEventListener('click', addCurrentPageAsFavorite)

const resizeHandle = document.getElementById('resize-handle')
resizeHandle.addEventListener('mousedown', e => {
  if (!sidebarVisible) return
  isResizing = true; resizeStartX = e.clientX; resizeStartW = sidebar.offsetWidth
  sidebar.classList.add('resizing'); resizeHandle.classList.add('active')
  document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; e.preventDefault()
})
document.addEventListener('mousemove', e => {
  if (!isResizing) return
  const newW = Math.max(160, Math.min(420, resizeStartW + e.clientX - resizeStartX))
  sidebar.style.width = newW + 'px'; sidebar.style.minWidth = newW + 'px'
})
document.addEventListener('mouseup', () => {
  if (!isResizing) return
  isResizing = false; sidebar.classList.remove('resizing'); resizeHandle.classList.remove('active')
  document.body.style.cursor = ''; document.body.style.userSelect = ''
  localStorage.setItem('arc-sidebar-width', sidebar.offsetWidth)
})

findInput.addEventListener('input', () => {
  const text = findInput.value.trim(); if (!webviewReady) return
  if (text) webview.findInPage(text)
  else { webview.stopFindInPage('clearSelection'); findCount.textContent = '' }
})
findInput.addEventListener('keydown', e => {
  e.stopPropagation()
  if (e.key === 'Enter')  { doFind(!e.shiftKey); return }
  if (e.key === 'Escape') { closeFind(); return }
})
document.getElementById('find-prev').addEventListener('click',  () => doFind(false))
document.getElementById('find-next').addEventListener('click',  () => doFind(true))
document.getElementById('find-close').addEventListener('click', closeFind)

document.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey
  if (document.activeElement === urlInput && !mod && !e.altKey && e.code !== 'Escape') return
  if (document.activeElement === findInput) return
  if (handleShortcut(mod, e.shiftKey, e.altKey, e.code)) e.preventDefault()
})
webview.addEventListener('before-input-event', e => {
  if (e.type !== 'keyDown') return
  if (handleShortcut(e.control || e.meta, e.shift, e.alt, e.code)) e.preventDefault()
})

window.bridge.onPermissionRequest(data => {
  pendingPermKey = data.key
  permText.textContent = `${data.origin} demande accès à : ${data.label}`
  permBar.classList.add('visible')
})
document.getElementById('perm-allow').addEventListener('click', () => {
  if (pendingPermKey) { window.bridge.answerPermission(pendingPermKey, true); pendingPermKey = null }
  permBar.classList.remove('visible')
})
document.getElementById('perm-deny').addEventListener('click', () => {
  if (pendingPermKey) { window.bridge.answerPermission(pendingPermKey, false); pendingPermKey = null }
  permBar.classList.remove('visible')
})
document.getElementById('perm-dismiss').addEventListener('click', () => {
  if (pendingPermKey) { window.bridge.answerPermission(pendingPermKey, false); pendingPermKey = null }
  permBar.classList.remove('visible')
})


// ============================================================
// ÉVÉNEMENTS — DRAG & DROP
// ============================================================

tabsList.addEventListener('dragstart', e => {
  const item = e.target.closest('.tab-item'); if (!item) return
  dragId = item.dataset.id; dragType = 'tab'
  e.dataTransfer.effectAllowed = 'move'
  requestAnimationFrame(() => item.classList.add('dragging'))
})
tabsList.addEventListener('dragover', e => {
  if (dragType !== 'tab') return
  e.preventDefault(); applyDragOver(e.target.closest('.tab-item'), e.clientY)
})
tabsList.addEventListener('drop', e => {
  e.preventDefault(); clearDragStyles()
  const target = e.target.closest('.tab-item')
  if (!target || !dragId || target.dataset.id === dragId) return
  reorder(tabs, dragId, target.dataset.id, e.clientY, target); saveState(); renderTabs()
})
tabsList.addEventListener('dragend', () => { clearDragStyles(); dragId = null; dragType = null })

essentialsList.addEventListener('dragstart', e => {
  clearTimeout(essClickTimer)
  const item = e.target.closest('.tab-item'); if (!item) return
  dragId = item.dataset.id; dragType = 'essential'
  e.dataTransfer.effectAllowed = 'move'
  requestAnimationFrame(() => item.classList.add('dragging'))
})
essentialsList.addEventListener('dragover', e => {
  if (dragType !== 'essential' && dragType !== 'tab') return
  e.preventDefault(); essentialsList.classList.add('drag-target')
  applyDragOver(e.target.closest('.tab-item'), e.clientY)
})
essentialsList.addEventListener('dragleave', e => {
  if (!essentialsList.contains(e.relatedTarget)) { essentialsList.classList.remove('drag-target'); clearDragStyles() }
})
essentialsList.addEventListener('drop', e => {
  e.preventDefault(); essentialsList.classList.remove('drag-target'); clearDragStyles()
  const targetItem = e.target.closest('.tab-item')
  if (dragType === 'essential') {
    if (!targetItem || !dragId || targetItem.dataset.id === dragId) return
    reorder(essentials, dragId, targetItem.dataset.id, e.clientY, targetItem); saveState(); renderEssentials()
  } else if (dragType === 'tab') {
    const tab = tabs.find(t => t.id === dragId); if (!tab || isSpecial(tab.url) || tab.private) return
    const url = normalizeUrl(tab.url)
    if (!essentials.find(ess => ess.url === url)) {
      const newEss = { id: 'e' + Date.now(), title: tab.title || url, url, favicon: tab.favicon }
      if (targetItem) {
        const rect   = targetItem.getBoundingClientRect()
        const tgtIdx = essentials.findIndex(ess => ess.id === targetItem.dataset.id)
        essentials.splice(e.clientY >= rect.top + rect.height / 2 ? tgtIdx + 1 : tgtIdx, 0, newEss)
      } else { essentials.push(newEss) }
    }
    const wasActive = activeTabId === dragId
    const tabIdx    = tabs.findIndex(t => t.id === dragId)
    if (tabIdx !== -1) tabs.splice(tabIdx, 1)
    if (wasActive) {
      const pinned = essentials.find(ess => ess.url === url)
      if (pinned) { activeEssentialId = pinned.id; activeTabId = null }
      else { const at = getActiveTabs(); at.length ? activateTab(at[0].id) : createTab() }
    }
    const at = getActiveTabs()
    if (!at.length) tabs.push({ id: 't' + Date.now(), title: 'Nouvel onglet', url: NEWTAB_URL, favicon: null, spaceId: activeSpaceId, lastUsed: Date.now(), archived: false })
    saveState(); render()
  }
})
essentialsList.addEventListener('dragend', () => { essentialsList.classList.remove('drag-target'); clearDragStyles(); dragId = null; dragType = null })


// ============================================================
// ÉVÉNEMENTS — WEBVIEW
// ============================================================

webview.addEventListener('dom-ready', () => { webviewReady = true; updateNavButtons() })

webview.addEventListener('did-start-loading', () => {
  isLoading = true; btnReload.innerHTML = ICON_STOP; btnReload.title = 'Arrêter'; startProgress()
})

webview.addEventListener('did-stop-loading', () => {
  isLoading = false; btnReload.innerHTML = ICON_RELOAD; btnReload.title = 'Recharger'
  completeProgress(); updateNavButtons()
  const url = webview.getURL()
  if (isNewtab(url)) {
    const engine = localStorage.getItem('divo-search-engine') || 'google'
    webview.executeJavaScript(`window.__divoEngine = '${engine}'`).catch(() => {})
  }
  if (!isSpecial(url)) {
    const tab = !activeEssentialId && activeTabId ? tabs.find(t => t.id === activeTabId) : null
    addToHistory(url, webview.getTitle(), tab?.favicon || null)
    if (tab?._resumeScroll && tab.scrollY > 0) {
      tab._resumeScroll = false
      const y = Math.round(tab.scrollY)
      setTimeout(() => webview.executeJavaScript(`window.scrollTo(0,${y})`).catch(() => {}), 200)
    } else if (tab) {
      tab._resumeScroll = false
    }
  }
})

webview.addEventListener('did-navigate', e => {
  urlInput.value = displayUrl(e.url)
  if (activeTabId && !activeEssentialId) {
    const tab = tabs.find(t => t.id === activeTabId)
    if (tab) {
      if (tab.url !== e.url) { tab.scrollY = 0; tab._resumeScroll = false }
      tab.url = e.url; saveState()
    }
  }
  globalPlaying = false; updateMuteBtn(); updateNavButtons()
  if (findBar.classList.contains('visible')) closeFind()
  permBar.classList.remove('visible')

  if (isSettings(e.url)) {
    setTimeout(async () => {
      const se = localStorage.getItem('divo-search-engine') || 'google'
      const hp = localStorage.getItem('divo-homepage')      || 'newtab'
      const ss = localStorage.getItem('divo-save-session')  || 'yes'
      const aa = localStorage.getItem('divo-auto-archive')  || 'off'
      const ab = await window.bridge.adblockStatus()
      webview.executeJavaScript(`
        document.getElementById('search-engine').value    = '${se}';
        document.getElementById('homepage').value          = '${hp}';
        document.getElementById('save-session').value     = '${ss}';
        document.getElementById('auto-archive').value     = '${aa}';
        document.getElementById('adblock-toggle').checked = ${ab};
      `).catch(() => {})
    }, 300)
  }
})

webview.addEventListener('did-navigate-in-page', e => {
  if (!e.isMainFrame) return
  urlInput.value = displayUrl(e.url)
  if (activeTabId && !activeEssentialId) {
    const tab = tabs.find(t => t.id === activeTabId)
    if (tab) { tab.url = e.url; saveState() }
  }
  updateNavButtons()
})

webview.addEventListener('page-title-updated', e => {
  if (e.title.startsWith('divo-action:')) {
    const action = e.title.replace('divo-action:', '')
    if (action === 'ext-install') window.bridge.extInstall()
    if (action.startsWith('adblock:')) window.bridge.adblockToggle(action.endsWith('true'))
    return
  }
  if (e.title.startsWith('divo-settings:')) {
    try {
      const s = JSON.parse(e.title.replace('divo-settings:', ''))
      if (s.searchEngine) localStorage.setItem('divo-search-engine', s.searchEngine)
      if (s.homepage)     localStorage.setItem('divo-homepage',      s.homepage)
      if (s.saveSession)  localStorage.setItem('divo-save-session',  s.saveSession)
      if (s.autoArchive)  { localStorage.setItem('divo-auto-archive', s.autoArchive); startArchiveTimer() }
    } catch {}
    return
  }
  if (!activeTabId || activeEssentialId) return
  const tab = tabs.find(t => t.id === activeTabId)
  if (!tab || isSpecial(tab.url)) return
  if (tab.title !== e.title) { tab.title = e.title; saveState(); renderTabs() }
})

webview.addEventListener('page-favicon-updated', e => {
  if (!activeTabId || activeEssentialId || !e.favicons?.length) return
  const tab = tabs.find(t => t.id === activeTabId)
  if (!tab || isSpecial(tab.url)) return
  if (tab.favicon !== e.favicons[0]) {
    tab.favicon = e.favicons[0]; saveState(); renderTabs(); updateTitlebarFavicon()
  }
})

webview.addEventListener('found-in-page', e => {
  const { activeMatchOrdinal, matches } = e.result
  if (matches > 0) { findCount.textContent = `${activeMatchOrdinal}/${matches}`; findCount.classList.remove('no-result') }
  else { findCount.textContent = 'Introuvable'; findCount.classList.add('no-result') }
})

webview.addEventListener('media-started-playing', () => {
  globalPlaying = true; updateMuteBtn()
  if (activeTabId && !activeEssentialId) {
    const tab = tabs.find(t => t.id === activeTabId)
    if (tab && !tab.playing) { tab.playing = true; renderTabs() }
  }
})

webview.addEventListener('media-paused', () => {
  globalPlaying = false; updateMuteBtn()
  if (activeTabId && !activeEssentialId) {
    const tab = tabs.find(t => t.id === activeTabId)
    if (tab && tab.playing) { tab.playing = false; renderTabs() }
  }
})

webview.addEventListener('new-window', e => {
  if (e.disposition === 'save-to-disk') return
  e.preventDefault(); if (e.url) createTab(e.url)
})


// ============================================================
// INIT
// ============================================================

if (localStorage.getItem('arc-sidebar-visible') === 'false') {
  sidebarVisible = false; sidebar.classList.add('collapsed')
}
const savedWidth = localStorage.getItem('arc-sidebar-width')
if (savedWidth) { sidebar.style.width = savedWidth + 'px'; sidebar.style.minWidth = savedWidth + 'px' }

window.bridge.onFullscreenChange(isFS => document.body.classList.toggle('fullscreen', isFS))
window.bridge.onOpenNewTab(url => { if (url) createTab(url) })

loadState(); loadHistory(); render(); startArchiveTimer(); startScrollSaver()

const activeItem = activeEssentialId
  ? essentials.find(e => e.id === activeEssentialId)
  : tabs.find(t => t.id === activeTabId)

if (activeItem) {
  webview.src   = normalizeUrl(activeItem.url)
  urlInput.value = displayUrl(activeItem.url)
}
