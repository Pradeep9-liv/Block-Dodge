document.addEventListener("DOMContentLoaded", function () {

  // Elements
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

  // Button listeners (works on mobile, no onclick needed)
  startBtn.addEventListener("click",   startGame);
  startBtn.addEventListener("touchend", function(e) { e.preventDefault(); startGame(); });
  restartBtn.addEventListener("click",   function() { location.reload(); });
  restartBtn.addEventListener("touchend", function(e) { e.preventDefault(); location.reload(); });

  // Audio (silent fallback if files missing)
  function makeSound(src, vol) {
    try { const a = new Audio(src); a.volume = vol; return a; }
    catch (e) { return { play: () => {}, currentTime: 0 }; }
  }
  const hitSound   = makeSound("audio/hit.wav",   0.5);
  const scoreSound = makeSound("audio/score.wav", 0.3);
  const startSound = makeSound("audio/start.wav", 0.4);

  // State
  let score           = 0;
  let highScore       = parseInt(localStorage.getItem("blockDodgeHighScore") || "0", 10);
  let obstacleSpeed   = 3;
  const maxSpeed      = 10;
  let spawnRate       = 1000;
  let obstacleCount   = 1;
  let activeObstacles = 0;
  let gameRunning     = false;
  let isDragging      = false;

  highScoreText.innerText = "High Score: " + highScore;
  player.style.left = (window.innerWidth / 2 - 30) + "px";

  // Touch / mouse controls on game area
  gameArea.addEventListener("mousedown",  () => isDragging = true);
  gameArea.addEventListener("mouseup",    () => isDragging = false);
  gameArea.addEventListener("mouseleave", () => isDragging = false);
  gameArea.addEventListener("mousemove",  (e) => {
    if (!isDragging || !gameRunning) return;
    movePlayer(e.clientX, e.clientY);
  });
  gameArea.addEventListener("touchstart", (e) => {
    // Only drag if not tapping a button
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

  // Obstacles
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

  function endGame() {
    gameRunning = false;
    finalScoreEl.innerText = "Score: " + score;
    finalHighEl.innerText  = "High Score: " + highScore;
    gameOverScreen.style.display = "flex";
  }

  function startGame() {
    try { startSound.play(); } catch(e) {}
    gameRunning = true;
    startScreen.style.display = "none";
    obstacleSpawner();
  }

});
