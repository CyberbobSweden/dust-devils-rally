// ─── CANVAS ──────────────────────────────────────────────────────────────────
const C=document.getElementById('c'), G=C.getContext('2d');
let CW, CH;
function resize(){ CW=C.width=innerWidth; CH=C.height=innerHeight; }
resize(); window.addEventListener('resize',resize);
if(!G.roundRect) G.roundRect=function(x,y,w,h){ this.rect(x,y,w,h); };

// ─── NAME SCREEN ─────────────────────────────────────────────────────────────
const NS=document.getElementById('nscreen');
const NF=document.getElementById('nfield');
document.getElementById('nbtn').addEventListener('click',()=>{
  const n=NF.value.trim().toUpperCase(); if(!n) return;
  S.name=n; doSave(); NS.style.display='none'; NF.blur(); initAudio();
});
NF.addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('nbtn').click(); });

// ─── INIT ────────────────────────────────────────────────────────────────────
loadSave();
if(!S.unlockedTracks) S.unlockedTracks=[0];
if(!S.bestTimes) S.bestTimes={};
activateTrack(S.currentTrack||0);
if(!S.name) NS.style.display='flex';

// ─── GAME STATE ───────────────────────────────────────────────────────────────
let state='menu', cdN=3, cdT=0, raceT=0;
let cam={x:0,y:0}, cars=[];
let camRot=0, camShake=0, camSX=0, camSY=0;

// ─── CONTROLS ────────────────────────────────────────────────────────────────
let ctrlL=false, ctrlR=false, ctrlB=false, ctrlN=false;
const AT={};

function updCtrl(){
  ctrlL=ctrlR=ctrlB=ctrlN=false;
  const lay=ctrlLayout();
  for(const id in AT){
    const {x,y}=AT[id];
    if(Math.hypot(x-lay.nos.x,y-lay.nos.y)<lay.nos.r){ ctrlN=true; continue; }
    if(Math.hypot(x-lay.brk.x,y-lay.brk.y)<lay.brk.r){ ctrlB=true; continue; }
    if(x>=lay.lz.x&&x<lay.lz.x+lay.lz.w&&y>=lay.lz.y) ctrlL=true;
    if(x>=lay.rz.x&&x<lay.rz.x+lay.rz.w&&y>=lay.rz.y) ctrlR=true;
  }
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────
C.addEventListener('touchstart',e=>{
  e.preventDefault(); initAudio();
  for(const t of e.changedTouches) AT[t.identifier]={x:t.clientX,y:t.clientY};
  const t=e.changedTouches[0];
  if(state==='menu')        menuClick(t.clientX,t.clientY);
  else if(state==='garage') garageClick(t.clientX,t.clientY);
  else if(state==='tracks') trackSelectClick(t.clientX,t.clientY);
  else if(state==='leaderboard') leaderboardClick(t.clientX,t.clientY);
  else if(state==='results') resultsClick(t.clientX,t.clientY);
  updCtrl();
},{passive:false});
C.addEventListener('touchend',e=>{ e.preventDefault(); for(const t of e.changedTouches) delete AT[t.identifier]; updCtrl(); },{passive:false});
C.addEventListener('touchmove',e=>{ e.preventDefault(); for(const t of e.changedTouches) AT[t.identifier]={x:t.clientX,y:t.clientY}; updCtrl(); },{passive:false});
C.addEventListener('click',e=>{
  initAudio();
  if(state==='menu')        menuClick(e.clientX,e.clientY);
  else if(state==='garage') garageClick(e.clientX,e.clientY);
  else if(state==='tracks') trackSelectClick(e.clientX,e.clientY);
  else if(state==='leaderboard') leaderboardClick(e.clientX,e.clientY);
  else if(state==='results') resultsClick(e.clientX,e.clientY);
});
window.addEventListener('keydown',e=>{
  initAudio();
  if(e.key==='ArrowLeft' ||e.key==='a') ctrlL=true;
  if(e.key==='ArrowRight'||e.key==='d') ctrlR=true;
  if(e.key==='ArrowDown' ||e.key==='s') ctrlB=true;
  if(e.key===' '||e.key==='ArrowUp'){ e.preventDefault(); ctrlN=true; }
  if(state==='menu'){
    if(e.key==='ArrowDown') menuSel=(menuSel+1)%MENU_ITEMS.length;
    if(e.key==='ArrowUp')   menuSel=(menuSel+MENU_ITEMS.length-1)%MENU_ITEMS.length;
    if(e.key==='Enter'){
      if(menuSel===0) startRace();
      else if(menuSel===1) state='garage';
      else if(menuSel===2) state='tracks';
      else { state='leaderboard'; lbTab=0; if(!scoresLoading&&(!globalScores||scoresError))fbLoad(); }
    }
  }
  if(['garage','tracks','leaderboard'].includes(state)&&(e.key==='Escape'||e.key==='Backspace')) state='menu';
  if(state==='results'){ if(e.key==='Enter') startRace(); if(e.key==='Escape') state='menu'; }
});
window.addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft' ||e.key==='a') ctrlL=false;
  if(e.key==='ArrowRight'||e.key==='d') ctrlR=false;
  if(e.key==='ArrowDown' ||e.key==='s') ctrlB=false;
  if(e.key===' '||e.key==='ArrowUp')    ctrlN=false;
});

