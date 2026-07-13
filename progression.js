// ── Progression page ──────────────────────────────────────────────────

function getTierColors(tier) {
  switch(tier) {
    case 'bronze':     return {c1:'#d08040', c2:'#6a3010', bar:'linear-gradient(90deg,#6a3010,#d08040,#e8b060)'};
    case 'argent':     return {c1:'#c0c0c0', c2:'#585858', bar:'linear-gradient(90deg,#606060,#d0d0d0,#b0b0b0)'};
    case 'or':         return {c1:'#d4a820', c2:'#7a5000', bar:'linear-gradient(90deg,#7a5000,#d4a820,#f0d040)'};
    case 'platine':    return {c1:'#9090e8', c2:'#282870', bar:'linear-gradient(90deg,#282870,#9090e8,#b0b0ff)'};
    case 'diamant':    return {c1:'#00c8e8', c2:'#004860', bar:'linear-gradient(90deg,#004860,#00c8e8,#60e0ff)'};
    case 'legendaire': return {c1:'#c040e0', c2:'#500080', bar:'linear-gradient(90deg,#500080,#c040e0,#e060ff)'};
    default:           return {c1:'#a8b0c8', c2:'#404858', bar:'linear-gradient(90deg,#808898,#c0c8d8,#a8b0c8)'};
  }
}

async function loadProgression() {
  setPage('loading');
  try {
    if (!S.data.prog) S.data.prog = await api('chargerProgressionClient');
    setPage('progression');
  } catch(e) { setPage('home'); }
}

function renderProgressionPage() {
  const p = S.data.prog || {};
  const niveau = p.niveau || 1;
  const tier = niveauToTier(niveau);
  const tc = getTierColors(tier);
  const sz = tier === 'legendaire' ? 72 : tier === 'diamant' ? 66 : tier === 'platine' ? 60 : 54;
  const xpPct = p.pct || 0;
  const xpTotal = p.xpTotal || 0;
  const xpManquant = p.xpManquant != null ? p.xpManquant : 10;

  const titreId = p.titreActif || ((() => { try { return localStorage.getItem('titreActif_' + S.client) || null; } catch(e) { return null; } })());
  const titreDef = titreId && typeof TITRES_DEF !== 'undefined' ? TITRES_DEF.find(t => t.id === titreId) : null;
  const titreHtml = titreDef ? `<div style="margin-top:6px;"><span style="font-size:12px;font-weight:700;color:${titreDef.c1};background:${titreDef.c1}22;border:1px solid ${titreDef.c1}55;border-radius:6px;padding:3px 9px;">${titreDef.icon} ${titreDef.nom}</span></div>` : '';

  return `<div id="app">
    ${renderHeader('Progression', '', false)}
    <div class="page">

      <!-- Hero niveau -->
      <div style="
        background:linear-gradient(145deg,#131825 0%,${tc.c2}aa 30%,${tc.c2}ee 50%,${tc.c2}aa 70%,#131825 100%);
        border-radius:16px;border-top:3px solid ${tc.c1};
        border-left:1px solid ${tc.c1}44;border-right:1px solid ${tc.c1}44;border-bottom:1px solid ${tc.c1}33;
        padding:22px 18px;margin-bottom:14px;
        box-shadow:inset 0 1px 0 ${tc.c1}55,0 0 28px ${tc.c1}33,0 2px 16px rgba(0,0,0,0.5);">
        <div style="display:flex;align-items:center;gap:18px;">
          <div style="flex-shrink:0;">${getBadgeSVG(tier, sz, 'prog')}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:20px;font-weight:700;color:#f0f2ff;margin-bottom:2px;">${p.prenom || S.client}</div>
            <div style="font-size:13px;color:${tc.c1};font-weight:600;letter-spacing:.5px;">NIVEAU ${niveau}</div>
            ${titreHtml}
            <div style="margin-top:12px;display:flex;justify-content:space-between;margin-bottom:5px;">
              <span style="font-size:10px;color:#8892a4;">${xpTotal.toLocaleString('fr')} XP</span>
              <span style="font-size:10px;color:${tc.c1};font-weight:600;">${xpManquant.toLocaleString('fr')} XP → Niv. ${niveau+1}</span>
            </div>
            <div style="height:5px;background:#1e2235;border-radius:3px;overflow:hidden;">
              <div style="height:100%;border-radius:3px;width:${xpPct}%;background:${tc.bar};transition:width .6s;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
        <div style="background:#0f1a10;border:1px solid #1D9E7544;border-radius:12px;padding:16px 8px;text-align:center;">
          <div style="font-size:26px;margin-bottom:6px;">📋</div>
          <div style="font-size:30px;font-weight:700;color:#1D9E75;line-height:1;">${p.bilansValidies || 0}</div>
          <div style="font-size:10px;color:#8892a4;margin-top:6px;">Bilans</div>
        </div>
        <div style="background:#0a1220;border:1px solid #4f8ef744;border-radius:12px;padding:16px 8px;text-align:center;">
          <div style="font-size:26px;margin-bottom:6px;">🏋️</div>
          <div style="font-size:30px;font-weight:700;color:#4f8ef7;line-height:1;">${p.seancesValidees || 0}</div>
          <div style="font-size:10px;color:#8892a4;margin-top:6px;">Séances</div>
        </div>
        <div style="background:#0f1520;border:1px solid #555e7a44;border-radius:12px;padding:16px 8px;text-align:center;">
          <div style="font-size:26px;margin-bottom:6px;">🦶</div>
          <div style="font-size:22px;font-weight:700;color:#e8eaf0;line-height:1;">${(p.pasTotal||0) >= 1000 ? ((p.pasTotal||0)/1000).toFixed(1)+'k' : (p.pasTotal||0)}</div>
          <div style="font-size:10px;color:#8892a4;margin-top:6px;">Pas</div>
        </div>
      </div>

      <button class="btn-blue" onclick="loadCollection()" style="width:100%;margin-bottom:10px;">🏆 Ma collection</button>
      <button class="btn-secondary" onclick="loadHome()">← Accueil</button>
    </div>
  </div>`;
}
