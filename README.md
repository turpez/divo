# Divo Browser

Navigateur minimaliste inspiré d'Arc, construit avec Electron.

## Téléchargement

Voir la section [Releases](../../releases) pour télécharger la dernière version.

> Windows affichera un avertissement SmartScreen — cliquer **"Informations complémentaires"** puis **"Exécuter quand même"**.

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
npm run build
```

Nécessite Node.js 20+ et Windows avec le Mode Développeur activé.
