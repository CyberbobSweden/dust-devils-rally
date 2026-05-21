// ─── SHARED SCREEN HELPERS ───────────────────────────────────────────────────
function btn(cx,x,y,w,h,bg,stroke,lw=1){
  cx.fillStyle=bg; cx.beginPath(); cx.roundRect(x,y,w,h,5); cx.fill();
  cx.strokeStyle=stroke; cx.lineWidth=lw; cx.stroke();
}

// ─── MAIN MENU ────────────────────────────────────────────────────────────────
const MENU_ITEMS=['▶  RACE','✦  GARAGE','⛟  TRACKS','★  LEADERBOARD'];
let menuSel=0;

function drawMenu(cx) {
  drawTrack(cx, {x:TRK[0].x,y:TRK[0].y}, getScale(true));
  drawVignette(cx);
  cx.fillStyle='rgba(0,0,0,.7)'; cx.fillRect(0,0,CW,CH);
  cx.textAlign='center';

  cx.fillStyle='#ffdd33'; cx.font='bold 30px monospace'; cx.fillText('DUST DEVILS',CW/2,CH*.17);
  cx.fillStyle='#ff8822'; cx.font='bold 22px monospace'; cx.fillText('RALLY',CW/2,CH*.17+36);
  cx.fillStyle='#ffdd22'; cx.font='bold 13px monospace'; cx.fillText('$'+S.coins+' coins',CW/2,CH*.17+62);
  if(S.name){ cx.fillStyle='rgba(255,255,255,.38)'; cx.font='11px monospace'; cx.fillText('Welcome back, '+S.name+'!',CW/2,CH*.17+80); }
  cx.fillStyle='rgba(255,200,100,.45)'; cx.font='9px monospace';
  cx.fillText('Track: '+(TDEF?TDEF.name:''), CW/2, CH*.17+98);

  MENU_ITEMS.forEach((label,i)=>{
    const by=CH*.46+i*50, hl=(menuSel===i);
    btn(cx,CW/2-128,by-22,256,40,hl?'rgba(255,221,51,.16)':'rgba(255,255,255,.06)',hl?'#ffdd33':'rgba(255,255,255,.18)',hl?2:1);
    cx.fillStyle=hl?'#ffdd33':'rgba(255,255,255,.7)';
    cx.font=(hl?'bold ':'')+' 14px monospace'; cx.fillText(label,CW/2,by+5);
  });

  cx.textAlign='right'; cx.fillStyle='rgba(255,255,255,.22)'; cx.font='9px monospace';
  cx.fillText(VERSION, CW-8, CH-18);
  cx.textAlign='center'; cx.fillStyle='rgba(255,200,100,.32)'; cx.font='9px monospace';
  cx.fillText('Made with ❤ by Risingbob · Umeå, Sweden', CW/2, CH-8);
}
function menuClick(mx,my){
  MENU_ITEMS.forEach((_,i)=>{
    const by=CH*.46+i*50;
    if(mx>=CW/2-128&&mx<=CW/2+128&&my>=by-22&&my<=by+18){
      menuSel=i;
      if(i===0) startRace();
      else if(i===1) state='garage';
      else if(i===2) state='tracks';
      else { state='leaderboard'; lbTab=0; if(!scoresLoading&&(!globalScores||scoresError))fbLoad(); }
    }
  });
}

