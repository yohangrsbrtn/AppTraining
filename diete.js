// ── Diète page ────────────────────────────────────────────────────────

let _dSubPage = 'list'; // 'list' | 'detail' | 'menus' | 'journal'
let _dDietes  = [];
let _dDetail  = null;
let _dNom     = '';

// ── Mes menus (aliments base coach + communauté, combinés en recettes perso) ──
let _dMenus      = null; // null = jamais chargé
let _dMenuVue    = 'liste'; // 'liste' | 'creation'
let _dMenuDraft  = null; // { nom, aliments: [] } en cours de construction

// ── Mon journal (jours perso, jusqu'à 7 repas, chacun = repas coach ou menu) ──
let _dJournal             = null; // null = jamais chargé, sinon liste brute de slots
let _dJournalDateOuverte  = '';   // date (dd/MM/yyyy) du jour ouvert, '' = liste des jours
let _dJournalAjoutEtape   = null; // null | 'choix' | 'coach-dietes' | 'coach-repas' | 'menu' | 'compose'
let _dJournalDieteChoisie = null; // { ligne, col, nom, repas } — diète en cours de parcours
let _dDieteDetailCache    = {};   // "ligne|col" -> détail chargerDieteParPosition (résolution des slots coach)

// ── Modale de recherche/ajout/création d'aliment (alimente _dMenuDraft) ──────
let _dBaseAliments          = null;
let _dAjoutEtape            = 'recherche'; // 'recherche' | 'quantite' | 'creation'
let _dAjoutSelection        = null;
let _dCreationNomPrerempli  = '';

// Garde-fou anti double-tap : un bouton "Créer"/"Ajouter"/"Enregistrer" tapé deux fois
// rapidement (avant la fin de l'appel réseau précédent) créait autant de lignes en
// double côté serveur (bug réel constaté sur la création d'aliment). Tous les boutons
// d'action de cette page passent par _guardAction() au lieu d'appeler la fonction
// directement, pour n'exécuter qu'un seul appel à la fois.
let _dActionEnCours = false;
async function _guardAction(fn) {
  if (_dActionEnCours) return;
  _dActionEnCours = true;
  try { await fn(); } finally { _dActionEnCours = false; }
}

async function loadDiete() {
  if (_pf.diete) {
    _dDietes  = _pf.diete;
    _pf.diete = null;
    _dSubPage = 'list';
    setPage('diete');
    schedulerPrechargement();
    return;
  }
  setPage('diete-loading');
  try {
    _dDietes  = await api('listerDietes');
    _dSubPage = 'list';
    setPage('diete');
    schedulerPrechargement();
  } catch(e) { setPage('home'); }
}

async function ouvrirDiete(ligne, col, nom) {
  _dNom = nom;
  setPage('diete-loading');
  try {
    _dDetail = await api('chargerDieteParPosition', { ligneTitre: ligne, colTitre: col });
    _dSubPage = 'detail';
    setPage('diete');
  } catch(e) { setPage('diete'); }
}

async function switchDieteTab(tab) {
  _dSubPage = tab;
  if (tab === 'menus') _dMenuVue = 'liste';
  if (tab === 'journal') _dJournalAjoutEtape = null;
  const chargerMenus   = tab === 'menus'   && _dMenus   === null;
  const chargerJournal = tab === 'journal' && _dJournal === null;
  const chargerMenusPourJournal = tab === 'journal' && _dMenus === null;
  if (chargerMenus || chargerJournal || chargerMenusPourJournal) {
    setPage('diete-loading');
    if (chargerMenus || chargerMenusPourJournal) _dMenus = await api('listerMenus').catch(() => []);
    if (chargerJournal) _dJournal = await api('listerJournal').catch(() => []);
  }
  setPage('diete');
}

// ── Render ────────────────────────────────────────────────────────────

function renderDietePage() {
  if (S.page === 'diete-loading') {
    return `<div id="app">${renderHeader('Ma Diète','',false)}<div class="page">${renderSpinner()}</div>${renderNavBar('diete')}</div>`;
  }
  if (_dSubPage === 'detail' && _dDetail) return renderDieteDetail();
  if (_dSubPage === 'menus') return renderDieteMenus();
  if (_dSubPage === 'journal') return renderDieteJournal();
  return renderDieteList();
}

function renderDieteTabs(actif) {
  const tabs = [['list','Diètes'], ['menus','Mes menus'], ['journal','Mon journal']];
  return `<div style="display:flex;gap:6px;padding:0 16px 12px;">
    ${tabs.map(([key,label]) => `
      <button onclick="switchDieteTab('${key}')" style="flex:1;padding:9px 4px;border-radius:10px;border:1px solid ${actif===key?'#a78bfa':'var(--border)'};background:${actif===key?'#a78bfa22':'transparent'};color:${actif===key?'#a78bfa':'var(--muted)'};font-size:12px;font-weight:700;cursor:pointer;">${label}</button>`).join('')}
  </div>`;
}

function renderDieteList() {
  const body = (!_dDietes || _dDietes.length === 0)
    ? `<div class="empty"><div class="empty-icon">🥗</div><div class="empty-text">Aucune diète trouvée.</div></div>`
    : _dDietes.map(d => `
      <div class="diete-item" onclick="ouvrirDiete(${d.ligne}, ${d.col}, '${(d.nom||'').replace(/'/g,"\\'")}')">
        <div class="diete-bar"></div>
        <span style="padding-left:8px;font-size:15px;font-weight:700;">${esc(d.nom)}</span>
        <div class="diete-arrow">›</div>
      </div>`).join('');

  return `<div id="app">
    ${renderHeader('Ma Diète', '', false)}
    ${renderDieteTabs('list')}
    <div class="page">${body}</div>
    ${renderNavBar('diete')}
  </div>`;
}

// Totaux par (repas, équivalence) — recalculés à chaque swipe pour mettre à
// jour les totaux du haut sans re-render complet. _dCurrentOpt[i] = index de
// l'équivalence actuellement affichée pour le repas i (0 = repas de base).
let _dOptionTotals = [];
let _dCurrentOpt   = [];

