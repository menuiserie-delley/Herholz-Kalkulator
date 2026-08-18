/*
 * Herholz Futtertüren-Kalkulator
 * Normwerte aus: Merkblatt "Norm-Masse Herholz Innentüren" (SABAG / Herholz, 2025)
 * Spalten je Zeile: Wandöffnung minimal, Wandöffnung rohes Mauerlichtmass, Wandöffnung maximal,
 *   A = Türblatt-Aussenmass (Bestellmass), B = Futter-Falzmass, C = lichtes Durchgangsmass,
 *   D = Aussenkante Futter, E50 = Aussenkante Bekleidung 50/50mm, E625 = Aussenkante Bekleidung 62.5/62.5mm
 */

const emailEmpfaenger = "info@menuiserie-delley.ch";

// Dekor/Oberflächen-Auswahl. Um weitere Dekore hinzuzufügen: Bild in den Ordner
// dekore/ legen (Dateiname = Dekor-Name) und hier einen Eintrag {id, name, img} ergänzen.
const DEKORE = [
  { id: "nebelgrau", name: "Nebelgrau", img: "dekore/nebelgrau.png" },
  { id: "uni-weiss", name: "Uni weiss", img: "dekore/uni-weiss.png" },
  { id: "felsgrau", name: "Felsgrau", img: "dekore/felsgrau.png" },
  { id: "esche-weiss", name: "Esche weiss", img: "dekore/esche-weiss.png" },
  { id: "brilliant-weiss", name: "Brilliant weiss", img: "dekore/brilliant-weiss.png" },
];

const NORM_BREITE = [
  { min: 665, roh: 680, max: 720, A: 650, B: 631, C: 603, D: 649, E50: 731, E625: 756 },
  { min: 715, roh: 730, max: 770, A: 700, B: 681, C: 653, D: 699, E50: 781, E625: 806 },
  { min: 765, roh: 780, max: 820, A: 750, B: 731, C: 703, D: 749, E50: 831, E625: 856 },
  { min: 815, roh: 830, max: 870, A: 800, B: 781, C: 753, D: 799, E50: 881, E625: 906 },
  { min: 865, roh: 880, max: 920, A: 850, B: 831, C: 803, D: 849, E50: 931, E625: 956 },
  { min: 915, roh: 930, max: 970, A: 900, B: 881, C: 853, D: 899, E50: 981, E625: 1006 },
  { min: 965, roh: 980, max: 1020, A: 950, B: 931, C: 903, D: 949, E50: 1031, E625: 1056 },
  { min: 1015, roh: 1030, max: 1070, A: 1000, B: 981, C: 953, D: 999, E50: 1081, E625: 1106 },
  { min: 1065, roh: 1080, max: 1120, A: 1050, B: 1031, C: 1003, D: 1049, E50: 1131, E625: 1156 },
];

const NORM_HOEHE = [
  { min: 2020, roh: 2030, max: 2050, A: 2010, B: 2005, C: 1991, D: 2014, E50: 2055, E625: 2067.5 },
  { min: 2050, roh: 2060, max: 2070, A: 2030, B: 2025, C: 2011, D: 2034, E50: 2075, E625: 2087.5 },
  { min: 2120, roh: 2130, max: 2150, A: 2110, B: 2105, C: 2091, D: 2114, E50: 2155, E625: 2167.5 },
];

// Wandstärkenausgleich (-3mm / +17mm): Bestellmass Zierbekleidung, Bereich eingeschoben..ausgezogen
const WANDSTAERKE_TABLE = [
  { bestellmass: 80, eingeschoben: 77, ausgezogen: 97 },
  { bestellmass: 100, eingeschoben: 97, ausgezogen: 117 },
  { bestellmass: 120, eingeschoben: 117, ausgezogen: 137 },
  { bestellmass: 140, eingeschoben: 137, ausgezogen: 157 },
  { bestellmass: 160, eingeschoben: 157, ausgezogen: 177 },
  { bestellmass: 180, eingeschoben: 177, ausgezogen: 197 },
  { bestellmass: 200, eingeschoben: 197, ausgezogen: 217 },
  { bestellmass: 220, eingeschoben: 217, ausgezogen: 237 },
  { bestellmass: 240, eingeschoben: 237, ausgezogen: 257 },
  { bestellmass: 265, eingeschoben: 262, ausgezogen: 282 },
  { bestellmass: 285, eingeschoben: 282, ausgezogen: 302 },
  { bestellmass: 305, eingeschoben: 302, ausgezogen: 322 },
  { bestellmass: 325, eingeschoben: 322, ausgezogen: 342 },
];