// ─── TRACK SELECT ─────────────────────────────────────────────────────────────
function drawTrackSelect(cx){
  cx.fillStyle='#0a0a0e'; cx.fillRect(0,0,CW,CH);
  cx.fillStyle='rgba(0,0,0,.4)'; cx.fillRect(0,0,CW,52);
  cx.textAlign='left'; cx.fillStyle='rgba(255,255,255,.38)'; cx.font='11px monospace'; cx.fillText('< BACK',12,33);
  cx.textAlign='center'; cx.fillStyle='#ffdd33'; cx.font='bold 18px monospace'; cx.fillText('SELECT TRACK',CW/2,33);

  const n=ALL_TRACKS.length, cols=CW>CH?Math.min(n,5):Math.min(n,2);
  const cW=Math.min(190,(CW-20)/cols-10), cH=185, sx=(CW-(cW+10)*cols)/2;
  if(!S.unlockedTracks) S.unlockedTracks=[0];

  ALL_TRACKS.forEach((t,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const cx2=sx+col*(cW+10), cy2=62+row*(cH+10);
    const unlocked=S.unlockedTracks.includes(i), sel=(S.currentTrack||0)===i;
    const bt=S.bestTimes&&S.bestTimes[i];

    btn(cx,cx2,cy2,cW,cH,sel?'rgba(255,221,51,.15)':unlocked?'rgba(255,255,255,.07)':'rgba(0,0,0,.5)',sel?'#ffdd33':unlocked?'rgba(255,255,255,.2)':'rgba(255,255,255,.06)',sel?2:1);

    // Mini track preview
    cx.save(); cx.beginPath(); cx.rect(cx2+4,cy2+4,cW-8,cH-8); cx.clip();
    if(unlocked){
      const mini=buildSpline(t.raw,6);
      let mnx=Infinity,mxx=-Infinity,mny=Infinity,myx=-Infinity;
      for(const p of mini){mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y);myx=Math.max(myx,p.y);}
      const ms=Math.min((cW-16)/(mxx-mnx),(cH*0.55)/(myx-mny))*.9;
      const mox=cx2+cW/2-(mxx+mnx)/2*ms, moy=cy2+cH*.38-(myx+mny)/2*ms;
      cx.beginPath(); cx.moveTo(mox+mini[0].x*ms,moy+mini[0].y*ms);
      for(const p of mini) cx.lineTo(mox+p.x*ms,moy+p.y*ms);
      cx.closePath(); cx.strokeStyle=t.d1; cx.lineWidth=t.tw*ms*2; cx.lineJoin='round'; cx.stroke();
      cx.strokeStyle=t.d2; cx.lineWidth=t.tw*ms*1.4; cx.stroke();
    } else {
      cx.fillStyle='rgba(255,255,255,.08)'; cx.font='28px monospace'; cx.textAlign='center';
      cx.fillText('🔒', cx2+cW/2, cy2+cH*.42);
    }
    cx.restore();

    cx.textAlign='center';
    cx.fillStyle=unlocked?'#fff':'rgba(255,255,255,.3)'; cx.font='bold 11px monospace'; cx.fillText(t.name,cx2+cW/2,cy2+cH-52);
    cx.fillStyle='rgba(255,255,255,.35)'; cx.font='8px monospace'; cx.fillText(t.sub,cx2+cW/2,cy2+cH-39);
    if(bt){const bm=Math.floor(bt/60),bs=String(Math.floor(bt%60)).padStart(2,'0'),bms=String(Math.floor((bt%1)*100)).padStart(2,'0');cx.fillStyle='#88ffaa';cx.font='9px monospace';cx.fillText('Best: '+bm+':'+bs+'.'+bms,cx2+cW/2,cy2+cH-24);}
    if(!unlocked&&i>0){cx.fillStyle='rgba(255,180,50,.5)';cx.font='8px monospace';cx.fillText('Finish track '+(i)+' to unlock',cx2+cW/2,cy2+cH-24);}

    const bY=cy2+cH-13;
    if(sel){ btn(cx,cx2+8,bY-12,cW-16,18,'rgba(255,220,50,.3)','#ffdd33'); cx.fillStyle='#ffdd33'; cx.font='bold 8px monospace'; cx.fillText('SELECTED ✓',cx2+cW/2,bY+1); }
    else if(unlocked){ btn(cx,cx2+8,bY-12,cW-16,18,'rgba(100,210,100,.22)','rgba(100,210,100,.4)'); cx.fillStyle='#88ff88'; cx.font='bold 8px monospace'; cx.fillText('SELECT',cx2+cW/2,bY+1); }
  });
}
function trackSelectClick(mx,my){
  if(mx<90&&my<52){state='menu';return;}
  const n=ALL_TRACKS.length, cols=CW>CH?Math.min(n,5):Math.min(n,2);
  const cW=Math.min(190,(CW-20)/cols-10), cH=185, sx=(CW-(cW+10)*cols)/2;
  if(!S.unlockedTracks) S.unlockedTracks=[0];
  ALL_TRACKS.forEach((_,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const cx2=sx+col*(cW+10), cy2=62+row*(cH+10);
    if(mx>=cx2&&mx<=cx2+cW&&my>=cy2&&my<=cy2+cH&&S.unlockedTracks.includes(i)){
      S.currentTrack=i; activateTrack(i); doSave(); beep(440,.08);
    }
  });
}

