import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const SIZE = 20;
const START_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

const THEMES = {
  neon: {
    name: "Neon",
    accent: "#00f5ff",
    accent2: "#8b5cf6",
    bg: "#050816",
  },
  cyber: {
    name: "Cyber",
    accent: "#00ff88",
    accent2: "#00b7ff",
    bg: "#03100c",
  },
  fire: {
    name: "Fire",
    accent: "#ff6b00",
    accent2: "#ff1744",
    bg: "#140503",
  },
  ice: {
    name: "Ice",
    accent: "#8be9ff",
    accent2: "#4169ff",
    bg: "#04101b",
  },
  matrix: {
    name: "Matrix",
    accent: "#39ff14",
    accent2: "#00a000",
    bg: "#010801",
  },
};

const SKINS = {
  neon: { name: "Neon", icon: "🐍", color: "#00f5ff" },
  plasma: { name: "Plasma", icon: "🟣", color: "#b86cff" },
  fire: { name: "Fire", icon: "🔥", color: "#ff6b00" },
  ice: { name: "Ice", icon: "❄️", color: "#7dd3fc" },
  rainbow: { name: "Rainbow", icon: "🌈", color: "#ff4ecd" },
};

const ARENAS = {
  grid: {
    name: "Neon Grid",
    icon: "▦",
  },
  cyber: {
    name: "Cyber Arena",
    icon: "◈",
  },
  space: {
    name: "Deep Space",
    icon: "✦",
  },
  lava: {
    name: "Lava Core",
    icon: "♨",
  },
  ice: {
    name: "Frozen Zone",
    icon: "❄",
  },
};

const MODES = {
  classic: {
    name: "Classic",
    icon: "🎮",
    description: "Traditional Snake",
  },
  time: {
    name: "Time Attack",
    icon: "⏱️",
    description: "Score as much as possible",
  },
  endless: {
    name: "Endless",
    icon: "♾️",
    description: "Wrap around the arena",
  },
  challenge: {
    name: "Challenge",
    icon: "💀",
    description: "Obstacles appear",
  },
};

const FOOD_TYPES = {
  normal: {
    points: 10,
    icon: "●",
    className: "normal-food",
  },
  bonus: {
    points: 25,
    icon: "◆",
    className: "bonus-food",
  },
  golden: {
    points: 50,
    icon: "★",
    className: "golden-food",
  },
};

const POWERUPS = {
  shield: {
    name: "Shield",
    icon: "🛡️",
    duration: 8000,
  },
  slow: {
    name: "Slow Time",
    icon: "🐌",
    duration: 7000,
  },
  multiplier: {
    name: "2× Multiplier",
    icon: "⚡",
    duration: 8000,
  },
};

const ACHIEVEMENTS = [
  {
    id: "first",
    name: "First Bite",
    description: "Eat your first food",
    icon: "🍎",
  },
  {
    id: "score100",
    name: "Rising Star",
    description: "Reach 100 points",
    icon: "⭐",
  },
  {
    id: "score500",
    name: "High Roller",
    description: "Reach 500 points",
    icon: "💎",
  },
  {
    id: "score1000",
    name: "Snake Legend",
    description: "Reach 1000 points",
    icon: "👑",
  },
  {
    id: "combo5",
    name: "Combo Master",
    description: "Reach a 5x combo",
    icon: "🔥",
  },
  {
    id: "length15",
    name: "Growing Up",
    description: "Reach 15 snake length",
    icon: "🐍",
  },
  {
    id: "games10",
    name: "Regular",
    description: "Play 10 games",
    icon: "🎮",
  },
  {
    id: "level10",
    name: "Elite",
    description: "Reach level 10",
    icon: "🚀",
  },
  {
    id: "golden",
    name: "Golden Hunter",
    description: "Eat golden food",
    icon: "🏆",
  },
  {
    id: "powerup",
    name: "Powered Up",
    description: "Collect a power-up",
    icon: "⚡",
  },
];

const DEFAULT_STATS = {
  games: 0,
  food: 0,
  goldenFood: 0,
  powerUps: 0,
  totalScore: 0,
  bestScore: 0,
  bestCombo: 0,
  bestLength: 3,
};

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
}

function randomCell(excluded = [], walls = []) {
  const blocked = [...excluded, ...walls];

  for (let i = 0; i < 500; i++) {
    const cell = {
      x: Math.floor(Math.random() * SIZE),
      y: Math.floor(Math.random() * SIZE),
    };

    const used = blocked.some(
      (item) => item.x === cell.x && item.y === cell.y
    );

    if (!used) return cell;
  }

  return { x: 2, y: 2 };
}