// Modus "roh": Herholz publiziert für jede Grösse bereits eine Wandöffnungs-Toleranz (min..max).
// Wir übernehmen diese und geben zusätzlich 3mm Sicherheitsspielraum an den Rändern, wie vom
// Kunden gewünscht ("+/-3mm wenn es in den ähnlichen Bereich kommt").
function matchRoh(value, tabelle) {
  return tabelle.find((row) => value >= row.min - 3 && value <= row.max + 3) || null;
}

// Modus "licht": lichtes Durchgangsmass ist ein Einzelwert (Spalte C), kein Bereich -> feste 3mm Toleranz.
function matchLicht(value, tabelle) {
  let best = null;
  let bestDiff = Infinity;
  for (const row of tabelle) {
    const diff = Math.abs(value - row.C);
    if (diff <= 3 && diff < bestDiff) {
      best = row;
      bestDiff = diff;
    }
  }
  return best;
}

function matchWandstaerke(value) {
  return WANDSTAERKE_TABLE.find((row) => value >= row.eingeschoben && value <= row.ausgezogen) || null;
}

function berechne() {
  const modus = document.querySelector('input[name="tk-modus"]:checked').value;
  const breite = parseFloat(document.getElementById("tk-breite").value);
  const hoehe = parseFloat(document.getElementById("tk-hoehe").value);
  const wandstaerke = parseFloat(document.getElementById("tk-wandstaerke").value);
  const bekleidung = document.getElementById("tk-bekleidung").value; // "50" oder "625"
  const bandseite = document.querySelector('input[name="tk-bandseite"]:checked').value; // "links" oder "rechts"
  const dekorId = document.querySelector('input[name="tk-dekor"]:checked')?.value || null;
  const dekor = DEKORE.find((d) => d.id === dekorId) || null;

  const ergebnisDiv = document.getElementById("tk-ergebnis");

  if (!breite || !hoehe) {
    ergebnisDiv.innerHTML = '<div class="tk-warning">Bitte Breite und Höhe eingeben.</div>';
    return null;
  }

  const matchFn = modus === "roh" ? matchRoh : matchLicht;
  const rowB = matchFn(breite, NORM_BREITE);
  const rowH = matchFn(hoehe, NORM_HOEHE);
  const wandRow = wandstaerke ? matchWandstaerke(wandstaerke) : null;

  const warnungen = [];
  if (!rowB) warnungen.push("Breite liegt ausserhalb der Herholz-Normmasse.");
  if (!rowH) warnungen.push("Höhe liegt ausserhalb der Herholz-Normmasse.");
  if (wandstaerke && !wandRow) warnungen.push("Wandstärke liegt ausserhalb des Zierbekleidungs-Ausgleichsbereichs (77–342 mm).");

  if (warnungen.length) {
    ergebnisDiv.innerHTML = `
      <div class="tk-warning">
        <strong>Ausserhalb Normmass</strong> – bitte Rücksprache mit Menuiserie Delley (info@menuiserie-delley.ch).<br>
        ${warnungen.join("<br>")}
      </div>`;
    return null;
  }

  const eSpalte = bekleidung === "625" ? "E625" : "E50";
  const bekleidungLabel = bekleidung === "625" ? "62.5 / 62.5 mm" : "50 / 50 mm";
  const bandseiteLabel = bandseite === "rechts" ? "DIN Rechts" : "DIN Links";

  const result = {
    modus,
    breiteEingabe: breite,
    hoeheEingabe: hoehe,
    wandstaerkeEingabe: wandstaerke || null,
    bezeichnung: document.getElementById("tk-bezeichnung").value.trim(),
    bekleidungLabel,
    bandseiteLabel,
    dekorName: dekor ? dekor.name : null,
    dekorImg: dekor ? dekor.img : null,
    A: { breite: rowB.A, hoehe: rowH.A },
    B: { breite: rowB.B, hoehe: rowH.B },
    C: { breite: rowB.C, hoehe: rowH.C },
    D: { breite: rowB.D, hoehe: rowH.D },
    E: { breite: rowB[eSpalte], hoehe: rowH[eSpalte] },
    zierBestellmass: wandRow ? wandRow.bestellmass : null,
    zierBereich: wandRow ? `${wandRow.eingeschoben}–${wandRow.ausgezogen} mm` : null,
  };

  zeigeErgebnis(result);
  return result;
}

