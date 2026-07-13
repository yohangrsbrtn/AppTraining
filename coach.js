// ── Coach pages ────────────────────────────────────────────────────────

const COACH_PALETTE = ['#378ADD','#1D9E75','#E8A838','#C45BAA','#E05C3A','#7B61FF','#0ABFBC','#F0A500'];

function coachColor(clientId) {
  let h = 0;
  for (let i = 0; i < (clientId || '').length; i++) h = (h * 31 + clientId.charCodeAt(i)) & 0xff;
  return COACH_PALETTE[h % COACH_PALETTE.length];
}

function formatTsCoach(ts) {
  const jours = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
  const mois  = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const m = (ts+'').match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
  if (!m) return ts;
  const d = new Date(+m[3], +m[2]-1, +m[1]);
  return jours[d.getDay()] + ' ' + +m[1] + ' ' + mois[+m[2]-1] + ' à ' + m[4] + 'h' + m[5];
}

// ── Coach home ────────────────────────────────────────────────────────

let _coachBilansCount = 0; // bilans à traiter (badge)

async function loadCoachHome() {
  setPage('loading');
  try {
    const bilans = await api('listerBilansCoach');
    S.data.coachBilans = bilans;
    _coachBilansCount = (bilans || []).filter(b => !b.coachTraite).length;
    setPage('coach-home');
  } catch(e) { setPage('coach-home'); }
}

function renderCoachHome() {
  const nATraiter = _coachBilansCount;

  return `<div id="app">
    ${renderHeader('Espace Coach', '', false)}
    <div class="page">

      <div class="card" style="text-align:center;padding:24px;margin-bottom:16px;background:linear-gradient(135deg,#0f1825,#131e30);border-color:#2a3a5a;">
        <div style="font-size:36px;margin-bottom:8px;">🏋️</div>
        <div style="font-size:20px;font-weight:700;color:#f0f2ff;">Yohan</div>
        <div style="font-size:13px;color:var(--muted);margin-top:4px;">Mode coach activé</div>
      </div>

      <div onclick="loadCentreBilans()" style="
        background:#161b2e;border-radius:14px;border:1.5px solid #1D9E7544;
        padding:18px 16px;margin-bottom:12px;cursor:pointer;display:flex;align-items:center;gap:14px;
        position:relative;overflow:hidden;">
        <div style="font-size:34px;flex-shrink:0;">📋</div>
        <div style="flex:1;">
          <div style="font-size:16px;font-weight:700;color:#f0f2ff;">Centre bilans</div>
          <div style="font-size:13px;color:var(--muted);margin-top:3px;">Bilans envoyés par les clients</div>
        </div>
        ${nATraiter > 0 ? `<div style="background:#e05c5c;color:#fff;border-radius:99px;font-size:13px;font-weight:700;padding:4px 10px;flex-shrink:0;">${nATraiter}</div>` : `<div style="color:var(--muted);font-size:18px;">›</div>`}
      </div>

      <div onclick="loadNotificationsCoach()" style="
        background:#161b2e;border-radius:14px;border:1.5px solid #378ADD44;
        padding:18px 16px;margin-bottom:12px;cursor:pointer;display:flex;align-items:center;gap:14px;">
        <div style="font-size:34px;flex-shrink:0;">🔔</div>
        <div style="flex:1;">
          <div style="font-size:16px;font-weight:700;color:#f0f2ff;">Notifications</div>
          <div style="font-size:13px;color:var(--muted);margin-top:3px;">Activité des clients (7 derniers jours)</div>
        </div>
        <div style="color:var(--muted);font-size:18px;">›</div>
      </div>

      <button class="btn-secondary" onclick="deconnexion()" style="color:var(--red);margin-top:8px;">🚪 Se déconnecter</button>
    </div>
  </div>`;
}

// ── Centre bilans ─────────────────────────────────────────────────────

let _centreBilansData = null;
let _coachBilanClientVu = null; // client dont on voit le bilan

