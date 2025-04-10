const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

let initGamma = null;
let initBeta = null;
let score = 0;
let gameOver = false;

const player = {
  x: 0,
  y: 0,
  radius: 15,
  color: 'blue',
  vx: 0,
  vy: 0,
  ax: 0,
  ay: 0
};

const target = {
  x: 0,
  y: 0,
  radius: 30,
  color: 'red'
};

function placePlayer() {
  player.x = Math.random() * (canvas.width - 2 * player.radius) + player.radius;
  player.y = Math.random() * (canvas.height - 2 * player.radius) + player.radius;
  player.vx = 0;
  player.vy = 0;
}

function placeTarget() {
  target.x = Math.random() * (canvas.width - 2 * target.radius) + target.radius;
  target.y = Math.random() * (canvas.height - 2 * target.radius) + target.radius;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  placeTarget();
  placePlayer();
}

window.addEventListener("deviceorientation", (event) => {
  if (initGamma === null && initBeta === null) {
    initGamma = event.gamma;
    initBeta = event.beta;
  }
  player.ax = (event.gamma - initGamma) / 100;
  player.ay = (event.beta - initBeta) / 100;
  console.log(event.alpha);
  console.log(event.gamma)
  console.log('Xy');
  
  console.log(event.beta)
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') player.ay = -0.5;
  if (event.key === 'ArrowDown') player.ay = 0.5;
  if (event.key === 'ArrowLeft') player.ax = -0.5;
  if (event.key === 'ArrowRight') player.ax = 0.5;
});

window.addEventListener('keyup', () => {
  player.ax = 0;
  player.ay = 0;
});

function move() {
  if (gameOver) return;
  player.vx += player.ax;
  player.vy += player.ay;
  player.vx *= 0.98;
  player.vy *= 0.98;
  player.x += player.vx;
  player.y += player.vy;

  if (player.x - player.radius < 0) {
    player.x = player.radius;
    player.vx = -player.vx * 0.5;
  }
  if (player.x + player.radius > canvas.width) {
    player.x = canvas.width - player.radius;
    player.vx = -player.vx * 0.5;
  }
  if (player.y - player.radius < 0) {
    player.y = player.radius;
    player.vy = -player.vy * 0.5;
  }
  if (player.y + player.radius > canvas.height) {
    player.y = canvas.height - player.radius;
    player.vy = -player.vy * 0.5;
  }
}

function Gol() {
  if (gameOver) return;
  const dx = player.x - target.x;
  const dy = player.y - target.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance + player.radius < target.radius) {
    score += 1;
    if (target.radius > 5) {
      target.radius -= 1;
    }
    placeTarget();
    if (score >= 14) {
      gameOver = true;
      showWinMessage();
    }
  }
}

function drawCircle(obj) {
  context.beginPath();
  context.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
  context.fillStyle = obj.color;
  context.fill();
}

function drawScore() {
  context.font = '24px Arial';
  context.fillStyle = 'black';
  context.fillText('Score: ' + score, 20, 30);
}

function showWinMessage() {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '50%';
  div.style.left = '50%';
  div.style.transform = 'translate(-50%, -50%)';
  div.style.background = 'white';
  div.style.padding = '40px';
  div.style.border = '2px solid black';
  div.style.textAlign = 'center';
  div.innerHTML = `
    <h1>Przeszedłeś grę!</h1>
    <button id="resetBtn">Reset</button>
  `;
  document.body.appendChild(div);
  document.getElementById('resetBtn').addEventListener('click', () => {
    location.reload();
  });
}

function gameLoop() {
  move();
  Gol();
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawCircle(target);
  drawCircle(player);
  drawScore();
  requestAnimationFrame(gameLoop);
}

gameLoop();