// ─── GARAGE ──────────────────────────────────────────────────────────────────
function drawGarage(cx){
  cx.fillStyle='#100e08'; cx.fillRect(0,0,CW,CH);
  cx.fillStyle='rgba(0,0,0,.4)'; cx.fillRect(0,0,CW,52);
  cx.textAlign='left'; cx.fillStyle='rgba(255,255,255,.38)'; cx.font='11px monospace'; cx.fillText('< BACK',12,33);
  cx.textAlign='center'; cx.fillStyle='#ffdd33'; cx.font='bold 18px monospace'; cx.fillText('GARAGE',CW/2,33);
  cx.textAlign='right'; cx.fillStyle='#ffee44'; cx.font='bold 13px monospace'; cx.fillText('$'+S.coins,CW-12,33);

  const cols=CW>CH?Math.min(5,CAR_DEFS.length):3;
  const cW=Math.min(148,(CW-16)/cols-8), cH=200, sX=(CW-(cW+8)*cols)/2;

  CAR_DEFS.forEach((def,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const cx2=sX+col*(cW+8), cy2=60+row*(cH+10);
    const owned=S.unlocked.includes(def.id), sel=S.selected===def.id;

    btn(cx,cx2,cy2,cW,cH,sel?'rgba(255,220,50,.14)':owned?'rgba(255,255,255,.06)':'rgba(0,0,0,.38)',sel?'#ffdd33':owned?'rgba(255,255,255,.22)':'rgba(255,255,255,.08)',sel?2:1);

    // Mini car preview
    cx.save(); cx.translate(cx2+cW/2,cy2+50);
    const bw=def.body==='wide'?44:def.body==='long'?36:40;
    const bh=def.body==='tall'?30:def.body==='low'?24:27;
    if(sel){cx.fillStyle='rgba(255,220,50,.22)';cx.beginPath();cx.arc(0,0,30,0,Math.PI*2);cx.fill();}
    cx.fillStyle=def.col; cx.beginPath(); cx.roundRect(-bw/2,-bh/2,bw,bh,3); cx.fill();
    const shG=cx.createLinearGradient(-bw/2,0,bw/2,0);
    shG.addColorStop(0,'rgba(255,255,255,0)');shG.addColorStop(.5,'rgba(255,255,255,.2)');shG.addColorStop(1,'rgba(0,0,0,.1)');
    cx.fillStyle=shG;cx.beginPath();cx.roundRect(-bw/2,-bh/2,bw,bh,3);cx.fill();
    cx.fillStyle='rgba(0,0,0,.42)';cx.beginPath();cx.roundRect(-bw*.3,-bh*.28,bw*.6,bh*.38,2);cx.fill();
    cx.fillStyle='#ffe87a';cx.fillRect(-bw/2,-bh/2,bw*.28,3);cx.fillRect(bw/2-bw*.28,-bh/2,bw*.28,3);
    cx.fillStyle='#ff3333';cx.fillRect(-bw/2,bh/2-3,bw*.28,3);cx.fillRect(bw/2-bw*.28,bh/2-3,bw*.28,3);
    cx.restore();

    cx.textAlign='center';
    cx.fillStyle=owned?'#fff':'rgba(255,255,255,.35)'; cx.font='bold 10px monospace'; cx.fillText(def.name,cx2+cW/2,cy2+80);
    cx.fillStyle='rgba(255,255,255,.28)'; cx.font='8px monospace';
    let line='', ly2=cy2+92;
    def.desc.split(' ').forEach(w=>{const test=line+w+' ';if(cx.measureText(test).width>cW-10&&line){cx.fillText(line.trim(),cx2+cW/2,ly2);line=w+' ';ly2+=11;}else line=test;});
    cx.fillText(line.trim(),cx2+cW/2,ly2);

    const stats=[['SPD',def.top/540],['ACC',def.acc/450],['GRP',def.grip],['NOS',def.nos/1.3]];
    stats.forEach(([lbl,val],si)=>{
      const sy=cy2+115+si*17, bx=cx2+8;
      cx.fillStyle='rgba(255,255,255,.14)'; cx.fillRect(bx,sy,cW-16,5);
      cx.fillStyle=def.col; cx.fillRect(bx,sy,(cW-16)*Math.min(1,val),5);
      cx.fillStyle='rgba(255,255,255,.42)'; cx.font='7px monospace'; cx.textAlign='left'; cx.fillText(lbl,bx,sy-1);
    });

    const bY=cy2+cH-24, bX=cx2+8, bW=cW-16; cx.textAlign='center';
    if(sel){ btn(cx,bX,bY,bW,18,'rgba(255,220,50,.28)','#ffdd33'); cx.fillStyle='#ffdd33'; cx.font='bold 8px monospace'; cx.fillText('SELECTED ✓',cx2+cW/2,bY+12); }
    else if(owned){ btn(cx,bX,bY,bW,18,'rgba(100,210,100,.22)','rgba(100,200,100,.4)'); cx.fillStyle='#88ff88'; cx.font='bold 8px monospace'; cx.fillText('SELECT',cx2+cW/2,bY+12); }
    else { const can=S.coins>=def.price; btn(cx,bX,bY,bW,18,can?'rgba(255,200,50,.22)':'rgba(80,80,80,.22)',can?'#ffdd33':'rgba(130,130,130,.3)'); cx.fillStyle=can?'#ffdd33':'rgba(130,130,130,.5)'; cx.font='bold 8px monospace'; cx.fillText('BUY $'+def.price,cx2+cW/2,bY+12); }
  });
}
function garageClick(mx,my){
  if(mx<90&&my<52){state='menu';return;}
  const cols=CW>CH?Math.min(5,CAR_DEFS.length):3;
  const cW=Math.min(148,(CW-16)/cols-8), cH=200, sX=(CW-(cW+8)*cols)/2;
  CAR_DEFS.forEach((def,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const cx2=sX+col*(cW+8), cy2=60+row*(cH+10);
    if(mx>=cx2&&mx<=cx2+cW&&my>=cy2&&my<=cy2+cH){
      if(S.unlocked.includes(def.id)){ S.selected=def.id; doSave(); }
      else if(S.coins>=def.price){ S.coins-=def.price; S.unlocked.push(def.id); S.selected=def.id; doSave(); beep(660,.08); setTimeout(()=>beep(880,.2),110); }
      else beep(180,.15,.3,'sawtooth');
    }
  });
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
let lbTab=0;

function drawLeaderboard(cx){
  cx.fillStyle='#08080f'; cx.fillRect(0,0,CW,CH);
  cx.fillStyle='rgba(0,0,0,.4)'; cx.fillRect(0,0,CW,52);
  cx.textAlign='left'; cx.fillStyle='rgba(255,255,255,.38)'; cx.font='11px monospace'; cx.fillText('< BACK',12,33);
  cx.textAlign='center'; cx.fillStyle='#ffdd33'; cx.font='bold 18px monospace'; cx.fillText('LEADERBOARD',CW/2,33);

  // Tabs
  ['🌍 GLOBAL','📱 LOCAL'].forEach((t,i)=>{
    const active=lbTab===i;
    btn(cx,CW/2-72+i*76,41,70,20,active?'rgba(255,221,51,.18)':'rgba(255,255,255,.05)',active?'#ffdd33':'rgba(255,255,255,.15)',active?1.5:1);
    cx.fillStyle=active?'#ffdd33':'rgba(255,255,255,.45)'; cx.font=(active?'bold ':'')+' 10px monospace';
    cx.fillText(t, CW/2-72+i*76+35, 55);
  });

  // Reload button (global tab only)
  if(lbTab===0){ btn(cx,CW-58,57,46,18,'rgba(255,255,255,.14)','rgba(255,255,255,.3)'); cx.fillStyle='rgba(255,255,255,.5)'; cx.font='9px monospace'; cx.textAlign='center'; cx.fillText('↻ RELOAD',CW-35,69); }

  const rowH=36, startY=82;
  const scores = lbTab===0 ? (globalScores||[]) : S.scores;

  if(lbTab===0&&!FB_URL){
    cx.fillStyle='rgba(255,200,80,.75)'; cx.font='bold 13px monospace'; cx.textAlign='center';
    cx.fillText('Firebase not configured.', CW/2, CH*.4); return;
  }
  if(lbTab===0&&scoresLoading){
    cx.fillStyle='rgba(255,255,255,.4)'; cx.font='13px monospace'; cx.textAlign='center';
    cx.fillText('Loading'+'.'.repeat(Math.floor(Date.now()/400)%4), CW/2, CH/2); return;
  }
  if(lbTab===0&&scoresError){
    cx.fillStyle='rgba(255,100,80,.7)'; cx.font='13px monospace'; cx.textAlign='center';
    cx.fillText('Could not load scores.', CW/2, CH*.4); return;
  }
  if(!scores.length){
    cx.fillStyle='rgba(255,255,255,.38)'; cx.font='13px monospace'; cx.textAlign='center';
    cx.fillText(lbTab===0?'No global scores yet!':'No local races yet!', CW/2, CH/2); return;
  }

  scores.slice(0,Math.min(12,Math.floor((CH-startY-10)/rowH))).forEach((s,i)=>{
    const y=startY+i*rowH, mc=['#ffdd22','#aaaaaa','#cc8844'][i]||'rgba(255,255,255,.55)';
    const mm=Math.floor(s.time/60), sec=String(Math.floor(s.time%60)).padStart(2,'0'), ms=String(Math.floor((s.time%1)*100)).padStart(2,'0');
    const sfx=['ST','ND','RD'][s.pos-1]||'TH';
    const isMe = s.pid ? s.pid===S.pid : s.name===S.name;
    if(isMe){cx.fillStyle='rgba(255,221,51,.07)';cx.fillRect(8,y-14,CW-16,rowH-2);}
    cx.fillStyle=mc; cx.font=(i<3?'bold ':'')+String(i<3?13:12)+'px monospace';
    cx.textAlign='left'; cx.fillText((i+1)+'. '+s.name+(isMe?' ◄':''), 22, y);
    cx.textAlign='right'; cx.fillText(mm+':'+sec+'.'+ms, CW-105, y);
    cx.fillStyle='rgba(255,255,255,.3)'; cx.font='9px monospace';
    const trackName=s.track!==undefined?(' · '+(ALL_TRACKS[s.track]?.name||'')):'';
    cx.fillText(s.pos+sfx+trackName, CW-12, y);
    cx.fillStyle='rgba(255,255,255,.07)'; cx.fillRect(12,y+rowH*.7,CW-24,1);
  });
}
function leaderboardClick(mx,my){
  if(mx<90&&my<52){state='menu';return;}
  if(my>=41&&my<=61){
    if(mx>=CW/2-72&&mx<=CW/2+4){lbTab=0;if(!scoresLoading&&(!globalScores||scoresError))fbLoad();}
    if(mx>=CW/2+4&&mx<=CW/2+78) lbTab=1;
  }
  if(lbTab===0&&mx>=CW-58&&mx<=CW-12&&my>=57&&my<=75){globalScores=null;fbLoad();}
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
let resCoins=0, resReasons=[];

function drawResults(cx, cam, SC) {
  drawTrack(cx,cam,SC);
  drawVignette(cx);
  cx.fillStyle='rgba(0,0,0,.75)'; cx.fillRect(0,0,CW,CH);
  cx.textAlign='center';
  cx.fillStyle='#ffee22'; cx.font='bold 26px monospace'; cx.fillText('RACE FINISHED!',CW/2,CH*.17);
  // Already stored pos in resReasons[0] header - just show info
  cx.fillStyle='#fff'; cx.font='20px monospace'; cx.fillText(resReasons[0]||'',CW/2,CH*.29);
  cx.fillStyle='#88ffaa'; cx.font='16px monospace'; cx.fillText(resReasons[1]||'',CW/2,CH*.38);
  cx.fillStyle='#ffdd22'; cx.font='bold 20px monospace'; cx.fillText('+ $'+resCoins+' coins',CW/2,CH*.49);
  cx.fillStyle='rgba(255,255,255,.45)'; cx.font='11px monospace';
  resReasons.slice(2).forEach((r,i)=>cx.fillText(r,CW/2,CH*.57+i*17));

  [['RACE AGAIN',CW/2-110],['MAIN MENU',CW/2+10]].forEach(([lbl,bx])=>{
    btn(cx,bx,CH*.8-18,105,34,'rgba(255,255,255,.1)','rgba(255,255,255,.28)');
    cx.fillStyle='rgba(255,255,255,.8)'; cx.font='bold 11px monospace'; cx.textAlign='center';
    cx.fillText(lbl,bx+52,CH*.8+2);
  });
}
function resultsClick(mx,my){
  if(my>CH*.76){ if(mx<CW/2) startRace(); else state='menu'; }
}
