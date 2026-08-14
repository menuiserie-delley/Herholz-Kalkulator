# Herholz Futtertüren-Kalkulator

Statische Web-App (HTML/CSS/JS, kein Build-Schritt nötig) für Menuiserie Delley zur Ermittlung des
Bestellmasses (Mass A) von Herholz-Innentüren nach dem Herholz Norm-Mass-Merkblatt.

## Funktionen

- Eingabe **rohes Mauerlicht** (Neubau/Umbau) oder **lichtes Durchgangsmass** einer bestehenden Türe,
  jeweils mit Wandstärke.
- Automatischer Abgleich mit der Herholz-Normtabelle (Breite/Höhe getrennt) inkl. Toleranz –
  liegt das Eingabemass im (bzw. nahe am) publizierten Herholz-Bereich, wird automatisch das
  passende Bestellmass übernommen. Ausserhalb der Normmasse erscheint ein Hinweis zur Rücksprache.
- Ermittlung des Zierbekleidungs-Bestellmasses anhand der Wandstärke (Wandstärkenausgleich -3/+17 mm).
- Mehrere Türen sammeln (Bestellliste, in `localStorage` gespeichert, bleibt bei Neuladen erhalten).
- Bestellung per Klick als E-Mail an **info@menuiserie-delley.ch** vorbereiten (mailto-Link), inkl.
  Kopieren-Button als Fallback für sehr lange Listen.

## Lokal testen

Einfach `index.html` im Browser öffnen, oder z. B. mit `python3 -m http.server` im Ordner starten.
Läuft ohne weitere Installation auch direkt über GitHub Pages.

## Dateien

- `index.html` – Seitenstruktur, Formular, Diagramm (inline SVG)
- `style.css` – Design (Delley-Farbschema, gleiche Basis wie die Parkett-Kalkulator-Seite)
- `script.js` – Normtabellen, Berechnungslogik, Bestellliste, E-Mail-Versand
- `logo.png` / `logo-pdf.png` – Menuiserie-Delley-Logo

## Hinweis zu den Normwerten

Alle Masszahlen (Breite/Höhe-Tabellen, Wandstärkenausgleich) stammen 1:1 aus dem offiziellen
Herholz-Merkblatt "Norm-Masse Herholz Innentüren" (Stand 2025) und sind in `script.js` als
Konstanten hinterlegt (`NORM_BREITE`, `NORM_HOEHE`, `WANDSTAERKE_TABLE`).
