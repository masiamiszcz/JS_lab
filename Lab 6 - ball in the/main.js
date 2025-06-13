const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const titleEl = document.getElementById('overlay-title');
const timeEl  = document.getElementById('overlay-time');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const btnRepeat= document.getElementById('btn-restart-level');

let level = 1;
let hits = 0;
let requiredHits = 5;
let gameRunning = false;
let moveChangeInterval;
let startTime = 0;

let smoothGamma = 0, smoothBeta = 0;
const ALPHA      = 0.1;
const ACC_SCALE  = 0.005;
const MAX_V      = 2;

const player = { x:0, y:0, r:15, color:'blue', vx:0, vy:0, ax:0, ay:0 };
let holes = [];

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  resetLevel();
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('deviceorientation', e => {
  smoothGamma = ALPHA * e.gamma + (1 - ALPHA) * smoothGamma;
  smoothBeta  = ALPHA * e.beta  + (1 - ALPHA) * smoothBeta;
  player.ax = smoothGamma * ACC_SCALE;
  player.ay = smoothBeta  * ACC_SCALE;
});

function gameLoop(){
  if(gameRunning){
    movePlayer();
    applyWormholeAttraction();
    moveHoles();
    checkCollisions();
    draw();
  }
  requestAnimationFrame(gameLoop);
}
gameLoop();

function movePlayer(){
  player.vx += player.ax;
  player.vy += player.ay;
  player.vx = Math.max(-MAX_V, Math.min(MAX_V, player.vx));
  player.vy = Math.max(-MAX_V, Math.min(MAX_V, player.vy));
  player.vx *= 0.96;
  player.vy *= 0.96;
  player.x += player.vx;
  player.y += player.vy;

  if(player.x < player.r){ player.x = player.r; player.vx *= -0.5; }
  if(player.x > canvas.width - player.r){ player.x = canvas.width - player.r; player.vx *= -0.5; }
  if(player.y < player.r){ player.y = player.r; player.vy *= -0.5; }
  if(player.y > canvas.height - player.r){ player.y = canvas.height - player.r; player.vy *= -0.5; }
}

function applyWormholeAttraction(){
  if(level!==3) return;
  const worm = holes.find(h => h.tele && h.behavior==='wormhole');
  if(!worm) return;
  const dx = worm.x - player.x;
  const dy = worm.y - player.y;
  const dist = Math.hypot(dx,dy);
  const zone = worm.r * 8;
  if(dist < zone && dist > 0){
    const strength = ((zone - dist)/zone)*0.25;
    const nx = dx/dist, ny = dy/dist;
    player.vx += strength*nx;
    player.vy += strength*ny;
    player.ax += strength*nx*0.5;
    player.ay += strength*ny*0.5;
  }
}

function moveHoles(){
  if(level!==3) return;
  holes.forEach(h=>{
    if(!h.tele && !h.hit){
      h.x += h.vx; h.y += h.vy;
      if(h.x < h.r){ h.x = h.r; h.vx *= -1; }
      if(h.x > canvas.width - h.r){ h.x = canvas.width - h.r; h.vx *= -1; }
      if(h.y < h.r){ h.y = h.r; h.vy *= -1; }
      if(h.y > canvas.height - h.r){ h.y = canvas.height - h.r; h.vy *= -1; }
    }
  });
  for(let i=0;i<holes.length;i++){
    for(let j=i+1;j<holes.length;j++){
      const a=holes[i], b=holes[j];
      if(a.tele||b.tele||a.hit||b.hit) continue;
      const dx=b.x-a.x, dy=b.y-a.y;
      const dist=Math.hypot(dx,dy), minDist=a.r+b.r+5;
      if(dist < minDist && dist>0){
        const ux=dx/dist, uy=dy/dist, overlap=(minDist-dist)/2;
        a.x -= ux*overlap; a.y -= uy*overlap;
        b.x += ux*overlap; b.y += uy*overlap;
        const tvx=a.vx; a.vx=b.vx; b.vx=tvx;
        const tvy=a.vy; a.vy=b.vy; b.vy=tvy;
      }
    }
  }
}

