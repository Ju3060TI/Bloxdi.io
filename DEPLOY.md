# Bloxdi.io – Repository neu auf Render deployen

## Was du brauchst

- GitHub-Account
- [Render.com](https://render.com) Account (kostenlos)
- Alle Spiel-Dateien liegen im **Root** dieses Ordners (kein Unterordner)

## Option A: Altes Render-Projekt löschen & neu erstellen

1. **Render Dashboard** → alte Site `bloxdi-io` öffnen
2. **Settings** → ganz unten **Delete Static Site**
3. **New +** → **Static Site**
4. GitHub-Repo verbinden (oder neu erstellen, siehe Option B)
5. Einstellungen:

| Feld | Wert |
|------|------|
| Name | `bloxdi-io` |
| Branch | `main` |
| Root Directory | *(leer)* |
| **Build Command** | *(komplett leer lassen)* |
| **Publish Directory** | `.` |

6. **Create Static Site** → nach 1–3 Min. testen: `https://DEIN-NAME.onrender.com`

## Option B: GitHub-Repo komplett neu füllen

### 1. Auf GitHub leeres Repo anlegen

- Name z. B. `bloxdi-io`
- **Ohne** README (leer)

### 2. Lokal hochladen (Git Bash oder GitHub Desktop)

Im Ordner `Bloxdi.io`:

```bash
git init
git add .
git commit -m "Bloxdi.io v0.4.0 – Static Site"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/bloxdi-io.git
git push -u origin main --force
```

`--force` nur wenn du ein **altes** Repo komplett ersetzen willst.

### 3. Mit GitHub Desktop (ohne Kommandozeile)

1. **File → Add local repository** → Ordner `Bloxdi.io` wählen
2. **Publish repository** → GitHub
3. Alle Dateien committen → **Push origin**

## Option C: Nur Render neu deployen (Repo bleibt)

1. Alle geänderten Dateien zu GitHub pushen
2. Render Dashboard → deine Site → **Manual Deploy** → **Deploy latest commit**
3. Optional: **Clear build cache** → nochmal deployen

## Dateien die online sein MÜSSEN

```
index.html
styles.css
main.js
blocks.js
render.js
world-generation.js
player.js
physics.js
menu.js
auth.js
inventory.js
crafting.js
entities.js
survival.js
combat.js
structures.js
caves.js
biomes.js
dimensions.js
shaders.js
particles.js
lighting.js
weather.js
sounds.js
achievements.js
statistics.js
marketplace.js
settings-advanced.js
mobile.js
render.yaml
package.json
```

## Nach dem Deploy testen

1. URL öffnen (nicht `file://`)
2. Ladebalken sollte in **unter 15 Sekunden** fertig sein
3. **Spielen** → Welt erstellen → Spiel startet

## Häufige Fehler

| Problem | Lösung |
|---------|--------|
| 0% Ladebildschirm ewig | `Strg+F5`, Build Command leer, Publish = `.` |
| Weiße Seite | F12 → Konsole, CDN blockiert? Anderes Netz testen |
| Alte Version | Render → Manual Deploy + Cache leeren |
| `file://` lokal | `npm start` → http://localhost:3000 |

## Lokal testen vor Deploy

```bash
npm start
```

Dann: http://localhost:3000
