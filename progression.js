// ── Progression page ──────────────────────────────────────────────────

async function loadProgression() {
  setPage('loading');
  try {
    if (!S.data.prog) S.data.prog = await api('chargerProgressionClient');
    setPage('progression');
  } catch(e) { setPage('home'); }
}

function renderProgressionPage() {
  const p = S.data.prog || {};
  const xpPct = p.xpNiveau && p.xpNiveauSuivant
    ? Math.min(100, Math.round((p.xpNiveau / p.xpNiveauSuivant) * 100)) : 0;

  return `<div id="app">
    ${renderHeader('Progression', '', false)}
    <div class="page">
      <div class="card" style="text-align:center;padding:28px 16px;">
        <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Niveau</div>
        <div style="font-size:56px;font-weight:700;color:var(--accent);line-height:1;">${p.niveau || 1}</div>
        <div style="font-size:16px;font-weight:600;margin-top:6px;">${p.prenom || S.client}</div>
        <div class="xp-bar-bg" style="margin-top:14px;"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px;">${(p.xpNiveau||0).toLocaleString('fr')} / ${(p.xpNiveauSuivant||100).toLocaleString('fr')} XP</div>
      </div>

      <div class="stats-row">
        <div class="card" style="margin-bottom:0;text-align:center;padding:20px 12px;">
          <div style="font-size:32px;margin-bottom:8px;">📋</div>
          <div style="font-size:36px;font-weight:700;color:var(--green);">${p.nbBilansValides || 0}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">Bilans validés</div>
        </div>
        <div class="card" style="margin-bottom:0;text-align:center;padding:20px 12px;">
          <div style="font-size:32px;margin-bottom:8px;">🏋️</div>
          <div style="font-size:36px;font-weight:700;color:#378ADD;">${p.seancesValidees || 0}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">Séances validées</div>
        </div>
      </div>

      <div class="card" style="text-align:center;padding:20px;">
        <div style="font-size:28px;margin-bottom:8px;">🦶</div>
        <div style="font-size:32px;font-weight:700;">${(p.pasTotal || 0).toLocaleString('fr')}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px;">Pas cumulés</div>
      </div>

      <button class="btn-blue" onclick="loadCollection()" style="width:100%;margin-bottom:10px;">🏆 Ma collection de titres</button>
      <button class="btn-secondary" onclick="goTo('home')">← Retour</button>
    </div>
    ${renderNavBar('home')}
  </div>`;
}