function _sommeAliments(aliments) {
  let cals = 0, prot = 0, glu = 0, lip = 0;
  (aliments || []).forEach(a => {
    cals += a.cals != null ? a.cals : (a.kcal || 0);
    prot += a.prot || 0;
    glu  += a.glu  || 0; lip  += a.lip  || 0;
  });
  return { cals, prot, glu, lip };
}

function _recalcDieteTotal() {
  let tCals = 0, tProt = 0, tGlu = 0, tLip = 0;
  _dOptionTotals.forEach((options, i) => {
    const t = options[_dCurrentOpt[i] || 0] || options[0];
    if (!t) return;
    tCals += t.cals; tProt += t.prot; tGlu += t.glu; tLip += t.lip;
  });
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = Math.round(v); };
  set('dTotKcal', tCals); set('dTotProt', tProt); set('dTotGlu', tGlu); set('dTotLip', tLip);
}

function renderDieteDetail() {
  const data = _dDetail;
  _dOptionTotals = [];
  _dCurrentOpt = [];

  let repasHtml = '';
  (data.repas || []).forEach((r, idx) => {
    const options = [r].concat(r.equivalences || []);
    const hasOpts = options.length > 1;

    _dOptionTotals[idx] = options.map(opt => _sommeAliments(opt.aliments));
    _dCurrentOpt[idx] = 0;

    repasHtml += `<div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;">
        <div style="font-size:15px;font-weight:600;">${esc(r.nom)}</div>
        ${hasOpts ? `<div id="dDots_${idx}" style="font-size:11px;font-weight:600;color:var(--muted);white-space:nowrap;">1 / ${options.length}</div>` : ''}
      </div>`;

    if (hasOpts) {
      repasHtml += `<div id="dSlider_${idx}" style="display:flex;overflow-x:scroll;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;gap:0;">`;
      options.forEach((opt, oIdx) => {
        repasHtml += `<div style="min-width:100%;scroll-snap-align:start;box-sizing:border-box;">
          ${oIdx > 0 ? `<div style="font-size:11px;color:#a78bfa;font-weight:600;margin-bottom:8px;">≡ ${esc(opt.nom)}</div>` : ''}
          ${rendreCorpsRepas(opt)}
        </div>`;
      });
      repasHtml += `</div>`;
    } else {
      repasHtml += rendreCorpsRepas(options[0]);
    }

    repasHtml += `</div>`;
  });

  const t0 = _dOptionTotals.reduce((acc, options) => {
    const t = options[0];
    acc.cals += t.cals; acc.prot += t.prot; acc.glu += t.glu; acc.lip += t.lip;
    return acc;
  }, { cals: 0, prot: 0, glu: 0, lip: 0 });

  return `<div id="app">
    ${renderHeader(esc(_dNom), 'Ma Diète', false)}
    <div id="dStickyMacros" style="position:sticky;top:0;z-index:90;background:var(--bg);padding:10px 16px;box-shadow:0 8px 12px -6px rgba(0,0,0,.4);">
      <div class="card" style="display:flex;justify-content:space-around;text-align:center;padding:14px 8px;margin-bottom:0;">
        <div><div style="font-size:20px;font-weight:700;" id="dTotKcal">${Math.round(t0.cals)}</div><div class="macro-label">KCAL</div></div>
        <div><div style="font-size:20px;font-weight:700;color:#378ADD;" id="dTotProt">${Math.round(t0.prot)}</div><div class="macro-label">PROT</div></div>
        <div><div style="font-size:20px;font-weight:700;color:var(--green);" id="dTotGlu">${Math.round(t0.glu)}</div><div class="macro-label">GLU</div></div>
        <div><div style="font-size:20px;font-weight:700;color:#D85A30;" id="dTotLip">${Math.round(t0.lip)}</div><div class="macro-label">LIP</div></div>
      </div>
    </div>
    <div class="page">
      <button class="btn-secondary" onclick="loadDiete()" style="margin-bottom:12px;">← Retour</button>
      ${repasHtml}
    </div>
    ${renderNavBar('diete')}
  </div>`;
}

function rendreCorpsRepas(r) {
  let sCals = 0, sProt = 0, sGlu = 0, sLip = 0;
  (r.aliments || []).forEach(a => {
    const cals = a.cals != null ? a.cals : (a.kcal || 0);
    sCals += cals; sProt += a.prot || 0;
    sGlu  += a.glu  || 0; sLip += a.lip || 0;
  });

  const aliments = (r.aliments || []).map(a => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="font-size:14px;">${esc(a.nom)}${a.modifie ? `<span style="display:inline-block;font-size:8px;font-weight:700;color:#f59e0b;background:#f59e0b18;border:1px solid #f59e0b44;border-radius:3px;padding:1px 4px;margin-left:5px;vertical-align:middle;">modifié</span>` : ''}</div>
      <div style="font-size:13px;color:var(--muted);white-space:nowrap;margin-left:10px;">${a.qte != null ? a.qte : Math.round(a.quantite||0)}${a.unite ? ' ' + a.unite : 'g'}</div>
    </div>`).join('');

  return `${aliments}
    <div style="display:flex;justify-content:space-around;text-align:center;margin-top:10px;padding-top:10px;border-top:1px solid #378ADD;">
      <div><span style="font-size:14px;font-weight:600;">${Math.round(sCals)}</span><div class="macro-label">KCAL</div></div>
      <div><span style="font-size:14px;font-weight:600;color:#378ADD;">${Math.round(sProt)}</span><div class="macro-label">PROT</div></div>
      <div><span style="font-size:14px;font-weight:600;color:var(--green);">${Math.round(sGlu)}</span><div class="macro-label">GLU</div></div>
      <div><span style="font-size:14px;font-weight:600;color:#D85A30;">${Math.round(sLip)}</span><div class="macro-label">LIP</div></div>
    </div>`;
}

// ── Onglet "Mes menus" ───────────────────────────────────────────────────────

function renderDieteMenus() {
  if (_dMenuVue === 'creation' && _dMenuDraft) return renderDieteMenuCreation();
  const menus = _dMenus || [];
  const cards = menus.map(m => {
    const s = _sommeAliments(m.aliments);
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div style="font-size:15px;font-weight:700;">${esc(m.nom)}</div>
        <button onclick="_guardAction(() => supprimerMenuClient('${m.menuId}'))" style="background:transparent;border:none;color:#8892a4;font-size:16px;cursor:pointer;line-height:1;">✕</button>
      </div>
      <div style="font-size:12px;color:var(--muted);margin:4px 0 10px;">${m.aliments.length} aliment${m.aliments.length>1?'s':''}</div>
      <div style="display:flex;justify-content:space-around;text-align:center;padding-top:10px;border-top:1px solid var(--border);">
        <div><span style="font-size:14px;font-weight:600;">${Math.round(s.cals)}</span><div class="macro-label">KCAL</div></div>
        <div><span style="font-size:14px;font-weight:600;color:#378ADD;">${Math.round(s.prot)}</span><div class="macro-label">PROT</div></div>
        <div><span style="font-size:14px;font-weight:600;color:var(--green);">${Math.round(s.glu)}</span><div class="macro-label">GLU</div></div>
        <div><span style="font-size:14px;font-weight:600;color:#D85A30;">${Math.round(s.lip)}</span><div class="macro-label">LIP</div></div>
      </div>
    </div>`;
  }).join('');

  return `<div id="app">
    ${renderHeader('Ma Diète', '', false)}
    ${renderDieteTabs('menus')}
    <div class="page">
      ${menus.length ? cards : '<div class="empty"><div class="empty-icon">🍽️</div><div class="empty-text">Aucun menu créé pour l\'instant.</div></div>'}
      <button onclick="ouvrirCreationMenu()" style="width:100%;margin-top:${menus.length?'4px':'0'};padding:14px;background:linear-gradient(135deg,#a78bfa,#6d3fd6);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">+ Créer un menu</button>
    </div>
    ${renderNavBar('diete')}
  </div>`;
}

