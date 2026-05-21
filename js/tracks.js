// ─── SPLINE MATH ─────────────────────────────────────────────────────────────
function crPt(a,b,c,d,t) {
  const t2=t*t, t3=t2*t;
  return {
    x:.5*((2*b.x)+(-a.x+c.x)*t+(2*a.x-5*b.x+4*c.x-d.x)*t2+(-a.x+3*b.x-3*c.x+d.x)*t3),
    y:.5*((2*b.y)+(-a.y+c.y)*t+(2*a.y-5*b.y+4*c.y-d.y)*t2+(-a.y+3*b.y-3*c.y+d.y)*t3)
  };
}
function buildSpline(raw, steps) {
  const n=raw.length, out=[];
  for (let i=0; i<n; i++) {
    const a=raw[(i-1+n)%n], b=raw[i], c=raw[(i+1)%n], d=raw[(i+2)%n];
    for (let j=0; j<steps; j++) out.push(crPt(a,b,c,d,j/steps));
  }
  return out;
}
function seededRng(seed) {
  let s = seed|0;
  return () => {
    s = s + 0x6D2B79F5|0;
    let t = Math.imul(s^s>>>15, 1|s);
    t = t + Math.imul(t^t>>>7, 61|t) ^ t;
    return ((t^t>>>14)>>>0) / 4294967296;
  };
}

// ─── TRACK DEFINITIONS ───────────────────────────────────────────────────────
const ALL_TRACKS = [
  { name:'DUST DEVILS',  sub:'Classic dirt rally circuit',
    steps:18, tw:100, grass:'#3d7830', d1:'#b87840', d2:'#cc9060', edge:'#604520',
    tc:['#267020','#388030','#1e5418'],
    raw:[{x:450,y:880},{x:760,y:880},{x:1060,y:880},{x:1310,y:760},{x:1490,y:540},
         {x:1530,y:300},{x:1380,y:140},{x:1120,y:130},{x:870,y:100},{x:620,y:155},
         {x:390,y:290},{x:250,y:490},{x:220,y:710},{x:310,y:840}] },

  { name:'STONE PASS',   sub:'Tight mountain hairpins',
    steps:16, tw:82, grass:'#2a5520', d1:'#888878', d2:'#aaaaaa', edge:'#404040',
    tc:['#1e4418','#2a5c20','#163010'],
    raw:[{x:400,y:760},{x:660,y:760},{x:920,y:720},{x:1100,y:600},{x:1180,y:430},
         {x:1140,y:270},{x:980,y:165},{x:760,y:145},{x:560,y:190},{x:390,y:320},
         {x:290,y:490},{x:250,y:650},{x:290,y:740}] },

  { name:'DESERT STORM', sub:'Wide open high-speed blast',
    steps:18, tw:118, grass:'#c4a040', d1:'#d4885e', d2:'#e8a078', edge:'#a04c28',
    tc:['#a8822a','#c0a040','#907030'],
    raw:[{x:300,y:810},{x:650,y:830},{x:1000,y:820},{x:1360,y:740},{x:1660,y:580},
         {x:1820,y:360},{x:1760,y:160},{x:1480,y:60},{x:1100,y:50},{x:750,y:110},
         {x:460,y:230},{x:250,y:440},{x:190,y:660},{x:220,y:780}] },

  { name:'GRAVEL PIT',   sub:'Tight quarry hairpins',
    steps:15, tw:80, grass:'#6a5838', d1:'#907855', d2:'#a88e68', edge:'#4a3820',
    tc:['#7a6040','#684e2c','#564018'],
    raw:[{x:380,y:680},{x:620,y:680},{x:840,y:640},{x:980,y:500},{x:960,y:340},
         {x:840,y:210},{x:660,y:170},{x:480,y:210},{x:350,y:340},{x:300,y:500},
         {x:330,y:620}] },

  { name:'COASTAL RUN',  sub:'Sweeping high-speed coast',
    steps:20, tw:122, grass:'#3a7848', d1:'#c8a055', d2:'#dab86a', edge:'#6a4c18',
    tc:['#2a7038','#3a8848','#1e5828'],
    raw:[{x:220,y:880},{x:580,y:900},{x:960,y:880},{x:1340,y:820},{x:1680,y:660},
         {x:1880,y:440},{x:1840,y:220},{x:1580,y:80},{x:1200,y:50},{x:820,y:90},
         {x:480,y:220},{x:260,y:440},{x:160,y:680},{x:180,y:800}] },
];

