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

  // Button listeners
  startBtn.addEventListener("click",    startGame);
  startBtn.addEventListener("touchend", function(e) { e.preventDefault(); startGame(); });
  restartBtn.addEventListener("click",   function() { location.reload(); });
  restartBtn.addEventListener("touchend", function(e) { e.preventDefault(); location.reload(); });

  // Audio (silent fallback if files missing)
  function makeSound(src, vol) {
    try { const a = new Audio(src); a.volume = vol; return a; }
    catch (e) { return { play: () => {}, pause: () => {}, currentTime: 0 }; }
  }
  const hitSound   = makeSound("audio/hit.wav",   0.5);
  const scoreSound = makeSound("audio/score.wav", 0.3);
  const startSound = makeSound("audio/start.wav", 0.4);

  function stopAllSounds() {
    try { hitSound.pause();   hitSound.currentTime   = 0; } catch(e) {}
    try { scoreSound.pause(); scoreSound.currentTime = 0; } catch(e) {}
    try { startSound.pause(); startSound.currentTime = 0; } catch(e) {}
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

  // Pause overlay element
  const pauseOverlay = document.createElement("div");
  pauseOverlay.id = "pauseOverlay";
  pauseOverlay.innerHTML = "<h2>Paused</h2><p>Return to the game to continue</p>";
  pauseOverlay.style.cssText = `
    position:absolute; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.75); backdrop-filter:blur(6px);
    display:none; flex-direction:column;
    justify-content:center; align-items:center;
    z-index:998; color:white; text-align:center;
  `;
  pauseOverlay.querySelector("h2").style.cssText = "font-size:48px; color:cyan; text-shadow:0 0 10px cyan, 0 0 20px cyan; margin-bottom:12px;";
  pauseOverlay.querySelector("p").style.cssText  = "color:#aaa; font-size:18px;";
  gameArea.appendChild(pauseOverlay);

  highScoreText.innerText = "High Score: " + highScore;
  player.style.left = (window.innerWidth / 2 - 30) + "px";

  // ── Pause / resume on app background ─────────────────────────────────

  function pauseGame() {
    if (!gameRunning || gamePaused) return;
    gamePaused = true;
    gameRunning = false;         // stops all intervals & spawner
    stopAllSounds();
    pauseOverlay.style.display = "flex";
  }

  function resumeGame() {
    if (!gamePaused) return;
    gamePaused  = false;
    gameRunning = true;
    pauseOverlay.style.display = "none";
    obstacleSpawner();           // restart spawner
  }

  // Page Visibility API — fires when user switches apps / goes to home screen
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      pauseGame();
    } else {
      resumeGame();
    }
  });

  // Capacitor / Cordova app lifecycle events (belt & suspenders)
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
    e.preventDefault();
    isDragging = true;
  }, { passive: false });
  gameArea.addEventListener("touchend", (e) => {
    if (e.target === startBtn || e.target === restartBtn) return;
    e.preventDefault();
    isDragging = false;
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

  function createObstacle() {
    if (!gameRunning) return;
    const obs = document.createElement("div");
    obs.classList.add("obstacle");
    obs.style.left = Math.random() * (window.innerWidth - 60) + "px";
    gameArea.appendChild(obs);
    activeObstacles++;
    let oy = -60;
    const iv = setInterval(() => {
      if (!gameRunning) { clearInterval(iv); return; }
      oy += obstacleSpeed;
      obs.style.top = oy + "px";
      const pr = player.getBoundingClientRect();
      const or = obs.getBoundingClientRect();
      if (pr.left < or.right && pr.right > or.left && pr.top < or.bottom && pr.bottom > or.top) {
        activeObstacles--; obs.remove(); clearInterval(iv);
        try { hitSound.play(); } catch(e) {}
        endGame(); return;
      }
      if (oy > window.innerHeight) {
        obs.remove(); activeObstacles--; clearInterval(iv);
        score++;
        try { scoreSound.currentTime = 0; scoreSound.play(); } catch(e) {}
        scoreText.innerText = "Score: " + score;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("blockDodgeHighScore", highScore);
          highScoreText.innerText = "High Score: " + highScore;
        }
        if (score % 10 === 0) {
          if (obstacleSpeed < maxSpeed) obstacleSpeed++;
          if (spawnRate > 700) spawnRate -= 50;
          if (obstacleCount < 5) obstacleCount++;
        }
      }
    }, 20);
  }

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
    gamePaused  = false;
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
