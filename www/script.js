document.addEventListener("DOMContentLoaded", function () {

  const startScreen    = document.getElementById("startScreen");
  const gameArea       = document.getElementById("gameArea");
  const player         = document.getElementById("player");
  const scoreText      = document.getElementById("score");
  const highScoreText  = document.getElementById("highScore");
  const gameOverScreen = document.getElementById("gameOver");
  const finalScoreEl   = document.getElementById("finalScore");
  const finalHighEl    = document.getElementById("finalHighScore");
  const startBtn       = document.getElementById("startBtn");
  const restartBtn     = document.getElementById("restartBtn");

  startBtn.addEventListener("click",    startGame);
  startBtn.addEventListener("touchend", function(e) { e.preventDefault(); startGame(); });
  restartBtn.addEventListener("click",   function() { location.reload(); });
  restartBtn.addEventListener("touchend", function(e) { e.preventDefault(); location.reload(); });

  // Audio
  function makeSound(src, vol) {
    try { const a = new Audio(src); a.volume = vol; return a; }
    catch (e) { return { play: () => {}, pause: () => {}, currentTime: 0 }; }
  }
  const hitSound   = makeSound("audio/hit.wav",   0.5);
  const scoreSound = makeSound("audio/score.wav", 0.3);
  const startSound = makeSound("audio/start.wav", 0.4);

  function stopAllSounds() {
    [hitSound, scoreSound, startSound].forEach(s => {
      try { s.pause(); s.currentTime = 0; } catch(e) {}
    });
  }

  // State
  let score           = 0;
  let highScore       = parseInt(localStorage.getItem("blockDodgeHighScore") || "0", 10);
  let obstacleSpeed   = 3;
  const maxSpeed      = 10;
  let spawnRate       = 1000;
  let obstacleCount   = 1;
  let activeObstacles = 0;
  let gameRunning     = false;
  let gamePaused      = false;
  let isDragging      = false;
  let spawnerTimeout  = null;         // single reference so we never double-spawn
  const activeIntervals = new Set();  // track every obstacle interval

  // Pause overlay
  const pauseOverlay = document.createElement("div");
  pauseOverlay.innerHTML = "<h2>Paused</h2><p>Return to the game to continue</p>";
  pauseOverlay.style.cssText = `
    position:absolute;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.78);backdrop-filter:blur(6px);
    display:none;flex-direction:column;justify-content:center;align-items:center;
    z-index:998;color:white;text-align:center;
  `;
  pauseOverlay.querySelector("h2").style.cssText = "font-size:44px;color:cyan;text-shadow:0 0 12px cyan;margin-bottom:10px;";
  pauseOverlay.querySelector("p").style.cssText  = "color:#aaa;font-size:17px;";
  gameArea.appendChild(pauseOverlay);

  highScoreText.innerText = "High Score: " + highScore;
  player.style.left = (window.innerWidth / 2 - 30) + "px";

  // ── Clear ALL obstacles from DOM and kill all their intervals ─────────
  function clearAllObstacles() {
    // kill every tracked interval
    activeIntervals.forEach(iv => clearInterval(iv));
    activeIntervals.clear();
    // remove every obstacle element from DOM
    document.querySelectorAll(".obstacle").forEach(o => o.remove());
    activeObstacles = 0;
  }

  // ── Pause / Resume ────────────────────────────────────────────────────
  function pauseGame() {
    if (!gameRunning || gamePaused) return;
    gamePaused  = true;
    gameRunning = false;
    stopAllSounds();
    // Kill spawner timer
    if (spawnerTimeout) { clearTimeout(spawnerTimeout); spawnerTimeout = null; }
    // Kill & remove all obstacle intervals + DOM elements
    clearAllObstacles();
    pauseOverlay.style.display = "flex";
  }

  function resumeGame() {
    if (!gamePaused) return;
    gamePaused  = false;
    gameRunning = true;
    pauseOverlay.style.display = "none";
    obstacleSpawner();   // fresh start — no ghost blocks
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { pauseGame(); } else { resumeGame(); }
  });
  document.addEventListener("pause",  pauseGame,  false);
  document.addEventListener("resume", resumeGame, false);

  // ── Controls ──────────────────────────────────────────────────────────
  gameArea.addEventListener("mousedown",  () => isDragging = true);
  gameArea.addEventListener("mouseup",    () => isDragging = false);
  gameArea.addEventListener("mouseleave", () => isDragging = false);
  gameArea.addEventListener("mousemove",  (e) => {
    if (!isDragging || !gameRunning) return;
    movePlayer(e.clientX, e.clientY);
  });
  gameArea.addEventListener("touchstart", (e) => {
    if (e.target === startBtn || e.target === restartBtn) return;
    e.preventDefault(); isDragging = true;
  }, { passive: false });
  gameArea.addEventListener("touchend", (e) => {
    if (e.target === startBtn || e.target === restartBtn) return;
    e.preventDefault(); isDragging = false;
  }, { passive: false });
  gameArea.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!isDragging || !gameRunning) return;
    movePlayer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  function movePlayer(x, y) {
    let px = Math.max(0, Math.min(x - player.offsetWidth  / 2, window.innerWidth  - player.offsetWidth));
    let py = Math.max(0, Math.min(y - player.offsetHeight / 2, window.innerHeight - player.offsetHeight));
    player.style.left = px + "px";
    player.style.top  = py + "px";
  }

  // ── Obstacles ─────────────────────────────────────────────────────────

  // Max blocks allowed on screen at once — never more than fit in a row minus 1 gap
  function maxAllowedObstacles() {
    const blockW   = 65;  // block width + gap
    const slotsInRow = Math.floor(window.innerWidth / blockW);
    // Never fill the whole row — leave at least 1.5 block gaps to dodge through
    return Math.max(1, slotsInRow - 2);
  }

  function createObstacle() {
    if (!gameRunning) return;

    const cap = maxAllowedObstacles();
    if (activeObstacles >= cap) return;   // hard cap — never cover full row

    const obs = document.createElement("div");
    obs.classList.add("obstacle");

    // Place blocks on a grid so they never perfectly overlap or block full row
    const blockW    = 60;
    const slots     = Math.floor(window.innerWidth / (blockW + 5));
    const slot      = Math.floor(Math.random() * slots);
    obs.style.left  = (slot * (blockW + 5)) + "px";

    gameArea.appendChild(obs);
    activeObstacles++;

    let oy = -60;
    const iv = setInterval(() => {
      if (!gameRunning) {
        // game paused/ended: interval will be cleared by clearAllObstacles()
        return;
      }
      oy += obstacleSpeed;
      obs.style.top = oy + "px";

      // Collision
      const pr = player.getBoundingClientRect();
      const or = obs.getBoundingClientRect();
      if (pr.left < or.right && pr.right > or.left &&
          pr.top  < or.bottom && pr.bottom > or.top) {
        activeIntervals.delete(iv);
        clearInterval(iv);
        activeObstacles--;
        obs.remove();
        try { hitSound.play(); } catch(e) {}
        endGame();
        return;
      }

      // Off-screen
      if (oy > window.innerHeight) {
        activeIntervals.delete(iv);
        clearInterval(iv);
        obs.remove();
        activeObstacles--;
        score++;
        try { scoreSound.currentTime = 0; scoreSound.play(); } catch(e) {}
        scoreText.innerText = "Score: " + score;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("blockDodgeHighScore", highScore);
          highScoreText.innerText = "High Score: " + highScore;
        }
        // Ramp difficulty — but cap obstacleCount so full-row jam is impossible
        if (score % 10 === 0) {
          if (obstacleSpeed < maxSpeed) obstacleSpeed++;
          if (spawnRate > 700) spawnRate -= 50;
          const maxCount = Math.max(1, maxAllowedObstacles() - 1);
          if (obstacleCount < maxCount) obstacleCount++;
        }
      }
    }, 20);

    activeIntervals.add(iv);
  }

  function obstacleSpawner() {
    if (!gameRunning) return;
    const cap = maxAllowedObstacles();
    for (let i = 0; i < obstacleCount; i++) {
      if (activeObstacles < cap) createObstacle();
    }
    spawnerTimeout = setTimeout(obstacleSpawner, spawnRate);
  }

  // ── Game flow ─────────────────────────────────────────────────────────
  function endGame() {
    gameRunning = false;
    gamePaused  = false;
    if (spawnerTimeout) { clearTimeout(spawnerTimeout); spawnerTimeout = null; }
    clearAllObstacles();
    stopAllSounds();
    finalScoreEl.innerText = "Score: " + score;
    finalHighEl.innerText  = "High Score: " + highScore;
    gameOverScreen.style.display = "flex";
  }

  function startGame() {
    try { startSound.play(); } catch(e) {}
    gameRunning = true;
    gamePaused  = false;
    startScreen.style.display = "none";
    obstacleSpawner();
  }

});
