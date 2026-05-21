// ─── TRACK DRAWING ───────────────────────────────────────────────────────────
function drawTrack(cx, cam, SC) {
  // Grass background (slightly oversized to cover camera rotation corners)
  cx.fillStyle = TDEF.grass;
  cx.fillRect(-200,-200,CW+400,CH+400);

  cx.save();
  cx.translate(CW/2-cam.x*SC, CH/2-cam.y*SC);
  cx.scale(SC, SC);

  // Rocks (behind trees)
  for(const r of ROCKS){
    cx.fillStyle='rgba(0,0,0,.18)';
    cx.beginPath(); cx.ellipse(r.x+2,r.y+2,r.r,r.r*.6,0,0,Math.PI*2); cx.fill();
    cx.fillStyle='#888878';
    cx.beginPath(); cx.ellipse(r.x,r.y,r.r,r.r*.65,-.3,0,Math.PI*2); cx.fill();
    cx.fillStyle='rgba(255,255,255,.12)';
    cx.beginPath(); cx.arc(r.x-r.r*.3,r.y-r.r*.3,r.r*.3,0,Math.PI*2); cx.fill();
  }

  // Trees
  for(const t of TREES){
    cx.fillStyle=TDEF.tc[t.g];
    cx.beginPath(); cx.arc(t.x,t.y,t.r*1.3,0,Math.PI*2); cx.fill();
    cx.fillStyle=TDEF.tc[(t.g+1)%3];
    cx.beginPath(); cx.arc(t.x-t.r*.2,t.y-t.r*.2,t.r,0,Math.PI*2); cx.fill();
    cx.fillStyle='rgba(60,35,10,.4)';
    cx.fillRect(t.x-2, t.y+t.r*.4, 4, t.r*.5);
  }

  // Track surface layers
  function tp(){
    cx.beginPath(); cx.moveTo(TRK[0].x,TRK[0].y);
    for(let i=1;i<TN;i++) cx.lineTo(TRK[i].x,TRK[i].y);
    cx.closePath();
  }
  cx.lineJoin='round'; cx.lineCap='round';
  tp(); cx.strokeStyle='rgba(0,0,0,.3)';    cx.lineWidth=TW*2+28; cx.stroke();
  tp(); cx.strokeStyle=TDEF.edge;           cx.lineWidth=TW*2+16; cx.stroke();
  tp(); cx.strokeStyle=TDEF.d1;             cx.lineWidth=TW*2;    cx.stroke();
  tp(); cx.strokeStyle=TDEF.d2;             cx.lineWidth=TW*2-30; cx.stroke();
  tp(); cx.strokeStyle='rgba(255,255,255,.06)'; cx.lineWidth=TW*2-62; cx.stroke();
  // Tire groove hints
  tp(); cx.strokeStyle='rgba(50,28,8,.18)'; cx.lineWidth=20; cx.stroke();
  // Centre dashes
  cx.setLineDash([24,28]);
  tp(); cx.strokeStyle='rgba(255,240,160,.18)'; cx.lineWidth=2.8; cx.stroke();
  cx.setLineDash([]);

  // Corner markers
  for(const m of MRKS){
    const col=m.alt?'#cc1010':'#eee';
    cx.fillStyle='rgba(0,0,0,.25)';
    cx.beginPath(); cx.arc(m.lx+1.5,m.ly+1.5,6,0,Math.PI*2); cx.fill();
    cx.fillStyle=col;
    cx.beginPath(); cx.arc(m.lx,m.ly,6,0,Math.PI*2); cx.fill();
    cx.fillStyle='rgba(0,0,0,.25)';
    cx.beginPath(); cx.arc(m.rx+1.5,m.ry+1.5,6,0,Math.PI*2); cx.fill();
    cx.fillStyle=col;
    cx.beginPath(); cx.arc(m.rx,m.ry,6,0,Math.PI*2); cx.fill();
  }

  // Start/finish checker
  const t0=TRK[0], t1=TRK[1];
  let fx=t1.x-t0.x, fy=t1.y-t0.y, fl=Math.sqrt(fx*fx+fy*fy)||1; fx/=fl; fy/=fl;
  const fnx=-fy, fny=fx;
  for(let k=0;k<8;k++){
    const f0=-TW+(k*TW*2/8), f1=f0+TW*2/8;
    cx.fillStyle=k%2===0?'#fff':'#222';
    cx.beginPath();
    cx.moveTo(t0.x+fnx*f0,   t0.y+fny*f0);
    cx.lineTo(t0.x+fnx*f1,   t0.y+fny*f1);
    cx.lineTo(t0.x+fnx*f1+fx*12, t0.y+fny*f1+fy*12);
    cx.lineTo(t0.x+fnx*f0+fx*12, t0.y+fny*f0+fy*12);
    cx.fill();
  }

  // Checkpoint gates — coloured bands across track
  const pl=cars[0]||null;
  CP_GATES.forEach((g,i)=>{
    const passed = pl && pl.nextCP>i;
    cx.save();
    cx.translate(g.cx, g.cy);
    cx.rotate(Math.atan2(g.tdy, g.tdx)); // perpendicular to track
    const hw=g.hw;
    cx.fillStyle=passed?'rgba(30,220,70,.2)':'rgba(255,200,40,.14)';
    cx.fillRect(-11,-hw,22,hw*2);
    cx.strokeStyle=passed?'rgba(30,230,80,.7)':'rgba(255,210,40,.6)';
    cx.lineWidth=6;
    cx.beginPath(); cx.moveTo(0,-hw); cx.lineTo(0,hw); cx.stroke();
    cx.strokeStyle=passed?'rgba(30,255,80,.85)':'rgba(255,215,40,.8)';
    cx.lineWidth=4;
    cx.beginPath(); cx.moveTo(-9,-8); cx.lineTo(0,8); cx.lineTo(9,-8); cx.stroke();
    cx.restore();
    if(!passed){
      cx.fillStyle='rgba(255,215,40,.75)';
      cx.font='bold 18px monospace'; cx.textAlign='center';
      cx.fillText(i+1, g.cx+g.nx*(TW+24), g.cy+g.ny*(TW+24));
    }
  });

  cx.restore();
}

