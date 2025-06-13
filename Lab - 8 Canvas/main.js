const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const versionSelect = document.querySelector('#versionSelect');
const numBallsInput = document.querySelector('#numBalls');
const thresholdInput = document.querySelector('#thresholdPercent');
const thresholdValue = document.querySelector('#thresholdPercentValue');
const interactionStrengthInput = document.querySelector('#interactionStrength');
const interactionValue = document.querySelector('#interactionStrengthValue');
const forceXInput = document.querySelector('#forceX');
const forceYInput = document.querySelector('#forceY');
const forceXValue = document.querySelector('#forceXValue');
const forceYValue = document.querySelector('#forceYValue');
const startBtn = document.querySelector('#startBtn');
const resetBtn = document.querySelector('#resetBtn');
const v2Controls = document.querySelector('#v2Controls');
const v3Controls = document.querySelector('#v3Controls');

let balls = [];
let animationId = null;
let mouseX = 0, mouseY = 0;

class Ball {
  constructor(x, y, vx, vy, radius) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.mass = radius * radius;
    this.energy = this.mass;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) this.vx *= -1;
    if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) this.vy *= -1;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}

function updateControls() {
  const version = parseInt(versionSelect.value);
  v2Controls.style.display = (version === 2) ? 'block' : 'none';
  v3Controls.style.display = (version === 3) ? 'block' : 'none';
}
versionSelect.addEventListener('change', updateControls);
updateControls();

thresholdInput.addEventListener('input', () => {
  thresholdValue.textContent = thresholdInput.value + '%';
});
interactionStrengthInput.addEventListener('input', () => {
  interactionValue.textContent = interactionStrengthInput.value;
});
forceXInput.addEventListener('input', () => {
  forceXValue.textContent = forceXInput.value;
});
forceYInput.addEventListener('input', () => {
  forceYValue.textContent = forceYInput.value;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
  if (parseInt(versionSelect.value) !== 2) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    const dx = b.x - clickX;
    const dy = b.y - clickY;
    if (Math.hypot(dx, dy) < b.radius) {
      balls.splice(i, 1);
      for (let k = 0; k < 2; k++) {
        const newRadius = Math.random() * 20 + 5;
        const newX = Math.random() * (canvas.width - 2 * newRadius) + newRadius;
        const newY = Math.random() * (canvas.height - 2 * newRadius) + newRadius;
        const angle = Math.random() * 2 * Math.PI;
        const newVx = Math.cos(angle) * 2;
        const newVy = Math.sin(angle) * 2;
        balls.push(new Ball(newX, newY, newVx, newVy, newRadius));
      }
      break;
    }
  }
});

startBtn.addEventListener('click', () => {
  if (animationId !== null) return;
  balls = [];
  const version = parseInt(versionSelect.value);
  const numBalls = parseInt(numBallsInput.value) || 0;
  for (let i = 0; i < numBalls; i++) {
    const radius = Math.random() * 20 + 5;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const y = Math.random() * (canvas.height - 2 * radius) + radius;
    const angle = Math.random() * 2 * Math.PI;
    const vx = Math.cos(angle) * 2;
    const vy = Math.sin(angle) * 2;
    balls.push(new Ball(x, y, vx, vy, radius));
  }
  animate();
});

resetBtn.addEventListener('click', () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  balls = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const version = parseInt(versionSelect.value);
  const threshold = (parseInt(thresholdInput.value) / 100) * canvas.width;
  const mouseStrength = parseFloat(interactionStrengthInput.value);
  const forceX = parseFloat(forceXInput.value);
  const forceY = parseFloat(forceYInput.value);

  balls.forEach(b => {
    if (version === 2 && mouseStrength !== 0) {
      const dx = mouseX - b.x;
      const dy = mouseY - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 100) {
        const force = mouseStrength / dist;
        b.vx += force * dx;
        b.vy += force * dy;
      }
    }
    b.update();
  });

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const b1 = balls[i];
      const b2 = balls[j];
      const dx = b1.x - b2.x;
      const dy = b1.y - b2.y;
      const dist = Math.hypot(dx, dy);
      if (dist < threshold) {
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();

        if (version === 3) {
          let smaller = b1, larger = b2;
          if (b1.mass > b2.mass) {
            smaller = b2;
            larger = b1;
          }
          const transfer = 0.05;
          if (smaller.mass > 1) {
            const m1 = smaller.mass, m2 = larger.mass;
            smaller.mass -= transfer;
            larger.mass += transfer;
            smaller.energy = smaller.mass;
            larger.energy = larger.mass;
            if (smaller.mass > 0) {
              smaller.vx *= (m1 / smaller.mass);
              smaller.vy *= (m1 / smaller.mass);
            }
            larger.vx *= (m2 / larger.mass);
            larger.vy *= (m2 / larger.mass);
          }
        }
      }
    }
  }

  balls = balls.filter(b => b.mass >= 1);
  balls.forEach(b => b.draw());
  animationId = requestAnimationFrame(animate);
}
    