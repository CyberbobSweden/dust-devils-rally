// ─── CAR CLASS ───────────────────────────────────────────────────────────────
class Car {
  constructor(x, y, angle, defId, isPlayer) {
    this.x=x; this.y=y; this.a=angle;
    this.def = CAR_DEFS.find(c=>c.id===defId) || CAR_DEFS[0];
    this.isP = isPlayer;

    // Physics
    this.sp=0; this.vx=0; this.vy=0;
    this._prevA=angle;

    // Race state
    this.nos=isPlayer?100:55;
    this.lap=0; this.pp=0;
    this.nextCP=0;           // anti-cheat: next required gate (0-3)
    this.total=0;
    this.wentOff=false;
    this.lapStart=0;

    // Drift
    this.driftAng=0;
    this.isDrifting=false;
    this._combo=0;           // drift combo score

    // AI
    this.aiI=0;
    this.aiM=0.68+Math.random()*0.28;

    // Visual
    this.skidTrail=[];
    this.nosFlame=0;
    this.num=Math.floor(Math.random()*98)+1;
  }

  speed() { return Math.sqrt(this.vx*this.vx+this.vy*this.vy); }

  update(dt, L, R, brake, nos, raceTime) {
    const def=this.def;

    // ── Controls ─────────────────────────────────────────────────────────────
    if(this.isP) {
      const maxSp = (nos&&this.nos>0) ? def.top*def.nos : def.top;
      this.sp = Math.min(this.sp + def.acc*dt, maxSp);
      if(brake) this.sp = Math.max(this.sp - 490*dt, -55);
      const tr = 3.2 * Math.min(1, Math.abs(this.sp)/110);
      if(L) this.a -= tr*dt;
      if(R) this.a += tr*dt;
      if(nos&&this.nos>0){ this.nos=Math.max(0,this.nos-52*dt); this.nosFlame=1; }
      else { this.nos=Math.min(100,this.nos+11*dt); this.nosFlame=Math.max(0,this.nosFlame-.1); }
    } else {
      // AI: steer toward waypoint
      const wp=TRK[this.aiI];
      const dx=wp.x-this.x, dy=wp.y-this.y, dist=Math.sqrt(dx*dx+dy*dy);
      const want=Math.atan2(dx,-dy);
      let diff=want-this.a;
      while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
      this.a += Math.sign(diff)*Math.min(Math.abs(diff),3.2*dt);
      if(dist<95) this.aiI=(this.aiI+9)%TN;
      this.sp += (320*this.aiM-this.sp)*2.2*dt;
    }

    // ── Real drift physics ────────────────────────────────────────────────────
    // Fast cornering = grip loss = sliding!
    const turnRate = Math.abs(this.a-this._prevA) / Math.max(dt,0.001);
    this._prevA = this.a;
    const spFrac = Math.min(1, Math.abs(this.sp)/Math.max(def.top,1));
    const driftLoad = spFrac * Math.min(1, turnRate*1.5);
    const effGrip = Math.max(0.2, def.grip - driftLoad*(1-def.grip)*2.0);
    const gf = 1 - Math.pow(1-effGrip, dt*60);

    const desVX=Math.sin(this.a)*this.sp, desVY=-Math.cos(this.a)*this.sp;
    this.vx += (desVX-this.vx)*gf;
    this.vy += (desVY-this.vy)*gf;

    // ── Off-track ─────────────────────────────────────────────────────────────
    this.off = nearD2(this.x,this.y) > TW*TW;
    if(this.off) {
      this.wentOff=true;
      const pen=Math.pow(0.07,dt);
      this.sp*=pen; this.vx*=pen; this.vy*=pen;
    }

    // ── Move ─────────────────────────────────────────────────────────────────
    this.x += this.vx*dt; this.y += this.vy*dt;

    // ── Drift angle ───────────────────────────────────────────────────────────
    const velA=Math.atan2(this.vx,-this.vy);
    let da=velA-this.a;
    while(da>Math.PI)da-=Math.PI*2; while(da<-Math.PI)da+=Math.PI*2;
    this.driftAng=da;
    this.isDrifting = Math.abs(da)>0.15 && Math.abs(this.sp)>80;

    // Skid trail + combo
    if(this.isDrifting && Math.abs(this.sp)>90) {
      this.skidTrail.push({x:this.x,y:this.y,t:Date.now()});
      if(this.skidTrail.length>150) this.skidTrail.shift();
      if(this.isP) this._combo += Math.abs(da)*Math.abs(this.sp)*dt*0.005;
    } else {
      if(this.isP && this._combo>3) {
        spawnDriftPopup(this, Math.floor(this._combo));
      }
      this._combo=0;
    }

    // ── Anti-cheat: ordered checkpoints, forward-only ─────────────────────────
    const prog=tProg(this.x,this.y);
    const fwd = prog>this.pp || (this.pp>.88&&prog<.12);
    if(fwd && this.nextCP<4) {
      const fr=CP_GATES[this.nextCP].fr;
      if(this.pp<fr && prog>=fr) this.nextCP++;
    }
    if(this.nextCP>=4 && this.pp>.88 && prog<.12) {
      this.lap++; this.nextCP=0;
      if(this.isP){ beep(660,.08); setTimeout(()=>beep(880,.2),100); }
    }
    this.pp=prog;
    this.total=this.lap+prog;
  }