function checkCollisions(){
  holes.forEach(h=>{
    const dist = Math.hypot(player.x-h.x, player.y-h.y);
    if(!h.tele && !h.hit && dist+player.r < h.r) onHit(h);
    if(h.tele && h.behavior==='wormhole' && dist < h.r+player.r) teleportPlayer();
  });
}

function onHit(h){
  h.hit = true;
  hits++;
  clearInterval(moveChangeInterval);
  if(level===3) spawnLevel3Hole(); else spawnLevel1or2Hole();
  teleportPlayer();
  if(hits >= requiredHits) endLevel();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  holes.forEach(h=>{
    if(h.hit) return;
    ctx.beginPath();
    ctx.arc(h.x,h.y,h.r,0,Math.PI*2);
    ctx.fillStyle = (h.tele && h.behavior==='wormhole')?'purple':'green';
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.fillStyle='black';
  ctx.font='20px Arial';
  ctx.fillText(`Hits: ${hits}/${requiredHits}`,20,30);
}

function resetLevel(){
  gameRunning=false;
  smoothGamma=smoothBeta=0;
  player.vx=player.vy=0;
  clearInterval(moveChangeInterval);
  overlay.classList.remove('hidden');
}

function getRandomPosition(){
  let x,y,safe;
  do{
    x=Math.random()*(canvas.width-60)+30;
    y=Math.random()*(canvas.height-60)+30;
    safe=holes.every(h=>Math.hypot(h.x-x,h.y-y)>h.r+player.r+20);
  }while(!safe);
  return {x,y};
}

function teleportPlayer(){
  const p=getRandomPosition();
  player.x=p.x; player.y=p.y;
  player.vx=player.vy=0;
}

function spawnLevel1or2Hole(){
  const p=getRandomPosition();
  holes=[{
    x: level===1?canvas.width/2:p.x,
    y: level===1?canvas.height/2:p.y,
    r:30, tele:false, hit:false
  }];
}

function spawnLevel3Hole(){
  const normals=holes.filter(h=>!h.tele&&!h.hit);
  if(normals.length>=3) return;
  const p=getRandomPosition();
  holes.push({
    x:p.x,y:p.y,r:30,tele:false,hit:false,
    vx:(Math.random()-0.5)*1,vy:(Math.random()-0.5)*1
  });
}

function setupLevel1(){
  hits=0; requiredHits=5; holes=[]; spawnLevel1or2Hole(); teleportPlayer();
}

function setupLevel2(){
  hits=0; requiredHits=5; holes=[]; spawnLevel1or2Hole(); teleportPlayer();
}

function setupLevel3(){
  hits=0; requiredHits=5;
  holes=[{x:canvas.width/2,y:canvas.height/2,r:30,tele:true,behavior:'wormhole'}];
  for(let i=0;i<3;i++) spawnLevel3Hole();
  moveChangeInterval=setInterval(()=>{
    holes.forEach(h=>{
      if(!h.tele&&!h.hit){
        h.vx=(Math.random()-0.5)*1;
        h.vy=(Math.random()-0.5)*1;
      }
    });
  },2000);
  teleportPlayer();
}

function startLevel(){
  hits=0;
  startTime=performance.now();
  overlay.classList.add('hidden');
  gameRunning=true;
  if(level===1) setupLevel1();
  if(level===2) setupLevel2();
  if(level===3) setupLevel3();
}

function endLevel(){
  gameRunning=false;
  clearInterval(moveChangeInterval);
  const elapsed=((performance.now()-startTime)/1000).toFixed(2);
  timeEl.textContent=`Czas: ${elapsed} s`;
  titleEl.textContent = level<3?`LEVEL ${level+1}`:'KONIEC GRY';
  btnStart.textContent = level<3?'Start!':'Od początku';
  btnRepeat.textContent = `Powtórz level ${level}`;
  btnRepeat.classList.remove('hidden');
  overlay.classList.remove('hidden');
  level = level<3?level+1:1;
}

btnStart.addEventListener('click',startLevel);
btnReset.addEventListener('click',()=>{level=1;startLevel();});
btnRepeat.addEventListener('click',()=>{level--;startLevel();});
