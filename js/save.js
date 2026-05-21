// ─── SAVE DATA ───────────────────────────────────────────────────────────────
let S = {
  name:'', coins:0,
  unlocked:['banger'], selected:'banger',
  unlockedTracks:[0], currentTrack:0,
  bestTimes:{}, scores:[],
  pid: Math.random().toString(36).slice(2,10) // unique device ID, generated once
};

function loadSave() {
  try {
    const d=localStorage.getItem('ddr_v4');
    if(d) Object.assign(S, JSON.parse(d));
  } catch(e) {}
}
function doSave() {
  try { localStorage.setItem('ddr_v4', JSON.stringify(S)); } catch(e) {}
}

// ─── FIREBASE GLOBAL LEADERBOARD ─────────────────────────────────────────────
let globalScores=null, scoresLoading=false, scoresError=false;

async function fbSave(entry) {
  if(!FB_URL) return;
  try {
    await fetch(FB_URL+'/scores.json', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name: entry.name.substring(0,12),
        time: Math.round(entry.time*100)/100,
        pos:  entry.pos,
        car:  entry.car,
        track:entry.track,
        pid:  S.pid,        // device ID — ties score to device, not just name
        ts:   Date.now()
      })
    });
  } catch(e) { console.warn('Score upload failed:', e); }
}

async function fbLoad() {
  if(!FB_URL){ globalScores=[]; return; }
  scoresLoading=true; scoresError=false;
  try {
    const r=await fetch(FB_URL+'/scores.json');
    const d=await r.json();
    globalScores = d
      ? Object.values(d).filter(s=>s&&typeof s.time==='number'&&s.name)
          .sort((a,b)=>a.time-b.time).slice(0,15)
      : [];
  } catch(e) { scoresError=true; globalScores=[]; }
  scoresLoading=false;
}

async function fbReset() {
  if(!FB_URL) return;
  try { await fetch(FB_URL+'/scores.json',{method:'DELETE'}); globalScores=[]; }
  catch(e) {}
}