// ─── RACE SETUP ──────────────────────────────────────────────────────────────
function setupRace(){
  const t0=TRK[0], t1=TRK[1];
  let dx=t1.x-t0.x, dy=t1.y-t0.y, ln=Math.sqrt(dx*dx+dy*dy)||1; dx/=ln; dy/=ln;
  const nx=-dy, ny=dx;
  const sa=Math.atan2(t1.x-t0.x,-(t1.y-t0.y));
  const pl=new Car(t0.x,t0.y,sa,S.selected,true);

  // 4 AI cars on a 2x2 grid behind player
  const pool=['turbo','rally','drift','muscle','banger'].filter(id=>id!==S.selected);
  const ai=[];
  [[-1,1],[1,1],[-1,2],[1,2]].forEach(([s,row],i)=>{
    const car=new Car(t0.x-dx*55*row+nx*28*s, t0.y-dy*55*row+ny*28*s, sa, pool[i]||pool[i%pool.length]);
    car.aiI=(i+1)*8; car.aiM=0.70+i*0.04;
    ai.push(car);
  });

  return { pl, ai, cam:{x:t0.x,y:t0.y} };
}

function startRace(){
  const g=setupRace();
  cars=[g.pl,...g.ai];
  cam=g.cam;
  parts=[]; driftPops=[];
  cdN=3; cdT=0; raceT=0;
  camRot=0; camShake=0; camSX=0; camSY=0;
  state='countdown';
  beep(440,.12);
}

