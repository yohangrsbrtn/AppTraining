// ── Recettes page ─────────────────────────────────────────────────────

let _rSubPage = 'list'; // 'list' | 'detail'
let _rList    = [];
let _rDetail  = null;
let _rNom     = '';

async function loadRecettes() {
  setPage('recettes-loading');
  try {
    _rList    = await api('listerRecettes');
    _rSubPage = 'list';
    setPage('recettes');
  } catch(e) { setPage('home'); }
}

async function ouvrirRecette(fileId, nom) {
  _rNom = nom;
  setPage('recettes-loading');
  try {
    _rDetail  = await api('chargerRecette', { fileId });
    _rSubPage = 'detail';
    setPage('recettes');
  } catch(e) { setPage('recettes'); }
}

// ── Render ────────────────────────────────────────────────────────────

function renderRecettesPage() {
  if (_rSubPage === 'detail' && _rDetail) return renderRecetteDetail();
  return renderRecetteList();
}

function renderRecetteList() {
  if (!_rList || _rList.length === 0) {
    return `<div id="app">
      ${renderHeader('Recettes', '', false)}
      <div class="page"><div class="empty"><div class="empty-icon">🍽️</div><div class="empty-text">Aucune recette disponible.</div></div></div>
      ${renderNavBar('recettes')}
    </div>`;
  }

  const rows = _rList.map(r => `
    <div class="list-item" onclick="ouvrirRecette('${r.id}','${(r.nom||'').replace(/'/g,"\\'")}')">
      <div class="list-icon">🍽️</div>
      <div class="list-text"><div class="list-title">${esc(r.nom)}</div></div>
      <div class="list-arrow" style="color:#f97316;">›</div>
    </div>`).join('');

  return `<div id="app">
    ${renderHeader('Recettes', `${_rList.length} recette${_rList.length > 1 ? 's' : ''}`, false)}
    <div class="page"><div class="card">${rows}</div></div>
    ${renderNavBar('recettes')}
  </div>`;
}

function renderRecetteDetail() {
  const data = _rDetail;
  let html = '';
  let inList = false;

  (data.elements || []).forEach(el => {
    if (el.type === 'li') {
      if (!inList) { html += '<div style="background:#0f1117;border-radius:10px;padding:12px 16px;margin-bottom:10px;"><ul style="margin:0;padding-left:18px;">'; inList = true; }
      html += `<li style="color:#c8d0e0;font-size:14px;margin-bottom:7px;line-height:1.6;padding-left:${(el.indent||0)*12}px;">${el.text}</li>`;
    } else {
      if (inList) { html += '</ul></div>'; inList = false; }
      if      (el.type === 'h1') html += `<div style="font-size:17px;font-weight:700;color:#f97316;margin:20px 0 10px;padding-bottom:8px;border-bottom:1px solid #f9731633;">${el.text}</div>`;
      else if (el.type === 'h2') html += `<div style="font-size:15px;font-weight:700;margin:16px 0 8px;">${el.text}</div>`;
      else if (el.type === 'h3') html += `<div style="font-size:12px;font-weight:700;color:#f97316cc;margin:12px 0 6px;text-transform:uppercase;letter-spacing:1px;">${el.text}</div>`;
      else if (el.type === 'p')  html += `<div style="font-size:14px;color:#c8d0e0;line-height:1.7;margin-bottom:8px;">${el.text}</div>`;
      else if (el.type === 'br') html += '<div style="height:6px;"></div>';
    }
  });
  if (inList) html += '</ul></div>';

  return `<div id="app">
    ${renderHeader(esc(_rNom || data.nom || 'Recette'), '', false)}
    <div class="page">
      <button class="btn-secondary" onclick="loadRecettes()" style="margin-bottom:16px;">← Toutes les recettes</button>
      <div style="font-size:20px;font-weight:700;color:#f97316;margin-bottom:18px;line-height:1.3;">${esc(data.nom||_rNom)}</div>
      ${html}
    </div>
    ${renderNavBar('recettes')}
  </div>`;
}
