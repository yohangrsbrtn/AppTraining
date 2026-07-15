// ── Diète page ────────────────────────────────────────────────────────

let _dSubPage = 'list'; // 'list' | 'detail'
let _dDietes  = [];
let _dDetail  = null;
let _dNom     = '';

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
    _dDetail  = await api('chargerDieteParPosition', { ligneTitre: ligne, colTitre: col });
    _dSubPage = 'detail';
    setPage('diete');
  } catch(e) { setPage('diete'); }
}

// ── Render ────────────────────────────────────────────────────────────

function renderDietePage() {
  if (S.page === 'diete-loading') {
    return `<div id="app">${renderHeader('Ma Diète','',false)}<div class="page">${renderSpinner()}</div>${renderNavBar('diete')}</div>`;
  }
  if (_dSubPage === 'detail' && _dDetail) return renderDieteDetail();
  return renderDieteList();
}

function renderDieteList() {
  if (!_dDietes || _dDietes.length === 0) {
    return `<div id="app">
      ${renderHeader('Ma Diète', '', false)}
      <div class="page"><div class="empty"><div class="empty-icon">🥗</div><div class="empty-text">Aucune diète trouvée.</div></div></div>
      ${renderNavBar('diete')}
    </div>`;
  }

  const rows = _dDietes.map(d => `
    <div class="diete-item" onclick="ouvrirDiete(${d.ligne}, ${d.col}, '${(d.nom||'').replace(/'/g,"\\'")}')">
      <div class="diete-bar"></div>
      <span style="padding-left:8px;font-size:15px;font-weight:700;">${esc(d.nom)}</span>
      <div class="diete-arrow">›</div>
    </div>`).join('');

  return `<div id="app">
    ${renderHeader('Ma Diète', 'Sélectionne ton type de journée', false)}
    <div class="page">${rows}</div>
    ${renderNavBar('diete')}
  </div>`;
}

function renderDieteDetail() {
  const data = _dDetail;
  let tCals = 0, tProt = 0, tGlu = 0, tLip = 0;
  (data.repas || []).forEach(r => {
    (r.aliments || []).forEach(a => {
      tCals += a.cals || 0; tProt += a.prot || 0;
      tGlu  += a.glu  || 0; tLip  += a.lip  || 0;
    });
  });

  let repasHtml = '';
  (data.repas || []).forEach((r, idx) => {
    const options = [r].concat(r.equivalences || []);
    const hasOpts = options.length > 1;

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

  return `<div id="app">
    ${renderHeader(esc(_dNom), 'Ma Diète', false)}
    <div class="page">
      <button class="btn-secondary" onclick="loadDiete()" style="margin-bottom:12px;">← Retour</button>
      <div class="card" style="display:flex;justify-content:space-around;text-align:center;padding:14px 8px;">
        <div><div style="font-size:20px;font-weight:700;">${Math.round(tCals)}</div><div class="macro-label">KCAL</div></div>
        <div><div style="font-size:20px;font-weight:700;color:#378ADD;">${Math.round(tProt)}</div><div class="macro-label">PROT</div></div>
        <div><div style="font-size:20px;font-weight:700;color:var(--green);">${Math.round(tGlu)}</div><div class="macro-label">GLU</div></div>
        <div><div style="font-size:20px;font-weight:700;color:#D85A30;">${Math.round(tLip)}</div><div class="macro-label">LIP</div></div>
      </div>
      ${repasHtml}
    </div>
    ${renderNavBar('diete')}
  </div>`;
}

function rendreCorpsRepas(r) {
  let sCals = 0, sProt = 0, sGlu = 0, sLip = 0;
  (r.aliments || []).forEach(a => {
    sCals += a.cals || 0; sProt += a.prot || 0;
    sGlu  += a.glu  || 0; sLip  += a.lip  || 0;
  });

  const aliments = (r.aliments || []).map(a => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="font-size:14px;">${esc(a.nom)}${a.modifie ? `<span style="display:inline-block;font-size:8px;font-weight:700;color:#f59e0b;background:#f59e0b18;border:1px solid #f59e0b44;border-radius:3px;padding:1px 4px;margin-left:5px;vertical-align:middle;">modifié</span>` : ''}</div>
      <div style="font-size:13px;color:var(--muted);white-space:nowrap;margin-left:10px;">${a.qte}${a.unite ? ' ' + a.unite : 'g'}</div>
    </div>`).join('');

  return `${aliments}
    <div style="display:flex;justify-content:space-around;text-align:center;margin-top:10px;padding-top:10px;border-top:1px solid #378ADD;">
      <div><span style="font-size:14px;font-weight:600;">${Math.round(sCals)}</span><div class="macro-label">KCAL</div></div>
      <div><span style="font-size:14px;font-weight:600;color:#378ADD;">${Math.round(sProt)}</span><div class="macro-label">PROT</div></div>
      <div><span style="font-size:14px;font-weight:600;color:var(--green);">${Math.round(sGlu)}</span><div class="macro-label">GLU</div></div>
      <div><span style="font-size:14px;font-weight:600;color:#D85A30;">${Math.round(sLip)}</span><div class="macro-label">LIP</div></div>
    </div>`;
}

function initDieteSliders(count) {
  for (let i = 0; i < count; i++) {
    const slider = document.getElementById('dSlider_' + i);
    const dots   = document.getElementById('dDots_'   + i);
    if (!slider || !dots) continue;
    const total = slider.children.length;
    slider.addEventListener('scroll', function() {
      const idx = Math.round(slider.scrollLeft / slider.offsetWidth);
      dots.textContent = (idx + 1) + ' / ' + total;
    }, { passive: true });
  }
}