async function loadCentreBilans() {
  setPage('loading');
  try {
    _centreBilansData = await api('listerBilansCoach');
    _coachBilansCount = (_centreBilansData || []).filter(b => !b.coachTraite).length;
    setPage('centre-bilans');
  } catch(e) { setPage('coach-home'); }
}

async function marquerTraiteCoach(clientId, ts) {
  try {
    await apiAs('marquerBilanTraiteServeur', clientId, { ts });
    await loadCentreBilans();
    showToast('✓ Bilan marqué traité', '#1D9E75');
  } catch(e) { showToast('Erreur : ' + e.message, '#c0392b'); }
}

function renderCentreBilans() {
  const data = _centreBilansData || [];
  const aTraiter = data.filter(b => !b.coachTraite);
  const traites  = data.filter(b =>  b.coachTraite);

  let html = '';

  // Stats
  html += `<div style="display:flex;gap:10px;margin-bottom:16px;">
    <div style="flex:1;background:#0d1a13;border:1px solid #1D9E7544;border-radius:10px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#1D9E75;">${aTraiter.length}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">À traiter</div>
    </div>
    <div style="flex:1;background:#161b2e;border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:var(--muted);">${traites.length}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">Traités</div>
    </div>
    <div style="flex:1;background:#161b2e;border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#f0f2ff;">${data.length}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">Total</div>
    </div>
  </div>`;

  // À traiter
  if (aTraiter.length > 0) {
    html += `<div class="section-title" style="color:#1D9E75;">📤 À traiter · ${aTraiter.length}</div>`;
    aTraiter.forEach(b => {
      const couleur = coachColor(b.client);
      html += `<div class="card" style="border-left:3px solid ${couleur};padding-left:14px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="font-size:15px;font-weight:700;color:${couleur};">${esc(b.nom)}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">${esc(b.semaine)}</div>
            <div style="font-size:11px;color:#555e7a;margin-top:3px;">Reçu ${formatTsCoach(b.ts)}</div>
          </div>
          <span style="font-size:10px;color:#8892a4;border:1px solid #2a305066;border-radius:4px;padding:2px 6px;">📋 Non traité</span>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <button onclick="voirBilanClient('${b.client}','${esc(b.nom)}')"
            style="flex:1;background:#1e2444;border:1px solid var(--border);color:#c8d0e0;font-size:13px;padding:9px;margin:0;border-radius:8px;cursor:pointer;">
            👁 Voir bilan
          </button>
          <button onclick="voirMensurationsClient('${b.client}','${esc(b.nom)}')"
            style="flex:1;background:#1e2444;border:1px solid var(--border);color:#c8d0e0;font-size:13px;padding:9px;margin:0;border-radius:8px;cursor:pointer;">
            📏 Mensurations
          </button>
        </div>
        <button onclick="marquerTraiteCoach('${b.client}','${b.ts.replace(/'/g,"\\'")}')"
          style="width:100%;background:linear-gradient(135deg,#1D9E75,#167a5a);color:#fff;font-size:13px;padding:9px;margin:0;border-radius:8px;font-weight:600;border:none;cursor:pointer;">
          ✓ Marquer traité
        </button>
      </div>`;
    });
  } else {
    html += `<div style="background:#0d1a13;border:1px solid #1D9E7533;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
      <div style="font-size:28px;margin-bottom:8px;">✅</div>
      <div style="font-size:14px;font-weight:600;color:#1D9E75;">Tout est traité !</div>
    </div>`;
  }

  // Traités
  if (traites.length > 0) {
    html += `<div class="section-title" style="color:var(--muted);">✓ Traités · ${traites.length}</div>`;
    traites.forEach(b => {
      const couleur = coachColor(b.client);
      html += `<div class="card" style="border-left:3px solid ${couleur}55;padding-left:14px;margin-bottom:8px;opacity:0.55;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:14px;font-weight:600;color:#8892a4;">${esc(b.nom)}</div>
            <div style="font-size:11px;color:#555e7a;margin-top:2px;">${esc(b.semaine)} · ${formatTsCoach(b.ts)}</div>
          </div>
          <span style="font-size:10px;color:#1D9E75;border:1px solid #1D9E7533;border-radius:4px;padding:2px 7px;white-space:nowrap;">✓ Traité</span>
        </div>
      </div>`;
    });
  }

  return `<div id="app">
    ${renderHeader('Centre bilans', '', false)}
    <div class="page">
      ${html}
      <button class="btn-secondary" onclick="loadCentreBilans()" style="margin-bottom:8px;">↻ Rafraîchir</button>
      <button class="btn-secondary" onclick="setPage('coach-home')">← Retour</button>
    </div>
  </div>`;
}

