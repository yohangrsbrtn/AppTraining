// ── Bilan page ────────────────────────────────────────────────────────

let _bilanData  = null;
let _bilanNotes = {};
let _prevMeta   = null;
let _bilanMode  = 'current'; // 'current' | 'previous' | 'history-list' | 'history-detail'

async function loadBilan() {
  setPage('bilan-loading');
  try {
    const data = await api('chargerBilan');
    _prevMeta  = data.prevLigneTitre ? {
      ligneTitre:   data.prevLigneTitre,
      semaineLabel: data.prevSemaineLabel,
      dejaValide:   data.prevDejaValide,
      targetSunday: data.prevTargetSunday
    } : null;
    _bilanMode = 'current';
    _bilanData = data;
    setPage('bilan');
  } catch(e) { setPage('home'); }
}

async function loadBilanPrecedent() {
  if (!_prevMeta) return;
  setPage('bilan-loading');
  try {
    const data = await api('chargerBilanParLigne', { ligneTitre: _prevMeta.ligneTitre });
    data.semaineLabel = _prevMeta.semaineLabel;
    data.dejaValide   = _prevMeta.dejaValide;
    data.targetSunday = _prevMeta.targetSunday;
    _bilanData = data;
    _bilanMode = 'previous';
    setPage('bilan');
  } catch(e) { setPage('bilan'); }
}

async function loadHistoriqueBilans() {
  setPage('bilan-loading');
  try {
    S.data.historiqueBilans = await api('chargerHistoriqueBilans');
    _bilanMode = 'history-list';
    setPage('bilan');
  } catch(e) { setPage('bilan'); }
}

async function loadBilanHistorique(ligneTitre) {
  setPage('bilan-loading');
  try {
    _bilanData = await api('chargerBilanParLigne', { ligneTitre });
    _bilanMode = 'history-detail';
    setPage('bilan');
  } catch(e) { setPage('bilan'); }
}

// ── Render ────────────────────────────────────────────────────────────

function renderBilanPage() {
  if (_bilanMode === 'bilan-loading') {
    return `<div id="app">${renderHeader('Bilan','',false)}<div class="page">${renderSpinner()}</div>${renderNavBar('bilan')}</div>`;
  }
  if (_bilanMode === 'history-list') return renderHistoriqueList();
  if (_bilanMode === 'history-detail') return renderBilanDetail(_bilanData, true);
  if (_bilanMode === 'previous') return renderBilanDetail(_bilanData, false, true);
  if (!_bilanData) return `<div id="app">${renderHeader('Bilan','',false)}<div class="page"><div class="empty"><div class="empty-icon">📊</div><div class="empty-text">Aucun bilan disponible</div></div></div>${renderNavBar('bilan')}</div>`;
  if (_bilanData.complet) return renderBilanComplet();
  return renderBilanDetail(_bilanData, false, false);
}

function renderBilanComplet() {
  return `<div id="app">
    ${renderHeader('Bilan', '', false)}
    <div class="page">
      <div class="card" style="text-align:center;padding:32px;">
        <div style="font-size:40px;margin-bottom:12px;">✅</div>
        <div style="font-size:16px;font-weight:700;">Tous les bilans sont à jour !</div>
      </div>
      <button class="btn-secondary" onclick="loadHistoriqueBilans()">📅 Historique des bilans</button>
    </div>
    ${renderNavBar('bilan')}
  </div>`;
}

function renderHistoriqueList() {
  const hist = S.data.historiqueBilans || [];
  const rows = hist.length === 0
    ? `<div class="empty"><div class="empty-text">Aucun bilan clôturé pour l'instant.</div></div>`
    : hist.map(b => `
      <div class="list-item" onclick="loadBilanHistorique(${b.ligneTitre})">
        <div class="list-icon">📋</div>
        <div class="list-text">
          <div class="list-title">${b.semaine || 'Bilan'}</div>
          <div class="list-sub">Validé le ${formatDateBilanFR(b.date)}</div>
        </div>
        <div class="list-arrow">›</div>
      </div>`).join('');

  return `<div id="app">
    ${renderHeader('Historique', '', false)}
    <div class="page">
      <div class="card">${rows}</div>
      <button class="btn-secondary" onclick="loadBilan()">← Bilan en cours</button>
    </div>
    ${renderNavBar('bilan')}
  </div>`;
}