  draw(cx, cam, SC) {
    const sx=(this.x-cam.x)*SC+CW/2, sy=(this.y-cam.y)*SC+CH/2;
    const def=this.def;
    const bw=(def.body==='wide'?1.15:def.body==='long'?.88:1)*17*SC;
    const bh=(def.body==='tall'?1.08:def.body==='low'?.9:1)*30*SC;

    // Skid marks
    if(this.skidTrail.length>1){
      const now=Date.now();
      for(let i=1;i<this.skidTrail.length;i++){
        const p=this.skidTrail[i],q=this.skidTrail[i-1];
        const age=(now-p.t)/3500; if(age>1)continue;
        cx.globalAlpha=(1-age)*0.2; cx.strokeStyle='#2a1a08'; cx.lineWidth=SC*6; cx.lineCap='round';
        cx.beginPath();
        cx.moveTo((q.x-cam.x)*SC+CW/2,(q.y-cam.y)*SC+CH/2);
        cx.lineTo((p.x-cam.x)*SC+CW/2,(p.y-cam.y)*SC+CH/2);
        cx.stroke();
      }
      cx.globalAlpha=1;
    }

    cx.save(); cx.translate(sx,sy); cx.rotate(this.a);

    // Shadow
    cx.globalAlpha=0.2; cx.fillStyle='#000';
    cx.beginPath(); cx.ellipse(2,3,bw*.62,bh*.24,0,0,Math.PI*2); cx.fill(); cx.globalAlpha=1;

    // Wheels (under body)
    cx.fillStyle='#111';
    const wr=bw*0.17;
    [[-bw*.37,-bh*.30],[bw*.37,-bh*.30],[-bw*.37,bh*.28],[bw*.37,bh*.28]].forEach(([wx,wy])=>{
      cx.beginPath(); cx.arc(wx,wy,wr,0,Math.PI*2); cx.fill();
      cx.strokeStyle='rgba(255,255,255,.18)'; cx.lineWidth=1.5; cx.stroke();
    });

    // Body
    cx.fillStyle=def.col;
    cx.beginPath(); cx.roundRect(-bw/2,-bh/2,bw,bh,3); cx.fill();

    // Metallic sheen
    const sh=cx.createLinearGradient(-bw/2,0,bw/2,0);
    sh.addColorStop(0,'rgba(255,255,255,0)');
    sh.addColorStop(0.44,'rgba(255,255,255,.18)');
    sh.addColorStop(0.56,'rgba(255,255,255,.2)');
    sh.addColorStop(1,'rgba(0,0,0,.1)');
    cx.fillStyle=sh; cx.beginPath(); cx.roundRect(-bw/2,-bh/2,bw,bh,3); cx.fill();

    // Cabin
    cx.fillStyle='rgba(0,0,0,.44)';
    cx.beginPath(); cx.roundRect(-bw*.30,-bh*.27,bw*.60,bh*.37,2); cx.fill();

    // Racing number
    cx.fillStyle='rgba(255,255,255,.7)';
    cx.font=`bold ${bh*0.16}px monospace`; cx.textAlign='center';
    cx.fillText(this.num, 0, bh*0.02);

    // Headlights
    cx.fillStyle='#ffe87a';
    cx.fillRect(-bw/2,-bh/2,bw*.28,3.5);
    cx.fillRect(bw/2-bw*.28,-bh/2,bw*.28,3.5);

    // Tail lights
    cx.fillStyle='#ff3333';
    cx.fillRect(-bw/2,bh/2-3.5,bw*.28,3.5);
    cx.fillRect(bw/2-bw*.28,bh/2-3.5,bw*.28,3.5);

    // Spoiler (wide/long bodies)
    if(def.body==='wide'||def.body==='long'){
      cx.fillStyle=def.col2;
      cx.fillRect(-bw*.52,bh/2-1,bw*1.04,2.5);
      cx.fillRect(-bw*.52,bh/2+1.5,bw*.1,5);
      cx.fillRect(bw*.42,bh/2+1.5,bw*.1,5);
    }

    // NOS flame
    if(this.isP && this.nosFlame>0.05){
      const fl=this.nosFlame*bh*0.45+4;
      cx.globalAlpha=this.nosFlame*0.78; cx.fillStyle='#44aaff';
      cx.beginPath(); cx.moveTo(-bw*.16,bh/2); cx.lineTo(0,bh/2+fl); cx.lineTo(bw*.16,bh/2); cx.fill();
      cx.globalAlpha=0.35; cx.fillStyle='#fff';
      cx.beginPath(); cx.moveTo(-bw*.07,bh/2); cx.lineTo(0,bh/2+fl*.5); cx.lineTo(bw*.07,bh/2); cx.fill();
      cx.globalAlpha=1;
    }

    cx.restore();

    // Drift smoke
    if(this.isDrifting && Math.random()<0.4)
      addDust(this.x-Math.sin(this.a)*9, this.y+Math.cos(this.a)*9, 'rgba(210,200,185,.8)', 1);

    // Player name tag
    if(this.isP && S.name){
      cx.fillStyle='rgba(255,255,255,.6)'; cx.font='7px monospace'; cx.textAlign='center';
      cx.fillText(S.name, sx, sy-bh*0.75);
    }
  }
}