async function supprimerMenuClient(menuId) {
  try {
    await api('supprimerMenu', { menuId });
    _dMenus = await api('listerMenus');
    setPage('diete');
  } catch(e) {}
}

function ouvrirCreationMenu() {
  _dMenuDraft = { nom: '', aliments: [] };
  _dMenuVue = 'creation';
  setPage('diete');
}

function annulerCreationMenu() {
  _dMenuDraft = null;
  _dMenuVue = 'liste';
  setPage('diete');
}

function retirerAlimentDraft(i) {
  _dMenuDraft.aliments.splice(i, 1);
  setPage('diete');
}

function renderDieteMenuCreation() {
  const d = _dMenuDraft;
  const s = _sommeAliments(d.aliments);
  const lignes = d.aliments.map((a, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="min-width:0;">
        <div style="font-size:14px;">${esc(a.nom)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:1px;">${a.quantite}g · ${Math.round(a.kcal)} kcal</div>
      </div>
      <button onclick="retirerAlimentDraft(${i})" style="background:transparent;border:none;color:#8892a4;font-size:16px;padding:4px 8px;cursor:pointer;line-height:1;">✕</button>
    </div>`).join('');

  return `<div id="app">
    ${renderHeader('Nouveau menu', '', false)}
    <div class="page">
      <button class="btn-secondary" onclick="annulerCreationMenu()" style="margin-bottom:12px;">← Annuler</button>
      <div class="card">
        <div style="font-size:11px;color:#8892a4;margin-bottom:6px;">NOM DU MENU</div>
        <input id="dMenuNom" type="text" value="${esc(d.nom)}" placeholder="ex: Mon petit-déj maison" oninput="_dMenuDraft.nom=this.value"
          style="width:100%;padding:12px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:10px;font-size:16px;box-sizing:border-box;margin-bottom:14px;">
        ${d.aliments.length ? lignes : '<div style="font-size:13px;color:var(--muted);text-align:center;padding:8px 0;">Aucun aliment ajouté.</div>'}
        ${d.aliments.length ? `<div style="display:flex;justify-content:space-around;text-align:center;margin-top:10px;padding-top:10px;border-top:1px solid #a78bfa;">
          <div><span style="font-size:14px;font-weight:600;">${Math.round(s.cals)}</span><div class="macro-label">KCAL</div></div>
          <div><span style="font-size:14px;font-weight:600;color:#378ADD;">${Math.round(s.prot)}</span><div class="macro-label">PROT</div></div>
          <div><span style="font-size:14px;font-weight:600;color:var(--green);">${Math.round(s.glu)}</span><div class="macro-label">GLU</div></div>
          <div><span style="font-size:14px;font-weight:600;color:#D85A30;">${Math.round(s.lip)}</span><div class="macro-label">LIP</div></div>
        </div>` : ''}
        <button onclick="ouvrirAjoutAliment()" style="width:100%;margin-top:${d.aliments.length?'12px':'8px'};padding:12px;background:#2d3142;border:none;border-radius:10px;color:#a78bfa;font-size:14px;font-weight:700;cursor:pointer;">+ Ajouter un aliment</button>
      </div>
      <button onclick="_guardAction(confirmerCreationMenu)" style="width:100%;margin-top:12px;padding:14px;background:linear-gradient(135deg,#a78bfa,#6d3fd6);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">Enregistrer le menu</button>
    </div>
    ${renderNavBar('diete')}
  </div>`;
}

async function confirmerCreationMenu() {
  const nom = (document.getElementById('dMenuNom').value || '').trim();
  if (!nom) { showToast('Donne un nom au menu.', '#c0392b'); return; }
  if (!_dMenuDraft.aliments.length) { showToast('Ajoute au moins un aliment.', '#c0392b'); return; }
  try {
    await api('creerMenu', { nom, aliments: _dMenuDraft.aliments });
    _dMenus = await api('listerMenus');
    _dMenuDraft = null;
    _dMenuVue = 'liste';
    setPage('diete');
  } catch(e) { showToast('Erreur : ' + e.message, '#c0392b'); }
}

// ── Onglet "Mon journal" ─────────────────────────────────────────────────────

function _joursJournal() {
  const parDate = {};
  (_dJournal || []).forEach(s => { (parDate[s.date] = parDate[s.date] || []).push(s); });
  const toKey = d => { const p = (d+'').split('/'); return p.length===3 ? p[2]+p[1].padStart(2,'0')+p[0].padStart(2,'0') : '0'; };
  return Object.keys(parDate).sort((a,b) => toKey(b).localeCompare(toKey(a))).map(date => ({ date, slots: parDate[date] }));
}

function renderDieteJournal() {
  if (_dJournalAjoutEtape === 'compose') return renderJournalCompose();
  if (_dJournalDateOuverte) return renderDieteJournalJour();
  const jours = _joursJournal();
  const rows = jours.map(j => `
    <div class="diete-item" onclick="ouvrirJourJournal('${j.date}')">
      <div class="diete-bar"></div>
      <span style="padding-left:8px;font-size:15px;font-weight:700;">${j.date}</span>
      <span style="margin-left:auto;margin-right:8px;font-size:12px;color:var(--muted);">${j.slots.length} repas</span>
      <div class="diete-arrow">›</div>
    </div>`).join('');

  return `<div id="app">
    ${renderHeader('Ma Diète', '', false)}
    ${renderDieteTabs('journal')}
    <div class="page">
      <div class="card" style="display:flex;gap:8px;align-items:center;">
        <input id="dJournalDatePicker" type="date" value="${isoDate(new Date())}" style="flex:1;padding:10px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:10px;font-size:16px;box-sizing:border-box;">
        <button onclick="ouvrirJourJournalDepuisPicker()" style="padding:10px 16px;background:linear-gradient(135deg,#a78bfa,#6d3fd6);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;">Ouvrir</button>
      </div>
      ${jours.length ? rows : '<div class="empty"><div class="empty-icon">📓</div><div class="empty-text">Aucun jour enregistré.</div></div>'}
    </div>
    ${renderNavBar('diete')}
  </div>`;
}

function ouvrirJourJournalDepuisPicker() {
  const el = document.getElementById('dJournalDatePicker');
  if (!el || !el.value) return;
  const [y,m,d] = el.value.split('-');
  ouvrirJourJournal(`${d}/${m}/${y}`);
}

async function ouvrirJourJournal(dateStr) {
  const slots = (_dJournal || []).filter(s => s.date === dateStr && s.type === 'coach');
  const refs = [...new Set(slots.map(s => s.ref))].map(ref => ref.split('|'));
  const aCharger = refs.filter(([l,c]) => !_dDieteDetailCache[l+'|'+c]);
  if (aCharger.length) {
    setPage('diete-loading');
    await Promise.all(aCharger.map(([l,c]) => _resoudreDieteDetail(parseInt(l), parseInt(c))));
  }
  _dJournalDateOuverte = dateStr;
  _dJournalAjoutEtape = null;
  setPage('diete');
}

function fermerJourJournal() {
  _dJournalDateOuverte = '';
  setPage('diete');
}

async function _resoudreDieteDetail(ligne, col) {
  const key = ligne + '|' + col;
  if (_dDieteDetailCache[key]) return _dDieteDetailCache[key];
  const d = await api('chargerDieteParPosition', { ligneTitre: ligne, colTitre: col });
  _dDieteDetailCache[key] = d;
  return d;
}

function _resoudreSlot(s) {
  if (s.type === 'menu') {
    const m = (_dMenus || []).find(mm => mm.menuId === s.ref);
    return m ? m.aliments : [];
  }
  const [ligne, col, idx] = s.ref.split('|');
  const detail = _dDieteDetailCache[ligne+'|'+col];
  const repas = detail && detail.repas && detail.repas[parseInt(idx)];
  return repas ? repas.aliments : [];
}

function renderDieteJournalJour() {
  const date = _dJournalDateOuverte;
  const slots = (_dJournal || []).filter(s => s.date === date).sort((a,b) => a.ligne - b.ligne);
  let total = { cals:0, prot:0, glu:0, lip:0 };
  const cards = slots.map((s, i) => {
    const aliments = _resoudreSlot(s);
    const som = _sommeAliments(aliments);
    total.cals += som.cals; total.prot += som.prot; total.glu += som.glu; total.lip += som.lip;
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
        <div>
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;">Repas ${i+1}</div>
          <div style="font-size:15px;font-weight:700;margin-top:2px;">${esc(s.label)}</div>
        </div>
        <button onclick="_guardAction(() => supprimerSlotJournalClient(${s.ligne}))" style="background:transparent;border:none;color:#8892a4;font-size:16px;cursor:pointer;line-height:1;">✕</button>
      </div>
      ${rendreCorpsRepas({ aliments })}
    </div>`;
  }).join('');

  return `<div id="app">
    ${renderHeader(date, 'Mon journal', false)}
    <div id="dStickyMacros" style="position:sticky;top:0;z-index:90;background:var(--bg);padding:10px 16px;box-shadow:0 8px 12px -6px rgba(0,0,0,.4);">
      <div class="card" style="display:flex;justify-content:space-around;text-align:center;padding:14px 8px;margin-bottom:0;">
        <div><div style="font-size:20px;font-weight:700;">${Math.round(total.cals)}</div><div class="macro-label">KCAL</div></div>
        <div><div style="font-size:20px;font-weight:700;color:#378ADD;">${Math.round(total.prot)}</div><div class="macro-label">PROT</div></div>
        <div><div style="font-size:20px;font-weight:700;color:var(--green);">${Math.round(total.glu)}</div><div class="macro-label">GLU</div></div>
        <div><div style="font-size:20px;font-weight:700;color:#D85A30;">${Math.round(total.lip)}</div><div class="macro-label">LIP</div></div>
      </div>
    </div>
    <div class="page">
      <button class="btn-secondary" onclick="fermerJourJournal()" style="margin-bottom:12px;">← Retour</button>
      ${cards}
      ${slots.length < 7 ? renderJournalAjoutSlot() : '<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px 0;">7 repas — journée complète.</div>'}
    </div>
    ${renderNavBar('diete')}
  </div>`;
}

function renderJournalAjoutSlot() {
  if (_dJournalAjoutEtape === 'choix') {
    return `<div class="card">
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px;">Choisis la source du repas</div>
      <button onclick="_dJournalAjoutEtape='coach-dietes';setPage('diete')" style="width:100%;padding:12px;background:#2d3142;border:none;border-radius:10px;color:#e8eaf0;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px;">📋 Un repas de ma diète</button>
      <button onclick="_dJournalAjoutEtape='menu';setPage('diete')" style="width:100%;padding:12px;background:#2d3142;border:none;border-radius:10px;color:#e8eaf0;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px;">🍽️ Un de mes menus</button>
      <button onclick="ouvrirComposeJournal()" style="width:100%;padding:12px;background:#2d3142;border:none;border-radius:10px;color:#e8eaf0;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px;">🥗 Composer avec des aliments</button>
      <button onclick="_dJournalAjoutEtape=null;setPage('diete')" style="width:100%;padding:10px;background:transparent;border:none;color:#8892a4;font-size:13px;cursor:pointer;">Annuler</button>
    </div>`;
  }
  if (_dJournalAjoutEtape === 'coach-dietes') {
    const rows = (_dDietes||[]).map(d => `
      <div class="diete-item" onclick="choisirDieteJournal(${d.ligne},${d.col},'${(d.nom||'').replace(/'/g,"\\'")}')">
        <div class="diete-bar"></div><span style="padding-left:8px;font-size:14px;font-weight:600;">${esc(d.nom)}</span><div class="diete-arrow">›</div>
      </div>`).join('');
    return `<div class="card">
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px;">Depuis quelle diète ?</div>
      ${rows || '<div style="font-size:13px;color:var(--muted);">Aucune diète trouvée.</div>'}
      <button onclick="_dJournalAjoutEtape='choix';setPage('diete')" style="width:100%;margin-top:10px;padding:10px;background:transparent;border:none;color:#8892a4;font-size:13px;cursor:pointer;">‹ Retour</button>
    </div>`;
  }
  if (_dJournalAjoutEtape === 'coach-repas') {
    const dc = _dJournalDieteChoisie;
    const repasList = (dc && dc.repas) || [];
    const rows = repasList.map((r, idx) => `
      <div class="diete-item" onclick="_guardAction(() => ajouterSlotCoach(${idx}))">
        <div class="diete-bar"></div><span style="padding-left:8px;font-size:14px;font-weight:600;">${esc(r.nom)}</span><div class="diete-arrow">›</div>
      </div>`).join('');
    return `<div class="card">
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px;">${esc(dc ? dc.nom : '')} — quel repas ?</div>
      ${rows || '<div style="font-size:13px;color:var(--muted);">Aucun repas trouvé.</div>'}
      <button onclick="_dJournalAjoutEtape='coach-dietes';setPage('diete')" style="width:100%;margin-top:10px;padding:10px;background:transparent;border:none;color:#8892a4;font-size:13px;cursor:pointer;">‹ Retour</button>
    </div>`;
  }
  if (_dJournalAjoutEtape === 'menu') {
    const rows = (_dMenus||[]).map(m => `
      <div class="diete-item" onclick="_guardAction(() => ajouterSlotMenu('${m.menuId}'))">
        <div class="diete-bar"></div><span style="padding-left:8px;font-size:14px;font-weight:600;">${esc(m.nom)}</span><div class="diete-arrow">›</div>
      </div>`).join('');
    return `<div class="card">
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px;">Quel menu ?</div>
      ${rows || '<div style="font-size:13px;color:var(--muted);">Aucun menu créé. Va dans "Mes menus" pour en créer un.</div>'}
      <button onclick="_dJournalAjoutEtape='choix';setPage('diete')" style="width:100%;margin-top:10px;padding:10px;background:transparent;border:none;color:#8892a4;font-size:13px;cursor:pointer;">‹ Retour</button>
    </div>`;
  }
  return `<button onclick="_dJournalAjoutEtape='choix';setPage('diete')" style="width:100%;padding:14px;background:linear-gradient(135deg,#a78bfa,#6d3fd6);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">+ Ajouter un repas</button>`;
}

// Compose un repas à la volée pour un slot du journal (plusieurs aliments de la
// base coach+communauté, ajoutés un par un) sans passer par la création préalable
// d'un menu dans la bibliothèque. Réutilise creerMenu() en coulisses (même stockage
// que "Mes menus", auto-nommé si le client ne donne pas de nom) pour ne pas dupliquer
// la logique de résolution des slots — seul le nom par défaut change.
function ouvrirComposeJournal() {
  _dMenuDraft = { nom: '', aliments: [] };
  _dJournalAjoutEtape = 'compose';
  setPage('diete');
}

function annulerComposeJournal() {
  _dMenuDraft = null;
  _dJournalAjoutEtape = 'choix';
  setPage('diete');
}

function renderJournalCompose() {
  const d = _dMenuDraft;
  const s = _sommeAliments(d.aliments);
  const lignes = d.aliments.map((a, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="min-width:0;">
        <div style="font-size:14px;">${esc(a.nom)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:1px;">${a.quantite}g · ${Math.round(a.kcal)} kcal</div>
      </div>
      <button onclick="retirerAlimentDraft(${i})" style="background:transparent;border:none;color:#8892a4;font-size:16px;padding:4px 8px;cursor:pointer;line-height:1;">✕</button>
    </div>`).join('');

  return `<div id="app">
    ${renderHeader('Composer un repas', _dJournalDateOuverte, false)}
    <div class="page">
      <button class="btn-secondary" onclick="annulerComposeJournal()" style="margin-bottom:12px;">← Annuler</button>
      <div class="card">
        <div style="font-size:11px;color:#8892a4;margin-bottom:6px;">NOM DU REPAS (optionnel)</div>
        <input id="dComposeNom" type="text" value="${esc(d.nom)}" placeholder="ex: Repas libre" oninput="_dMenuDraft.nom=this.value"
          style="width:100%;padding:12px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:10px;font-size:16px;box-sizing:border-box;margin-bottom:14px;">
        ${d.aliments.length ? lignes : '<div style="font-size:13px;color:var(--muted);text-align:center;padding:8px 0;">Aucun aliment ajouté.</div>'}
        ${d.aliments.length ? `<div style="display:flex;justify-content:space-around;text-align:center;margin-top:10px;padding-top:10px;border-top:1px solid #a78bfa;">
          <div><span style="font-size:14px;font-weight:600;">${Math.round(s.cals)}</span><div class="macro-label">KCAL</div></div>
          <div><span style="font-size:14px;font-weight:600;color:#378ADD;">${Math.round(s.prot)}</span><div class="macro-label">PROT</div></div>
          <div><span style="font-size:14px;font-weight:600;color:var(--green);">${Math.round(s.glu)}</span><div class="macro-label">GLU</div></div>
          <div><span style="font-size:14px;font-weight:600;color:#D85A30;">${Math.round(s.lip)}</span><div class="macro-label">LIP</div></div>
        </div>` : ''}
        <button onclick="ouvrirAjoutAliment()" style="width:100%;margin-top:${d.aliments.length?'12px':'8px'};padding:12px;background:#2d3142;border:none;border-radius:10px;color:#a78bfa;font-size:14px;font-weight:700;cursor:pointer;">+ Ajouter un aliment</button>
      </div>
      <button onclick="_guardAction(confirmerComposeJournal)" style="width:100%;margin-top:12px;padding:14px;background:linear-gradient(135deg,#a78bfa,#6d3fd6);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">Ajouter au journal</button>
    </div>
    ${renderNavBar('diete')}
  </div>`;
}

async function confirmerComposeJournal() {
  if (!_dMenuDraft.aliments.length) { showToast('Ajoute au moins un aliment.', '#c0392b'); return; }
  const nom = (document.getElementById('dComposeNom').value || '').trim() || ('Repas du ' + _dJournalDateOuverte);
  try {
    const res = await api('creerMenu', { nom, aliments: _dMenuDraft.aliments });
    if (!res || !res.ok) { showToast('Erreur lors de la création.', '#c0392b'); return; }
    const res2 = await api('ajouterSlotJournal', { date: _dJournalDateOuverte, type: 'menu', ref: res.menuId, label: nom });
    if (!res2 || !res2.ok) { showToast(res2 && res2.erreur === 'jour_complet' ? 'Cette journée compte déjà 7 repas.' : 'Erreur.', '#c0392b'); return; }
    _dMenus = await api('listerMenus');
    _dJournal = await api('listerJournal');
    _dMenuDraft = null;
    _dJournalAjoutEtape = null;
    setPage('diete');
  } catch(e) { showToast('Erreur : ' + e.message, '#c0392b'); }
}

async function choisirDieteJournal(ligne, col, nom) {
  setPage('diete-loading');
  try {
    const detail = await _resoudreDieteDetail(ligne, col);
    _dJournalDieteChoisie = { ligne, col, nom, repas: detail.repas || [] };
    _dJournalAjoutEtape = 'coach-repas';
  } catch(e) {}
  setPage('diete');
}

async function ajouterSlotCoach(idx) {
  const dc = _dJournalDieteChoisie;
  const r = dc && dc.repas[idx];
  if (!r) return;
  const ref = dc.ligne + '|' + dc.col + '|' + idx;
  const label = r.nom + ' · ' + dc.nom;
  try {
    const res = await api('ajouterSlotJournal', { date: _dJournalDateOuverte, type: 'coach', ref, label });
    if (!res || !res.ok) { showToast(res && res.erreur === 'jour_complet' ? 'Cette journée compte déjà 7 repas.' : 'Erreur.', '#c0392b'); return; }
    _dJournal = await api('listerJournal');
    _dJournalAjoutEtape = null;
    _dJournalDieteChoisie = null;
    setPage('diete');
  } catch(e) { showToast('Erreur : ' + e.message, '#c0392b'); }
}

async function ajouterSlotMenu(menuId) {
  const m = (_dMenus||[]).find(mm => mm.menuId === menuId);
  if (!m) return;
  try {
    const res = await api('ajouterSlotJournal', { date: _dJournalDateOuverte, type: 'menu', ref: menuId, label: m.nom });
    if (!res || !res.ok) { showToast(res && res.erreur === 'jour_complet' ? 'Cette journée compte déjà 7 repas.' : 'Erreur.', '#c0392b'); return; }
    _dJournal = await api('listerJournal');
    _dJournalAjoutEtape = null;
    setPage('diete');
  } catch(e) { showToast('Erreur : ' + e.message, '#c0392b'); }
}

async function supprimerSlotJournalClient(ligne) {
  try {
    await api('supprimerSlotJournal', { ligne });
    _dJournal = await api('listerJournal');
    setPage('diete');
  } catch(e) {}
}

// ── Modale de recherche/ajout/création d'aliment (alimente _dMenuDraft) ──────

async function ouvrirAjoutAliment() {
  _dAjoutEtape = 'recherche';
  _dAjoutSelection = null;
  if (!_dBaseAliments) {
    _afficherModalAjout(true);
    try { _dBaseAliments = await api('chargerBaseAliments'); } catch(e) { _dBaseAliments = { coach: [], communaute: [] }; }
  }
  _afficherModalAjout(false);
}

function _tousLesAliments() {
  const b = _dBaseAliments || { coach: [], communaute: [] };
  return (b.coach || []).concat(b.communaute || []);
}

function _rechercherAlimentsLocal(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const matches = _tousLesAliments().filter(a => a.nom.toLowerCase().includes(q));
  matches.sort((a, b) => {
    const aStarts = a.nom.toLowerCase().startsWith(q), bStarts = b.nom.toLowerCase().startsWith(q);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    return a.nom.localeCompare(b.nom, 'fr');
  });
  return matches.slice(0, 20);
}

function onRechercheAlimentInput(val) {
  const cont = document.getElementById('dAjoutResultats');
  if (cont) cont.innerHTML = renderResultatsAliments(val);
}

function renderResultatsAliments(query) {
  const q = (query || '').trim();
  if (!q) return '<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px 0;">Tape le nom d\'un aliment…</div>';
  const results = _rechercherAlimentsLocal(q);
  const rowsHtml = results.map(a => {
    const badge = a.source === 'coach'
      ? '<span style="font-size:9px;font-weight:700;color:#378ADD;background:#378ADD18;border:1px solid #378ADD44;border-radius:4px;padding:1px 5px;">🧑‍🍳 base</span>'
      : `<span style="font-size:9px;font-weight:700;color:#a78bfa;background:#a78bfa18;border:1px solid #a78bfa44;border-radius:4px;padding:1px 5px;">👥 communauté${a.valide ? '' : ' · non validé'}</span>`;
    return `<div onclick="selectionnerAliment('${a.nom.replace(/'/g,"\\'")}','${a.source}')" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;">
      <div style="min-width:0;">
        <div style="font-size:14px;">${esc(a.nom)}</div>
        <div style="margin-top:3px;">${badge}</div>
      </div>
      <div style="font-size:12px;color:var(--muted);white-space:nowrap;margin-left:10px;">${Math.round(a.kcal*100)} kcal/100g</div>
    </div>`;
  }).join('');
  const creerBtn = `<button onclick="ouvrirCreationAliment('${q.replace(/'/g,"\\'")}')" style="width:100%;margin-top:10px;padding:10px;background:#2d3142;border:none;border-radius:8px;color:#a78bfa;font-size:13px;font-weight:600;cursor:pointer;">+ Créer "${esc(q)}" comme nouvel aliment</button>`;
  if (results.length === 0) {
    return `<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px 0;">Aucun résultat.</div>${creerBtn}`;
  }
  return rowsHtml + creerBtn;
}

function selectionnerAliment(nom, source) {
  const found = _tousLesAliments().find(a => a.nom === nom && a.source === source);
  if (!found) return;
  _dAjoutSelection = found;
  _dAjoutEtape = 'quantite';
  _afficherModalAjout(false);
}

function renderModalAjoutQuantite() {
  const a = _dAjoutSelection;
  const aDetail = a.sucres !== null; // base coach = pas de détail sucres/fibres/AGS
  return `
    <div style="font-size:11px;font-weight:600;color:#555e7a;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Ajouter</div>
    <div style="font-size:18px;font-weight:700;color:#f0f2ff;margin-bottom:16px;">${esc(a.nom)}</div>
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;color:#8892a4;margin-bottom:6px;">QUANTITÉ (g)</div>
      <input id="dAjoutQte" type="text" inputmode="numeric" placeholder="ex: 100" oninput="_majPreviewAjout()"
        style="width:100%;padding:12px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:10px;font-size:16px;box-sizing:border-box;">
    </div>
    <div id="dAjoutPreview" style="display:flex;justify-content:space-around;text-align:center;padding:12px 0;background:#0f1117;border-radius:10px;">
      <div><span style="font-size:14px;font-weight:600;">0</span><div class="macro-label">KCAL</div></div>
      <div><span style="font-size:14px;font-weight:600;color:#378ADD;">0</span><div class="macro-label">PROT</div></div>
      <div><span style="font-size:14px;font-weight:600;color:var(--green);">0</span><div class="macro-label">GLU</div></div>
      <div><span style="font-size:14px;font-weight:600;color:#D85A30;">0</span><div class="macro-label">LIP</div></div>
    </div>
    <div id="dAjoutPreviewDetail" style="font-size:11px;color:var(--muted);text-align:center;margin:8px 0 20px;">${aDetail ? 'dont sucres <span id="dPrevSucres">0</span>g · fibres <span id="dPrevFibres">0</span>g · dont AGS <span id="dPrevAgs">0</span>g' : ''}</div>
    <button onclick="_guardAction(confirmerAjoutAliment)" style="width:100%;padding:14px;background:linear-gradient(135deg,#a78bfa,#6d3fd6);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">Ajouter</button>
    <button onclick="_dAjoutEtape='recherche';_afficherModalAjout(false);" style="width:100%;margin-top:8px;padding:12px;background:#2d3142;border:none;border-radius:12px;color:#8892a4;font-size:14px;cursor:pointer;">‹ Retour</button>`;
}

function _majPreviewAjout() {
  const a = _dAjoutSelection;
  const prev = document.getElementById('dAjoutPreview');
  if (!prev || !a) return;
  const qte = parseFloat((document.getElementById('dAjoutQte')||{}).value) || 0;
  const vals = [Math.round(a.kcal*qte), Math.round(a.prot*qte), Math.round(a.glu*qte), Math.round(a.lip*qte)];
  prev.querySelectorAll('span').forEach((s, i) => { s.textContent = vals[i]; });
  if (a.sucres !== null) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = Math.round(v*qte); };
    set('dPrevSucres', a.sucres); set('dPrevFibres', a.fibres); set('dPrevAgs', a.ags);
  }
}

