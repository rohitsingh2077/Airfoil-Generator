let zoom = 200;
let offsetX = 400;
let offsetY = 250;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let xu = [], yu = [], xl = [], yl = [];
let animating = false;

const canvas = document.getElementById('airfoilCanvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('mousedown', e => {
  isDragging = true;
  dragStart = { x: e.offsetX, y: e.offsetY };
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('mousemove', e => {
  if (isDragging) {
    const dx = e.offsetX - dragStart.x;
    const dy = e.offsetY - dragStart.y;
    offsetX += dx;
    offsetY += dy;
    dragStart = { x: e.offsetX, y: e.offsetY };
    drawAirfoil();
  }
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  zoom *= zoomFactor;
  drawAirfoil();
});

function generateAirfoil(codeInput) {
  const code = codeInput || document.getElementById('nacaInput').value.trim();
  if (!/^\d{4}$/.test(code)) {
    alert("Please enter a valid 4-digit NACA code.");
    return;
  }

  const m = parseInt(code[0]) / 100;
  const p = parseInt(code[1]) / 10;
  const t = parseInt(code.slice(2)) / 100;

  const points = 100;
  const xVals = Array.from({ length: points + 1 }, (_, i) => 0.5 * (1 - Math.cos(Math.PI * i / points)));
  const yt = xVals.map(x => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4));

  xu = [], yu = [], xl = [], yl = [];

  for (let i = 0; i <= points; i++) {
    let x = xVals[i];
    let yc = 0, dyc_dx = 0;

    if (x < p && p !== 0) {
      yc = (m / (p ** 2)) * (2 * p * x - x ** 2);
      dyc_dx = (2 * m / (p ** 2)) * (p - x);
    } else if (p !== 0) {
      yc = (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x ** 2);
      dyc_dx = (2 * m / ((1 - p) ** 2)) * (p - x);
    }

    const theta = Math.atan(dyc_dx);
    xu.push(x - yt[i] * Math.sin(theta));
    yu.push(yc + yt[i] * Math.cos(theta));
    xl.push(x + yt[i] * Math.sin(theta));
    yl.push(yc - yt[i] * Math.cos(theta));
  }

  drawAirfoil();
}

function drawAirfoil() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, offsetY);
  ctx.lineTo(canvas.width, offsetY);
  ctx.moveTo(offsetX, 0);
  ctx.lineTo(offsetX, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < xu.length; i++) {
    const x = offsetX + xu[i] * zoom;
    const y = offsetY - yu[i] * zoom;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = xl.length - 1; i >= 0; i--) {
    const x = offsetX + xl[i] * zoom;
    const y = offsetY - yl[i] * zoom;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#0077cc';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(offsetX, offsetY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();
}

function zoomIn() {
  zoom *= 1.2;
  drawAirfoil();
}

function zoomOut() {
  zoom /= 1.2;
  drawAirfoil();
}

function resetView() {
  zoom = 200;
  offsetX = 400;
  offsetY = 250;
  drawAirfoil();
}

function downloadDAT() {
  let content = "# X\tY\n";
  for (let i = 0; i < xu.length; i++) {
    content += `${xu[i].toFixed(5)}\t${yu[i].toFixed(5)}\n`;
  }
  for (let i = 0; i < xl.length; i++) {
    content += `${xl[i].toFixed(5)}\t${yl[i].toFixed(5)}\n`;
  }

  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'airfoil.dat';
  a.click();
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme") || "light";
  html.setAttribute("data-theme", current === "light" ? "dark" : "light");
}

async function startAnimation() {
  if (animating) return;
  animating = true;
  for (let i = 0; i <= 9999 && animating; i++) {
    const code = i.toString().padStart(4, '0');
    document.getElementById('nacaInput').value = code;
    generateAirfoil(code);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  animating = false;
}