function renderBilanDetail(data, modeHistorique, isSemainePrecedente) {
  _bilanData  = data;
  _bilanNotes = {};
  (data.repas || []).forEach((r, idx) => {
    if (r.adhesion > 0) _bilanNotes['r'+idx+'_adh'] = r.adhesion;
    if (r.digestion > 0) _bilanNotes['r'+idx+'_dig'] = r.digestion;
    if (r.appetit > 0)  _bilanNotes['r'+idx+'_app'] = r.appetit;
  });

  const subtitle = isSemainePrecedente
    ? 'Semaine précédente'
    : (data.semaineLabel || 'Semaine en cours');

  let html = '';

  // Bandeau statut
  if (data.dejaValide && data.dateValidation) {
    const label = modeHistorique ? 'Validé le' : 'Bilan clôturé le';
    const suffixe = modeHistorique ? 'modifiable, mais ne peut pas être revalidé' : 'modifiable, mais ne peut pas être reclôturé';
    html += `<div class="bilan-banner">${label} <strong>${formatDateBilanFR(data.dateValidation)}</strong> — ${suffixe}</div>`;
  }
  // Bouton retour semaine en cours depuis précédent
  if (isSemainePrecedente) {
    html += `<button class="btn-secondary" onclick="loadBilan()">← Semaine en cours</button>`;
  } else if (!modeHistorique) {
    html += `<button class="btn-secondary" onclick="loadHistoriqueBilans()">📅 Historique des bilans</button>`;
  }

  // ── Alimentation (toujours modifiable, même clôturé/historique — seule la re-validation est bloquée)
  html += `<div class="section-title" style="color:#378ADD;">🍽️ Alimentation</div>`;
  (data.repas || []).forEach((r, idx) => {
    html += `<div class="card">
      <div style="font-size:14px;font-weight:600;margin-bottom:12px;">Repas N°${r.num}</div>
      <div class="field-label">ADHÉSION</div>
      ${renderNotes(r.ligne, 6, 'r'+idx+'_adh', r.adhesion)}
      <div class="field-label" style="margin-top:8px;">DIGESTION</div>
      ${renderNotes(r.ligne, 7, 'r'+idx+'_dig', r.digestion)}
      <div class="field-label" style="margin-top:8px;">APPÉTIT</div>
      ${renderNotes(r.ligne, 8, 'r'+idx+'_app', r.appetit)}
    </div>`;
  });
  html += `<div class="card">
    <div class="field-label">COMMENTAIRE ALIMENTATION</div>
    <textarea class="bilan-textarea" placeholder="Commentaire global..."
      onchange="sauverBilan(${data.ligneTitre + 2}, 9, this.value)"
    >${esc(data.commentaireAlim)}</textarea>
  </div>`;

  // ── Semaine
  html += `<div class="section-title" style="color:#1D9E75;">📅 Semaine</div>`;
  (data.jours || []).forEach(j => {
    html += `<div class="card">
      <div style="font-size:14px;font-weight:600;margin-bottom:12px;">${j.nom}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
        <div>
          <div class="field-label">POIDS (kg)</div>
          <input class="bilan-input" type="text" inputmode="decimal" value="${fmtFR(j.poids)}" placeholder="—"
            onchange="sauverBilan(${j.ligne}, 12, parsePoids(this.value))">
        </div>
        <div>
          <div class="field-label">EAU (L)</div>
          <input class="bilan-input" type="text" inputmode="decimal" value="${fmtFR(j.eau)}" placeholder="—"
            onchange="sauverBilan(${j.ligne}, 13, parseEau(this.value))">
        </div>
        <div>
          <div class="field-label">STEPS</div>
          <input class="bilan-input" type="text" inputmode="numeric" value="${fmtFR(j.steps)}" placeholder="0"
            onchange="sauverStepsBilan(${j.ligne}, this.value)">
        </div>
      </div>
      <div style="display:flex;gap:6px;">
        ${renderToggle(j.ligne, 14, 'tog_diet_'+j.ligne, j.diete, 'Diète')}
        ${renderToggle(j.ligne, 18, 'tog_train_'+j.ligne, j.training, 'Training')}
        ${renderToggle(j.ligne, 19, 'tog_cardio_'+j.ligne, j.cardio, 'Cardio')}
      </div>
    </div>`;
  });

  const ligneComJour = (data.jours && data.jours.length > 0) ? data.jours[0].ligne : data.ligneTitre + 2;
  html += `<div class="card">
    <div class="field-label">COMMENTAIRE SEMAINE</div>
    <textarea class="bilan-textarea" placeholder="Commentaire global..."
      onchange="sauverBilan(${ligneComJour}, 15, this.value)"
    >${esc(data.commentaireJour)}</textarea>
    <div class="field-label" style="margin-top:10px;">COMMENTAIRE ACTIVITÉ</div>
    <textarea class="bilan-textarea" placeholder="Commentaire activité..."
      onchange="sauverBilan(${ligneComJour}, 20, this.value)"
    >${esc(data.commentaireActivite)}</textarea>
  </div>`;

  // ── Boutons bas
  if (modeHistorique) {
    html += `<button class="btn-secondary" onclick="loadHistoriqueBilans()">📅 Historique des bilans</button>`;
  } else if (data.dejaValide) {
    const deja = !!data.dejaEnvoye;
    html += `<button id="btn-envoyer" onclick="doEnvoyerBilanAuCoach(${data.ligneTitre}, this)"
      ${deja ? 'disabled' : ''}
      class="${deja ? 'btn-disabled' : 'btn-blue'}" style="width:100%;margin-top:4px;">
      ${deja ? '✅ Envoyé au coach' : '📤 Envoyer au coach'}
    </button>`;
    html += `<button class="btn-secondary" onclick="loadHistoriqueBilans()" style="margin-top:8px;">📅 Historique des bilans</button>`;
    if (isSemainePrecedente) {
      html += `<button class="btn-secondary" onclick="loadBilan()" style="margin-top:8px;">← Semaine en cours</button>`;
    }
  } else {
    const deja = !!data.dejaEnvoye;
    html += `<div style="display:flex;gap:10px;margin-top:4px;">
      <button id="btn-envoyer" onclick="doEnvoyerBilanAuCoach(${data.ligneTitre}, this)"
        ${deja ? 'disabled' : ''}
        class="${deja ? 'btn-disabled' : 'btn-blue'}" style="flex:1;margin:0;">
        ${deja ? '✅ Envoyé au coach' : '📤 Envoyer au coach'}
      </button>
      <button onclick="ouvrirRecapBilan(${data.ligneTitre})" class="btn-green" style="flex:1;margin:0;">🔒 Clôturer</button>
    </div>`;
    html += `<button class="btn-secondary" onclick="loadHistoriqueBilans()" style="margin-top:8px;">📅 Historique des bilans</button>`;
  }

  return `<div id="app">
    ${renderHeader('Bilan', subtitle, false)}
    <div class="page">${html}</div>
    ${renderNavBar('bilan')}
  </div>`;
}