// ─── ACTIVE TRACK STATE (rebuilt by activateTrack) ───────────────────────────
let TRK=[], TN=0, TW=100, TREES=[], MRKS=[], CP_GATES=[], ROCKS=[], TDEF=null;

function nearD2(x,y) {
  let m=Infinity;
  for(let i=0;i<TN;i++){const dx=TRK[i].x-x,dy=TRK[i].y-y,d=dx*dx+dy*dy;if(d<m)m=d;}
  return m;
}
function tProg(x,y) {
  let m=Infinity,mi=0;
  for(let i=0;i<TN;i++){const dx=TRK[i].x-x,dy=TRK[i].y-y,d=dx*dx+dy*dy;if(d<m){m=d;mi=i;}}
  return mi/TN;
}
function getScale(menu=false) {
  if(menu){
    let xn=Infinity,xx=-Infinity,yn=Infinity,yx=-Infinity;
    for(const p of TRK){xn=Math.min(xn,p.x);xx=Math.max(xx,p.x);yn=Math.min(yn,p.y);yx=Math.max(yx,p.y);}
    return Math.min(CH/(yx-yn+TW*2.5),CW/(xx-xn+TW*2.5))*0.86;
  }
  return CW>CH ? CH/520 : CH/600;
}

function activateTrack(idx) {
  idx = Math.min(Math.max(0,idx), ALL_TRACKS.length-1);
  TDEF = ALL_TRACKS[idx];
  TW = TDEF.tw;
  TRK = buildSpline(TDEF.raw, TDEF.steps);
  TN = TRK.length;

  // local nearD2 during build (TRK just set above)
  function nd(x,y){let m=Infinity;for(let i=0;i<TN;i++){const dx=TRK[i].x-x,dy=TRK[i].y-y,d=dx*dx+dy*dy;if(d<m)m=d;}return m;}

  // Trees
  TREES=[];
  const rt=seededRng(1337+idx*777);
  let xn=Infinity,xx=-Infinity,yn=Infinity,yx=-Infinity;
  for(const p of TDEF.raw){xn=Math.min(xn,p.x);xx=Math.max(xx,p.x);yn=Math.min(yn,p.y);yx=Math.max(yx,p.y);}
  for(let i=0;i<140;i++){
    const x=xn-140+rt()*(xx-xn+280), y=yn-140+rt()*(yx-yn+280);
    if(nd(x,y)>(TW+52)*(TW+52)) TREES.push({x,y,r:7+rt()*13,g:Math.floor(rt()*3)});
  }

  // Rocks beside track
  ROCKS=[];
  const rr=seededRng(9999+idx*555);
  for(let i=0;i<55;i++){
    const tp=TRK[Math.floor(rr()*TN)], a=rr()*Math.PI*2, dist=TW+14+rr()*55;
    const rx=tp.x+Math.cos(a)*dist, ry=tp.y+Math.sin(a)*dist;
    if(nd(rx,ry)>(TW+10)*(TW+10)) ROCKS.push({x:rx,y:ry,r:3+rr()*7});
  }

  // Corner markers
  MRKS=[];
  for(let i=0;i<TN;i+=12){
    const t=TRK[i],n=TRK[(i+1)%TN];
    let dx=n.x-t.x,dy=n.y-t.y,ln=Math.sqrt(dx*dx+dy*dy)||1;dx/=ln;dy/=ln;
    MRKS.push({lx:t.x-dy*TW,ly:t.y+dx*TW,rx:t.x+dy*TW,ry:t.y-dx*TW,alt:Math.floor(i/12)%2});
  }

  // Checkpoint gates at 22/44/66/88%
  CP_GATES=[.22,.44,.66,.88].map(fr=>{
    const i2=Math.floor(fr*TN), t=TRK[i2], n=TRK[(i2+1)%TN];
    let dx=n.x-t.x,dy=n.y-t.y,ln=Math.sqrt(dx*dx+dy*dy)||1;dx/=ln;dy/=ln;
    return {cx:t.x,cy:t.y,nx:-dy,ny:dx,tdx:dx,tdy:dy,hw:TW-10,fr};
  });
}
