# Bloxdi.io

Episches Voxel-Survival-Spiel im Browser – Three.js, Vanilla JS ES Modules.

## Starten

Öffne `index.html` mit einem lokalen Server (ES Modules):

```bash
npx serve .
# oder: python -m http.server 8080
```

Dann: `http://localhost:3000` (oder Port 8080)

## Struktur (20+ Dateien)

| Bereich | Dateien |
|---------|---------|
| Core | `index.html`, `styles.css`, `blocks.js`, `world-generation.js`, `player.js`, `physics.js`, `main.js`, `auth.js`, `menu.js` |
| Gameplay | `inventory.js`, `crafting.js`, `entities.js`, `survival.js`, `combat.js` |
| Welt | `structures.js`, `caves.js`, `biomes.js`, `dimensions.js` |
| Visuell | `shaders.js`, `particles.js`, `lighting.js`, `weather.js`, `sounds.js` |
| Extra | `achievements.js`, `statistics.js`, `marketplace.js`, `settings-advanced.js`, `mobile.js` |

## Features

- 300+ Blöcke mit 16×16 Canvas-Texturen
- 15 Biome, Höhlen, Schluchten, Dörfer, Tempel
- Survival (HP, Hunger, XP), Inventar, Crafting
- Mobs mit KI, Tag/Nacht, Wetter, Partikel
- GPU-Auto-Detect für Performance-Presets
- Offline-Speicherung (LocalStorage)
- Touch-Steuerung für Mobile/WebView

## Steuerung

- **WASD** – Bewegen
- **Maus ziehen** – Kamera (ohne Pointer Lock)
- **Pfeiltasten** – Alternative Kamera
- **Linksklick halten** – Block abbauen
- **Rechtsklick** – Block setzen
- **1–9** – Hotbar
- **E** – Inventar
- **Shift** – Schleichen
- **F5** – Perspektive
- **F3** – Debug
- **Escape** – Pause

## Firebase (optional)

Trage deine Firebase-Config in `auth.js` ein für Cloud-Saves.

## Auf Render.com deployen

**Kurzanleitung:** Siehe [DEPLOY.md](DEPLOY.md) – Repo neu pushen, Render Static Site, Publish Directory `.`

Bloxdi.io ist eine **Static Site** – perfekt für [Render.com](https://render.com).

### Schritt 1: GitHub-Repository

```bash
cd Bloxdi.io
git init
git add .
git commit -m "Bloxdi.io initial"
git remote add origin https://github.com/DEIN-USERNAME/bloxdi-io.git
git push -u origin main
```

Ersetze `DEIN-USERNAME` durch deinen GitHub-Namen.

### Schritt 2: Render verbinden

1. Auf [render.com](https://render.com) einloggen (kostenloser Account reicht).
2. **New +** → **Static Site**.
3. GitHub-Repo `bloxdi-io` verbinden.
4. Einstellungen:

| Feld | Wert |
|------|------|
| **Name** | `bloxdi-io` |
| **Branch** | `main` |
| **Root Directory** | *(leer lassen)* |
| **Build Command** | *(leer lassen)* |
| **Publish Directory** | `.` |

5. **Create Static Site** klicken.

Render liest optional automatisch die `render.yaml` im Projektroot (Blueprint).

### Schritt 3: Live-URL

Nach 1–2 Minuten erhältst du eine URL wie:

`https://bloxdi-io.onrender.com`

Eigene Domain: Render Dashboard → **Settings** → **Custom Domains** → z. B. `bloxdi.io` hinzufügen.

### Hinweise für Render

- **ES Modules** und Three.js-CDN funktionieren ohne Build.
- **LocalStorage** (Welten speichern) läuft im Browser des Spielers.
- Free-Tier: Site schläft nach Inaktivität (~15 s Kaltstart beim ersten Besuch).
- `render.yaml` liegt bereits im Repo – bei Blueprint-Deploy werden Header & SPA-Rewrite gesetzt.

### Nur mit render.yaml (Blueprint)

**New +** → **Blueprint** → Repo wählen → Render erstellt die Static Site aus `render.yaml`.

Vorher in `render.yaml` die Zeile `repo:` auf dein echtes GitHub-Repo anpassen oder die `repo`-Zeile entfernen (wird beim manuellen Connect gesetzt).

## Version

0.4.0