// ── Composants ────────────────────────────────────────────────────────

function renderNotes(ligne, col, groupeId, valActuelle) {
  let h = `<div style="display:flex;gap:4px;margin:3px 0;">`;
  for (let i = 1; i <= 5; i++) {
    const active = valActuelle === i;
    h += `<button id="${groupeId}_${i}" onclick="noterRepas(${ligne},${col},${i},'${groupeId}')"
      style="flex:1;padding:8px 0;background:${active?'#378ADD':'#2d3142'};border:none;border-radius:6px;color:#e8eaf0;font-size:14px;font-weight:600;cursor:pointer;">${i}</button>`;
  }
  return h + '</div>';
}

function renderToggle(ligne, col, elemId, val, label) {
  const on = val === true;
  return `<button id="${elemId}" data-val="${on}" onclick="toggleBilan(${ligne},${col},'${elemId}')"
    style="flex:1;padding:10px 6px;background:${on?'#1D9E75':'#2d3142'};border:none;border-radius:8px;color:#e8eaf0;font-size:12px;font-weight:600;cursor:pointer;">
    ${on?'✓ ':''}${label}</button>`;
}

// ── Interactions ──────────────────────────────────────────────────────

function noterRepas(ligne, col, valeur, groupeId) {
  sauverBilan(ligne, col, valeur);
  _bilanNotes[groupeId] = valeur;
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById(groupeId + '_' + i);
    if (btn) btn.style.background = (i === valeur) ? '#378ADD' : '#2d3142';
  }
}

