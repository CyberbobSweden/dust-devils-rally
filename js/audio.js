// ─── AUDIO ───────────────────────────────────────────────────────────────────
let AC=null, engOsc=null, engGain=null, scrSrc=null, _scrOn=false;

function initAudio() {
  if(!AC) try{ AC=new(window.AudioContext||window.webkitAudioContext)(); }catch(e){}
}

function beep(freq, dur, vol=0.22, type='square') {
  if(!AC) return;
  if(AC.state==='suspended') AC.resume();
  const o=AC.createOscillator(), g=AC.createGain();
  o.connect(g); g.connect(AC.destination);
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(vol, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime+dur);
  o.start(); o.stop(AC.currentTime+dur+0.02);
}

function startEngine() {
  if(!AC||engOsc) return;
  engOsc=AC.createOscillator(); engGain=AC.createGain();
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=450;
  engOsc.type='sawtooth';
  engOsc.connect(f); f.connect(engGain); engGain.connect(AC.destination);
  engGain.gain.value=0.025; engOsc.frequency.value=80; engOsc.start();
}
function updateEngine(sp, top) {
  if(!engOsc) startEngine();
  if(!engOsc) return;
  const t=Math.min(1,Math.abs(sp)/top);
  engOsc.frequency.value=65+t*220;
  engGain.gain.value=0.02+t*0.03;
}
function stopEngine() {
  if(engOsc){ try{engOsc.stop();}catch(e){} engOsc=null; engGain=null; }
}

function setScreech(on) {
  if(on===_scrOn) return; _scrOn=on;
  if(!AC) return;
  if(on){
    const buf=AC.createBuffer(1,AC.sampleRate*0.15,AC.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    scrSrc=AC.createBufferSource(); scrSrc.buffer=buf; scrSrc.loop=true;
    const g=AC.createGain(), f=AC.createBiquadFilter();
    f.type='bandpass'; f.frequency.value=2400; f.Q.value=1.8;
    scrSrc.connect(f); f.connect(g); g.connect(AC.destination);
    g.gain.value=0.065; scrSrc.start();
  } else {
    if(scrSrc){ try{scrSrc.stop();}catch(e){} scrSrc=null; }
  }
}