function finishRace(){
  stopEngine(); setScreech(false);
  const sorted=[...cars].sort((a,b)=>b.total-a.total);
  const pos=sorted.indexOf(cars[0])+1;
  const base=[200,120,70][pos-1]||50;
  let earned=base;
  const sfx=['ST','ND','RD'][pos-1]||'TH';
  const m=Math.floor(raceT/60),s=String(Math.floor(raceT%60)).padStart(2,'0'),ms=String(Math.floor((raceT%1)*100)).padStart(2,'0');
  resReasons=[pos+sfx+' place – '+m+':'+s+'.'+ms, 'Base prize: $'+base];
  if(!cars[0].wentOff){ earned+=40; resReasons.push('Clean race bonus: +$40'); }
  if(raceT<110&&pos===1){ earned+=60; resReasons.push('Speed bonus: +$60'); }
  S.coins+=earned; resCoins=earned;

  // Track best time + unlock next
  const tid=S.currentTrack||0;
  if(!S.bestTimes[tid]||raceT<S.bestTimes[tid]) S.bestTimes[tid]=raceT;
  if(!S.unlockedTracks.includes(tid+1)&&tid+1<ALL_TRACKS.length){
    S.unlockedTracks.push(tid+1);
    resReasons.push('🏆 Unlocked: '+ALL_TRACKS[tid+1].name+'!');
    setTimeout(()=>{ beep(554,.1); setTimeout(()=>beep(659,.1),120); setTimeout(()=>beep(880,.25),240); },300);
  }

  const entry={name:S.name||'ANON',time:raceT,pos,car:S.selected,track:tid};
  S.scores.push(entry); S.scores.sort((a,b)=>a.time-b.time); S.scores=S.scores.slice(0,10);
  doSave(); fbSave(entry);
  state='results';
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
let lastT=0;
function loop(now){
  const dt=Math.min((now-lastT)/1000,0.05); lastT=now;
  const SC=getScale();
  G.clearRect(0,0,CW,CH);

  try {
    if(state==='menu'){
      drawMenu(G);

    } else if(state==='garage'){
      drawGarage(G);

    } else if(state==='tracks'){
      drawTrackSelect(G);

    } else if(state==='leaderboard'){
      drawTrack(G,{x:TRK[0].x,y:TRK[0].y},getScale(true));
      drawVignette(G);
      drawLeaderboard(G);

    } else if(state==='results'){
      drawResults(G,cam,getScale(true));

    } else {
      // countdown / racing
      if(state==='countdown'){
        cdT+=dt;
        if(cdT>=1){ cdT=0; cdN--; beep(cdN>0?440*Math.pow(1.25,3-cdN):880,cdN>0?.15:.3); if(cdN<=0) state='racing'; }
      } else if(state==='racing'){
        raceT+=dt;
        const pl=cars[0];
        for(const c of cars){
          const p=c.isP;
          c.update(dt, p?ctrlL:false, p?ctrlR:false, p?ctrlB:false, p?ctrlN:false, raceT);
        }
        doCollisions(cars);
        updParts(dt); updDriftPops(dt);
        if(Math.abs(pl.sp)>22&&Math.random()<0.3)
          addDust(pl.x,pl.y,pl.off?'#c08040':'#c8a878');
        updateEngine(pl.sp, pl.def.top);
        setScreech(pl.isDrifting&&!pl.off);
        // Camera look-ahead
        const la=90, tx=pl.x+Math.sin(pl.a)*la, ty=pl.y-Math.cos(pl.a)*la;
        cam.x+=(tx-cam.x)*.13; cam.y+=(ty-cam.y)*.13;
        // Shake decay
        camShake*=0.80; camSX=(Math.random()-.5)*camShake; camSY=(Math.random()-.5)*camShake;
        if(pl.lap>=LAPS) finishRace();
      }

      // World draw (with shake)
      G.save();
      G.translate(CW/2+camSX,CH/2+camSY); G.rotate(0); G.translate(-CW/2,-CH/2);
      drawTrack(G,cam,SC);
      drawParts(G,cam,SC);
      [...cars].sort((a,b)=>a.y-b.y).forEach(c=>c.draw(G,cam,SC));
      G.restore();

      drawVignette(G);
      if(state==='racing') drawSpeedLines(G, cars[0].speed(), cars[0].def.top);
      if(state==='racing') drawDriftPops(G,cam,SC);
      drawMinimap(G, cars);
      drawHUD(G, cars[0], cars, raceT);
      drawCtrl(G, ctrlL, ctrlR, ctrlN, ctrlB, cars[0], raceT);

      if(state==='countdown'){
        G.fillStyle='rgba(0,0,0,.3)'; G.fillRect(0,0,CW,CH);
        G.textAlign='center'; G.fillStyle='#ffee00';
        G.font=`bold ${Math.min(CW,CH)*.18}px monospace`;
        G.shadowColor='#ff8800'; G.shadowBlur=20;
        G.fillText(cdN>0?String(cdN):'GO!', CW/2, CH*.52);
        G.shadowBlur=0;
      }
    }
  } catch(err){
    console.error('Loop error:', err);
    G.fillStyle='rgba(0,0,0,.8)'; G.fillRect(0,0,CW,CH);
    G.fillStyle='#ff4444'; G.font='14px monospace'; G.textAlign='center';
    G.fillText('Error: '+err.message, CW/2, CH/2);
    G.fillStyle='rgba(255,255,255,.5)'; G.font='11px monospace';
    G.fillText('Tap to return to menu', CW/2, CH/2+28);
    state='menu'; camRot=0; camShake=0;
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(t=>{ lastT=t; requestAnimationFrame(loop); });
