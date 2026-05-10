// Wait for Cordova to be ready (falls back gracefully in browser too)
document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("DOMContentLoaded", onDeviceReady, false);

function onDeviceReady() {
  // Prevent duplicate init
  if (window._gameInited) return;
  window._gameInited = true;
  initGame();
}

function initGame() {
  const startScreen = document.getElementById("startScreen");
  const gameArea = document.getElementById("gameArea");
  const player = document.getElementById("player");
  const scoreText = document.getElementById("score");
  const highScoreText = document.getElementById("highScore");
  const gameOverScreen = document.getElementById("gameOver");
  const finalScore = document.getElementById("finalScore");
  const finalHighScore = document.getElementById("finalHighScore");

  // ── Audio (silent fallback if files missing) ──────────────────────────
  function makeSound(src, vol) {
    try {
      const a = new Audio(src);
      a.volume = vol;
      return a;
    } catch (e) {
      return { play: () => {}, currentTime: 0 };
    }
  }
  const hitSound   = makeSound("audio/hit.wav",   0.5);
  const scoreSound = makeSound("audio/score.wav", 0.3);
  const startSound = makeSound("audio/start.wav", 0.4);

  // ── State ─────────────────────────────────────────────────────────────
  let score          = 0;
  let highScore      = parseInt(localStorage.getItem("blockDodgeHighScore") || "0", 10);
  let obstacleSpeed  = 3;
  const maxObstacleSpeed = 10;
  let spawnRate      = 1000;
  let obstacleCount  = 1;
  let activeObstacles = 0;
  let gameRunning    = false;
  let isDragging     = false;

  highScoreText.innerText = "High Score: " + highScore;

  // Player start position
  player.style.left = (window.innerWidth / 2 - 30) + "px";

  // ── Player controls ───────────────────────────────────────────────────
  gameArea.addEventListener("mousedown",  () => { isDragging = true; });
  gameArea.addEventListener("mouseup",    () => { isDragging = false; });
  gameArea.addEventListener("mouseleave", () => { isDragging = false; });
  gameArea.addEventListener("mousemove",  (e) => {
    if (!isDragging || !gameRunning) return;
    movePlayer(e.clientX, e.clientY);
  });

  gameArea.addEventListener("touchstart", (e) => { e.preventDefault(); isDragging = true; }, { passive: false });
  gameArea.addEventListener("touchend",   (e) => { e.preventDefault(); isDragging = false; }, { passive: false });
  gameArea.addEventListener("touchmove",  (e) => {
    e.preventDefault();
    if (!isDragging || !gameRunning) return;
    movePlayer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  function movePlayer(x, y) {
    let px = x - player.offsetWidth  / 2;
    let py = y - player.offsetHeight / 2;
    px = Math.max(0, Math.min(px, window.innerWidth  - player.offsetWidth));
    py = Math.max(0, Math.min(py, window.innerHeight - player.offsetHeight));
    player.style.left = px + "px";
    player.style.top  = py + "px";
  }

  // ── Obstacles ─────────────────────────────────────────────────────────
  function createObstacle() {
    if (!gameRunning) return;
    const obstacle = document.createElement("div");
    obstacle.classList.add("obstacle");
    obstacle.style.left = Math.random() * (window.innerWidth - 60) + "px";
    gameArea.appendChild(obstacle);
    activeObstacles++;

    let oy = -60;
    const interval = setInterval(() => {
      if (!gameRunning) { clearInterval(interval); return; }
      oy += obstacleSpeed;
      obstacle.style.top = oy + "px";

      // Collision
      const pr = player.getBoundingClientRect();
      const or = obstacle.getBoundingClientRect();
      if (pr.left < or.right && pr.right > or.left &&
          pr.top  < or.bottom && pr.bottom > or.top) {
        activeObstacles--;
        try { hitSound.play(); } catch(e) {}
        obstacle.remove();
        clearInterval(interval);
        endGame();
        return;
      }

      // Off-screen → score
      if (oy > window.innerHeight) {
        obstacle.remove();
        activeObstacles--;
        clearInterval(interval);
        score++;
        try { scoreSound.currentTime = 0; scoreSound.play(); } catch(e) {}
        scoreText.innerText = "Score: " + score;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("blockDodgeHighScore", highScore);
          highScoreText.innerText = "High Score: " + highScore;
        }
        // Difficulty ramp
        if (score % 10 === 0) {
          if (obstacleSpeed < maxObstacleSpeed) obstacleSpeed++;
          if (spawnRate > 700) spawnRate -= 50;
          if (obstacleCount < 5) obstacleCount++;
        }
      }
    }, 20);
  }

  // ── Spawner ───────────────────────────────────────────────────────────
  function obstacleSpawner() {
    if (!gameRunning) return;
    for (let i = 0; i < obstacleCount; i++) {
      if (activeObstacles < 10) createObstacle();
    }
    setTimeout(obstacleSpawner, spawnRate);
  }

  // ── Game flow ─────────────────────────────────────────────────────────
  function endGame() {
    gameRunning = false;
    finalScore.innerText     = "Score: " + score;
    finalHighScore.innerText = "High Score: " + highScore;
    gameOverScreen.style.display = "flex";
  }

  window.restartGame = function() { location.reload(); };

  window.startGame = function() {
    try { startSound.play(); } catch(e) {}
    gameRunning = true;
    startScreen.style.display = "none";
    obstacleSpawner();
  };
}
