// ── Collection page ───────────────────────────────────────────────────

const BADGES_NIVEAU = [
  {seuil:1,  tier:'debutant',   nom:'Débutant',  desc:'Premier pas dans l\'aventure'},
  {seuil:10, tier:'bronze',     nom:'Bronze',     desc:'Les bases sont posées'},
  {seuil:20, tier:'argent',     nom:'Argent',     desc:'La régularité commence à payer'},
  {seuil:30, tier:'or',         nom:'Or',         desc:'Une vraie machine de guerre'},
  {seuil:40, tier:'platine',    nom:'Platine',    desc:'L\'élite du coaching'},
  {seuil:50, tier:'diamant',    nom:'Diamant',    desc:'Au-delà des limites'},
  {seuil:60, tier:'Légendaire', nom:'Légendaire', desc:'Statut mythique'}
];

function getBadgeSVG(tier, sz, sfx) {
  sz=sz||44; sfx=sfx||'';
  function s5(cx,cy,r1,r2){let p='';for(let i=0;i<10;i++){const r=i%2?r2:r1,a=(i*36-90)*Math.PI/180;p+=+(cx+r*Math.cos(a)).toFixed(1)+','+ +(cy+r*Math.sin(a)).toFixed(1)+' ';}return p;}
  function s8(cx,cy,r1,r2){let p='';for(let i=0;i<16;i++){const r=i%2?r2:r1,a=(i*22.5-90)*Math.PI/180;p+=+(cx+r*Math.cos(a)).toFixed(1)+','+ +(cy+r*Math.sin(a)).toFixed(1)+' ';}return p;}
  function spk(cx,cy,radii,ir){let p='';radii.forEach((r,i)=>{const n=radii.length,a=(i*360/n-90)*Math.PI/180,va=((i+.5)*360/n-90)*Math.PI/180;p+=+(cx+r*Math.cos(a)).toFixed(1)+','+ +(cy+r*Math.sin(a)).toFixed(1)+' '+ +(cx+ir*Math.cos(va)).toFixed(1)+','+ +(cy+ir*Math.sin(va)).toFixed(1)+' ';});return p;}
  const gh=Math.round(sz*1.1);
  if(tier==='debutant')return`<svg viewBox="0 0 80 80" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="dbt_s${sfx}" cx="35%" cy="28%" r="65%"><stop offset="0%" stop-color="#C0C0C0"/><stop offset="45%" stop-color="#505050"/><stop offset="100%" stop-color="#050505"/></radialGradient><linearGradient id="dbt_r${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#060606"/><stop offset="35%" stop-color="#484848"/><stop offset="50%" stop-color="#686868"/><stop offset="65%" stop-color="#484848"/><stop offset="100%" stop-color="#060606"/></linearGradient><linearGradient id="dbt_t${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#B8B8B8"/><stop offset="100%" stop-color="#282828"/></linearGradient></defs><circle cx="42" cy="42" r="36" fill="#020202" opacity="0.45"/><circle cx="40" cy="40" r="38" fill="#030303"/><circle cx="40" cy="40" r="36" fill="url(#dbt_r${sfx})"/><circle cx="40" cy="40" r="27" fill="#030303"/><circle cx="40" cy="40" r="25" fill="url(#dbt_s${sfx})"/><polygon points="${s5(40,39,14,5)}" fill="url(#dbt_t${sfx})" stroke="#040404" stroke-width="0.5"/><text x="40" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="8" font-weight="bold" fill="#080808" opacity="0.5">I</text></svg>`;
  if(tier==='bronze')return`<svg viewBox="0 0 80 80" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="brz_s${sfx}" cx="35%" cy="28%" r="65%"><stop offset="0%" stop-color="#E8A060"/><stop offset="40%" stop-color="#8B4518"/><stop offset="100%" stop-color="#100500"/></radialGradient><linearGradient id="brz_r${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#100500"/><stop offset="35%" stop-color="#7A3810"/><stop offset="50%" stop-color="#C07030"/><stop offset="65%" stop-color="#7A3810"/><stop offset="100%" stop-color="#100500"/></linearGradient><linearGradient id="brz_t${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F0C888"/><stop offset="100%" stop-color="#5C2E0A"/></linearGradient></defs><circle cx="42" cy="42" r="36" fill="#040200" opacity="0.5"/><circle cx="40" cy="40" r="38" fill="#050200"/><circle cx="40" cy="40" r="36" fill="url(#brz_r${sfx})"/><circle cx="40" cy="40" r="27" fill="#050200"/><circle cx="40" cy="40" r="25" fill="url(#brz_s${sfx})"/><polygon points="${s5(40,39,14,5)}" fill="url(#brz_t${sfx})" stroke="#080300" stroke-width="0.5"/><text x="40" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="7" font-weight="bold" fill="#100500" opacity="0.6">II</text></svg>`;
  if(tier==='argent')return`<svg viewBox="0 0 80 80" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="arg_s${sfx}" cx="30%" cy="22%" r="68%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="18%" stop-color="#E8E8E8"/><stop offset="45%" stop-color="#909090"/><stop offset="100%" stop-color="#060606"/></radialGradient><linearGradient id="arg_r${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#030303"/><stop offset="30%" stop-color="#646464"/><stop offset="50%" stop-color="#D8D8D8"/><stop offset="70%" stop-color="#646464"/><stop offset="100%" stop-color="#030303"/></linearGradient><linearGradient id="arg_t${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="45%" stop-color="#C8C8C8"/><stop offset="100%" stop-color="#303030"/></linearGradient></defs><circle cx="42" cy="42" r="36" fill="#020202" opacity="0.5"/><circle cx="40" cy="40" r="38" fill="#040404"/><circle cx="40" cy="40" r="36" fill="url(#arg_r${sfx})"/><circle cx="40" cy="40" r="27" fill="#040404"/><circle cx="40" cy="40" r="25" fill="url(#arg_s${sfx})"/><polygon points="${s5(40,39,14,5)}" fill="url(#arg_t${sfx})" stroke="#060606" stroke-width="0.5"/><text x="40" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="7" font-weight="bold" fill="#060606" opacity="0.55">III</text></svg>`;
  if(tier==='or')return`<svg viewBox="0 0 80 80" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="or_s${sfx}" cx="33%" cy="26%" r="65%"><stop offset="0%" stop-color="#FFE880"/><stop offset="35%" stop-color="#A07810"/><stop offset="100%" stop-color="#0C0600"/></radialGradient><linearGradient id="or_r${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0C0600"/><stop offset="35%" stop-color="#806000"/><stop offset="50%" stop-color="#D4A820"/><stop offset="65%" stop-color="#806000"/><stop offset="100%" stop-color="#0C0600"/></linearGradient><linearGradient id="or_t${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFF0A0"/><stop offset="100%" stop-color="#6A4000"/></linearGradient></defs><circle cx="42" cy="42" r="36" fill="#030200" opacity="0.5"/><circle cx="40" cy="40" r="38" fill="#060400"/><circle cx="40" cy="40" r="36" fill="url(#or_r${sfx})"/><circle cx="40" cy="40" r="27" fill="#060400"/><circle cx="40" cy="40" r="25" fill="url(#or_s${sfx})"/><polygon points="${s5(40,39,14,5)}" fill="url(#or_t${sfx})" stroke="#0A0500" stroke-width="0.5"/><text x="40" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="8" font-weight="bold" fill="#0C0600" opacity="0.6">IV</text></svg>`;
  if(tier==='platine'){const sp=spk(40,44,[38,34,30,27,24,27,30,34],20),sp2=spk(40,44,[35,31,27,24,21,24,27,31],20);return`<svg viewBox="0 0 80 88" width="${sz}" height="${gh}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="plt_s${sfx}" cx="32%" cy="24%" r="68%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="12%" stop-color="#E8F0FF"/><stop offset="30%" stop-color="#9098D8"/><stop offset="60%" stop-color="#303070"/><stop offset="100%" stop-color="#07071A"/></radialGradient><linearGradient id="plt_r${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#04040F"/><stop offset="28%" stop-color="#4858C0"/><stop offset="50%" stop-color="#D8E8FF"/><stop offset="72%" stop-color="#4858C0"/><stop offset="100%" stop-color="#04040F"/></linearGradient><linearGradient id="plt_t${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#C0D0FF"/><stop offset="100%" stop-color="#1020A0"/></linearGradient><linearGradient id="plt_g${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F0D860"/><stop offset="50%" stop-color="#C8A020"/><stop offset="100%" stop-color="#806000"/></linearGradient></defs><polygon points="${sp}" fill="#04040F"/><polygon points="${sp}" fill="url(#plt_r${sfx})"/><polygon points="${sp2}" fill="none" stroke="url(#plt_g${sfx})" stroke-width="1.2" opacity="0.8"/><polygon points="${sp}" fill="none" stroke="#D8E8FF" stroke-width="0.6" opacity="0.4"/><circle cx="40" cy="44" r="20" fill="#04040F"/><circle cx="40" cy="44" r="18" fill="url(#plt_s${sfx})"/><circle cx="40" cy="44" r="17" fill="none" stroke="url(#plt_g${sfx})" stroke-width="1"/><polygon points="${s5(40,43,12,4.5)}" fill="url(#plt_t${sfx})" stroke="#04040F" stroke-width="0.5"/><polygon points="${s5(40,43,12,4.5)}" fill="none" stroke="#FFFFFF" stroke-width="0.5" opacity="0.5"/><circle cx="40" cy="43" r="4" fill="#04040F" opacity="0.6"/><text x="40" y="47" text-anchor="middle" font-family="Georgia,serif" font-size="8.5" font-weight="bold" fill="#D8E8FF">V</text></svg>`;}
  if(tier==='diamant'){const sp=spk(40,44,[40,37,33,28,25,22,25,28,33,37],17),sp2=spk(40,44,[37,34,30,25,22,19,22,25,30,34],17);return`<svg viewBox="0 0 80 88" width="${sz}" height="${gh}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="dia_s${sfx}" cx="30%" cy="22%" r="70%"><stop offset="0%" stop-color="#EFFFFF"/><stop offset="10%" stop-color="#A0F0FF"/><stop offset="28%" stop-color="#00C8F0"/><stop offset="55%" stop-color="#004878"/><stop offset="100%" stop-color="#000A18"/></radialGradient><linearGradient id="dia_r${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#000508"/><stop offset="28%" stop-color="#0068A8"/><stop offset="50%" stop-color="#00F0FF"/><stop offset="72%" stop-color="#0068A8"/><stop offset="100%" stop-color="#000508"/></linearGradient><linearGradient id="dia_t${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#EFFFFF"/><stop offset="50%" stop-color="#40E8FF"/><stop offset="100%" stop-color="#001840"/></linearGradient><linearGradient id="dia_gl${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00F8FF"/><stop offset="100%" stop-color="#0050A0"/></linearGradient></defs><polygon points="${sp}" fill="#000508"/><polygon points="${sp}" fill="url(#dia_r${sfx})"/><polygon points="${sp2}" fill="none" stroke="url(#dia_gl${sfx})" stroke-width="1.4" opacity="0.9"/><polygon points="${sp}" fill="none" stroke="#00F0FF" stroke-width="0.7" opacity="0.5"/><circle cx="40" cy="44" r="20" fill="#000508"/><circle cx="40" cy="44" r="18" fill="url(#dia_s${sfx})"/><circle cx="40" cy="44" r="17" fill="none" stroke="#00E8FF" stroke-width="1.2" opacity="0.6"/><polygon points="${s5(40,43,12,4.5)}" fill="url(#dia_t${sfx})" stroke="#000508" stroke-width="0.5"/><polygon points="${s5(40,43,12,4.5)}" fill="none" stroke="#00F0FF" stroke-width="0.6" opacity="0.6"/><circle cx="40" cy="43" r="4" fill="#000508" opacity="0.6"/><text x="40" y="47" text-anchor="middle" font-family="Georgia,serif" font-size="8" font-weight="bold" fill="#80F8FF">VI</text></svg>`;}
  if(tier==='legendaire'){const sp=spk(40,44,[42,39,35,31,27,23,20,23,27,31,35,39],15),sp2=spk(40,44,[39,36,32,28,24,20,17,20,24,28,32,36],15);return`<svg viewBox="0 0 80 88" width="${sz}" height="${gh}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="leg_s${sfx}" cx="30%" cy="22%" r="70%"><stop offset="0%" stop-color="#FFFAFF"/><stop offset="10%" stop-color="#F080FF"/><stop offset="28%" stop-color="#B020E8"/><stop offset="55%" stop-color="#500080"/><stop offset="100%" stop-color="#0A0015"/></radialGradient><linearGradient id="leg_r${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#060010"/><stop offset="28%" stop-color="#8000C0"/><stop offset="50%" stop-color="#FF60FF"/><stop offset="72%" stop-color="#8000C0"/><stop offset="100%" stop-color="#060010"/></linearGradient><linearGradient id="leg_t${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFF8FF"/><stop offset="50%" stop-color="#E060FF"/><stop offset="100%" stop-color="#280040"/></linearGradient><linearGradient id="leg_gl${sfx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFE040"/><stop offset="50%" stop-color="#D49020"/><stop offset="100%" stop-color="#805000"/></linearGradient></defs><polygon points="${sp}" fill="#060010"/><polygon points="${sp}" fill="url(#leg_r${sfx})"/><polygon points="${sp2}" fill="none" stroke="url(#leg_gl${sfx})" stroke-width="1.5" opacity="0.9"/><polygon points="${sp}" fill="none" stroke="#FF80FF" stroke-width="0.7" opacity="0.45"/><circle cx="40" cy="44" r="20" fill="#060010"/><circle cx="40" cy="44" r="18" fill="url(#leg_s${sfx})"/><circle cx="40" cy="44" r="17" fill="none" stroke="url(#leg_gl${sfx})" stroke-width="1.2"/><polygon points="${s8(40,43,11,4.5)}" fill="url(#leg_t${sfx})" stroke="#060010" stroke-width="0.4"/><polygon points="${s8(40,43,11,4.5)}" fill="none" stroke="#FFD700" stroke-width="0.5" opacity="0.6"/><circle cx="40" cy="43" r="4" fill="#060010" opacity="0.65"/><text x="40" y="47.5" text-anchor="middle" font-family="Georgia,serif" font-size="7.5" font-weight="bold" fill="#FFD700">VII</text></svg>`;}
  return '';
}

