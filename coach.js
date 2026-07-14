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

// ── Mes clients ───────────────────────────────────────────────────────

let _mesClients = null;
let _clientSelectionne = null; // { id, nom, niveau, ... }
let _clientProgData = null;

async function loadMesClients() {
  setPage('loading');
  try {
    const raw = await api('listerClientsAvecNiveaux');
    _mesClients = typeof raw === 'string' ? JSON.parse(raw) : raw;
    setPage('mes-clients');
  } catch(e) { setPage('home'); }
}

function ouvrirClientDetail(clientId) {
  _clientSelectionne = (_mesClients || []).find(c => c.id === clientId) || { id: clientId, nom: clientId };
  setPage('client-detail');
}

async function voirProgressionClient(clientId) {
  setPage('loading');
  try {
    _clientProgData = await apiAs('chargerProgressionClient', clientId);
    _clientProgData._clientId = clientId;
    _coachBilanRetour = 'client-detail';
    setPage('client-progression');
  } catch(e) {
    showToast('Erreur : ' + e.message, '#c0392b');
    setPage('client-detail');
  }
}

function renderMesClients() {
  const clients = _mesClients || [];

  const rows = clients.map(c => {
    const tier = typeof niveauToTier === 'function' ? niveauToTier(c.niveau || 1) : 'debutant';
    const titreDef = (c.titreActif && typeof TITRES_DEF !== 'undefined') ? TITRES_DEF.find(t => t.id === c.titreActif) : null;
    const titreBadge = titreDef ? `<span style="display:inline-flex;align-items:center;gap:3px;background:linear-gradient(90deg,${titreDef.c2}cc,${titreDef.c1}99);border:1px solid ${titreDef.c1}55;border-radius:5px;padding:1px 6px 1px 4px;font-size:9px;font-weight:700;color:#f0f2ff;margin-left:7px;vertical-align:middle;">${titreDef.icon} ${titreDef.nom}</span>` : '';
    const connex = c.dernConnexion
      ? `<div style="font-size:10px;color:#555e7a;margin-top:3px;white-space:nowrap;">${esc(c.dernConnexion)}</div>`
      : `<div style="font-size:10px;color:#555e7a;margin-top:3px;">Jamais connecté</div>`;

    return `<div onclick="ouvrirClientDetail('${c.id}')"
      class="card" style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;cursor:pointer;-webkit-tap-highlight-color:transparent;"
      ontouchstart="this.style.opacity='.75'" ontouchend="this.style.opacity='1'">
      <div style="flex:1;min-width:0;">
        <div style="font-size:15px;font-weight:700;color:#f0f2ff;white-space:nowrap;">${esc(c.nom)}${titreBadge}</div>
        ${connex}
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <div style="font-size:11px;font-weight:700;color:#8892a4;">Niv.&nbsp;${c.niveau || 1}</div>
        ${typeof getBadgeSVG === 'function' ? getBadgeSVG(tier, 36, 'cl'+c.id) : ''}
      </div>
    </div>`;
  });

  return `<div id="app">
    ${renderHeader('Mes clients', `${clients.length} client${clients.length > 1 ? 's' : ''}`, false)}
    <div class="page">
      ${rows.length ? rows.join('') : '<div class="empty"><div class="empty-icon">👥</div><div class="empty-text">Aucun client trouvé.</div></div>'}
      <button class="btn-secondary" onclick="loadHome()" style="margin-top:8px;">← Mon accueil</button>
    </div>
  </div>`;
}

