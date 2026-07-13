// ── Collection page ───────────────────────────────────────────────────

const TITRES_DEF = [
  {id:'baby',      nom:'Baby-trotteur',    icon:'👶', c1:'#00E090', c2:'#006A48', cat:'pas',    seuil:150000,  cond:'150 000 pas cumulés'},
  {id:'march',     nom:'Marcheur',         icon:'🚶', c1:'#40C8FF', c2:'#0058A0', cat:'pas',    seuil:300000,  cond:'300 000 pas cumulés'},
  {id:'grand',     nom:'Grand marcheur',   icon:'🥾', c1:'#60E040', c2:'#1A6018', cat:'pas',    seuil:600000,  cond:'600 000 pas cumulés'},
  {id:'pele',      nom:'Pèlerin',          icon:'🗺️', c1:'#FFD700', c2:'#9A5800', cat:'pas',    seuil:1000000, cond:'1 000 000 pas cumulés'},
  {id:'regu',      nom:'Régulier',         icon:'📅', c1:'#C080FF', c2:'#5820C0', cat:'bilan',  seuil:6,       cond:'6 bilans validés'},
  {id:'assi',      nom:'Assidu',           icon:'🔥', c1:'#FF7030', c2:'#B02000', cat:'bilan',  seuil:13,      cond:'13 bilans validés'},
  {id:'centurion', nom:'Centurion',        icon:'🏛️', c1:'#FFD040', c2:'#9C3800', cat:'bilan',  seuil:26,      cond:'26 bilans validés'},
  {id:'rep1',      nom:'Première rep',     icon:'💪', c1:'#3ecf8e', c2:'#0d3d24', cat:'seance', seuil:1,       cond:'1 séance validée'},
  {id:'route',     nom:'En route',         icon:'👟', c1:'#60b8ff', c2:'#0a1e3d', cat:'seance', seuil:10,      cond:'10 séances validées'},
  {id:'guerre',    nom:'Machine de guerre',icon:'⚔️', c1:'#ff6b35', c2:'#3d1200', cat:'seance', seuil:50,      cond:'50 séances validées'},
  {id:'cent100',   nom:'Centenaire',       icon:'🏅', c1:'#ffd700', c2:'#3d2000', cat:'seance', seuil:100,     cond:'100 séances validées'},
  {id:'eclair',    nom:'Premier pas',      icon:'⚡', c1:'#a78bfa', c2:'#1e1040', cat:'niveau', seuil:5,       cond:'Niveau 5 atteint'},
  {id:'confirme',  nom:'Confirmé',         icon:'⭐', c1:'#38bdf8', c2:'#0a1e30', cat:'niveau', seuil:15,      cond:'Niveau 15 atteint'},
  {id:'elite',     nom:'Élite',            icon:'👑', c1:'#e879f9', c2:'#200030', cat:'niveau', seuil:25,      cond:'Niveau 25 atteint'}
];

let _colTitreActif = null;

async function loadCollection() {
  setPage('loading');
  try {
    if (!S.data.prog) S.data.prog = await api('chargerProgressionClient');
    try {
      _colTitreActif = localStorage.getItem('titreActif_' + S.client)
        || (S.data.prog.titreActif || null) || null;
      if (_colTitreActif === '') _colTitreActif = null;
    } catch(e) {}
    setPage('collection');
  } catch(e) { setPage('home'); }
}

function _colVal(cat) {
  const p = S.data.prog || {};
  if (cat === 'pas')    return p.pasTotal        || 0;
  if (cat === 'bilan')  return p.nbBilansValides  || 0;
  if (cat === 'seance') return p.seancesValidees  || 0;
  if (cat === 'niveau') return p.niveau           || 1;
  return 0;
}

function activerTitre(id) {
  const def = TITRES_DEF.find(t => t.id === id);
  if (!def || _colVal(def.cat) < def.seuil) return;
  _colTitreActif = (_colTitreActif === id) ? null : id;
  try { localStorage.setItem('titreActif_' + S.client, _colTitreActif || ''); } catch(e) {}
  api('sauvegarderTitreActif', { titreId: _colTitreActif || '' }).catch(() => {});
  setPage('collection');
}

function renderCollectionPage() {
  const catLabels = { pas: '🦶 Pas', bilan: '📋 Bilans', seance: '🏋️ Séances', niveau: '⭐ Niveau' };
  const cats = ['pas', 'bilan', 'seance', 'niveau'];

  const actiDef = _colTitreActif ? TITRES_DEF.find(t => t.id === _colTitreActif) : null;
  const activeBanner = actiDef ? `
    <div class="card" style="text-align:center;padding:14px 12px;border-color:${actiDef.c1}60;margin-bottom:16px;">
      <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">TITRE ACTIF</div>
      <div style="font-size:20px;font-weight:700;color:${actiDef.c1};">${actiDef.icon} ${actiDef.nom}</div>
    </div>` : '';

  let html = '';
  cats.forEach(cat => {
    const titres = TITRES_DEF.filter(t => t.cat === cat);
    const val = _colVal(cat);
    html += `<div class="section-title" style="color:var(--muted);">${catLabels[cat]}</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:8px;">`;
    titres.forEach(t => {
      const unlocked = val >= t.seuil;
      const isActif  = _colTitreActif === t.id;
      const pct = unlocked ? 100 : Math.min(99, Math.round((val / t.seuil) * 100));
      html += `<div onclick="${unlocked ? `activerTitre('${t.id}')` : ''}"
        style="background:#161b2e;border-radius:12px;border:1.5px solid ${unlocked ? t.c1 + '55' : 'var(--border)'};
          padding:14px;display:flex;align-items:center;gap:14px;
          ${isActif ? `box-shadow:0 0 0 2.5px ${t.c1};` : ''}
          opacity:${unlocked ? '1' : '0.5'};
          ${unlocked ? 'cursor:pointer;' : ''}">
        <div style="font-size:30px;width:38px;text-align:center;filter:${unlocked ? 'none' : 'grayscale(1)'};">${t.icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap;">
            <div style="font-size:14px;font-weight:700;color:${unlocked ? '#e8eaf0' : 'var(--muted)'};">${t.nom}</div>
            ${isActif ? `<span style="font-size:10px;font-weight:700;color:${t.c1};background:${t.c1}22;border:1px solid ${t.c1}55;border-radius:4px;padding:1px 5px;">ACTIF</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">${t.cond}</div>
          <div style="background:var(--bg3);border-radius:99px;height:4px;overflow:hidden;">
            <div style="height:100%;border-radius:99px;width:${pct}%;background:${unlocked ? t.c1 : 'var(--border)'};transition:width .6s;"></div>
          </div>
          ${!unlocked ? `<div style="font-size:10px;color:var(--muted);margin-top:3px;">${val.toLocaleString('fr')} / ${t.seuil.toLocaleString('fr')}</div>` : ''}
        </div>
        <div style="font-size:18px;flex-shrink:0;">${unlocked ? (isActif ? '✓' : '○') : '🔒'}</div>
      </div>`;
    });
    html += `</div>`;
  });

  return `<div id="app">
    ${renderHeader('Ma Collection', '', false)}
    <div class="page">
      ${activeBanner}
      ${html}
      <button class="btn-secondary" onclick="loadProgression()" style="margin-top:4px;">← Progression</button>
    </div>
    ${renderNavBar('home')}
  </div>`;
}
