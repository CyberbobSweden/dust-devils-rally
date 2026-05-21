// ─── VERSION ─────────────────────────────────────────────────────────────────
const VERSION = 'v4.0.0';

// ─── FIREBASE (global leaderboard) ───────────────────────────────────────────
const FB_URL = 'https://dust-devils-rally-default-rtdb.europe-west1.firebasedatabase.app';

// ─── GAME SETTINGS ───────────────────────────────────────────────────────────
const LAPS = 3;

// ─── CAR DEFINITIONS ─────────────────────────────────────────────────────────
const CAR_DEFS = [
  { id:'banger', name:'BANGER',      price:0,    col:'#4477ff', col2:'#1a3a88',
    grip:.88, top:370, acc:310, nos:1.0, body:'std',
    desc:'Free starter. Solid all-rounder.' },
  { id:'turbo',  name:'TURBO HATCH', price:500,  col:'#ff3322', col2:'#881100',
    grip:.91, top:420, acc:370, nos:1.1, body:'low',
    desc:'Fast and grippy. Great handling.' },
  { id:'rally',  name:'RALLY BEAST', price:1500, col:'#22bb55', col2:'#0d6630',
    grip:.84, top:490, acc:410, nos:1.2, body:'tall',
    desc:'Off-road king. Huge top speed.' },
  { id:'drift',  name:'DRIFT KING',  price:2000, col:'#ffaa00', col2:'#885500',
    grip:.68, top:450, acc:345, nos:1.0, body:'wide',
    desc:'Slide sideways. Maximum chaos.' },
  { id:'muscle', name:'MUSCLE CAR',  price:3000, col:'#cc44ff', col2:'#660088',
    grip:.78, top:540, acc:450, nos:1.3, body:'long',
    desc:'Brute power. Fastest on straights.' },
];