function toggleBilan(ligne, col, elemId) {
  const el = document.getElementById(elemId);
  const newVal = el.dataset.val !== 'true';
  el.dataset.val = String(newVal);
  el.style.background = newVal ? '#1D9E75' : '#2d3142';
  const label = el.textContent.replace('✓', '').trim();
  el.textContent = (newVal ? '✓ ' : '') + label;
  sauverBilan(ligne, col, newVal);
}

function sauverBilan(ligne, col, valeur) {
  api('enregistrerValeur', { nomFeuille: 'Bilan', ligne, colonne: col, valeur }).catch(() => {});
}

function sauverStepsBilan(ligne, val) {
  const v = parseSteps(val);
  api('enregistrerValeur', { nomFeuille: 'Bilan', ligne, colonne: 17, valeur: v }).catch(() => {});
}

async function doEnvoyerBilanAuCoach(ligneTitre, btn) {
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Envoi...'; }
  try {
    const retard = await api('verifierRetardBilan').catch(() => null);
    if (retard && retard.enRetard) {
      if (btn) { btn.disabled = false; btn.textContent = '📤 Envoyer au coach'; }
      afficherAlerteRetardBilan(() => envoyerBilanAuCoachConfirme(ligneTitre, btn));
      return;
    }
    await envoyerBilanAuCoachConfirme(ligneTitre, btn);
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '📤 Envoyer au coach'; }
    showToast('Erreur : ' + e.message, '#c0392b');
  }
}

async function envoyerBilanAuCoachConfirme(ligneTitre, btn) {
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Envoi...'; }
  try {
    const res = await api('envoyerBilanAuCoach', { ligneTitre });
    if (btn) { btn.className = 'btn-disabled'; btn.textContent = '✅ Envoyé au coach'; }
    if (_bilanData) _bilanData.dejaEnvoye = true;
    const bonus = res && res.bonusPonctualite > 0;
    showToast(bonus ? '📤 Bilan envoyé au coach ! +20 XP ⏱️' : '📤 Bilan envoyé au coach !', bonus ? null : '#1a5ba0');
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '📤 Envoyer au coach'; }
    showToast('Erreur : ' + e.message, '#c0392b');
  }
}