function confirmerAjoutAliment() {
  const a = _dAjoutSelection;
  const qte = parseFloat((document.getElementById('dAjoutQte')||{}).value) || 0;
  if (!a || qte <= 0 || !_dMenuDraft) return;
  _dMenuDraft.aliments.push({
    nom: a.nom, quantite: qte, kcal: a.kcal*qte, prot: a.prot*qte, glu: a.glu*qte,
    sucres: (a.sucres||0)*qte, fibres: (a.fibres||0)*qte, lip: a.lip*qte, ags: (a.ags||0)*qte
  });
  const modal = document.getElementById('modalAjoutAliment');
  if (modal) modal.remove();
  setPage('diete');
}

function ouvrirCreationAliment(nomPrerempli) {
  _dCreationNomPrerempli = nomPrerempli || '';
  _dAjoutEtape = 'creation';
  _afficherModalAjout(false);
}

function renderModalAjoutCreation() {
  return `
    <div style="font-size:11px;font-weight:600;color:#555e7a;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Nouvel aliment</div>
    <div style="font-size:13px;color:#8892a4;margin-bottom:16px;line-height:1.5;">Ajouté à la base communautaire, utilisable par tous — visible immédiatement mais marqué "non validé" jusqu'à ce que ton coach le confirme.</div>
    <div style="margin-bottom:12px;">
      <div style="font-size:11px;color:#8892a4;margin-bottom:6px;">NOM</div>
      <input id="dCreaNom" type="text" value="${esc(_dCreationNomPrerempli)}" placeholder="ex: Yaourt grec"
        style="width:100%;padding:12px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:10px;font-size:16px;box-sizing:border-box;">
    </div>
    <div style="font-size:11px;color:#8892a4;margin-bottom:6px;">POUR 100g</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
      <div><div style="font-size:10px;color:#8892a4;margin-bottom:4px;">Kcal</div><input id="dCreaKcal" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:8px;font-size:16px;box-sizing:border-box;"></div>
      <div><div style="font-size:10px;color:#8892a4;margin-bottom:4px;">Protéines (g)</div><input id="dCreaProt" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:8px;font-size:16px;box-sizing:border-box;"></div>
      <div><div style="font-size:10px;color:#8892a4;margin-bottom:4px;">Glucides (g)</div><input id="dCreaGlu" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:8px;font-size:16px;box-sizing:border-box;"></div>
      <div><div style="font-size:10px;color:#8892a4;margin-bottom:4px;">dont Sucres (g)</div><input id="dCreaSucres" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:8px;font-size:16px;box-sizing:border-box;"></div>
      <div><div style="font-size:10px;color:#8892a4;margin-bottom:4px;">Lipides (g)</div><input id="dCreaLip" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:8px;font-size:16px;box-sizing:border-box;"></div>
      <div><div style="font-size:10px;color:#8892a4;margin-bottom:4px;">dont AGS (g)</div><input id="dCreaAgs" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:8px;font-size:16px;box-sizing:border-box;"></div>
      <div style="grid-column:1 / -1;"><div style="font-size:10px;color:#8892a4;margin-bottom:4px;">Fibres (g)</div><input id="dCreaFibres" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:8px;font-size:16px;box-sizing:border-box;"></div>
    </div>
    <div style="font-size:11px;color:#555e7a;margin-bottom:12px;">Sucres, AGS et fibres sont optionnels.</div>
    <div id="dCreaErr" style="display:none;font-size:12px;color:#e05252;margin-bottom:12px;"></div>
    <button onclick="_guardAction(confirmerCreationAliment)" style="width:100%;padding:14px;background:linear-gradient(135deg,#a78bfa,#6d3fd6);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">Créer et ajouter</button>
    <button onclick="_dAjoutEtape='recherche';_afficherModalAjout(false);" style="width:100%;margin-top:8px;padding:12px;background:#2d3142;border:none;border-radius:12px;color:#8892a4;font-size:14px;cursor:pointer;">‹ Retour</button>`;
}

