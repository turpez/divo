# Divo Browser

Navigateur minimaliste inspiré d'Arc, construit avec Electron.

## Téléchargement

Voir la section [Releases](../../releases) pour télécharger la dernière version.

### Windows

Télécharger `Divo Setup x.x.x.exe` (installeur) ou `Divo x.x.x.exe` (portable).

> SmartScreen peut afficher un avertissement — cliquer **"Informations complémentaires"** puis **"Exécuter quand même"**.

### Linux

Télécharger `Divo-x.x.x.AppImage`, puis dans un terminal :

```bash
chmod +x Divo-*.AppImage
./Divo-*.AppImage
```

> Sur certaines distributions, il faut activer l'exécution des AppImage dans les propriétés du fichier (clic droit → Propriétés → Autoriser l'exécution).

**Dépendances requises** (si l'AppImage ne démarre pas) :

```bash
# Debian / Ubuntu
sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils

# Arch
sudo pacman -S gtk3 libnotify nss libxss libxtst xdg-utils
```

## Fonctionnalités

- **Spaces** — groupes d'onglets avec favoris isolés par espace
- **Essentials** — onglets épinglés toujours accessibles
- **Favoris** — bookmarks par espace
- **Auto-archive** — onglets inactifs archivés automatiquement
- **Déchargement d'onglets** — libère la mémoire, scroll sauvegardé
- **Bloqueur de pubs** — ~40 000 domaines bloqués + CSS injection
- **Navigation privée** — Ctrl+Shift+N
- **Restauration d'onglet** — Ctrl+Shift+T
- **Historique**, téléchargements, recherche dans la page
- **Extensions Chrome** (MV2/MV3 non signées)

## Raccourcis

| Raccourci | Action |
|---|---|
| `Ctrl+T` | Nouvel onglet |
| `Ctrl+W` | Fermer l'onglet |
| `Ctrl+Shift+T` | Restaurer le dernier onglet fermé |
| `Ctrl+Shift+N` | Navigation privée |
| `Ctrl+Tab` | Onglet suivant |
| `Ctrl+L` | Focus barre URL |
| `Ctrl+F` | Recherche dans la page |
| `Ctrl+H` | Historique |
| `Ctrl+B` | Afficher/masquer la sidebar |
| `Ctrl+D` | Épingler en Essential |
| `F11` | Plein écran |

## Build

```bash
npm install

# Windows
npm run build

# Linux
npm run build:linux
```

Nécessite Node.js 20+. Sous Windows, le Mode Développeur doit être activé.