function afficherAlerteRetardBilan(onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9998;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML = `<div style="background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;padding:28px 24px;border-radius:18px;font-size:15px;font-weight:600;text-align:center;max-width:340px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.5);">
    <div style="font-size:36px;margin-bottom:12px;">😅</div>
    <div style="font-size:16px;font-weight:700;margin-bottom:10px;">T'es à la bourre !</div>
    <div style="font-size:14px;font-weight:400;line-height:1.5;margin-bottom:20px;">Ton coach va peut-être traiter ton bilan... ou peut-être pas 😜</div>
    <button id="_retardOkBtn" style="background:#fff;color:#b45309;font-weight:700;font-size:15px;padding:12px 32px;border-radius:10px;margin:0;border:none;cursor:pointer;">OK</button>
  </div>`;
  document.body.appendChild(overlay);
  document.getElementById('_retardOkBtn').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

function ouvrirRecapBilan(ligneTitre) {
  // Affiche un résumé avant clôture
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:flex-end;';
  modal.innerHTML = `
    <div style="background:#131629;border-radius:20px 20px 0 0;padding:24px;width:100%;padding-bottom:calc(24px + env(safe-area-inset-bottom));">
      <div style="font-size:16px;font-weight:700;margin-bottom:8px;">🔒 Clôturer la semaine</div>
      <div style="font-size:13px;color:#8892a4;margin-bottom:20px;">Une fois clôturé, ton bilan ne peut plus être re-clôturé. Tu pourras quand même modifier les données.</div>
      <button onclick="confirmerCloture(${ligneTitre})" class="btn-green" style="width:100%;margin-bottom:10px;">✅ Confirmer la clôture</button>
      <button onclick="this.closest('[style*=fixed]').remove()" class="btn-secondary" style="width:100%;">Annuler</button>
    </div>`;
  document.body.appendChild(modal);
}

async function confirmerCloture(ligneTitre) {
  document.querySelector('[style*="position:fixed;inset"]')?.remove();
  setPage('bilan-loading');
  try {
    const result = await api('validerBilan', { ligneTitre, targetSunday: _bilanData?.targetSunday || null });
    await loadBilan();
    if (result && result.xp) {
      afficherXPValidation(result);
    } else {
      showToast('✅ Bilan clôturé !', '#1D9E75');
    }
  } catch(e) {
    showToast('Erreur : ' + e.message, '#c0392b');
    setPage('bilan');
  }
}

function afficherXPValidation(result) {
  const xp = result.xp || 50;
  const rows = [['Clôture 🔒', result.xpBase || 50]];
  if (result.bonusDiete > 0)   rows.push(['Diète 7/7 ✅', result.bonusDiete]);
  if (result.bonusSeances > 0) rows.push(['Objectif séances ✅', result.bonusSeances]);
  if (result.bonusSteps > 0)   rows.push(['Bonus steps 👟', result.bonusSteps]);
  if (result.bonusStreak > 0)  rows.push(['Streak bilans 🔥', result.bonusStreak]);
  const bonusHtml = rows.map(r =>
    `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #2d3142;">
      <span style="font-size:13px;color:#8892a4;">${r[0]}</span>
      <span style="font-size:13px;font-weight:600;color:#e8eaf0;">+${r[1]} XP</span>
    </div>`
  ).join('');
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity 0.3s;';
  overlay.innerHTML = `<div style="background:#1a1d29;border-radius:20px;padding:36px 28px;text-align:center;max-width:300px;width:85%;box-shadow:0 20px 60px rgba(0,0,0,0.5);transform:scale(0.85);transition:transform 0.3s;">
    <div style="font-size:52px;margin-bottom:10px;">🏆</div>
    <div style="font-size:22px;font-weight:700;color:#e8eaf0;margin-bottom:4px;">Bilan clôturé !</div>
    <div style="font-size:13px;color:#8892a4;margin-bottom:18px;">Bravo pour cette semaine !</div>
    <div style="background:#0f1117;border-radius:12px;padding:4px 16px 8px;margin-bottom:16px;text-align:left;">
      ${bonusHtml}
      <div style="display:flex;justify-content:space-between;padding:10px 0 2px;">
        <span style="font-size:15px;font-weight:700;color:#e8eaf0;">Total gagné</span>
        <span style="font-size:20px;font-weight:800;color:#f0a500;">+${xp} XP ⭐</span>
      </div>
    </div>
    <button id="_xpOverlayBtn" style="background:linear-gradient(135deg,#1D9E75,#167a5a);width:100%;margin:0;padding:14px;border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">Retour à l'accueil</button>
  </div>`;
  document.body.appendChild(overlay);
  document.getElementById('_xpOverlayBtn').addEventListener('click', () => {
    overlay.remove();
    loadHome();
  });
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.querySelector('div').style.transform = 'scale(1)';
  });
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatDateBilanFR(dateStr) {
  if (!dateStr) return '';
  const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const mois  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const m = (dateStr + '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) {
    const d = new Date(+m[3], +m[2]-1, +m[1]);
    return jours[d.getDay()] + ' ' + +m[1] + ' ' + mois[+m[2]-1] + ' ' + +m[3];
  }
  const d = new Date(dateStr);
  if (!isNaN(d)) return jours[d.getDay()] + ' ' + d.getDate() + ' ' + mois[d.getMonth()] + ' ' + d.getFullYear();
  return dateStr;
}

function fmtFR(val) { return (val == null || val === '') ? '' : (val + '').replace('.', ','); }
function parseSteps(val) {
  if (!val) return '';
  const s = (val+'').trim().replace(/\s/g,'');
  if (/[.,]/.test(s)) return '';
  const n = parseInt(s, 10);
  return isNaN(n) || n <= 0 ? '' : n;
}
function parseEau(val) {
  if (!val) return '';
  const n = parseFloat((val+'').trim().replace(/[~≈≃\s]/g,'').replace(',','.'));
  return isNaN(n) ? '' : n;
}
function parsePoids(val) {
  if (!val) return '';
  const n = parseFloat((val+'').trim().replace(',','.'));
  return isNaN(n) ? '' : n;
}
function esc(s) { return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function showToast(msg, bg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:${bg||'linear-gradient(135deg,#1a5ba0,#1D9E75)'};color:#fff;padding:13px 22px;border-radius:14px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 18px rgba(0,0,0,.4);text-align:center;max-width:82vw;opacity:1;transition:opacity .5s;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 2500);
}