function zeigeErgebnis(r) {
  const hinweisC = r.C.hoehe === 1991 || r.C.hoehe === 2011 || r.C.hoehe === 2091
    ? '<p style="font-size:12.5px;color:#777;font-style:italic;">Hinweis: Herholz-Fertigelemente haben eine rechnerische Bodenluft von 4 mm – das Futter kann für dauerelastische Abdichtung um 3 mm höher eingebaut werden (wichtig bei Fliesen-/Steinzeugböden).</p>'
    : "";

  document.getElementById("tk-ergebnis").innerHTML = `
    <div class="ergebnis-total">Bestellmass Türe (A): ${r.A.breite} × ${r.A.hoehe} mm</div>
    <div class="ergebnis-box">
      <h3>Weitere Masse</h3>
      <p><strong>B – Futter-Falzmass:</strong> ${r.B.breite} × ${r.B.hoehe} mm</p>
      <p><strong>C – lichtes Durchgangsmass:</strong> ${r.C.breite} × ${r.C.hoehe} mm</p>
      <p><strong>D – Aussenkante Futter:</strong> ${r.D.breite} × ${r.D.hoehe} mm</p>
      <p><strong>E – Aussenkante Bekleidung (${r.bekleidungLabel}):</strong> ${r.E.breite} × ${r.E.hoehe} mm</p>
      <p><strong>Bandseite:</strong> ${r.bandseiteLabel}</p>
      <p><strong>Dekor / Oberfläche:</strong> ${r.dekorName || "–"}</p>
      ${hinweisC}
    </div>
    ${r.zierBestellmass ? `
    <div class="ergebnis-box">
      <h3>Zierbekleidung / Wandstärkenausgleich</h3>
      <p><strong>Bestellmass Zierbekleidung:</strong> ${r.zierBestellmass} mm</p>
      <p><strong>Verstellbereich (eingeschoben–ausgezogen):</strong> ${r.zierBereich}</p>
    </div>` : ""}
    <button id="tk-add-btn" class="tk-add-btn">＋ Zur Bestellliste hinzufügen</button>
  `;
  document.getElementById("tk-add-btn").onclick = () => zurListeHinzufuegen(r);
}

// ---- Bestellliste ----

const STORAGE_KEY = "herholz-bestellliste";

function ladeListe() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function speichereListe(liste) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liste));
}

function zurListeHinzufuegen(r) {
  const liste = ladeListe();
  liste.push(r);
  speichereListe(liste);
  renderListe();
}

function ausListeEntfernen(index) {
  const liste = ladeListe();
  liste.splice(index, 1);
  speichereListe(liste);
  renderListe();
}