async function confirmerCreationAliment() {
  const val = id => parseFloat((document.getElementById(id).value||'').replace(',','.')) || 0;
  const nom = (document.getElementById('dCreaNom').value || '').trim();
  const kcal100   = val('dCreaKcal');
  const prot100   = val('dCreaProt');
  const glu100    = val('dCreaGlu');
  const sucres100 = val('dCreaSucres');
  const lip100    = val('dCreaLip');
  const ags100    = val('dCreaAgs');
  const fibres100 = val('dCreaFibres');
  const errEl = document.getElementById('dCreaErr');
  if (!nom) { errEl.textContent = 'Entre un nom.'; errEl.style.display = 'block'; return; }
  if (kcal100 <= 0) { errEl.textContent = 'Entre au moins les calories.'; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  try {
    const res = await api('ajouterAlimentCommunaute', {
      nom, kcal: kcal100/100, prot: prot100/100, glu: glu100/100,
      sucres: sucres100/100, fibres: fibres100/100, lip: lip100/100, ags: ags100/100
    });
    if (!res || !res.ok) { errEl.textContent = 'Erreur lors de la création.'; errEl.style.display = 'block'; return; }
    if (_dBaseAliments) _dBaseAliments.communaute.push(res.aliment);
    _dAjoutSelection = res.aliment;
    _dAjoutEtape = 'quantite';
    _afficherModalAjout(false);
  } catch(e) { errEl.textContent = 'Erreur : ' + e.message; errEl.style.display = 'block'; }
}

function _afficherModalAjout(loading) {
  const existant = document.getElementById('modalAjoutAliment');
  if (existant) existant.remove();
  const modal = document.createElement('div');
  modal.id = 'modalAjoutAliment';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:flex-end;';
  let contenu;
  if (loading) {
    contenu = '<div style="display:flex;justify-content:center;padding:40px 0;"><div class="spin"></div></div>';
  } else if (_dAjoutEtape === 'quantite') {
    contenu = renderModalAjoutQuantite();
  } else if (_dAjoutEtape === 'creation') {
    contenu = renderModalAjoutCreation();
  } else {
    contenu = `
      <div style="font-size:11px;font-weight:600;color:#555e7a;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Ajouter un aliment</div>
      <input id="dAjoutRecherche" type="text" placeholder="Chercher un aliment…" oninput="onRechercheAlimentInput(this.value)"
        style="width:100%;padding:12px;background:#0f1117;color:#e8eaf0;border:1px solid #2d3142;border-radius:10px;font-size:16px;box-sizing:border-box;margin-bottom:4px;">
      <div id="dAjoutResultats" style="max-height:50vh;overflow-y:auto;">${renderResultatsAliments('')}</div>
      <button onclick="document.getElementById('modalAjoutAliment').remove();" style="width:100%;margin-top:12px;padding:12px;background:#2d3142;border:none;border-radius:12px;color:#8892a4;font-size:14px;cursor:pointer;">Fermer</button>`;
  }
  modal.innerHTML = `<div style="background:#1a1f35;border-radius:20px 20px 0 0;padding:24px 20px calc(32px + env(safe-area-inset-bottom));width:100%;max-width:500px;margin:0 auto;box-sizing:border-box;max-height:85vh;overflow-y:auto;">
    <div style="width:36px;height:4px;background:#2d3142;border-radius:2px;margin:0 auto 20px;"></div>
    ${contenu}
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// Cale le bandeau de totaux (sticky) juste sous le header (sticky lui aussi,
// hauteur variable selon appareil/notch) pour qu'ils ne se chevauchent pas.
function initDieteStickyMacros() {
  const bar = document.getElementById('dStickyMacros');
  const header = document.querySelector('.header');
  if (!bar || !header) return;
  bar.style.top = header.offsetHeight + 'px';
}

function initDieteSliders(count) {
  for (let i = 0; i < count; i++) {
    const slider = document.getElementById('dSlider_' + i);
    const dots   = document.getElementById('dDots_'   + i);
    if (!slider || !dots) continue;
    const total = slider.children.length;
    const repasIdx = i;
    slider.addEventListener('scroll', function() {
      const idx = Math.round(slider.scrollLeft / slider.offsetWidth);
      dots.textContent = (idx + 1) + ' / ' + total;
      if (_dCurrentOpt[repasIdx] !== idx) {
        _dCurrentOpt[repasIdx] = idx;
        _recalcDieteTotal();
      }
    }, { passive: true });
  }
}