// ─── MINIMAP ─────────────────────────────────────────────────────────────────
function drawMinimap(cx, cars) {
  const land=CW>CH, mw=land?90:76, mh=land?72:60;
  const mx=CW-mw-10, my=land?56:12;
  cx.save();
  cx.fillStyle='rgba(0,0,0,.52)';
  cx.beginPath(); cx.roundRect(mx,my,mw,mh,5); cx.fill();
  cx.strokeStyle='rgba(255,255,255,.14)'; cx.lineWidth=1; cx.stroke();

  let xn=Infinity,xx=-Infinity,yn=Infinity,yx=-Infinity;
  for(const p of TRK){xn=Math.min(xn,p.x);xx=Math.max(xx,p.x);yn=Math.min(yn,p.y);yx=Math.max(yx,p.y);}
  const ms=Math.min(mw/(xx-xn),mh/(yx-yn))*.82;
  const ox=mx+(mw-(xx-xn)*ms)/2, oy=my+(mh-(yx-yn)*ms)/2;
  const tp=p=>({x:ox+(p.x-xn)*ms, y:oy+(p.y-yn)*ms});

  cx.beginPath();
  let pt=tp(TRK[0]); cx.moveTo(pt.x,pt.y);
  for(const p of TRK){pt=tp(p); cx.lineTo(pt.x,pt.y);}
  cx.closePath(); cx.strokeStyle=TDEF.d1; cx.lineWidth=4.5; cx.stroke();

  // CP dots
  CP_GATES.forEach((g,i)=>{
    const cp=tp(g), passed=cars[0]&&cars[0].nextCP>i;
    cx.fillStyle=passed?'rgba(40,255,90,.7)':'rgba(255,200,40,.5)';
    cx.beginPath(); cx.arc(cp.x,cp.y,2.5,0,Math.PI*2); cx.fill();
  });

  // Car dots
  for(const c of cars){
    const cp=tp(c);
    cx.fillStyle=c.isP?'#fff':c.def.col;
    cx.beginPath(); cx.arc(cp.x,cp.y,c.isP?3.5:2.5,0,Math.PI*2); cx.fill();
  }
  cx.restore();
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function drawHUD(cx, pl, cars, raceT) {
  if(!pl) return;
  const land=CW>CH, bH=land?48:54;
  cx.fillStyle='rgba(0,0,0,.52)'; cx.fillRect(0,0,CW,bH);

  // Position
  const sorted=[...cars].sort((a,b)=>b.total-a.total);
  const pos=sorted.indexOf(pl)+1, sfx=['ST','ND','RD'][pos-1]||'TH';
  cx.fillStyle='#ffee22'; cx.font='bold 22px monospace'; cx.textAlign='left';
  cx.fillText(pos+sfx, 12, land?34:36);

  // Game title + version (tiny)
  cx.fillStyle='rgba(255,200,60,.38)'; cx.font='bold 7px monospace';
  cx.fillText('DUST DEVILS RALLY '+VERSION, 12, 11);

  // Lap
  cx.fillStyle='#fff'; cx.font='bold 15px monospace'; cx.textAlign='center';
  cx.fillText('LAP '+Math.min(pl.lap+1,LAPS)+'/'+LAPS, CW/2, land?28:29);

  // Track name
  cx.fillStyle='rgba(255,220,100,.45)'; cx.font='9px monospace';
  cx.fillText(TDEF.name, CW/2, land?bH-3:bH-2);

  // Timer
  const m=Math.floor(raceT/60), s=String(Math.floor(raceT%60)).padStart(2,'0');
  const ms=String(Math.floor((raceT%1)*100)).padStart(2,'0');
  cx.fillStyle='#88ffaa'; cx.font='11px monospace';
  cx.fillText(m+':'+s+'.'+ms, CW/2, land?43:46);

  // Speed
  cx.textAlign='right'; cx.fillStyle='#8899ff'; cx.font='bold 13px monospace';
  cx.fillText(Math.round(pl.speed()), land?CW-110:CW-92, land?32:32);
  cx.fillStyle='#445566'; cx.font='8px monospace';
  cx.fillText('km/h', land?CW-110:CW-92, land?44:44);

  // Coins
  cx.textAlign='left'; cx.fillStyle='#ffdd22'; cx.font='bold 11px monospace';
  cx.fillText('$'+S.coins, 12, land?bH+16:72);

  // Checkpoint bar
  const cpW=76, cpH=5, cpX=CW/2-cpW/2, cpY=land?bH-8:bH-6;
  cx.fillStyle='rgba(0,0,0,.4)'; cx.fillRect(cpX,cpY,cpW,cpH);
  cx.fillStyle='rgba(40,220,80,.7)'; cx.fillRect(cpX,cpY,cpW*(pl.nextCP/4),cpH);
  for(let i=1;i<4;i++){cx.fillStyle='rgba(255,255,255,.3)';cx.fillRect(cpX+cpW*(i/4)-.5,cpY,1,cpH);}

  // NOS bar
  const nW=66, nH=7, nX=12, nY=land?38:60;
  cx.fillStyle='rgba(0,0,0,.4)'; cx.fillRect(nX,nY,nW,nH);
  cx.fillStyle=pl.nos>38?'#44aaff':'#ff5522'; cx.fillRect(nX,nY,nW*(pl.nos/100),nH);
  cx.strokeStyle='rgba(255,255,255,.2)'; cx.lineWidth=1; cx.strokeRect(nX,nY,nW,nH);
  cx.fillStyle='rgba(180,220,255,.45)'; cx.font='7px monospace'; cx.textAlign='left';
  cx.fillText('NOS', nX, nY-1);

  // Drift indicator
  if(pl.isDrifting){
    const combo=pl._combo||0;
    cx.fillStyle=combo>10?'#ffaa00':'rgba(255,170,0,.7)';
    cx.font='bold 11px monospace'; cx.textAlign='left';
    cx.fillText(combo>0?'DRIFT x'+Math.floor(combo):'DRIFT!', 85, land?bH+16:72);
  }

  // Off-track warning
  if(pl.off && Math.floor(Date.now()/220)%2){
    cx.fillStyle='rgba(255,90,0,.7)'; cx.font='bold 12px monospace'; cx.textAlign='center';
    cx.fillText('! OFF TRACK !', CW/2, land?bH+18:72);
  }
}

// ─── TOUCH CONTROLS ───────────────────────────────────────────────────────────
function ctrlLayout(){
  const land=CW>CH;
  return land
    ? {lz:{x:0,y:0,w:CW*.24,h:CH}, rz:{x:CW*.76,y:0,w:CW*.24,h:CH},
       nos:{x:CW-64,y:CH-70,r:32},  brk:{x:CW-64,y:CH-142,r:26}}
    : {lz:{x:0,y:CH*.3,w:CW*.38,h:CH*.7}, rz:{x:CW*.62,y:CH*.3,w:CW*.38,h:CH*.7},
       nos:{x:CW/2,y:CH-55,r:32},   brk:{x:CW/2,y:CH-120,r:26}};
}
function drawCtrl(cx, ctrlL, ctrlR, ctrlN, ctrlB, pl, raceT) {
  const lay=ctrlLayout(), land=CW>CH, {lz,rz}=lay;
  cx.fillStyle=`rgba(255,255,255,${ctrlL?.07:.02})`; cx.fillRect(lz.x,lz.y,lz.w,lz.h);
  cx.fillStyle=`rgba(255,255,255,${ctrlR?.07:.02})`; cx.fillRect(rz.x,rz.y,rz.w,rz.h);

  const ly=land?CH*.62:lz.y+lz.h*.52;
  cx.strokeStyle=`rgba(255,255,255,${ctrlL?.82:.28})`; cx.lineWidth=2.5;
  cx.beginPath(); cx.moveTo(lz.x+lz.w*.5+18,ly-11); cx.lineTo(lz.x+lz.w*.5-18,ly); cx.lineTo(lz.x+lz.w*.5+18,ly+11); cx.stroke();
  const ry=land?CH*.62:rz.y+rz.h*.52;
  cx.strokeStyle=`rgba(255,255,255,${ctrlR?.82:.28})`;
  cx.beginPath(); cx.moveTo(rz.x+rz.w*.5-18,ry-11); cx.lineTo(rz.x+rz.w*.5+18,ry); cx.lineTo(rz.x+rz.w*.5-18,ry+11); cx.stroke();
  cx.fillStyle=`rgba(255,255,255,${ctrlL?.6:.18})`; cx.font='8px monospace'; cx.textAlign='center';
  cx.fillText('STEER', lz.x+lz.w*.5, ly+26);
  cx.fillStyle=`rgba(255,255,255,${ctrlR?.6:.18})`;
  cx.fillText('STEER', rz.x+rz.w*.5, ry+26);

  const nos=lay.nos, nA=ctrlN&&pl&&pl.nos>0;
  cx.beginPath(); cx.arc(nos.x,nos.y,nos.r,0,Math.PI*2);
  cx.fillStyle=nA?'rgba(20,100,255,.72)':'rgba(0,55,185,.28)'; cx.fill();
  cx.strokeStyle=nA?'#66ccff':'rgba(80,140,255,.38)'; cx.lineWidth=2; cx.stroke();
  cx.fillStyle=nA?'#fff':'rgba(140,190,255,.58)'; cx.font='bold 10px monospace'; cx.textAlign='center';
  cx.fillText('NOS', nos.x, nos.y+4);

  const brk=lay.brk;
  cx.beginPath(); cx.arc(brk.x,brk.y,brk.r,0,Math.PI*2);
  cx.fillStyle=ctrlB?'rgba(255,70,0,.7)':'rgba(180,60,0,.22)'; cx.fill();
  cx.strokeStyle=ctrlB?'#ff8844':'rgba(255,120,80,.32)'; cx.lineWidth=1.5; cx.stroke();
  cx.fillStyle=ctrlB?'#fff':'rgba(255,160,120,.5)'; cx.font='bold 9px monospace';
  cx.fillText('BRK', brk.x, brk.y+3);

  if(raceT<3.5){
    cx.globalAlpha=1-raceT/3.5;
    cx.fillStyle='rgba(255,220,100,1)'; cx.font='11px monospace'; cx.textAlign='center';
    cx.fillText('Touch left / right edges to steer', CW/2, CH-10);
    cx.globalAlpha=1;
  }
}

// ─── VISUAL FX ────────────────────────────────────────────────────────────────
function drawSpeedLines(cx, sp, top) {
  const t=Math.max(0,(sp-240)/(top-240)); if(t<=0)return;
  cx.save();
  for(let i=0;i<Math.floor(t*16);i++){
    const ang=(i/16)*Math.PI*2+Date.now()*.0004;
    const r1=Math.min(CW,CH)*.28+Math.random()*Math.min(CW,CH)*.12;
    const r2=r1+t*65+Math.random()*35;
    cx.strokeStyle=`rgba(255,255,255,${t*.13})`; cx.lineWidth=.8+Math.random()*.7;
    cx.beginPath();
    cx.moveTo(CW/2+Math.cos(ang)*r1, CH/2+Math.sin(ang)*r1);
    cx.lineTo(CW/2+Math.cos(ang)*r2, CH/2+Math.sin(ang)*r2);
    cx.stroke();
  }
  cx.restore();
}

function drawVignette(cx) {
  const r=Math.sqrt(CW*CW+CH*CH)*.5;
  const g=cx.createRadialGradient(CW/2,CH/2,r*.22,CW/2,CH/2,r*.88);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(1,'rgba(0,0,0,.52)');
  cx.fillStyle=g; cx.fillRect(0,0,CW,CH);
}