function niveauToTier(n) {
  return n>=60?'legendaire':n>=50?'diamant':n>=40?'platine':n>=30?'or':n>=20?'argent':n>=10?'bronze':'debutant';
}

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
    // Marquer tous les titres/emblèmes débloqués comme vus (retire le badge "🆕" sur Progression)
    const p = S.data.prog || {};
    const pt = p.pasTotal || 0, nb = p.bilansValidies || 0;
    const totalDebloques = TITRES_DEF.filter(b => (b.cat==='pas'?pt:b.cat==='bilan'?nb:b.cat==='seance'?(p.seancesValidees||0):(p.niveau||0)) >= b.seuil).length;
    try { localStorage.setItem('seenTitres_' + S.client, totalDebloques); } catch(e) {}
    p.seenTitres = totalDebloques;
    api('sauvegarderSeenTitres', { count: totalDebloques }).catch(() => {});
  } catch(e) { setPage('home'); }
}

function _colVal(cat) {
  const p = S.data.prog || {};
  if (cat === 'pas')    return p.pasTotal        || 0;
  if (cat === 'bilan')  return p.bilansValidies  || 0;
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
  const p = S.data.prog || {};
  const niveauActuel = p.niveau || 1;

  // ── Badges de niveau ──
  const badgesHtml = `
    <div class="section-title" style="color:var(--muted);">🏅 Badges de niveau</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px;">
      ${BADGES_NIVEAU.map((b, i) => {
        const unlocked = niveauActuel >= b.seuil;
        const sz = b.tier === 'legendaire' ? 70 : b.tier === 'diamant' ? 64 : b.tier === 'platine' ? 60 : 52;
        return `<div style="flex:0 0 calc(50% - 5px);background:#161b2e;border-radius:14px;
          border:1px solid ${unlocked ? '#2a3050' : '#161b2e'};padding:16px 12px;
          display:flex;flex-direction:column;align-items:center;gap:8px;
          opacity:${unlocked ? '1' : '0.45'};filter:${unlocked ? 'none' : 'grayscale(0.8)'};">
          ${getBadgeSVG(b.tier, sz, 'niv'+i)}
          <div style="font-size:13px;font-weight:700;color:${unlocked ? '#f0f2ff' : '#555e7a'};">${b.nom}</div>
          <div style="font-size:10px;color:#8892a4;">${unlocked ? '✅ Niveau ' + b.seuil : '🔒 Niveau ' + b.seuil}</div>
          <div style="font-size:10px;color:${unlocked ? 'var(--green)' : 'var(--muted)'};text-align:center;line-height:1.4;">${b.desc}</div>
        </div>`;
      }).join('')}
    </div>`;

  const catLabels = { pas: '🦶 Pas', bilan: '📋 Bilans', seance: '🏋️ Séances', niveau: '⭐ Titres de niveau' };
  const cats = ['seance', 'bilan', 'pas', 'niveau'];

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
      ${badgesHtml}
      ${html}
      <button class="btn-secondary" onclick="loadProgression()" style="margin-top:4px;">← Progression</button>
    </div>
    ${renderNavBar('home')}
  </div>`;
}

// ── Système de déblocage (level-up + titres) ──────────────────────────

function verifierDeblocages(p) {
  p = p || {};
  const deblocages = detecterDeblocagesNiveau(p.niveau || 1);
  const titres = detecterDeblocagesTitres(p.pasTotal||0, p.bilansValidies||0, p.seancesValidees||0, p.niveau||1);
  if (deblocages.length > 0 || titres.length > 0) afficherDeblocage(deblocages.concat(titres));
}

// Re-fetch la progression puis vérifie les déblocages — à appeler après
// toute action qui peut faire gagner de l'XP (séance, journée, bilan)
async function rafraichirProgressionEtDeblocages() {
  if (S.isCoach || _viewAsClientOverride) return;
  try {
    const p = await api('chargerProgressionClient');
    S.data.prog = p;
    verifierDeblocages(p);
  } catch(e) {}
}

function detecterDeblocagesNiveau(niveau) {
  const key = 'lastNiveau_' + getClient();
  let stored = null;
  try { stored = localStorage.getItem(key); } catch(e) {}
  try { localStorage.setItem(key, niveau); } catch(e) {}
  if (stored === null) return [];
  const ancien = parseInt(stored) || 0;
  if (niveau <= ancien) return [];
  const TIERS = {10:'bronze',20:'argent',30:'or',40:'platine',50:'diamant',60:'legendaire'};
  const TIERS_DESC = {bronze:'Les bases sont posées, la machine tourne',argent:'La régularité commence à payer',or:'Une vraie machine de guerre',platine:"L'élite du coaching",diamant:'Au-delà des limites — niveau rare',legendaire:'Statut mythique — légende vivante'};
  const TIERS_NOM = {bronze:'Bronze',argent:'Argent',or:'Or',platine:'Platine',diamant:'Diamant',legendaire:'Légendaire'};
  const LEVEL_DESCS = ['Continue comme ça — tu cartonnes !','Chaque séance te rapproche du sommet.','La régularité paie, toujours.','Tu ne lâches rien !','Impressionnant, continue ainsi.','Le travail paye — niveau après niveau.','Tu es sur la bonne voie.'];
  const result = [];
  for (let n = ancien + 1; n <= niveau; n++) {
    const tier = TIERS[n];
    if (tier) {
      result.push({type:'niveau', tier, nom:'Emblème '+TIERS_NOM[tier], desc:TIERS_DESC[tier]});
    } else {
      result.push({type:'levelup', niveau:n, desc:LEVEL_DESCS[n % LEVEL_DESCS.length]});
    }
  }
  return result;
}

function detecterDeblocagesTitres(pasTotal, nbBilans, nbSeances, niveau) {
  window._titresAnimes = window._titresAnimes || {};
  const nouveaux = [];
  const client = getClient();
  TITRES_DEF.forEach(b => {
    const key = 'lastTitre_' + client + '_' + b.id;
    let stored = null;
    try { stored = localStorage.getItem(key); } catch(e) {}
    const val = b.cat === 'pas' ? pasTotal : b.cat === 'bilan' ? nbBilans : b.cat === 'seance' ? (nbSeances||0) : (niveau||0);
    const etaitDebloque = stored === '1';
    const estDebloque = val >= b.seuil;
    try {
      if (estDebloque) localStorage.setItem(key, '1');
      else if (stored === null) localStorage.setItem(key, '0');
    } catch(e) {}
    if (estDebloque && !etaitDebloque && stored !== null && !window._titresAnimes[key]) {
      window._titresAnimes[key] = true;
      nouveaux.push({type:'titre', id:b.id, nom:b.nom, desc:b.cond, c1:b.c1, c2:b.c2, icon:b.icon});
    }
  });
  return nouveaux;
}

function afficherDeblocage(items) {
  if (!items || items.length === 0) return;
  window._deblocageQueue = (window._deblocageQueue || []).concat(items);
  if (!window._deblocageActif) afficherProchainDeblocage();
}

function afficherProchainDeblocage() {
  if (!window._deblocageQueue || window._deblocageQueue.length === 0) { window._deblocageActif = false; return; }
  window._deblocageActif = true;
  const item = window._deblocageQueue.shift();

  const old = document.getElementById('_deblocageOverlay');
  if (old) old.remove();

  if (item.type === 'levelup') {
    if (!document.getElementById('_dbkStyle')) {
      const st = document.createElement('style');
      st.id = '_dbkStyle';
      st.textContent = '@keyframes lvlFall{0%{transform:translateY(-20px) rotate(0deg);opacity:.8}100%{transform:translateY(110vh) rotate(400deg);opacity:0}}@keyframes lvlSway{0%,100%{margin-left:0}50%{margin-left:18px}}@keyframes lvlBurst{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(calc(-50% + var(--bx)),calc(-50% + var(--by))) scale(0);opacity:0}}';
      document.head.appendChild(st);
    }
    const ov = document.createElement('div');
    ov.id = '_deblocageOverlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(5,8,20,0.97);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;animation:fadeInModal 0.3s ease both;overflow:hidden;';
    const cfColors = ['#40C8FF','#60E0FF','#FFD700','#FF8040','#C080FF','#60E040','#f0f2ff','#FF6090'];
    for (let ci = 0; ci < 32; ci++) {
      const cd = document.createElement('div');
      const sz = (4 + Math.random()*6).toFixed(1), dur = (2.6 + Math.random()*3).toFixed(1), dly = (Math.random()*3.2).toFixed(2);
      cd.style.cssText = 'position:absolute;top:-12px;left:'+(Math.random()*100).toFixed(1)+'%;width:'+sz+'px;height:'+sz+'px;background:'+cfColors[ci%cfColors.length]+';border-radius:'+(Math.random()>.5?'50%':'2px')+';opacity:.75;pointer-events:none;animation:lvlFall '+dur+'s linear '+dly+'s infinite,lvlSway '+(dur*.55).toFixed(1)+'s ease-in-out '+dly+'s infinite;';
      ov.appendChild(cd);
    }
    for (let si = 0; si < 16; si++) {
      const sp = document.createElement('div');
      const ang = (si/16)*Math.PI*2, dist = 65 + Math.random()*90, spSz = (4+Math.random()*5).toFixed(1), spDly = (.1+Math.random()*.4).toFixed(2);
      sp.style.cssText = 'position:absolute;top:50%;left:50%;width:'+spSz+'px;height:'+spSz+'px;border-radius:50%;background:'+cfColors[si%cfColors.length]+';--bx:'+Math.round(Math.cos(ang)*dist)+'px;--by:'+Math.round(Math.sin(ang)*dist)+'px;animation:lvlBurst 1.3s ease-out '+spDly+'s both;';
      ov.appendChild(sp);
    }
    const inn = document.createElement('div');
    inn.style.cssText = 'text-align:center;max-width:300px;position:relative;z-index:1;width:100%;';
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:10px;font-weight:700;color:#40C8FF;text-transform:uppercase;letter-spacing:4px;margin-bottom:18px;animation:slideDown 0.45s ease both;';
    lbl.textContent = '⬆ Niveau atteint !';
    inn.appendChild(lbl);
    const bigN = document.createElement('div');
    bigN.style.cssText = 'font-size:96px;font-weight:900;line-height:1;color:#f0f2ff;font-family:Georgia,serif;text-shadow:0 0 80px #40A8FF44;animation:popIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;';
    bigN.textContent = item.niveau;
    inn.appendChild(bigN);
    const nivW = document.createElement('div');
    nivW.style.cssText = 'font-size:12px;color:#8892a4;letter-spacing:3px;margin-top:-4px;animation:slideUp2 0.45s ease 0.3s both;';
    nivW.textContent = 'N I V E A U';
    inn.appendChild(nivW);
    const dsc = document.createElement('div');
    dsc.style.cssText = 'font-size:13px;color:#40C8FF;margin-top:16px;line-height:1.5;animation:slideUp2 0.45s ease 0.4s both;';
    dsc.textContent = item.desc || 'Continue comme ça — tu cartonnes !';
    inn.appendChild(dsc);
    const btn = document.createElement('button');
    btn.style.cssText = 'margin-top:24px;width:100%;padding:15px;background:linear-gradient(90deg,#004A90,#40C8FF,#004A90);border:none;border-radius:14px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;animation:slideUp2 0.45s ease 0.5s both;';
    btn.textContent = 'Continuons ! 💪';
    btn.addEventListener('click', fermerDeblocage);
    inn.appendChild(btn);
    ov.appendChild(inn);
    document.body.appendChild(ov);
    return;
  }

  const tc = item.type === 'niveau'
    ? (typeof getTierColors === 'function' ? getTierColors(item.tier) : {c1:'#a8b0c8', c2:'#404858'})
    : {c1: item.c1 || '#a8b0c8', c2: item.c2 || '#404858'};

  const visuel = item.type === 'niveau'
    ? getBadgeSVG(item.tier, 120, 'dbk')
    : `<div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,${tc.c1}cc,${tc.c2});display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px ${tc.c1}66;font-size:44px;">${item.icon || '🏆'}</div>`;

  const overlay = document.createElement('div');
  overlay.id = '_deblocageOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(5,8,20,0.96);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;animation:fadeInModal 0.3s ease both;';
  const glow = document.createElement('div');
  glow.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,'+tc.c1+'18 0%,transparent 65%);pointer-events:none;animation:pulseGlow 2.5s ease infinite;';
  overlay.appendChild(glow);
  const inner = document.createElement('div');
  inner.style.cssText = 'text-align:center;max-width:310px;position:relative;z-index:1;width:100%;';
  const lbl2 = document.createElement('div');
  lbl2.style.cssText = 'font-size:10px;font-weight:700;color:'+tc.c1+';text-transform:uppercase;letter-spacing:4px;margin-bottom:22px;animation:slideDown 0.45s ease both;';
  lbl2.textContent = '🔓 Débloqué !';
  inner.appendChild(lbl2);
  const bwrap = document.createElement('div');
  bwrap.style.cssText = 'display:flex;justify-content:center;animation:popIn 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.08s both;';
  bwrap.innerHTML = visuel;
  inner.appendChild(bwrap);
  const nom = document.createElement('div');
  nom.style.cssText = 'font-size:24px;font-weight:800;color:#f0f2ff;margin-top:22px;text-shadow:0 0 24px '+tc.c1+'44;animation:slideUp2 0.45s ease 0.22s both;';
  nom.textContent = item.nom;
  inner.appendChild(nom);
  const desc = document.createElement('div');
  desc.style.cssText = 'font-size:13px;color:'+tc.c1+';margin-top:8px;line-height:1.5;animation:slideUp2 0.45s ease 0.32s both;';
  desc.textContent = item.desc;
  inner.appendChild(desc);
  const btn2 = document.createElement('button');
  btn2.style.cssText = 'margin-top:32px;width:100%;padding:15px;background:linear-gradient(90deg,'+tc.c2+','+tc.c1+','+tc.c2+');border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:700;box-shadow:0 4px 24px '+tc.c1+'44;-webkit-tap-highlight-color:transparent;cursor:pointer;animation:slideUp2 0.45s ease 0.42s both;';
  btn2.textContent = 'Super ! 🔥';
  btn2.addEventListener('click', fermerDeblocage);
  inner.appendChild(btn2);
  overlay.appendChild(inner);
  document.body.appendChild(overlay);
}

function fermerDeblocage() {
  const el = document.getElementById('_deblocageOverlay');
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.22s ease'; }
  setTimeout(() => { if (el && el.parentNode) el.remove(); afficherProchainDeblocage(); }, 240);
}