// ── Notifications ─────────────────────────────────────────────────────

let _notifData = null;
let _notifFiltre = null;

async function loadNotificationsCoach() {
  setPage('loading');
  try {
    _notifData   = await api('chargerTousLesLogs');
    _notifFiltre = null;
    setPage('notifications-coach');
  } catch(e) { setPage('coach-home'); }
}

function renderNotificationsCoach() {
  const result = _notifData || { logs: [] };
  const allLogs = (result.logs || []).filter(l => l.type !== 'bilanEnvoye');
  const filtre = _notifFiltre;
  const liste = filtre ? allLogs.filter(l => l.client === filtre) : allLogs;

  // Clients uniques dans les logs pour les filtres
  const clientsVus = {};
  allLogs.forEach(l => { if (l.client) clientsVus[l.client] = l.nom || l.client; });

  let filtresHtml = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
    <button onclick="_notifFiltre=null;setPage('notifications-coach')"
      style="background:${!filtre?'#378ADD':'#2d3142'};color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;">Tous</button>`;
  Object.entries(clientsVus).forEach(([cId, nom]) => {
    const col = coachColor(cId);
    filtresHtml += `<button onclick="_notifFiltre='${cId}';setPage('notifications-coach')"
      style="background:${filtre===cId?col:'#2d3142'};color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;">${nom.split(' ')[0]}</button>`;
  });
  filtresHtml += `</div>`;

  let logsHtml = '';
  if (!liste || liste.length === 0) {
    logsHtml = '<div class="empty"><div class="empty-icon">🔔</div><div class="empty-text">Aucune activité sur les 7 derniers jours.</div></div>';
  } else {
    liste.forEach(l => {
      const couleur = coachColor(l.client);
      const isBilan = l.type === 'bilan';
      const progParts = (l.programme || '').split('|');
      const progNom = progParts[0];
      const nomSeance = progParts[1] || '';
      let ligne2, ligne3;
      if (isBilan) {
        ligne2 = '📋 Bilan clôturé';
        ligne3 = l.semaine ? 'Semaine ' + l.semaine : '';
      } else if (l.type === 'journee') {
        ligne2 = '✅ Journée validée';
        ligne3 = l.semaine || '';
      } else {
        ligne2 = '✅ ' + (l.semaine ? 'S' + l.semaine : '') + (nomSeance ? ' · ' + nomSeance : ' · Séance validée');
        ligne3 = progNom;
      }
      const clickStyle = isBilan ? `cursor:pointer;` : '';
      const clickAttr  = isBilan ? `onclick="voirBilanClient('${l.client}','${esc(l.nom)}')"` : '';
      logsHtml += `<div class="card" ${clickAttr} style="border-left:3px solid ${couleur};padding-left:14px;margin-bottom:10px;${clickStyle}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div style="font-size:14px;font-weight:700;color:${couleur};">${esc(l.nom)}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${isBilan ? `<span style="font-size:10px;color:${couleur};border:1px solid ${couleur}44;border-radius:4px;padding:1px 5px;">Voir ›</span>` : ''}
            <div style="font-size:11px;color:#8892a4;">${formatTsCoach(l.ts)}</div>
          </div>
        </div>
        <div style="font-size:13px;color:#e8eaf0;margin-top:4px;">${ligne2}</div>
        ${ligne3 ? `<div style="font-size:12px;color:#8892a4;margin-top:2px;">${ligne3}</div>` : ''}
      </div>`;
    });
  }

  return `<div id="app">
    ${renderHeader('Notifications', '7 derniers jours', false)}
    <div class="page">
      ${filtresHtml}
      ${logsHtml}
      <button class="btn-secondary" onclick="loadNotificationsCoach()" style="margin-bottom:8px;">↻ Rafraîchir</button>
      <button class="btn-secondary" onclick="setPage('coach-home')">← Retour</button>
    </div>
  </div>`;
}

// ── Voir bilan client (coach) ─────────────────────────────────────────

let _coachBilanData  = null;
let _coachBilanNom   = '';
let _coachBilanRetour = null;

async function voirBilanClient(clientId, nom) {
  _coachBilanNom    = nom || clientId;
  _coachBilanRetour = S.page; // mémorise d'où on vient
  setPage('loading');
  try {
    const hist = await apiAs('chargerHistoriqueBilans', clientId);
    if (!hist || hist.length === 0) {
      showToast('Aucun bilan clôturé pour ce client.', '#c0392b');
      setPage(_coachBilanRetour);
      return;
    }
    _coachBilanData = await apiAs('chargerBilanParLigne', clientId, { ligneTitre: hist[0].ligneTitre });
    _coachBilanData._clientId = clientId;
    setPage('coach-bilan');
  } catch(e) {
    showToast('Erreur : ' + e.message, '#c0392b');
    setPage(_coachBilanRetour);
  }
}

async function voirMensurationsClient(clientId, nom) {
  _coachBilanNom    = nom || clientId;
  _coachBilanRetour = S.page;
  setPage('loading');
  try {
    const releves = await apiAs('chargerMensurations', clientId);
    S.data._coachMens = { releves, clientId, nom: _coachBilanNom };
    setPage('coach-mensurations');
  } catch(e) {
    showToast('Erreur : ' + e.message, '#c0392b');
    setPage(_coachBilanRetour);
  }
}

function renderCoachBilan() {
  const data = _coachBilanData;
  if (!data) return `<div id="app">${renderHeader('Bilan client','',false)}<div class="page"><div class="empty"><div class="empty-text">Aucune donnée</div></div></div></div>`;

  let html = '';
  if (data.dateValidation) {
    html += `<div class="bilan-banner">Clôturé le <strong>${formatDateBilanFR(data.dateValidation)}</strong></div>`;
  }
  html += `<div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:12px;">${esc(data.semaineLabel||'')}</div>`;

  // Alimentation
  html += `<div class="section-title" style="color:#378ADD;">🍽️ Alimentation</div>`;
  (data.repas || []).forEach((r, idx) => {
    html += `<div class="card">
      <div style="font-size:14px;font-weight:600;margin-bottom:10px;">Repas N°${r.num}</div>
      <div class="field-label">ADHÉSION</div>${renderNotes(r.ligne,6,'cba'+idx+'_adh',r.adhesion,true)}
      <div class="field-label" style="margin-top:8px;">DIGESTION</div>${renderNotes(r.ligne,7,'cba'+idx+'_dig',r.digestion,true)}
      <div class="field-label" style="margin-top:8px;">APPÉTIT</div>${renderNotes(r.ligne,8,'cba'+idx+'_app',r.appetit,true)}
    </div>`;
  });
  html += `<div class="card"><div class="field-label">COMMENTAIRE ALIMENTATION</div>
    <textarea class="bilan-textarea" readonly>${esc(data.commentaireAlim)}</textarea></div>`;

  // Semaine
  html += `<div class="section-title" style="color:#1D9E75;">📅 Semaine</div>`;
  (data.jours || []).forEach(j => {
    html += `<div class="card">
      <div style="font-size:14px;font-weight:600;margin-bottom:10px;">${j.nom}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;">
        <div><div class="field-label">POIDS</div><input class="bilan-input" readonly value="${fmtFR(j.poids)}" placeholder="—"></div>
        <div><div class="field-label">EAU</div><input class="bilan-input" readonly value="${fmtFR(j.eau)}" placeholder="—"></div>
        <div><div class="field-label">STEPS</div><input class="bilan-input" readonly value="${fmtFR(j.steps)}" placeholder="0"></div>
      </div>
      <div style="display:flex;gap:6px;">
        ${renderToggle(j.ligne,14,'_cb_d'+j.ligne,j.diete,'Diète',true)}
        ${renderToggle(j.ligne,18,'_cb_t'+j.ligne,j.training,'Training',true)}
        ${renderToggle(j.ligne,19,'_cb_c'+j.ligne,j.cardio,'Cardio',true)}
      </div>
    </div>`;
  });
  const ligneComJour = (data.jours && data.jours.length > 0) ? data.jours[0].ligne : data.ligneTitre + 2;
  html += `<div class="card">
    <div class="field-label">COMMENTAIRE SEMAINE</div>
    <textarea class="bilan-textarea" readonly>${esc(data.commentaireJour)}</textarea>
    <div class="field-label" style="margin-top:10px;">COMMENTAIRE ACTIVITÉ</div>
    <textarea class="bilan-textarea" readonly>${esc(data.commentaireActivite)}</textarea>
  </div>`;

  return `<div id="app">
    ${renderHeader('Bilan · ' + esc(_coachBilanNom), '', false)}
    <div class="page">
      ${html}
      <button class="btn-secondary" onclick="setPage(_coachBilanRetour||'centre-bilans')">← Retour</button>
    </div>
  </div>`;
}

