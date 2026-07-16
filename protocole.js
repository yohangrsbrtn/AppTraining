// ── Protocole (fonctionnalité activable individuellement par client) ────
// Lecture seule : le coach saisit le cycle/les molécules directement dans la
// feuille Google Sheets "Protocol" du client. L'app se contente de relire ces
// données brutes et de recalculer l'affichage à la volée (mêmes formules que
// le bouton "Générer le protocole" du coach), sans jamais rien écrire dedans.

let _protocoleData = null;

async function loadProtocole() {
  showLoadingOverlay('Chargement…');
  try {
    _protocoleData = await api('chargerProtocoleChimie');
    hideLoadingOverlay();
    setPage('protocole');
    schedulerPrechargement();
  } catch(e) { hideLoadingOverlay(); setPage('home'); }
}

function renderProtocolePage() {
  const d = _protocoleData || {};
  if (!d.hasProtocole) {
    return `<div id="app">
      ${renderHeader('Protocole', '', false)}
      <div class="page">
        <div class="empty"><div class="empty-icon">🧬</div><div class="empty-text">Aucun protocole en cours pour l'instant.</div></div>
        <button class="btn-secondary" onclick="loadHome()">← Accueil</button>
      </div>
      ${renderNavBar('home')}
    </div>`;
  }

  const catColor = c => c === 'Injectable' ? '#e05c5c' : c === 'Oral' ? '#4f8ef7' : '#a78bfa';

  const moleculesHtml = (d.molecules || []).map(m => `
    <div class="card" style="border-left:3px solid ${catColor(m.categorie)};padding-left:14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:14px;font-weight:700;color:#e8eaf0;">${esc(m.nom)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${esc(m.categorie)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:15px;font-weight:700;color:${catColor(m.categorie)};">${m.dosageHebdoMg}&nbsp;mg<span style="font-size:10px;font-weight:600;color:var(--muted);">/sem</span></div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${esc(m.totalConverti || (m.totalMg + ' mg'))} sur le cycle</div>
          ${m.quantiteRequise ? `<div style="font-size:11px;color:var(--muted);margin-top:1px;">${esc(m.quantiteRequise)}</div>` : ''}
        </div>
      </div>
    </div>`).join('');

  const semStyle = statut => {
    if (statut === 'passee') return 'opacity:.45;text-decoration:line-through;';
    if (statut === 'encours') return 'background:#0d1a13;border:1px solid #1D9E7555;';
    return '';
  };

  const semainesHtml = (d.semaines || []).map(s => `
    <div class="card" style="margin-bottom:8px;${semStyle(s.statut)}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${s.doses.length ? '8px' : '0'};">
        <div style="font-size:13px;font-weight:700;color:${s.statut === 'encours' ? '#1D9E75' : '#e8eaf0'};">Semaine ${s.numero}${s.statut === 'encours' ? ' · en cours' : ''}</div>
        <div style="font-size:11px;color:var(--muted);">${esc(s.date)}</div>
      </div>
      ${s.doses.map(dose => `
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;">
          <span style="color:var(--muted);">${esc(dose.nom)}</span>
          <span style="color:${dose.texte === '—' ? 'var(--muted)' : '#e8eaf0'};font-weight:600;">${esc(dose.texte)}</span>
        </div>`).join('')}
    </div>`).join('');

  return `<div id="app">
    ${renderHeader('Protocole', d.dureeSemaines ? d.dureeSemaines + ' semaines' : '', false)}
    <div class="page">
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);">
          <span>Début : <strong style="color:#e8eaf0;">${esc(d.dateDebut)}</strong></span>
          <span>${d.dureeSemaines} semaines</span>
        </div>
        ${d.objectif ? `<div style="font-size:12px;color:var(--muted);margin-top:8px;">${esc(d.objectif)}</div>` : ''}
      </div>

      <div class="section-title" style="color:var(--muted);">Molécules</div>
      ${moleculesHtml || '<div class="empty"><div class="empty-text">Aucune molécule renseignée.</div></div>'}

      <div class="section-title" style="color:var(--muted);margin-top:16px;">Planning</div>
      ${semainesHtml}

      <button class="btn-secondary" onclick="loadHome()" style="margin-top:8px;">← Accueil</button>
    </div>
    ${renderNavBar('home')}
  </div>`;
}