function renderListe() {
  const liste = ladeListe();
  const container = document.getElementById("tk-liste");
  const sendenBtn = document.getElementById("tk-senden-btn");
  const kopierenBtn = document.getElementById("tk-kopieren-btn");

  if (!liste.length) {
    container.innerHTML = '<p class="tk-empty">Noch keine Türen erfasst.</p>';
    sendenBtn.disabled = true;
    kopierenBtn.disabled = true;
    return;
  }

  const zeilen = liste.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.bezeichnung || "–"}</td>
      <td>${r.A.breite} × ${r.A.hoehe} mm</td>
      <td>${r.zierBestellmass ? r.zierBestellmass + " mm" : "–"}</td>
      <td>${r.bandseiteLabel}</td>
      <td>${r.dekorImg ? `<img src="${r.dekorImg}" alt="${r.dekorName}" class="tk-table-swatch">` : ""}${r.dekorName || "–"}</td>
      <td><button class="tk-remove-btn" data-index="${i}">Entfernen</button></td>
    </tr>`).join("");

  container.innerHTML = `
    <div class="tk-table-wrap">
      <table class="tk-table">
        <thead>
          <tr><th>Pos</th><th>Bezeichnung</th><th>Bestellmass A (B×H)</th><th>Zierbekleidung</th><th>Band</th><th>Dekor</th><th></th></tr>
        </thead>
        <tbody>${zeilen}</tbody>
      </table>
    </div>`;

  container.querySelectorAll(".tk-remove-btn").forEach((btn) => {
    btn.onclick = () => ausListeEntfernen(parseInt(btn.dataset.index, 10));
  });

  sendenBtn.disabled = false;
  kopierenBtn.disabled = false;
}

function bestellTextErstellen() {
  const liste = ladeListe();
  const zeilen = liste.map((r, i) => {
    const teile = [
      `Position ${i + 1}${r.bezeichnung ? " – " + r.bezeichnung : ""}`,
      `  Bestellmass Türe (A): ${r.A.breite} x ${r.A.hoehe} mm`,
      `  Futter-Falzmass (B): ${r.B.breite} x ${r.B.hoehe} mm`,
      `  Lichtes Durchgangsmass (C): ${r.C.breite} x ${r.C.hoehe} mm`,
      `  Zierbekleidung: ${r.bekleidungLabel}${r.zierBestellmass ? `, Bestellmass ${r.zierBestellmass} mm (Bereich ${r.zierBereich})` : ""}`,
      `  Bandseite: ${r.bandseiteLabel}`,
      `  Dekor / Oberfläche: ${r.dekorName || "nicht gewählt"}`,
      `  Eingabe: ${r.modus === "roh" ? "rohes Mauerlicht" : "lichtes Durchgangsmass (bestehend)"} ${r.breiteEingabe} x ${r.hoeheEingabe} mm${r.wandstaerkeEingabe ? `, Wandstärke ${r.wandstaerkeEingabe} mm` : ""}`,
    ];
    return teile.join("\n");
  });

  return `Bestellung Herholz Futtertüren\n\n${zeilen.join("\n\n")}\n\n(Alle Masse gemäss Herholz-Norm-Mass-Abgleich, ohne Gewähr – bitte vor Bestellung prüfen.)`;
}

function bestellungSenden() {
  const text = bestellTextErstellen();
  const betreff = encodeURIComponent("Bestellung Herholz Futtertüren");
  const body = encodeURIComponent(text);
  const mailtoUrl = `mailto:${emailEmpfaenger}?subject=${betreff}&body=${body}`;

  if (mailtoUrl.length > 1800) {
    alert(
      "Die Bestellliste ist sehr lang – die E-Mail könnte beim Öffnen abgeschnitten werden.\n" +
      "Bitte zusätzlich auf 'Liste in Zwischenablage kopieren' klicken und den Text vor dem Senden " +
      "in die E-Mail einfügen/prüfen."
    );
  }

  window.location.href = mailtoUrl;
}

async function listeKopieren() {
  const text = bestellTextErstellen();
  const btn = document.getElementById("tk-kopieren-btn");
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  const original = btn.innerText;
  btn.innerText = "Kopiert!";
  setTimeout(() => (btn.innerText = original), 1500);
}

function renderDekorGrid() {
  const grid = document.getElementById("tk-dekor-grid");

  if (!DEKORE.length) {
    grid.innerHTML = '<p class="tk-empty">Dekore werden in Kürze ergänzt.</p>';
    return;
  }

  grid.innerHTML = DEKORE.map((d, i) => `
    <label class="tk-dekor-option${i === 0 ? " is-selected" : ""}">
      <input type="radio" name="tk-dekor" value="${d.id}" ${i === 0 ? "checked" : ""}>
      <span class="tk-dekor-swatch-wrap">
        <img src="${d.img}" alt="${d.name}" class="tk-dekor-swatch">
        <button type="button" class="tk-dekor-zoom" data-img="${d.img}" data-name="${d.name}" aria-label="${d.name} vergrössern">🔍</button>
      </span>
      <span>${d.name}</span>
    </label>`).join("");

  grid.querySelectorAll('input[name="tk-dekor"]').forEach((input) => {
    input.addEventListener("change", () => {
      grid.querySelectorAll(".tk-dekor-option").forEach((el) => el.classList.remove("is-selected"));
      input.closest(".tk-dekor-option").classList.add("is-selected");
    });
  });

  grid.querySelectorAll(".tk-dekor-zoom").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      oeffneLightbox(btn.dataset.img, btn.dataset.name);
    });
  });
}

function oeffneLightbox(img, name) {
  document.getElementById("tk-lightbox-img").src = img;
  document.getElementById("tk-lightbox-img").alt = name;
  document.getElementById("tk-lightbox-caption").textContent = name;
  document.getElementById("tk-lightbox").hidden = false;
}

function schliesseLightbox() {
  document.getElementById("tk-lightbox").hidden = true;
}

function setup() {
  renderDekorGrid();
  document.getElementById("tk-berechnen-btn").onclick = berechne;
  document.getElementById("tk-senden-btn").onclick = bestellungSenden;
  document.getElementById("tk-kopieren-btn").onclick = listeKopieren;
  document.getElementById("tk-lightbox").onclick = schliesseLightbox;
  document.getElementById("tk-lightbox-close").onclick = schliesseLightbox;
  document.getElementById("tk-lightbox-img").onclick = (e) => e.stopPropagation();
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") schliesseLightbox();
  });
  renderListe();
}

window.onload = setup;