function renderCoachMensurations() {
  const d = S.data._coachMens || {};
  const releves = d.releves || [];

  const poidsPts = releves.map(r=>r.poids).filter(v=>v!==null&&v!==''&&!isNaN(v)).map(Number);
  const poidsActuel = poidsPts.length ? poidsPts[poidsPts.length-1] : null;
  const poidsDebut  = poidsPts.length ? poidsPts[0] : null;
  const varPoids    = poidsActuel !== null ? (poidsActuel - poidsDebut).toFixed(1) : null;

  let html = '';
  if (poidsActuel !== null) {
    html += `<div class="card" style="text-align:center;margin-bottom:12px;">
      <div class="field-label">POIDS ACTUEL</div>
      <div style="font-size:32px;font-weight:700;margin:6px 0;">${poidsActuel} kg</div>
      <div style="font-size:13px;color:${varPoids>=0?'var(--green)':'#D85A30'};">${varPoids>=0?'+':''}${varPoids} kg depuis le début</div>
    </div>`;
    if (poidsPts.length >= 2) {
      html += `<div class="card"><div style="font-size:13px;font-weight:600;margin-bottom:8px;color:#378ADD;">Évolution du poids</div>${miniGraphe(releves.map(r=>r.poids),'#378ADD',' kg')}</div>`;
    }
  }

  const histRows = releves.length ? releves.slice().reverse().map(r => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="font-size:13px;color:var(--muted);">${r.date}${r.phase?' · '+r.phase:''}</div>
      <div style="font-size:13px;">${r.poids?r.poids+' kg':'—'}${r.taille?' · '+r.taille+' cm':''}</div>
    </div>`).join('')
    : '<div style="font-size:13px;color:var(--muted);text-align:center;padding:12px;">Aucune mesure.</div>';

  html += `<div class="card"><div style="font-size:13px;font-weight:600;margin-bottom:10px;">Historique</div>${histRows}</div>`;

  return `<div id="app">
    ${renderHeader('Mensurations · ' + esc(d.nom || ''), '', false)}
    <div class="page">
      ${html}
      <button class="btn-secondary" onclick="setPage(_coachBilanRetour||'centre-bilans')">← Retour</button>
    </div>
  </div>`;
}
