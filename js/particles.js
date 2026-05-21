// ─── PARTICLES ───────────────────────────────────────────────────────────────
let parts=[], driftPops=[];

function addDust(x,y,col,n=2){
  for(let i=0;i<n;i++)
    parts.push({x,y,vx:(Math.random()-.5)*60,vy:(Math.random()-.5)*60,l:.55,m:.55,r:2.5+Math.random()*3,c:col});
}
function updParts(dt){
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    p.vx*=.93; p.vy*=.93; p.l-=dt;
    if(p.l<=0) parts.splice(i,1);
  }
}
function drawParts(cx,cam,SC){
  for(const p of parts){
    const a=p.l/p.m;
    cx.globalAlpha=a*0.42; cx.fillStyle=p.c;
    cx.beginPath(); cx.arc((p.x-cam.x)*SC+CW/2,(p.y-cam.y)*SC+CH/2,p.r*a+.8,0,Math.PI*2); cx.fill();
  }
  cx.globalAlpha=1;
}

// ─── DRIFT SCORE POPUPS ───────────────────────────────────────────────────────
function spawnDriftPopup(car, pts){
  driftPops.push({x:car.x, y:car.y, pts, life:1.1, max:1.1});
}
function updDriftPops(dt){
  for(let i=driftPops.length-1;i>=0;i--){
    const p=driftPops[i]; p.y-=25*dt; p.life-=dt;
    if(p.life<=0) driftPops.splice(i,1);
  }
}
function drawDriftPops(cx,cam,SC){
  for(const p of driftPops){
    const a=Math.min(1,p.life/p.max*2);
    cx.globalAlpha=a;
    cx.fillStyle='#ffcc00';
    cx.font=`bold ${Math.min(16,10+p.pts*0.08)}px monospace`;
    cx.textAlign='center';
    cx.fillText('DRIFT +'+p.pts, (p.x-cam.x)*SC+CW/2, (p.y-cam.y)*SC+CH/2);
  }
  cx.globalAlpha=1;
}

// ─── COLLISIONS ──────────────────────────────────────────────────────────────
function doCollisions(cars){
  const R=20;
  for(let i=0;i<cars.length;i++) for(let j=i+1;j<cars.length;j++){
    const a=cars[i], b=cars[j];
    const dx=b.x-a.x, dy=b.y-a.y, dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<R*2 && dist>0.1){
      const nx=dx/dist, ny=dy/dist, ov=R*2-dist;
      a.x-=nx*ov*.5; a.y-=ny*ov*.5;
      b.x+=nx*ov*.5; b.y+=ny*ov*.5;
      const rvn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
      if(rvn<0){
        const imp=rvn*0.55;
        a.vx+=imp*nx; a.vy+=imp*ny;
        b.vx-=imp*nx; b.vy-=imp*ny;
        a.sp=a.vx*Math.sin(a.a)-a.vy*Math.cos(a.a);
        b.sp=b.vx*Math.sin(b.a)-b.vy*Math.cos(b.a);
        beep(110+Math.random()*70,.13,.25,'sawtooth');
        camShake=3;
        const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
        for(let k=0;k<5;k++) addDust(mx,my,'#ffcc44',1);
      }
    }
  }
}