function renderClientDetail() {
  const c = _clientSelectionne;
  if (!c) return `<div id="app">${renderHeader('Client','',false)}<div class="page"></div></div>`;
  const couleur = coachColor(c.id);
  const tier = typeof niveauToTier === 'function' ? niveauToTier(c.niveau || 1) : 'debutant';
  const tc   = typeof getTierColors === 'function' ? getTierColors(tier) : { c1: couleur, c2: '#404858', bar: couleur };
  const sz   = 52;
  const titreDef = (c.titreActif && typeof TITRES_DEF !== 'undefined') ? TITRES_DEF.find(t => t.id === c.titreActif) : null;
  const titreHtml = titreDef ? `<div style="margin-top:6px;"><span style="font-size:11px;font-weight:700;color:${titreDef.c1};background:${titreDef.c1}22;border:1px solid ${titreDef.c1}55;border-radius:5px;padding:2px 7px;">${titreDef.icon} ${titreDef.nom}</span></div>` : '';

  return `<div id="app">
    ${renderHeader(esc(c.nom), '', false)}
    <div class="page">

      <!-- Hero -->
      <div style="background:linear-gradient(145deg,#131825 0%,${tc.c2}aa 30%,${tc.c2}ee 50%,${tc.c2}aa 70%,#131825 100%);
        border-radius:16px;border-top:3px solid ${tc.c1};
        border-left:1px solid ${tc.c1}44;border-right:1px solid ${tc.c1}44;border-bottom:1px solid ${tc.c1}33;
        padding:16px;margin-bottom:16px;
        box-shadow:inset 0 1px 0 ${tc.c1}55,0 0 20px ${tc.c1}33,0 2px 12px rgba(0,0,0,.45);">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="flex-shrink:0;">${typeof getBadgeSVG === 'function' ? getBadgeSVG(tier, sz, 'cd'+c.id) : ''}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:20px;font-weight:700;color:#f0f2ff;">${esc(c.nom)}</div>
            <div style="font-size:13px;color:${tc.c1};font-weight:600;margin-top:2px;">NIVEAU ${c.niveau || 1}</div>
            ${titreHtml}
            ${c.dernConnexion ? `<div style="font-size:11px;color:var(--muted);margin-top:6px;">${esc(c.dernConnexion)}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="section-title" style="color:var(--muted);">Accès rapide</div>

      <div onclick="voirProgressionClient('${c.id}')"
        style="background:#161b2e;border-radius:12px;border:1px solid var(--border);padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;">
        <div style="font-size:28px;">📈</div>
        <div style="flex:1;"><div style="font-size:15px;font-weight:600;">Progression</div><div style="font-size:12px;color:var(--muted);margin-top:2px;">XP, bilans validés, séances, pas</div></div>
        <div style="color:var(--muted);">›</div>
      </div>

      <div onclick="voirBilanClient('${c.id}','${esc(c.nom)}')"
        style="background:#161b2e;border-radius:12px;border:1px solid var(--border);padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;">
        <div style="font-size:28px;">📋</div>
        <div style="flex:1;"><div style="font-size:15px;font-weight:600;">Dernier bilan</div><div style="font-size:12px;color:var(--muted);margin-top:2px;">Voir le bilan clôturé le plus récent</div></div>
        <div style="color:var(--muted);">›</div>
      </div>

      <div onclick="voirMensurationsClient('${c.id}','${esc(c.nom)}')"
        style="background:#161b2e;border-radius:12px;border:1px solid var(--border);padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;">
        <div style="font-size:28px;">📏</div>
        <div style="flex:1;"><div style="font-size:15px;font-weight:600;">Mensurations</div><div style="font-size:12px;color:var(--muted);margin-top:2px;">Historique poids et mensurations</div></div>
        <div style="color:var(--muted);">›</div>
      </div>

      <button onclick="enterVueClient('${c.id}')"
        style="width:100%;background:linear-gradient(135deg,#E8A838,#c88010);color:#1a0e00;border:none;border-radius:var(--radius);font-size:14px;font-weight:700;padding:14px;cursor:pointer;margin-bottom:10px;margin-top:4px;">
        👁️ Naviguer comme ${esc(c.nom.split(' ')[0])}
      </button>
      <button class="btn-secondary" onclick="setPage('mes-clients')" style="margin-top:0px;">← Mes clients</button>
    </div>
  </div>`;
}

function renderClientProgression() {
  const p = _clientProgData || {};
  const c = _clientSelectionne || {};
  const niveau = p.niveau || 1;
  const tier = typeof niveauToTier === 'function' ? niveauToTier(niveau) : 'debutant';
  const tc   = typeof getTierColors === 'function' ? getTierColors(tier) : { c1:'#a8b0c8', c2:'#404858', bar:'linear-gradient(90deg,#808898,#c0c8d8)' };
  const sz   = 60;
  const xpPct = p.pct || (p.xpNiveau && p.xpNiveauSuivant ? Math.min(100, Math.round((p.xpNiveau / p.xpNiveauSuivant) * 100)) : 0);
  const xpManquant = p.xpManquant != null ? p.xpManquant : ((p.xpNiveauSuivant || 100) - (p.xpNiveau || 0));

  return `<div id="app">
    ${renderHeader('Progression · ' + esc(c.nom || ''), '', false)}
    <div class="page">
      <div style="background:linear-gradient(145deg,#131825 0%,${tc.c2}aa 30%,${tc.c2}ee 50%,${tc.c2}aa 70%,#131825 100%);
        border-radius:16px;border-top:3px solid ${tc.c1};
        border-left:1px solid ${tc.c1}44;border-right:1px solid ${tc.c1}44;border-bottom:1px solid ${tc.c1}33;
        padding:20px 18px;margin-bottom:14px;
        box-shadow:inset 0 1px 0 ${tc.c1}55,0 0 24px ${tc.c1}33,0 2px 14px rgba(0,0,0,.5);">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="flex-shrink:0;">${typeof getBadgeSVG === 'function' ? getBadgeSVG(tier, sz, 'cp'+c.id) : ''}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:18px;font-weight:700;color:#f0f2ff;">${esc(c.nom || p.prenom || '')}</div>
            <div style="font-size:13px;color:${tc.c1};font-weight:600;">NIVEAU ${niveau}</div>
            <div style="margin-top:10px;display:flex;justify-content:space-between;margin-bottom:5px;">
              <span style="font-size:10px;color:#8892a4;">${(p.xpNiveau||0).toLocaleString('fr')} XP</span>
              <span style="font-size:10px;color:${tc.c1};font-weight:600;">${xpManquant.toLocaleString('fr')} → Niv. ${niveau+1}</span>
            </div>
            <div style="height:4px;background:#1e2235;border-radius:2px;overflow:hidden;">
              <div style="height:100%;border-radius:2px;width:${xpPct}%;background:${tc.bar};transition:width .6s;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-row">
        <div style="background:linear-gradient(135deg,#0f1a10,#162a1a);border:1px solid #1D9E7555;border-radius:14px;padding:18px 12px;text-align:center;">
          <div style="font-size:28px;margin-bottom:6px;">📋</div>
          <div style="font-size:34px;font-weight:700;color:#1D9E75;line-height:1;">${p.bilansValidies || 0}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">Bilans validés</div>
        </div>
        <div style="background:linear-gradient(135deg,#0a1220,#0f1e38);border:1px solid #378ADD55;border-radius:14px;padding:18px 12px;text-align:center;">
          <div style="font-size:28px;margin-bottom:6px;">🏋️</div>
          <div style="font-size:34px;font-weight:700;color:#378ADD;line-height:1;">${p.seancesValidees || 0}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">Séances validées</div>
        </div>
      </div>

      <div style="background:linear-gradient(135deg,#0f1520,#151e30);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:14px;">
        <div style="font-size:32px;">🦶</div>
        <div>
          <div style="font-size:26px;font-weight:700;color:#f0f2ff;line-height:1;">${(p.pasTotal || 0).toLocaleString('fr')}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">Pas cumulés</div>
        </div>
      </div>

      <button class="btn-secondary" onclick="setPage('client-detail')">← Retour</button>
    </div>
  </div>`;
}

// ── Coach home ────────────────────────────────────────────────────────

let _coachBilansCount = 0; // bilans à traiter (badge dans renderHome)

// ── Centre bilans ─────────────────────────────────────────────────────

let _centreBilansData = null;
let _coachBilanClientVu = null; // client dont on voit le bilan

async function loadCentreBilans() {
  setPage('loading');
  try {
    _centreBilansData = await api('listerBilansCoach');
    _coachBilansCount = (_centreBilansData || []).filter(b => !b.coachTraite).length;
    setPage('centre-bilans');
  } catch(e) { setPage('home'); }
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
      <button class="btn-secondary" onclick="loadHome()">← Retour</button>
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
    api('marquerNotifsLues').catch(() => {});
    S.data.notifsNonLues = 0;
    setPage('notifications-coach');
  } catch(e) { setPage('home'); }
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
      <button class="btn-secondary" onclick="loadHome()">← Retour</button>
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

// ── Rapports de bugs (coach) ──────────────────────────────────────────

let _rapportsBugsData = null;

async function loadRapportsBugs() {
  setPage('loading');
  try {
    _rapportsBugsData = await api('chargerRapportsBugs');
    setPage('rapports-bugs');
    (_rapportsBugsData.bugs || []).filter(b => !b.lu).forEach(b => {
      api('marquerBugLu', { ligne: b.ligne }).catch(() => {});
    });
    S.data.bugsNonLus = 0;
  } catch(e) { setPage('home'); }
}

function renderRapportsBugs() {
  const bugs = (_rapportsBugsData && _rapportsBugsData.bugs) || [];

  let html = '';
  if (!bugs.length) {
    html = '<div class="empty"><div class="empty-icon">🐛</div><div class="empty-text">Aucun rapport pour l\'instant. 🎉</div></div>';
  } else {
    bugs.forEach(b => {
      const couleur = coachColor(b.client);
      const opacity = b.lu ? '0.6' : '1';
      html += `<div class="card" style="margin-bottom:10px;border-left:3px solid ${couleur};padding-left:14px;opacity:${opacity};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
          <div style="font-size:14px;font-weight:700;color:${couleur};">${esc(b.nom)} ${!b.lu ? '<span style="background:#e74c3c;color:#fff;font-size:10px;padding:2px 6px;border-radius:8px;margin-left:6px;">NEW</span>' : ''}</div>
          <div style="font-size:11px;color:#8892a4;">${formatTsCoach(b.ts)}</div>
        </div>
        <div style="font-size:13px;color:#e8eaf0;white-space:pre-wrap;">${esc(b.message)}</div>
      </div>`;
    });
  }

  return `<div id="app">
    ${renderHeader('Rapports de bugs', '', false)}
    <div class="page">
      ${html}
      <button class="btn-secondary" onclick="loadRapportsBugs()" style="margin-bottom:8px;">↻ Rafraîchir</button>
      <button class="btn-secondary" onclick="loadHome()">← Retour</button>
    </div>
  </div>`;
}
