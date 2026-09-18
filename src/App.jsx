import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

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
  grid: { name: "Neon Grid", icon: "▦" },
  cyber: { name: "Cyber Arena", icon: "◈" },
  space: { name: "Deep Space", icon: "✦" },
  lava: { name: "Lava Core", icon: "♨" },
  ice: { name: "Frozen Zone", icon: "❄" },
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
    const wall = randomCell(START_SNAKE, walls);

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
  /* ================= AUTH ================= */

  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");

  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  /* ================= GAME ================= */

  const [screen, setScreen] = useState("game");

  const [snake, setSnake] = useState(START_SNAKE);

  const [food, setFood] = useState(() =>
    createFood(START_SNAKE)
  );

  const [powerUp, setPowerUp] = useState(null);
  const [walls, setWalls] = useState([]);

  const [direction, setDirection] = useState({
    x: 1,
    y: 0,
  });

  const directionRef = useRef({
    x: 1,
    y: 0,
  });

  const [nextDirection, setNextDirection] = useState({
    x: 1,
    y: 0,
  });

  const nextDirectionRef = useRef({
    x: 1,
    y: 0,
  });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [score, setScore] = useState(0);

  const [highScore, setHighScore] = useState(() =>
    loadData("neon-high-score", 0)
  );

  const [level, setLevel] = useState(1);

  const [combo, setCombo] = useState(0);

  const [bestCombo, setBestCombo] = useState(() =>
    loadData("neon-best-combo", 0)
  );

  const [soundOn, setSoundOn] = useState(() =>
    loadData("neon-sound", true)
  );

  const [volume, setVolume] = useState(() =>
    loadData("neon-volume", 0.5)
  );

  const [theme, setTheme] = useState(() =>
    loadData("neon-theme", "neon")
  );

  const [skin, setSkin] = useState(() =>
    loadData("neon-skin", "neon")
  );

  const [arena, setArena] = useState(() =>
    loadData("neon-arena", "grid")
  );

  const [mode, setMode] = useState(() =>
    loadData("neon-mode", "classic")
  );

  const [playerName, setPlayerName] = useState(() =>
    loadData("neon-player", "Nova")
  );

  const [stats, setStats] = useState(() =>
    loadData("neon-stats", DEFAULT_STATS)
  );

  const [achievements, setAchievements] = useState(() =>
    loadData("neon-achievements", [])
  );

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] =
    useState(false);
  const [leaderboardError, setLeaderboardError] =
    useState("");

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

  /* ================= PROFILE ================= */

  const [profileData, setProfileData] = useState(null);
  const [cloudStats, setCloudStats] = useState(null);
  const [recentScores, setRecentScores] = useState([]);
  const [globalRank, setGlobalRank] = useState(null);

  const [profileUsername, setProfileUsername] =
    useState("");

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileError, setProfileError] =
    useState("");

  const audioContext = useRef(null);
  const gameTimer = useRef(null);
  const powerTimer = useRef(null);
  const messageTimer = useRef(null);
  const touchStart = useRef(null);

  const currentTheme = THEMES[theme];
  const currentSkin = SKINS[skin];

  const speed = useMemo(() => {
    let base = Math.max(
      65,
      170 - (level - 1) * 9
    );

    if (activePowerUp === "slow") {
      base += 75;
    }

    return base;
  }, [level, activePowerUp]);

  /* ================= SUPABASE AUTH ================= */

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setUser(session?.user ?? null);
      setAuthChecking(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user?.user_metadata?.username) {
      setPlayerName(user.user_metadata.username);
    }
  }, [user]);

  /* ================= AUTH ================= */

  async function handleAuth(event) {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");

    const email = authEmail.trim();
    const username = authUsername.trim();

    if (!email || !authPassword) {
      setAuthError(
        "Please enter your email and password."
      );
      return;
    }

    if (authMode === "signup" && !username) {
      setAuthError("Choose a player name.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setAuthBusy(true);

    if (authMode === "signup") {
      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.session) {
        setUser(data.user);
        setPlayerName(username);

        setAuthMessage(
          "Account created! Welcome to Neon Snake."
        );
      } else {
        setAuthMessage(
          "Account created! Check your email to confirm your account."
        );
      }
    } else {
      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password: authPassword,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setUser(data.user);
        setAuthMessage(
          "Welcome back, Snake Master! 🐍"
        );
      }
    }

    setAuthBusy(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setRunning(false);
    setPaused(false);
    setGameOver(false);
    setScreen("game");

    showMessage("Signed out 👋");
  }

  /* ================= LOCAL STORAGE ================= */

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

  /* ================= CLOUD PROFILE ================= */

  async function loadProfileData() {
    if (!user) return;

    setProfileLoading(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, username, created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const {
        data: playerStats,
        error: statsError,
      } = await supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (statsError) {
        throw statsError;
      }

      const {
        data: scores,
        error: scoresError,
      } = await supabase
        .from("scores")
        .select(
          "id, score, mode, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(10);

      if (scoresError) {
        throw scoresError;
      }

      const bestScore =
        playerStats?.best_score ??
        stats.bestScore ??
        0;

      const {
        count: higherScores,
        error: rankError,
      } = await supabase
        .from("scores")
        .select("id", {
          count: "exact",
          head: true,
        })
        .gt("score", bestScore);

      if (rankError) {
        console.warn(
          "Rank lookup failed:",
          rankError
        );
      }

      const resolvedUsername =
        profile?.username ||
        user.user_metadata?.username ||
        playerName ||
        "Player";

      setProfileData(
        profile || {
          id: user.id,
          username: resolvedUsername,
          created_at: user.created_at,
        }
      );

      setCloudStats(
        playerStats || {
          user_id: user.id,
          games: stats.games,
          food: stats.food,
          golden_food: stats.goldenFood,
          power_ups: stats.powerUps,
          total_score: stats.totalScore,
          best_score: stats.bestScore,
          best_combo: stats.bestCombo,
          best_length: stats.bestLength,
        }
      );

      setRecentScores(scores || []);

      setGlobalRank(
        bestScore > 0
          ? (higherScores || 0) + 1
          : null
      );

      setProfileUsername(
        resolvedUsername
      );

      setPlayerName(
        resolvedUsername
      );
    } catch (error) {
      console.error(
        "Profile loading error:",
        error
      );

      setProfileError(
        error.message ||
          "Unable to load cloud profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    if (
      user &&
      screen === "profile"
    ) {
      loadProfileData();
    }
  }, [user, screen]);

  /* ================= SAVE PROFILE ================= */

  async function saveProfile() {
    if (!user) return;

    const username =
      profileUsername.trim();

    if (!username) {
      setProfileMessage(
        "Please enter a player name."
      );
      return;
    }

    if (username.length < 2) {
      setProfileMessage(
        "Player name must be at least 2 characters."
      );
      return;
    }

    setProfileLoading(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          username,
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      const {
        error: metadataError,
      } = await supabase.auth.updateUser({
        data: {
          username,
        },
      });

      if (metadataError) {
        console.warn(
          "Metadata update failed:",
          metadataError
        );
      }

      setPlayerName(username);

      setProfileData(
        (old) => ({
          ...(old || {}),
          username,
        })
      );

      setProfileMessage(
        "Profile updated successfully ✨"
      );
    } catch (error) {
      console.error(
        "Profile update failed:",
        error
      );

      setProfileError(
        error.message ||
          "Could not update profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  /* ================= ONLINE LEADERBOARD ================= */

  async function loadLeaderboard() {
    if (!user) return;

    setLeaderboardLoading(true);
    setLeaderboardError("");

    const {
      data: scoreRows,
      error: scoreError,
    } = await supabase
      .from("scores")
      .select(
        "id, user_id, score, mode, created_at"
      )
      .order("score", {
        ascending: false,
      })
      .limit(50);

    if (scoreError) {
      setLeaderboardError(
        scoreError.message
      );

      setLeaderboardLoading(false);
      return;
    }

    const userIds = [
      ...new Set(
        (scoreRows || []).map(
          (row) => row.user_id
        )
      ),
    ];

    let profileMap = {};

    if (userIds.length > 0) {
      const {
        data: profiles,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      if (!profileError) {
        profileMap =
          Object.fromEntries(
            (profiles || []).map(
              (profile) => [
                profile.id,
                profile.username,
              ]
            )
          );
      }
    }

    const formatted =
      (scoreRows || []).map(
        (entry) => ({
          ...entry,
          name:
            profileMap[
              entry.user_id
            ] || "Player",
        })
      );

    setLeaderboard(formatted);
    setLeaderboardLoading(false);
  }

  useEffect(() => {
    if (
      screen === "leaderboard" &&
      user
    ) {
      loadLeaderboard();
    }
  }, [screen, user]);

  /* ================= SOUND ================= */

  function playSound(type) {
    if (!soundOn) return;

    try {
      if (!audioContext.current) {
        audioContext.current =
          new window.AudioContext();
      }

      const ctx =
        audioContext.current;

      const oscillator =
        ctx.createOscillator();

      const gain =
        ctx.createGain();

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

      oscillator.stop(
        ctx.currentTime + 0.12
      );
    } catch {
      // Audio is optional.
    }
  }

  function showMessage(text) {
    setMessage(text);

    clearTimeout(
      messageTimer.current
    );

    messageTimer.current =
      setTimeout(() => {
        setMessage("");
      }, 1800);
  }

  function spawnParticles(
    cell,
    type = "normal"
  ) {
    const newParticles =
      Array.from(
        {
          length:
            type === "golden"
              ? 12
              : 7,
        },
        (_, index) => ({
          id: `${Date.now()}-${index}`,
          x: cell.x,
          y: cell.y,
          dx:
            Math.random() * 2 - 1,
          dy:
            Math.random() * 2 - 1,
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
              (p) =>
                p.id ===
                particle.id
            )
        )
      );
    }, 450);
  }

  /* ================= ACHIEVEMENTS ================= */

  function unlockAchievement(id) {
    setAchievements((old) => {
      if (old.includes(id)) {
        return old;
      }

      const achievement =
        ACHIEVEMENTS.find(
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
    newLevel,
    newGames = stats.games
  ) {
    if (
      stats.food > 0 ||
      newScore > 0
    ) {
      unlockAchievement(
        "first"
      );
    }

    if (newScore >= 100) {
      unlockAchievement(
        "score100"
      );
    }

    if (newScore >= 500) {
      unlockAchievement(
        "score500"
      );
    }

    if (newScore >= 1000) {
      unlockAchievement(
        "score1000"
      );
    }

    if (newCombo >= 5) {
      unlockAchievement(
        "combo5"
      );
    }

    if (newLength >= 15) {
      unlockAchievement(
        "length15"
      );
    }

    if (newGames >= 10) {
      unlockAchievement(
        "games10"
      );
    }

    if (newLevel >= 10) {
      unlockAchievement(
        "level10"
      );
    }
  }

  /* ================= ONLINE SCORE ================= */

  async function submitOnlineScore(
    finalScore,
    finalStats
  ) {
    if (!user) return;

    try {
      const {
        error: scoreError,
      } = await supabase
        .from("scores")
        .insert({
          user_id: user.id,
          score: finalScore,
          mode: MODES[mode].name,
        });

      if (scoreError) {
        console.error(
          "Score upload failed:",
          scoreError
        );
      }

      const {
        error: statsError,
      } = await supabase
        .from("player_stats")
        .upsert(
          {
            user_id: user.id,
            games: finalStats.games,
            food: finalStats.food,
            golden_food:
              finalStats.goldenFood,
            power_ups:
              finalStats.powerUps,
            total_score:
              finalStats.totalScore,
            best_score:
              finalStats.bestScore,
            best_combo:
              finalStats.bestCombo,
            best_length:
              finalStats.bestLength,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id",
          }
        );

      if (statsError) {
        console.error(
          "Stats upload failed:",
          statsError
        );
      }
    } catch (error) {
      console.error(
        "Online save failed:",
        error
      );
    }
  }

  /* ================= GAME ================= */

  function startGame() {
    const initialSnake = [
      ...START_SNAKE,
    ];

    const initialWalls =
      mode === "challenge"
        ? createWalls()
        : [];

    const initialFood =
      createFood(
        initialSnake,
        initialWalls
      );

    setSnake(initialSnake);

    setDirection({
      x: 1,
      y: 0,
    });

    directionRef.current = {
      x: 1,
      y: 0,
    };

    setNextDirection({
      x: 1,
      y: 0,
    });

    nextDirectionRef.current = {
      x: 1,
      y: 0,
    };

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

  async function finishGame(
    finalScore = score
  ) {
    if (!running) return;

    setRunning(false);
    setGameOver(true);
    setPaused(false);

    playSound("gameover");

    const newStats = {
      ...stats,
      games: stats.games + 1,
      totalScore:
        stats.totalScore +
        finalScore,
      bestScore: Math.max(
        stats.bestScore,
        finalScore
      ),
      bestCombo: Math.max(
        stats.bestCombo,
        bestCombo
      ),
      bestLength: Math.max(
        stats.bestLength,
        snake.length
      ),
    };

    setStats(newStats);

    checkAchievements(
      finalScore,
      combo,
      snake.length,
      level,
      newStats.games
    );

    if (
      finalScore > highScore
    ) {
      setHighScore(
        finalScore
      );

      showMessage(
        "🏆 NEW HIGH SCORE!"
      );
    } else {
      showMessage(
        "GAME OVER"
      );
    }

    await submitOnlineScore(
      finalScore,
      newStats
    );
  }

  function changeDirection(
    newDirection
  ) {
    const current =
      directionRef.current;

    if (
      newDirection.x ===
        -current.x &&
      newDirection.y ===
        -current.y
    ) {
      return;
    }

    nextDirectionRef.current =
      newDirection;

    setNextDirection(
      newDirection
    );
  }

  function moveSnake() {
    if (
      !running ||
      paused ||
      gameOver
    ) {
      return;
    }

    const newDirection =
      nextDirectionRef.current;

    directionRef.current =
      newDirection;

    setDirection(
      newDirection
    );

    setSnake(
      (currentSnake) => {
        const head =
          currentSnake[0];

        let newHead = {
          x:
            head.x +
            newDirection.x,
          y:
            head.y +
            newDirection.y,
        };

        if (mode === "endless") {
          newHead.x =
            (newHead.x + SIZE) %
            SIZE;

          newHead.y =
            (newHead.y + SIZE) %
            SIZE;
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

        const hitWall =
          walls.some(
            (wall) =>
              wall.x ===
                newHead.x &&
              wall.y ===
                newHead.y
          );

        if (
          hitWall &&
          activePowerUp !==
            "shield"
        ) {
          finishGame(score);
          return currentSnake;
        }

        const hitSelf =
          currentSnake.some(
            (segment) =>
              segment.x ===
                newHead.x &&
              segment.y ===
                newHead.y
          );

        if (
          hitSelf &&
          activePowerUp !==
            "shield"
        ) {
          finishGame(score);
          return currentSnake;
        }

        let newSnake = [
          newHead,
          ...currentSnake,
        ];

        const ateFood =
          newHead.x ===
            food.x &&
          newHead.y ===
            food.y;

        const atePowerUp =
          powerUp &&
          newHead.x ===
            powerUp.x &&
          newHead.y ===
            powerUp.y;

        if (ateFood) {
          const foodData =
            FOOD_TYPES[
              food.type
            ];

          const comboBonus =
            combo >= 2
              ? combo * 5
              : 0;

          const multiplier =
            activePowerUp ===
            "multiplier"
              ? 2
              : 1;

          const gained =
            (foodData.points +
              comboBonus) *
            multiplier;

          const newScore =
            score + gained;

          const newCombo =
            combo + 1;

          const newLevel =
            Math.floor(
              newScore / 100
            ) + 1;

          setScore(
            newScore
          );

          setCombo(
            newCombo
          );

          setLevel(
            newLevel
          );

          if (
            newCombo >
            bestCombo
          ) {
            setBestCombo(
              newCombo
            );
          }

          setStats((old) => ({
            ...old,
            food:
              old.food + 1,
            goldenFood:
              old.goldenFood +
              (food.type ===
              "golden"
                ? 1
                : 0),
            bestCombo:
              Math.max(
                old.bestCombo,
                newCombo
              ),
            bestLength:
              Math.max(
                old.bestLength,
                newSnake.length
              ),
          }));

          if (
            food.type ===
            "golden"
          ) {
            playSound(
              "golden"
            );

            showMessage(
              "🏆 GOLDEN FOOD +50!"
            );

            unlockAchievement(
              "golden"
            );
          } else if (
            food.type ===
            "bonus"
          ) {
            playSound(
              "bonus"
            );

            showMessage(
              `◆ +${gained}`
            );
          } else {
            playSound("eat");

            if (
              newCombo >= 3
            ) {
              showMessage(
                `🔥 ${newCombo}x COMBO! +${gained}`
              );
            }
          }

          spawnParticles(
            food,
            food.type
          );

          if (
            newLevel > level
          ) {
            playSound(
              "level"
            );

            showMessage(
              `🚀 LEVEL ${newLevel}!`
            );
          }

          if (
            newScore >
            highScore
          ) {
            setHighScore(
              newScore
            );
          }

          setChallengeProgress(
            (old) =>
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
            setPowerUp(
              newPowerUp
            );
          }
        } else {
          newSnake.pop();
          setCombo(0);
        }

        if (atePowerUp) {
          const power =
            POWERUPS[
              powerUp.type
            ];

          setActivePowerUp(
            powerUp.type
          );

          setPowerUpTime(
            power.duration
          );

          setStats((old) => ({
            ...old,
            powerUps:
              old.powerUps +
              1,
          }));

          unlockAchievement(
            "powerup"
          );

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
      }
    );
  }

  /* ================= GAME TIMER ================= */

  useEffect(() => {
    if (
      !running ||
      paused ||
      gameOver
    ) {
      clearInterval(
        gameTimer.current
      );
      return;
    }

    gameTimer.current =
      setInterval(
        moveSnake,
        speed
      );

    return () => {
      clearInterval(
        gameTimer.current
      );
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

  /* ================= POWER TIMER ================= */

  useEffect(() => {
    if (!activePowerUp) {
      return;
    }

    clearInterval(
      powerTimer.current
    );

    powerTimer.current =
      setInterval(() => {
        setPowerUpTime(
          (old) => {
            if (old <= 100) {
              setActivePowerUp(
                null
              );

              return 0;
            }

            return old - 100;
          }
        );
      }, 100);

    return () => {
      clearInterval(
        powerTimer.current
      );
    };
  }, [activePowerUp]);

  /* ================= TIME MODE ================= */

  useEffect(() => {
    if (
      mode !== "time" ||
      !running ||
      paused ||
      gameOver
    ) {
      return;
    }

    const timer =
      setInterval(() => {
        setTimeLeft(
          (old) => {
            if (old <= 1) {
              finishGame(
                score
              );

              return 0;
            }

            return old - 1;
          }
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    mode,
    running,
    paused,
    gameOver,
    score,
  ]);

  /* ================= KEYBOARD ================= */

  function handleKeyDown(
    event
  ) {
    const key =
      event.key.toLowerCase();

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

    if (
      key === "arrowup" ||
      key === "w"
    ) {
      changeDirection({
        x: 0,
        y: -1,
      });
    }

    if (
      key === "arrowdown" ||
      key === "s"
    ) {
      changeDirection({
        x: 0,
        y: 1,
      });
    }

    if (
      key === "arrowleft" ||
      key === "a"
    ) {
      changeDirection({
        x: -1,
        y: 0,
      });
    }

    if (
      key === "arrowright" ||
      key === "d"
    ) {
      changeDirection({
        x: 1,
        y: 0,
      });
    }

    if (key === " ") {
      if (running) {
        setPaused(
          (old) => !old
        );
      }
    }

    if (key === "enter") {
      if (
        !running ||
        gameOver
      ) {
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

  /* ================= TOUCH ================= */

  function handleTouchStart(
    event
  ) {
    const touch =
      event.touches?.[0];

    if (!touch) return;

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(
    event
  ) {
    if (!touchStart.current) {
      return;
    }

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

    if (
      Math.abs(dx) >
      Math.abs(dy)
    ) {
      changeDirection({
        x:
          dx > 0 ? 1 : -1,
        y: 0,
      });
    } else {
      changeDirection({
        x: 0,
        y:
          dy > 0 ? 1 : -1,
      });
    }
  }

  function setModeAndReset(
    newMode
  ) {
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

  /* ================= RESET ================= */

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

    setHighScore(0);
    setBestCombo(0);
    setStats(DEFAULT_STATS);
    setAchievements([]);

    showMessage(
      "Local progress reset"
    );
  }

  /* ================= AUTH SCREEN ================= */

  function renderAuth() {
    return (
      <div className="auth-screen">
        <div className="auth-background">
          <div className="auth-glow glow-one" />
          <div className="auth-glow glow-two" />
          <div className="auth-grid" />
        </div>

        <div className="auth-card">
          <div className="auth-logo">
            🐍
          </div>

          <div className="auth-brand">
            <strong>
              NEON SNAKE
            </strong>

            <span>
              ONLINE ARCADE
            </span>
          </div>

          <div className="auth-heading">
            <div className="eyebrow">
              {authMode === "login"
                ? "WELCOME BACK"
                : "JOIN THE ARCADE"}
            </div>

            <h1>
              {authMode === "login"
                ? "Enter the Arena"
                : "Create Your Account"}
            </h1>

            <p>
              {authMode === "login"
                ? "Sign in to save your scores and compete globally."
                : "Create your player profile and start climbing the leaderboard."}
            </p>
          </div>

          {authError && (
            <div className="auth-alert error">
              ⚠️ {authError}
            </div>
          )}

          {authMessage && (
            <div className="auth-alert success">
              ✅ {authMessage}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleAuth}
          >
            {authMode === "signup" && (
              <label>
                <span>
                  PLAYER NAME
                </span>

                <input
                  type="text"
                  value={
                    authUsername
                  }
                  onChange={(e) =>
                    setAuthUsername(
                      e.target.value
                    )
                  }
                  placeholder="Choose your name"
                  maxLength={18}
                  autoComplete="username"
                />
              </label>
            )}

            <label>
              <span>
                EMAIL
              </span>

              <input
                type="email"
                value={authEmail}
                onChange={(e) =>
                  setAuthEmail(
                    e.target.value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              <span>
                PASSWORD
              </span>

              <input
                type="password"
                value={
                  authPassword
                }
                onChange={(e) =>
                  setAuthPassword(
                    e.target.value
                  )
                }
                placeholder="At least 6 characters"
                autoComplete={
                  authMode === "login"
                    ? "current-password"
                    : "new-password"
                }
              />
            </label>

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={authBusy}
            >
              {authBusy
                ? "CONNECTING..."
                : authMode === "login"
                ? "ENTER ARCADE →"
                : "CREATE ACCOUNT →"}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {authMode === "login"
                ? "New player?"
                : "Already have an account?"}
            </span>

            <button
              onClick={() => {
                setAuthMode(
                  authMode ===
                    "login"
                    ? "signup"
                    : "login"
                );

                setAuthError("");
                setAuthMessage("");
              }}
            >
              {authMode === "login"
                ? "Create account"
                : "Sign in"}
            </button>
          </div>

          <div className="auth-footer">
            🔐 Secure account
            <span>•</span>
            ☁️ Cloud saves
            <span>•</span>
            🏆 Global scores
          </div>
        </div>
      </div>
    );
  }

  /* ================= GAME SCREEN ================= */

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
                  setSoundOn(
                    (old) => !old
                  )
                }
              >
                {soundOn
                  ? "🔊"
                  : "🔇"}
              </button>

              <button
                className="icon-button"
                onClick={() =>
                  setPaused(
                    (old) => !old
                  )
                }
                disabled={!running}
              >
                {paused
                  ? "▶"
                  : "Ⅱ"}
              </button>
            </div>
          </div>

          <div className="score-row">
            <div className="score-card">
              <span>SCORE</span>
              <strong>
                {score}
              </strong>
            </div>

            <div className="score-card">
              <span>BEST</span>
              <strong>
                {highScore}
              </strong>
            </div>

            <div className="score-card">
              <span>LEVEL</span>
              <strong>
                {level}
              </strong>
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
                {
                  POWERUPS[
                    activePowerUp
                  ].icon
                }
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
              paused
                ? "paused-board"
                : ""
            } ${
              gameOver
                ? "gameover-board"
                : ""
            }`}
            onTouchStart={
              handleTouchStart
            }
            onTouchEnd={
              handleTouchEnd
            }
          >
            {Array.from({
              length:
                SIZE * SIZE,
            }).map(
              (_, index) => {
                const x =
                  index % SIZE;

                const y =
                  Math.floor(
                    index / SIZE
                  );

                const segmentIndex =
                  snake.findIndex(
                    (segment) =>
                      segment.x ===
                        x &&
                      segment.y ===
                        y
                  );

                const isSnake =
                  segmentIndex !==
                  -1;

                const isHead =
                  segmentIndex ===
                  0;

                const isFood =
                  food.x === x &&
                  food.y === y;

                const isPower =
                  powerUp &&
                  powerUp.x ===
                    x &&
                  powerUp.y ===
                    y;

                const isWall =
                  walls.some(
                    (wall) =>
                      wall.x ===
                        x &&
                      wall.y ===
                        y
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
                            ]
                              .className
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
                      <span>
                        ▦
                      </span>
                    )}
                  </div>
                );
              }
            )}

            {particles.map(
              (particle) => (
                <span
                  key={
                    particle.id
                  }
                  className="particle"
                  style={{
                    left: `${
                      (particle.x /
                        SIZE) *
                      100
                    }%`,
                    top: `${
                      (particle.y /
                        SIZE) *
                      100
                    }%`,
                    "--dx":
                      particle.dx,
                    "--dy":
                      particle.dy,
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
                    onClick={
                      startGame
                    }
                  >
                    START GAME
                  </button>
                </div>
              )}

            {paused &&
              running && (
                <div className="board-overlay">
                  <div className="overlay-icon">
                    ⏸️
                  </div>

                  <h2>
                    PAUSED
                  </h2>

                  <p>
                    Take a breath.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() =>
                      setPaused(
                        false
                      )
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

                <h2>
                  GAME OVER
                </h2>

                <div className="final-score">
                  {score}
                </div>

                <p>
                  {score >=
                  highScore
                    ? "🏆 New record!"
                    : "Nice run!"}
                </p>

                <button
                  className="primary-button"
                  onClick={
                    startGame
                  }
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
              onPointerDown={(
                e
              ) => {
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
                onPointerDown={(
                  e
                ) => {
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
                onPointerDown={(
                  e
                ) => {
                  e.preventDefault();

                  setPaused(
                    (old) =>
                      !old
                  );
                }}
              >
                {paused
                  ? "▶"
                  : "Ⅱ"}
              </button>

              <button
                onPointerDown={(
                  e
                ) => {
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
              onPointerDown={(
                e
              ) => {
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
              <span>
                PLAYER
              </span>

              <input
                value={
                  playerName
                }
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
                      setModeAndReset(
                        id
                      )
                    }
                  >
                    <span>
                      {
                        item.icon
                      }
                    </span>

                    <b>
                      {
                        item.name
                      }
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

              <span>
                🔥
              </span>
            </div>

            <h3>
              Score{" "}
              {
                dailyChallenge.target
              }
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
              {
                dailyChallenge.reward
              }
            </small>
          </div>

          <div className="account-panel">
            <div className="online-indicator">
              <span className="status-dot" />
              ONLINE ACCOUNT
            </div>

            <small>
              {user?.email}
            </small>

            <button
              className="logout-button"
              onClick={
                handleLogout
              }
            >
              🚪 Sign Out
            </button>
          </div>
        </aside>
      </div>
    );
  }

  /* ================= PROFILE ================= */

  function renderProfile() {
    const displayName =
      profileData?.username ||
      profileUsername ||
      playerName ||
      "Player";

    const displayStats =
      cloudStats || {
        games: stats.games,
        food: stats.food,
        golden_food:
          stats.goldenFood,
        power_ups:
          stats.powerUps,
        total_score:
          stats.totalScore,
        best_score:
          stats.bestScore,
        best_combo:
          stats.bestCombo,
        best_length:
          stats.bestLength,
      };

    return (
      <div className="page profile-page">
        <div className="page-heading profile-page-heading">
          <span>👤</span>

          <div>
            <div className="eyebrow">
              PLAYER CENTER
            </div>

            <h1>
              My Profile
            </h1>
          </div>

          <button
            className="refresh-button"
            onClick={
              loadProfileData
            }
            disabled={
              profileLoading
            }
          >
            {profileLoading
              ? "⏳ Loading..."
              : "↻ Refresh"}
          </button>
        </div>

        {profileError && (
          <div className="auth-alert error">
            ⚠️ {profileError}
          </div>
        )}

        {profileMessage && (
          <div className="auth-alert success">
            ✅ {profileMessage}
          </div>
        )}

        <div className="profile-hero">
          <div className="profile-avatar">
            {displayName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-identity">
            <span className="profile-label">
              SNAKE MASTER
            </span>

            <h2>
              {displayName}
            </h2>

            <p>
              {user?.email}
            </p>

            {profileData?.created_at && (
              <small>
                Member since{" "}
                {new Date(
                  profileData.created_at
                ).toLocaleDateString(
                  undefined,
                  {
                    month:
                      "short",
                    year:
                      "numeric",
                  }
                )}
              </small>
            )}
          </div>

          <div className="profile-rank-big">
            <span>
              GLOBAL RANK
            </span>

            <strong>
              {globalRank
                ? `#${globalRank}`
                : "—"}
            </strong>
          </div>
        </div>

        <div className="profile-edit-card">
          <div className="profile-section-title">
            <div>
              <span>
                ACCOUNT
              </span>

              <h2>
                Player Identity
              </h2>
            </div>

            <span className="cloud-badge">
              ☁️ CLOUD
            </span>
          </div>

          <div className="profile-edit-row">
            <input
              type="text"
              value={
                profileUsername
              }
              onChange={(e) =>
                setProfileUsername(
                  e.target.value
                )
              }
              maxLength={18}
              placeholder="Enter player name"
            />

            <button
              className="primary-button"
              onClick={
                saveProfile
              }
              disabled={
                profileLoading
              }
            >
              {profileLoading
                ? "SAVING..."
                : "SAVE PROFILE"}
            </button>
          </div>
        </div>

        <div className="profile-rank-card">
          <div>
            <span>
              🏆 BEST SCORE
            </span>

            <strong>
              {displayStats.best_score ??
                0}
            </strong>

            <small>
              Personal record
            </small>
          </div>

          <div>
            <span>
              🌎 GLOBAL POSITION
            </span>

            <strong>
              {globalRank
                ? `#${globalRank}`
                : "—"}
            </strong>

            <small>
              Based on best score
            </small>
          </div>
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat">
            <span>🎮</span>
            <small>
              GAMES
            </small>
            <strong>
              {displayStats.games ??
                0}
            </strong>
          </div>

          <div className="profile-stat">
            <span>🍎</span>
            <small>
              FOOD
            </small>
            <strong>
              {displayStats.food ??
                0}
            </strong>
          </div>

          <div className="profile-stat">
            <span>⭐</span>
            <small>
              TOTAL SCORE
            </small>
            <strong>
              {displayStats.total_score ??
                0}
            </strong>
          </div>

          <div className="profile-stat">
            <span>🔥</span>
            <small>
              BEST COMBO
            </small>
            <strong>
              {displayStats.best_combo ??
                0}
              x
            </strong>
          </div>

          <div className="profile-stat">
            <span>📏</span>
            <small>
              LONGEST
            </small>
            <strong>
              {displayStats.best_length ??
                0}
            </strong>
          </div>

          <div className="profile-stat">
            <span>🥇</span>
            <small>
              GOLDEN FOOD
            </small>
            <strong>
              {displayStats.golden_food ??
                0}
            </strong>
          </div>

          <div className="profile-stat">
            <span>⚡</span>
            <small>
              POWER-UPS
            </small>
            <strong>
              {displayStats.power_ups ??
                0}
            </strong>
          </div>

          <div className="profile-stat">
            <span>🏅</span>
            <small>
              ACHIEVEMENTS
            </small>
            <strong>
              {
                achievements.length
              }
              /{ACHIEVEMENTS.length}
            </strong>
          </div>
        </div>

        <div className="recent-scores-card">
          <div className="section-heading">
            <div>
              <span>
                ONLINE HISTORY
              </span>

              <h2>
                Recent Scores
              </h2>
            </div>

            <span className="cloud-badge">
              ☁️ LIVE DATA
            </span>
          </div>

          {recentScores.length ===
          0 ? (
            <div className="empty-scores">
              <div>
                🐍
              </div>

              <h3>
                No online games yet
              </h3>

              <p>
                Finish a game to
                create your online
                score history.
              </p>
            </div>
          ) : (
            <div className="score-history">
              {recentScores.map(
                (
                  game,
                  index
                ) => (
                  <div
                    className="score-history-row"
                    key={
                      game.id
                    }
                  >
                    <div className="score-number">
                      {index ===
                      0
                        ? "🔥"
                        : `#${index + 1}`}
                    </div>

                    <div className="score-history-info">
                      <strong>
                        {
                          game.score
                        }
                      </strong>

                      <span>
                        {
                          game.mode
                        }
                      </span>
                    </div>

                    <div className="score-history-date">
                      {new Date(
                        game.created_at
                      ).toLocaleDateString(
                        undefined,
                        {
                          day:
                            "2-digit",
                          month:
                            "short",
                          year:
                            "numeric",
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="profile-footer-card">
          <div>
            <span>
              ☁️ CLOUD SYNC
            </span>

            <h3>
              Your progress is connected
            </h3>

            <p>
              Scores and player
              statistics are saved
              securely to your Neon
              Snake account.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              setScreen(
                "leaderboard"
              )
            }
          >
            VIEW GLOBAL →
          </button>
        </div>
      </div>
    );
  }

  /* ================= LEADERBOARD ================= */

  function renderLeaderboard() {
    return (
      <div className="page">
        <div className="page-heading">
          <span>🏆</span>

          <div>
            <div className="eyebrow">
              ONLINE RECORDS
            </div>

            <h1>
              Global Leaderboard
            </h1>
          </div>

          <button
            className="refresh-button"
            onClick={
              loadLeaderboard
            }
            disabled={
              leaderboardLoading
            }
          >
            {leaderboardLoading
              ? "↻"
              : "↻ Refresh"}
          </button>
        </div>

        <div className="online-banner">
          <span>☁️</span>

          <div>
            <b>
              GLOBAL SCOREBOARD
            </b>

            <small>
              Scores from Neon Snake
              players around the
              world.
            </small>
          </div>
        </div>

        {leaderboardError && (
          <div className="auth-alert error">
            ⚠️{" "}
            {leaderboardError}
          </div>
        )}

        <div className="leaderboard-list">
          {leaderboardLoading ? (
            <div className="empty-state">
              <div>
                ⏳
              </div>

              <h2>
                Loading scores...
              </h2>

              <p>
                Connecting to the
                arcade network.
              </p>
            </div>
          ) : leaderboard.length ===
            0 ? (
            <div className="empty-state">
              <div>
                🏆
              </div>

              <h2>
                No scores yet
              </h2>

              <p>
                Play a game and claim
                the first spot.
              </p>
            </div>
          ) : (
            leaderboard.map(
              (
                entry,
                index
              ) => (
                <div
                  className={`leaderboard-row ${
                    entry.user_id ===
                    user?.id
                      ? "your-score"
                      : ""
                  }`}
                  key={
                    entry.id
                  }
                >
                  <div className="rank">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `#${index + 1}`}
                  </div>

                  <div className="leader-player">
                    <div className="mini-avatar">
                      🐍
                    </div>

                    <div>
                      <b>
                        {
                          entry.name
                        }

                        {entry.user_id ===
                          user?.id && (
                          <span className="you-badge">
                            YOU
                          </span>
                        )}
                      </b>

                      <small>
                        {
                          entry.mode
                        }
                      </small>
                    </div>
                  </div>

                  <strong>
                    {
                      entry.score
                    }
                  </strong>
                </div>
              )
            )
          )}
        </div>
      </div>
    );
  }

  /* ================= ACHIEVEMENTS ================= */

  function renderAchievements() {
    return (
      <div className="page">
        <div className="page-heading">
          <span>🏆</span>

          <div>
            <div className="eyebrow">
              PROGRESSION
            </div>

            <h1>
              Achievements
            </h1>
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
                  key={
                    achievement.id
                  }
                >
                  <div className="achievement-icon">
                    {unlocked
                      ? achievement.icon
                      : "🔒"}
                  </div>

                  <div>
                    <h3>
                      {
                        achievement.name
                      }
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

  /* ================= STATS ================= */

  function renderStats() {
    return (
      <div className="page">
        <div className="page-heading">
          <span>📊</span>

          <div>
            <div className="eyebrow">
              YOUR PERFORMANCE
            </div>

            <h1>
              Statistics
            </h1>
          </div>
        </div>

        <div className="stats-grid">
          <div className="big-stat">
            <span>
              BEST SCORE
            </span>

            <strong>
              {stats.bestScore}
            </strong>
          </div>

          <div className="big-stat">
            <span>
              GAMES PLAYED
            </span>

            <strong>
              {stats.games}
            </strong>
          </div>

          <div className="big-stat">
            <span>
              TOTAL SCORE
            </span>

            <strong>
              {stats.totalScore}
            </strong>
          </div>

          <div className="big-stat">
            <span>
              FOOD EATEN
            </span>

            <strong>
              {stats.food}
            </strong>
          </div>

          <div className="big-stat">
            <span>
              BEST COMBO
            </span>

            <strong>
              {stats.bestCombo}x
            </strong>
          </div>

          <div className="big-stat">
            <span>
              LONGEST SNAKE
            </span>

            <strong>
              {stats.bestLength}
            </strong>
          </div>

          <div className="big-stat">
            <span>
              GOLDEN FOOD
            </span>

            <strong>
              {stats.goldenFood}
            </strong>
          </div>

          <div className="big-stat">
            <span>
              POWER-UPS
            </span>

            <strong>
              {stats.powerUps}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  /* ================= SETTINGS ================= */

  function renderSettings() {
    return (
      <div className="page">
        <div className="page-heading">
          <span>⚙️</span>

          <div>
            <div className="eyebrow">
              CUSTOMIZE
            </div>

            <h1>
              Settings
            </h1>
          </div>
        </div>

        <div className="settings-section">
          <h2>
            🎨 Themes
          </h2>

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
                      background:
                        item.accent,
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
          <h2>
            🐍 Snake Skins
          </h2>

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
          <h2>
            🌌 Arenas
          </h2>

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
          <h2>
            🔊 Sound
          </h2>

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
              disabled={
                !soundOn
              }
            />
          </div>
        </div>

        <div className="danger-section">
          <h2>
            Reset Local Progress
          </h2>

          <p>
            This removes your local
            score, achievements and
            statistics.
          </p>

          <button
            className="danger-button"
            onClick={
              resetProgress
            }
          >
            Reset Everything
          </button>
        </div>
      </div>
    );
  }

  /* ================= LOADING ================= */

  if (authChecking) {
    return (
      <div className="auth-screen">
        <div className="auth-card loading-card">
          <div className="auth-logo">
            🐍
          </div>

          <h1>
            NEON SNAKE
          </h1>

          <p>
            Connecting to arcade
            network...
          </p>

          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return renderAuth();
  }

  /* ================= MAIN APP ================= */

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
              ONLINE ARCADE
            </span>
          </div>
        </div>

        <div className="top-right">
          <div className="top-status">
            <span className="status-dot" />
            SYSTEM ONLINE
          </div>

          <button
            className="account-chip"
            onClick={() =>
              setScreen("profile")
            }
          >
            <span>👤</span>

            <b>
              {playerName ||
                "Player"}
            </b>
          </button>
        </div>
      </header>

      <main>
        {screen === "game" &&
          renderGame()}

        {screen ===
          "profile" &&
          renderProfile()}

        {screen ===
          "leaderboard" &&
          renderLeaderboard()}

        {screen ===
          "achievements" &&
          renderAchievements()}

        {screen === "stats" &&
          renderStats()}

        {screen ===
          "settings" &&
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
            screen ===
            "leaderboard"
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
          Global
        </button>

        <button
          className={
            screen ===
            "profile"
              ? "active"
              : ""
          }
          onClick={() =>
            setScreen("profile")
          }
        >
          <span>👤</span>
          Profile
        </button>

        <button
          className={
            screen ===
            "achievements"
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
            setScreen(
              "settings"
            )
          }
        >
          <span>⚙️</span>
          Settings
        </button>
      </nav>

      <footer>
        NEON SNAKE • ONLINE
        ARCADE • v2.0
      </footer>
    </div>
  );
}

export default App;