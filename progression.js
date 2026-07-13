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
  const xpPct = p.pct || (p.xpNiveau && p.xpNiveauSuivant
    ? Math.min(100, Math.round((p.xpNiveau / p.xpNiveauSuivant) * 100)) : 0);
  const xpManquant = p.xpManquant != null ? p.xpManquant : ((p.xpNiveauSuivant || 100) - (p.xpNiveau || 0));

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
              <span style="font-size:10px;color:#8892a4;">${(p.xpNiveau||0).toLocaleString('fr')} XP</span>
              <span style="font-size:10px;color:${tc.c1};font-weight:600;">${xpManquant.toLocaleString('fr')} XP → Niv. ${niveau+1}</span>
            </div>
            <div style="height:5px;background:#1e2235;border-radius:3px;overflow:hidden;">
              <div style="height:100%;border-radius:3px;width:${xpPct}%;background:${tc.bar};transition:width .6s;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div style="background:linear-gradient(135deg,#0f1a10,#162a1a);border:1px solid #1D9E7555;border-radius:14px;padding:20px 12px;text-align:center;">
          <div style="font-size:30px;margin-bottom:8px;">📋</div>
          <div style="font-size:38px;font-weight:700;color:#1D9E75;line-height:1;">${p.nbBilansValides || 0}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:8px;">Bilans validés</div>
        </div>
        <div style="background:linear-gradient(135deg,#0a1220,#0f1e38);border:1px solid #378ADD55;border-radius:14px;padding:20px 12px;text-align:center;">
          <div style="font-size:30px;margin-bottom:8px;">🏋️</div>
          <div style="font-size:38px;font-weight:700;color:#378ADD;line-height:1;">${p.seancesValidees || 0}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:8px;">Séances validées</div>
        </div>
      </div>

      <div style="background:linear-gradient(135deg,#0f1520,#151e30);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:12px;display:flex;align-items:center;gap:16px;">
        <div style="font-size:36px;">🦶</div>
        <div>
          <div style="font-size:28px;font-weight:700;color:#f0f2ff;line-height:1;">${(p.pasTotal || 0).toLocaleString('fr')}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:5px;">Pas cumulés</div>
        </div>
      </div>

      <button class="btn-blue" onclick="loadCollection()" style="width:100%;margin-bottom:10px;">🏆 Ma collection</button>
      <button class="btn-secondary" onclick="goTo('home')">← Retour</button>
    </div>
    ${renderNavBar('home')}
  </div>`;
}
