# plateload

PlateLoad Pro — calcolatore dischi per palestra. App single-file, nessuna build.

## Stack

- File principali: `index.html` (markup + JS inline, vanilla JS) e `style.css` (Tailwind compilato, minificato)
- Tailwind viene compilato offline con la CLI e servito come file statico: niente CDN a runtime. Per ricompilare dopo una modifica alle classi in `index.html`: `npm install` poi `npx tailwindcss -c tailwind.config.js -i input.css -o style.css --minify` (config in `tailwind.config.js`, input in `input.css`)
- Font: Inter + JetBrains Mono da Google Fonts
- Persistenza: `localStorage` (chiave `plateload_pro_v1`, con migrazione dalla v1)
- Tema dark via classe `dark` su `<html>`

## Comandi

- Nessuna build, nessun test, nessun dépendance da installare: si apre `index.html` nel browser
- Per servire in locale durante lo sviluppo: `python3 -m http.server` dalla root del progetto

## Convenzioni

- UI in italiano, testo utente in italiano
- Stili custom in `<style>` in `<head>`, logica in `<script>` a fine body
- Non introdurre dipendenze externe oltre le CDN già presenti senza chiedere

## Mappa

- `index.html` — tutta l'app (markup, stili, logica)