function createFood(snake, walls = []) {
  const random = Math.random();

  let type = "normal";

  if (random > 0.94) {
    type = "golden";
  } else if (random > 0.82) {
    type = "bonus";
  }

  return {
    ...randomCell(snake, walls),
    type,
  };
}

function createPowerUp(snake, food, walls = []) {
  const shouldSpawn = Math.random() < 0.12;

  if (!shouldSpawn) return null;

  const cell = randomCell([...snake, food], walls);

  const types = Object.keys(POWERUPS);

  return {
    ...cell,
    type: types[Math.floor(Math.random() * types.length)],
  };
}

function createWalls() {
  const walls = [];

  for (let i = 0; i < 10; i++) {
    const wall = randomCell(
      START_SNAKE,
      walls
    );

    if (
      !START_SNAKE.some(
        (s) => s.x === wall.x && s.y === wall.y
      )
    ) {
      walls.push(wall);
    }
  }

  return walls;
}

function App() {
  const [screen, setScreen] = useState("game");

  const [snake, setSnake] = useState(START_SNAKE);
  const [food, setFood] = useState(() => createFood(START_SNAKE));
  const [powerUp, setPowerUp] = useState(null);
  const [walls, setWalls] = useState([]);

  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const directionRef = useRef({ x: 1, y: 0 });

  const [nextDirection, setNextDirection] = useState({
    x: 1,
    y: 0,
  });

  const nextDirectionRef = useRef({ x: 1, y: 0 });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    () => loadData("neon-high-score", 0)
  );

  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(
    () => loadData("neon-best-combo", 0)
  );

  const [soundOn, setSoundOn] = useState(
    () => loadData("neon-sound", true)
  );

  const [volume, setVolume] = useState(
    () => loadData("neon-volume", 0.5)
  );

  const [theme, setTheme] = useState(
    () => loadData("neon-theme", "neon")
  );

  const [skin, setSkin] = useState(
    () => loadData("neon-skin", "neon")
  );

  const [arena, setArena] = useState(
    () => loadData("neon-arena", "grid")
  );

  const [mode, setMode] = useState(
    () => loadData("neon-mode", "classic")
  );

  const [playerName, setPlayerName] = useState(
    () => loadData("neon-player", "Nova")
  );

  const [stats, setStats] = useState(
    () => loadData("neon-stats", DEFAULT_STATS)
  );

  const [achievements, setAchievements] = useState(
    () => loadData("neon-achievements", [])
  );

  const [leaderboard, setLeaderboard] = useState(
    () => loadData("neon-leaderboard", [])
  );

  const [activePowerUp, setActivePowerUp] = useState(null);
  const [powerUpTime, setPowerUpTime] = useState(0);

  const [timeLeft, setTimeLeft] = useState(60);

  const [message, setMessage] = useState(
    "Press START to play"
  );

  const [dailyChallenge] = useState(() =>
    loadData("neon-daily", {
      target: 250,
      reward: "🔥 Fire Skin",
      progress: 0,
    })
  );

  const [challengeProgress, setChallengeProgress] =
    useState(dailyChallenge.progress || 0);

  const [particles, setParticles] = useState([]);

  const audioContext = useRef(null);
  const gameTimer = useRef(null);
  const powerTimer = useRef(null);
  const messageTimer = useRef(null);
  const touchStart = useRef(null);

  const currentTheme = THEMES[theme];
  const currentSkin = SKINS[skin];

  const speed = useMemo(() => {
    let base = Math.max(65, 170 - (level - 1) * 9);

    if (activePowerUp === "slow") {
      base += 75;
    }

    return base;
  }, [level, activePowerUp]);

  useEffect(() => {
    saveData("neon-high-score", highScore);
  }, [highScore]);

  useEffect(() => {
    saveData("neon-best-combo", bestCombo);
  }, [bestCombo]);

  useEffect(() => {
    saveData("neon-sound", soundOn);
  }, [soundOn]);

  useEffect(() => {
    saveData("neon-volume", volume);
  }, [volume]);

  useEffect(() => {
    saveData("neon-theme", theme);
  }, [theme]);

  useEffect(() => {
    saveData("neon-skin", skin);
  }, [skin]);

  useEffect(() => {
    saveData("neon-arena", arena);
  }, [arena]);

  useEffect(() => {
    saveData("neon-mode", mode);
  }, [mode]);

  useEffect(() => {
    saveData("neon-player", playerName);
  }, [playerName]);

  useEffect(() => {
    saveData("neon-stats", stats);
  }, [stats]);

  useEffect(() => {
    saveData("neon-achievements", achievements);
  }, [achievements]);

  useEffect(() => {
    saveData("neon-leaderboard", leaderboard);
  }, [leaderboard]);

  function playSound(type) {
    if (!soundOn) return;

    try {
      if (!audioContext.current) {
        audioContext.current =
          new window.AudioContext();
      }

      const ctx = audioContext.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      const frequencies = {
        eat: 520,
        bonus: 700,
        golden: 900,
        power: 350,
        gameover: 130,
        level: 800,
      };

      oscillator.frequency.value =
        frequencies[type] || 500;

      oscillator.type = "sine";

      gain.gain.setValueAtTime(
        volume * 0.08,
        ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.12
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio is optional.
    }
  }

  function showMessage(text) {
    setMessage(text);

    clearTimeout(messageTimer.current);

    messageTimer.current = setTimeout(() => {
      setMessage("");
    }, 1800);
  }

  function spawnParticles(cell, type = "normal") {
    const newParticles = Array.from(
      { length: type === "golden" ? 12 : 7 },
      (_, index) => ({
        id: `${Date.now()}-${index}`,
        x: cell.x,
        y: cell.y,
        dx: Math.random() * 2 - 1,
        dy: Math.random() * 2 - 1,
      })
    );

    setParticles((old) => [
      ...old,
      ...newParticles,
    ]);

    setTimeout(() => {
      setParticles((old) =>
        old.filter(
          (particle) =>
            !newParticles.some(
              (p) => p.id === particle.id
            )
        )
      );
    }, 450);
  }

  function unlockAchievement(id) {
    setAchievements((old) => {
      if (old.includes(id)) return old;

      const achievement = ACHIEVEMENTS.find(
        (item) => item.id === id
      );

      if (achievement) {
        setTimeout(() => {
          showMessage(
            `${achievement.icon} Achievement unlocked!`
          );
        }, 0);
      }

      return [...old, id];
    });
  }

  function checkAchievements(
    newScore,
    newCombo,
    newLength,
    newLevel
  ) {
    if (stats.food > 0 || newScore > 0) {
      unlockAchievement("first");
    }

    if (newScore >= 100) {
      unlockAchievement("score100");
    }

    if (newScore >= 500) {
      unlockAchievement("score500");
    }

    if (newScore >= 1000) {
      unlockAchievement("score1000");
    }

    if (newCombo >= 5) {
      unlockAchievement("combo5");
    }

    if (newLength >= 15) {
      unlockAchievement("length15");
    }

    if (stats.games >= 10) {
      unlockAchievement("games10");
    }

    if (newLevel >= 10) {
      unlockAchievement("level10");
    }
  }

  function startGame() {
    const initialSnake = [...START_SNAKE];

    const initialWalls =
      mode === "challenge"
        ? createWalls()
        : [];

    const initialFood = createFood(
      initialSnake,
      initialWalls
    );

    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };

    setNextDirection({ x: 1, y: 0 });
    nextDirectionRef.current = { x: 1, y: 0 };

    setFood(initialFood);
    setWalls(initialWalls);
    setPowerUp(null);

    setActivePowerUp(null);
    setPowerUpTime(0);

    setScore(0);
    setLevel(1);
    setCombo(0);

    setTimeLeft(60);

    setGameOver(false);
    setPaused(false);
    setRunning(true);

    showMessage(
      mode === "time"
        ? "⏱️ 60 seconds!"
        : "GO! 🐍"
    );

    playSound("level");
  }

  function finishGame(finalScore = score) {
    setRunning(false);
    setGameOver(true);
    setPaused(false);

    playSound("gameover");

    setStats((old) => ({
      ...old,
      games: old.games + 1,
      totalScore: old.totalScore + finalScore,
      bestScore: Math.max(old.bestScore, finalScore),
      bestCombo: Math.max(old.bestCombo, bestCombo),
      bestLength: Math.max(
        old.bestLength,
        snake.length
      ),
    }));

    setLeaderboard((old) => {
      const updated = [
        ...old,
        {
          name: playerName || "Player",
          score: finalScore,
          mode: MODES[mode].name,
          date: new Date().toLocaleDateString(),
        },
      ];

      return updated
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    });

    if (finalScore > highScore) {
      setHighScore(finalScore);
      showMessage("🏆 NEW HIGH SCORE!");
    } else {
      showMessage("GAME OVER");
    }
  }

  function changeDirection(newDirection) {
    const current = directionRef.current;

    if (
      newDirection.x === -current.x &&
      newDirection.y === -current.y
    ) {
      return;
    }

    nextDirectionRef.current = newDirection;
    setNextDirection(newDirection);
  }

  function moveSnake() {
    if (!running || paused || gameOver) return;

    const newDirection =
      nextDirectionRef.current;

    directionRef.current = newDirection;
    setDirection(newDirection);

    setSnake((currentSnake) => {
      const head = currentSnake[0];

      let newHead = {
        x: head.x + newDirection.x,
        y: head.y + newDirection.y,
      };

      if (mode === "endless") {
        newHead.x =
          (newHead.x + SIZE) % SIZE;
        newHead.y =
          (newHead.y + SIZE) % SIZE;
      } else {
        if (
          newHead.x < 0 ||
          newHead.x >= SIZE ||
          newHead.y < 0 ||
          newHead.y >= SIZE
        ) {
          finishGame(score);
          return currentSnake;
        }
      }

      const hitWall = walls.some(
        (wall) =>
          wall.x === newHead.x &&
          wall.y === newHead.y
      );

      if (
        hitWall &&
        activePowerUp !== "shield"
      ) {
        finishGame(score);
        return currentSnake;
      }

      const hitSelf = currentSnake.some(
        (segment) =>
          segment.x === newHead.x &&
          segment.y === newHead.y
      );

      if (
        hitSelf &&
        activePowerUp !== "shield"
      ) {
        finishGame(score);
        return currentSnake;
      }

      let newSnake = [
        newHead,
        ...currentSnake,
      ];

      const ateFood =
        newHead.x === food.x &&
        newHead.y === food.y;

      const atePowerUp =
        powerUp &&
        newHead.x === powerUp.x &&
        newHead.y === powerUp.y;

      if (ateFood) {
        const foodData =
          FOOD_TYPES[food.type];

        const comboBonus =
          combo >= 2
            ? combo * 5
            : 0;

        const multiplier =
          activePowerUp === "multiplier"
            ? 2
            : 1;

        const gained =
          (foodData.points + comboBonus) *
          multiplier;

        const newScore =
          score + gained;

        const newCombo = combo + 1;

        const newLevel =
          Math.floor(newScore / 100) + 1;

        setScore(newScore);
        setCombo(newCombo);
        setLevel(newLevel);

        if (newCombo > bestCombo) {
          setBestCombo(newCombo);
        }

        setStats((old) => ({
          ...old,
          food: old.food + 1,
          goldenFood:
            old.goldenFood +
            (food.type === "golden" ? 1 : 0),
          bestCombo: Math.max(
            old.bestCombo,
            newCombo
          ),
          bestLength: Math.max(
            old.bestLength,
            newSnake.length
          ),
        }));

        if (food.type === "golden") {
          playSound("golden");
          showMessage("🏆 GOLDEN FOOD +50!");
          unlockAchievement("golden");
        } else if (food.type === "bonus") {
          playSound("bonus");
          showMessage(`◆ +${gained}`);
        } else {
          playSound("eat");

          if (newCombo >= 3) {
            showMessage(
              `🔥 ${newCombo}x COMBO! +${gained}`
            );
          }
        }

        spawnParticles(
          food,
          food.type
        );

        if (newLevel > level) {
          playSound("level");
          showMessage(
            `🚀 LEVEL ${newLevel}!`
          );
        }

        if (newScore > highScore) {
          setHighScore(newScore);
        }

        setChallengeProgress((old) =>
          Math.min(
            dailyChallenge.target,
            old + gained
          )
        );

        checkAchievements(
          newScore,
          newCombo,
          newSnake.length,
          newLevel
        );

        setFood(
          createFood(
            newSnake,
            walls
          )
        );

        const newPowerUp =
          createPowerUp(
            newSnake,
            food,
            walls
          );

        if (newPowerUp) {
          setPowerUp(newPowerUp);
        }
      } else {
        newSnake.pop();

        setCombo(0);
      }

      if (atePowerUp) {
        const power =
          POWERUPS[powerUp.type];

        setActivePowerUp(powerUp.type);
        setPowerUpTime(power.duration);

        setStats((old) => ({
          ...old,
          powerUps: old.powerUps + 1,
        }));

        unlockAchievement("powerup");

        playSound("power");
        showMessage(
          `${power.icon} ${power.name}!`
        );

        spawnParticles(
          powerUp,
          "power"
        );

        setPowerUp(null);
      }

      return newSnake;
    });
  }

  useEffect(() => {
    if (!running || paused || gameOver) {
      clearInterval(gameTimer.current);
      return;
    }

    gameTimer.current = setInterval(
      moveSnake,
      speed
    );

    return () => {
      clearInterval(gameTimer.current);
    };
  }, [
    running,
    paused,
    gameOver,
    speed,
    score,
    combo,
    food,
    powerUp,
    walls,
    activePowerUp,
    mode,
  ]);

  useEffect(() => {
    if (!activePowerUp) return;

    clearInterval(powerTimer.current);

    powerTimer.current = setInterval(() => {
      setPowerUpTime((old) => {
        if (old <= 100) {
          setActivePowerUp(null);
          return 0;
        }

        return old - 100;
      });
    }, 100);

    return () => {
      clearInterval(powerTimer.current);
    };
  }, [activePowerUp]);

  useEffect(() => {
    if (
      mode !== "time" ||
      !running ||
      paused ||
      gameOver
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((old) => {
        if (old <= 1) {
          finishGame(score);
          return 0;
        }

        return old - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    mode,
    running,
    paused,
    gameOver,
    score,
  ]);

  function resetProgress() {
    if (
      !window.confirm(
        "Reset all saved progress?"
      )
    ) {
      return;
    }

    localStorage.removeItem(
      "neon-high-score"
    );

    localStorage.removeItem(
      "neon-best-combo"
    );

    localStorage.removeItem(
      "neon-stats"
    );

    localStorage.removeItem(
      "neon-achievements"
    );

    localStorage.removeItem(
      "neon-leaderboard"
    );

    setHighScore(0);
    setBestCombo(0);
    setStats(DEFAULT_STATS);
    setAchievements([]);
    setLeaderboard([]);

    showMessage("Progress reset");
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
      ].includes(key)
    ) {
      event.preventDefault();
    }

    if (key === "arrowup" || key === "w") {
      changeDirection({
        x: 0,
        y: -1,
      });
    }

    if (key === "arrowdown" || key === "s") {
      changeDirection({
        x: 0,
        y: 1,
      });
    }

    if (key === "arrowleft" || key === "a") {
      changeDirection({
        x: -1,
        y: 0,
      });
    }

    if (key === "arrowright" || key === "d") {
      changeDirection({
        x: 1,
        y: 0,
      });
    }

    if (key === " ") {
      if (running) {
        setPaused((old) => !old);
      }
    }

    if (key === "enter") {
      if (!running || gameOver) {
        startGame();
      }
    }
  }

  useEffect(() => {
    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  });

  function handleTouchStart(event) {
    const touch =
      event.touches?.[0];

    if (!touch) return;

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(event) {
    if (!touchStart.current) return;

    const touch =
      event.changedTouches?.[0];

    if (!touch) return;

    const dx =
      touch.clientX -
      touchStart.current.x;

    const dy =
      touch.clientY -
      touchStart.current.y;

    touchStart.current = null;

    if (
      Math.abs(dx) < 25 &&
      Math.abs(dy) < 25
    ) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection({
        x: dx > 0 ? 1 : -1,
        y: 0,
      });
    } else {
      changeDirection({
        x: 0,
        y: dy > 0 ? 1 : -1,
      });
    }
  }

  function setModeAndReset(newMode) {
    setMode(newMode);

    if (running) {
      setRunning(false);
      setGameOver(false);
      setPaused(false);
    }

    showMessage(
      `${MODES[newMode].icon} ${MODES[newMode].name}`
    );
  }

  function renderGame() {
    return (
      <div className="game-layout">
        <section className="game-section">
          <div className="game-header">
            <div>
              <div className="eyebrow">
                CURRENT RUN
              </div>

              <h1>
                {MODES[mode].icon}{" "}
                {MODES[mode].name}
              </h1>
            </div>

            <div className="header-actions">
              <button
                className="icon-button"
                onClick={() =>
                  setSoundOn((old) => !old)
                }
              >
                {soundOn ? "🔊" : "🔇"}
              </button>

              <button
                className="icon-button"
                onClick={() =>
                  setPaused((old) => !old)
                }
                disabled={!running}
              >
                {paused ? "▶" : "Ⅱ"}
              </button>
            </div>
          </div>

          <div className="score-row">
            <div className="score-card">
              <span>SCORE</span>
              <strong>{score}</strong>
            </div>

            <div className="score-card">
              <span>BEST</span>
              <strong>{highScore}</strong>
            </div>

            <div className="score-card">
              <span>LEVEL</span>
              <strong>{level}</strong>
            </div>

            <div className="score-card">
              <span>COMBO</span>
              <strong>
                {combo > 1
                  ? `${combo}x`
                  : "—"}
              </strong>
            </div>

            {mode === "time" && (
              <div className="score-card timer-card">
                <span>TIME</span>
                <strong>
                  {timeLeft}s
                </strong>
              </div>
            )}
          </div>

          {activePowerUp && (
            <div className="power-status">
              <span>
                {POWERUPS[
                  activePowerUp
                ].icon}
              </span>

              <div>
                <b>
                  {
                    POWERUPS[
                      activePowerUp
                    ].name
                  }
                </b>

                <div className="power-bar">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        (powerUpTime /
                          POWERUPS[
                            activePowerUp
                          ].duration) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div
            className={`board arena-${arena} ${
              paused ? "paused-board" : ""
            } ${
              gameOver
                ? "gameover-board"
                : ""
            }`}
            onTouchStart={
              handleTouchStart
            }
            onTouchEnd={handleTouchEnd}
          >
            {Array.from({
              length: SIZE * SIZE,
            }).map((_, index) => {
              const x = index % SIZE;
              const y = Math.floor(
                index / SIZE
              );

              const segmentIndex =
                snake.findIndex(
                  (segment) =>
                    segment.x === x &&
                    segment.y === y
                );

              const isSnake =
                segmentIndex !== -1;

              const isHead =
                segmentIndex === 0;

              const isFood =
                food.x === x &&
                food.y === y;

              const isPower =
                powerUp &&
                powerUp.x === x &&
                powerUp.y === y;

              const isWall =
                walls.some(
                  (wall) =>
                    wall.x === x &&
                    wall.y === y
                );

              return (
                <div
                  key={index}
                  className={`cell ${
                    isSnake
                      ? "snake-cell"
                      : ""
                  } ${
                    isHead
                      ? "snake-head"
                      : ""
                  } ${
                    isFood
                      ? `food-cell ${
                          FOOD_TYPES[
                            food.type
                          ].className
                        }`
                      : ""
                  } ${
                    isPower
                      ? `power-cell power-${powerUp.type}`
                      : ""
                  } ${
                    isWall
                      ? "wall-cell"
                      : ""
                  }`}
                >
                  {isSnake && (
                    <span
                      className="snake-body"
                      style={{
                        background:
                          currentSkin.color,
                      }}
                    />
                  )}

                  {isHead && (
                    <span className="snake-eyes">
                      <i />
                      <i />
                    </span>
                  )}

                  {isFood && (
                    <span>
                      {
                        FOOD_TYPES[
                          food.type
                        ].icon
                      }
                    </span>
                  )}

                  {isPower && (
                    <span>
                      {
                        POWERUPS[
                          powerUp.type
                        ].icon
                      }
                    </span>
                  )}

                  {isWall && (
                    <span>▦</span>
                  )}
                </div>
              );
            })}

            {particles.map(
              (particle) => (
                <span
                  key={particle.id}
                  className="particle"
                  style={{
                    left: `${
                      (particle.x / SIZE) *
                      100
                    }%`,
                    top: `${
                      (particle.y / SIZE) *
                      100
                    }%`,
                    "--dx": particle.dx,
                    "--dy": particle.dy,
                  }}
                />
              )
            )}

            {!running &&
              !gameOver && (
                <div className="board-overlay">
                  <div className="overlay-icon">
                    🐍
                  </div>

                  <h2>
                    NEON SNAKE
                  </h2>

                  <p>
                    {message ||
                      "Ready to play?"}
                  </p>

                  <button
                    className="primary-button"
                    onClick={startGame}
                  >
                    START GAME
                  </button>
                </div>
              )}

            {paused && running && (
              <div className="board-overlay">
                <div className="overlay-icon">
                  ⏸️
                </div>

                <h2>PAUSED</h2>

                <p>Take a breath.</p>

                <button
                  className="primary-button"
                  onClick={() =>
                    setPaused(false)
                  }
                >
                  RESUME
                </button>
              </div>
            )}

            {gameOver && (
              <div className="board-overlay">
                <div className="overlay-icon">
                  💥
                </div>

                <h2>GAME OVER</h2>

                <div className="final-score">
                  {score}
                </div>

                <p>
                  {score >= highScore
                    ? "🏆 New record!"
                    : "Nice run!"}
                </p>

                <button
                  className="primary-button"
                  onClick={startGame}
                >
                  PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          <div className="message">
            {message}
          </div>

          <div className="mobile-controls">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                changeDirection({
                  x: 0,
                  y: -1,
                });
              }}
            >
              ▲
            </button>

            <div>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  changeDirection({
                    x: -1,
                    y: 0,
                  });
                }}
              >
                ◀
              </button>

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  setPaused((old) => !old);
                }}
              >
                {paused ? "▶" : "Ⅱ"}
              </button>

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  changeDirection({
                    x: 1,
                    y: 0,
                  });
                }}
              >
                ▶
              </button>
            </div>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                changeDirection({
                  x: 0,
                  y: 1,
                });
              }}
            >
              ▼
            </button>
          </div>
        </section>

        <aside className="side-panel">
          <div className="profile-card">
            <div className="avatar">
              {currentSkin.icon}
            </div>

            <div>
              <span>PLAYER</span>

              <input
                value={playerName}
                onChange={(e) =>
                  setPlayerName(
                    e.target.value
                  )
                }
                maxLength={18}
              />
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-title">
              GAME MODES
            </div>

            <div className="mode-grid">
              {Object.entries(
                MODES
              ).map(
                ([
                  id,
                  item,
                ]) => (
                  <button
                    key={id}
                    className={
                      mode === id
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setModeAndReset(id)
                    }
                  >
                    <span>
                      {item.icon}
                    </span>

                    <b>
                      {item.name}
                    </b>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="daily-card">
            <div className="daily-top">
              <span>
                DAILY CHALLENGE
              </span>

              <span>🔥</span>
            </div>

            <h3>
              Score{" "}
              {dailyChallenge.target}
            </h3>

            <div className="progress">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    (challengeProgress /
                      dailyChallenge.target) *
                      100
                  )}%`,
                }}
              />
            </div>

            <small>
              Reward:{" "}
              {dailyChallenge.reward}
            </small>
          </div>
        </aside>
      </div>
    );
  }

  function renderLeaderboard() {
    return (
      <div className="page">
        <div className="page-heading">
          <span>🏆</span>
          <div>
            <div className="eyebrow">
              LOCAL RECORDS
            </div>
            <h1>Leaderboard</h1>
          </div>
        </div>

        <div className="leaderboard-list">
          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <div>🏆</div>
              <h2>No scores yet</h2>
              <p>
                Play a game and claim the
                first spot.
              </p>
            </div>
          ) : (
            leaderboard.map(
              (entry, index) => (
                <div
                  className="leaderboard-row"
                  key={`${entry.date}-${index}`}
                >
                  <div className="rank">
                    #{index + 1}
                  </div>

                  <div className="leader-player">
                    <div className="mini-avatar">
                      🐍
                    </div>

                    <div>
                      <b>
                        {entry.name}
                      </b>
                      <small>
                        {entry.mode}
                      </small>
                    </div>
                  </div>

                  <strong>
                    {entry.score}
                  </strong>
                </div>
              )
            )
          )}
        </div>
      </div>
    );
  }

  function renderAchievements() {
    return (
      <div className="page">
        <div className="page-heading">
          <span>🏆</span>

          <div>
            <div className="eyebrow">
              PROGRESSION
            </div>

            <h1>Achievements</h1>
          </div>
        </div>

        <div className="achievement-grid">
          {ACHIEVEMENTS.map(
            (achievement) => {
              const unlocked =
                achievements.includes(
                  achievement.id
                );

              return (
                <div
                  className={`achievement-card ${
                    unlocked
                      ? "unlocked"
                      : ""
                  }`}
                  key={achievement.id}
                >
                  <div className="achievement-icon">
                    {unlocked
                      ? achievement.icon
                      : "🔒"}
                  </div>

                  <div>
                    <h3>
                      {achievement.name}
                    </h3>

                    <p>
                      {
                        achievement.description
                      }
                    </p>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }

  function renderStats() {
    return (
      <div className="page">
        <div className="page-heading">
          <span>📊</span>

          <div>
            <div className="eyebrow">
              YOUR PERFORMANCE
            </div>

            <h1>Statistics</h1>
          </div>
        </div>

        <div className="stats-grid">
          <div className="big-stat">
            <span>BEST SCORE</span>
            <strong>
              {stats.bestScore}
            </strong>
          </div>

          <div className="big-stat">
            <span>GAMES PLAYED</span>
            <strong>
              {stats.games}
            </strong>
          </div>

          <div className="big-stat">
            <span>TOTAL SCORE</span>
            <strong>
              {stats.totalScore}
            </strong>
          </div>

          <div className="big-stat">
            <span>FOOD EATEN</span>
            <strong>
              {stats.food}
            </strong>
          </div>

          <div className="big-stat">
            <span>BEST COMBO</span>
            <strong>
              {stats.bestCombo}x
            </strong>
          </div>

          <div className="big-stat">
            <span>LONGEST SNAKE</span>
            <strong>
              {stats.bestLength}
            </strong>
          </div>

          <div className="big-stat">
            <span>GOLDEN FOOD</span>
            <strong>
              {stats.goldenFood}
            </strong>
          </div>

          <div className="big-stat">
            <span>POWER-UPS</span>
            <strong>
              {stats.powerUps}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="page">
        <div className="page-heading">
          <span>⚙️</span>

          <div>
            <div className="eyebrow">
              CUSTOMIZE
            </div>

            <h1>Settings</h1>
          </div>
        </div>

        <div className="settings-section">
          <h2>🎨 Themes</h2>

          <div className="option-grid">
            {Object.entries(
              THEMES
            ).map(
              ([id, item]) => (
                <button
                  key={id}
                  className={`option-card ${
                    theme === id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setTheme(id)
                  }
                >
                  <span
                    className="theme-preview"
                    style={{
                      background: item.accent,
                    }}
                  />
                  <b>
                    {item.name}
                  </b>
                </button>
              )
            )}
          </div>
        </div>

        <div className="settings-section">
          <h2>🐍 Snake Skins</h2>

          <div className="option-grid">
            {Object.entries(
              SKINS
            ).map(
              ([id, item]) => (
                <button
                  key={id}
                  className={`option-card ${
                    skin === id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSkin(id)
                  }
                >
                  <span className="skin-preview">
                    {item.icon}
                  </span>

                  <b>
                    {item.name}
                  </b>
                </button>
              )
            )}
          </div>
        </div>

        <div className="settings-section">
          <h2>🌌 Arenas</h2>

          <div className="option-grid">
            {Object.entries(
              ARENAS
            ).map(
              ([id, item]) => (
                <button
                  key={id}
                  className={`option-card ${
                    arena === id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setArena(id)
                  }
                >
                  <span className="arena-preview">
                    {item.icon}
                  </span>

                  <b>
                    {item.name}
                  </b>
                </button>
              )
            )}
          </div>
        </div>

        <div className="settings-section">
          <h2>🔊 Sound</h2>

          <div className="sound-row">
            <button
              className={`toggle ${
                soundOn
                  ? "on"
                  : ""
              }`}
              onClick={() =>
                setSoundOn(
                  (old) => !old
                )
              }
            >
              <span />
            </button>

            <span>
              {soundOn
                ? "Sound enabled"
                : "Sound disabled"}
            </span>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) =>
                setVolume(
                  Number(
                    e.target.value
                  )
                )
              }
              disabled={!soundOn}
            />
          </div>
        </div>

        <div className="danger-section">
          <h2>Reset Progress</h2>

          <p>
            This removes your local score,
            achievements and statistics.
          </p>

          <button
            className="danger-button"
            onClick={resetProgress}
          >
            Reset Everything
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`app theme-${theme}`}
      style={{
        "--accent":
          currentTheme.accent,
        "--accent2":
          currentTheme.accent2,
        "--theme-bg":
          currentTheme.bg,
      }}
    >
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            🐍
          </div>

          <div>
            <strong>
              NEON SNAKE
            </strong>

            <span>
              ARCADE EDITION
            </span>
          </div>
        </div>

        <div className="top-status">
          <span className="status-dot" />
          SYSTEM ONLINE
        </div>
      </header>

      <main>
        {screen === "game" &&
          renderGame()}

        {screen === "leaderboard" &&
          renderLeaderboard()}

        {screen === "achievements" &&
          renderAchievements()}

        {screen === "stats" &&
          renderStats()}

        {screen === "settings" &&
          renderSettings()}
      </main>

      <nav className="bottom-nav">
        <button
          className={
            screen === "game"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen("game")
          }
        >
          <span>🎮</span>
          Game
        </button>

        <button
          className={
            screen === "leaderboard"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen(
              "leaderboard"
            )
          }
        >
          <span>🏆</span>
          Scores
        </button>

        <button
          className={
            screen === "achievements"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen(
              "achievements"
            )
          }
        >
          <span>🎖️</span>
          Awards
        </button>

        <button
          className={
            screen === "stats"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen("stats")
          }
        >
          <span>📊</span>
          Stats
        </button>

        <button
          className={
            screen === "settings"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen("settings")
          }
        >
          <span>⚙️</span>
          Settings
        </button>
      </nav>

      <footer>
        NEON SNAKE • PHASE 1–4 • v1.0
      </footer>
    </div>
  );
}

export default App;