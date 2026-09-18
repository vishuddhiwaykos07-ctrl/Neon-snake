import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const BOARD_SIZE = 20

const THEMES = {
  neon: {
    name: 'Neon',
    icon: '💜',
    className: 'theme-neon',
  },
  cyber: {
    name: 'Cyber',
    icon: '🔵',
    className: 'theme-cyber',
  },
  matrix: {
    name: 'Matrix',
    icon: '🟢',
    className: 'theme-matrix',
  },
  fire: {
    name: 'Fire',
    icon: '🔥',
    className: 'theme-fire',
  },
  ice: {
    name: 'Ice',
    icon: '❄️',
    className: 'theme-ice',
  },
}

const FOOD_TYPES = {
  normal: {
    symbol: '●',
    points: 10,
    className: 'normal-food',
  },
  bonus: {
    symbol: '◆',
    points: 25,
    className: 'bonus-food',
  },
  golden: {
    symbol: '★',
    points: 50,
    className: 'golden-food',
  },
}

const POWER_UPS = {
  shield: {
    symbol: '🛡️',
    name: 'Shield',
    duration: 6000,
  },
  slow: {
    symbol: '⏱️',
    name: 'Slow',
    duration: 6000,
  },
  multiplier: {
    symbol: '✕2',
    name: '2X Score',
    duration: 6000,
  },
}

const MODES = {
  classic: {
    name: 'Classic',
    icon: '🐍',
    description: 'Classic Snake gameplay',
  },
  time: {
    name: 'Time Attack',
    icon: '⏱️',
    description: 'Score as much as possible in 60 seconds',
  },
  endless: {
    name: 'Endless',
    icon: '♾️',
    description: 'Keep going and chase your record',
  },
  challenge: {
    name: 'Challenge',
    icon: '💀',
    description: 'Walls appear as your score increases',
  },
}

const ACHIEVEMENT_LIST = [
  {
    id: 'first',
    icon: '🎮',
    title: 'First Game',
    description: 'Complete your first game',
  },
  {
    id: 'score50',
    icon: '⭐',
    title: 'Rising Star',
    description: 'Reach 50 points',
  },
  {
    id: 'score100',
    icon: '💯',
    title: 'Century',
    description: 'Reach 100 points',
  },
  {
    id: 'score250',
    icon: '🔥',
    title: 'On Fire',
    description: 'Reach 250 points',
  },
  {
    id: 'combo5',
    icon: '⚡',
    title: 'Combo Master',
    description: 'Reach a 5x combo',
  },
  {
    id: 'gold',
    icon: '👑',
    title: 'Golden Hunter',
    description: 'Eat golden food',
  },
  {
    id: 'power',
    icon: '🛡️',
    title: 'Powered Up',
    description: 'Use a power-up',
  },
  {
    id: 'long',
    icon: '🐍',
    title: 'Long Snake',
    description: 'Reach a length of 15',
  },
]

const DEFAULT_STATS = {
  games: 0,
  food: 0,
  bestCombo: 0,
  totalScore: 0,
  goldenFood: 0,
  powerUps: 0,
  longestSnake: 3,
}

const getSaved = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value !== null ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage errors
  }
}

const randomPosition = () => ({
  x: Math.floor(Math.random() * BOARD_SIZE),
  y: Math.floor(Math.random() * BOARD_SIZE),
})

const isSamePosition = (a, b) => a.x === b.x && a.y === b.y

const createFood = (snake) => {
  let position = randomPosition()

  while (snake.some((segment) => isSamePosition(segment, position))) {
    position = randomPosition()
  }

  const random = Math.random()

  let type = 'normal'

  if (random > 0.94) {
    type = 'golden'
  } else if (random > 0.78) {
    type = 'bonus'
  }

  return {
    ...position,
    type,
  }
}

const createPowerUp = (snake, food) => {
  if (Math.random() > 0.08) return null

  let position = randomPosition()

  while (
    snake.some((segment) => isSamePosition(segment, position)) ||
    isSamePosition(food, position)
  ) {
    position = randomPosition()
  }

  const types = Object.keys(POWER_UPS)
  const type = types[Math.floor(Math.random() * types.length)]

  return {
    ...position,
    type,
  }
}

const getInitialSnake = () => [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

function App() {
  const [snake, setSnake] = useState(getInitialSnake)
  const [food, setFood] = useState(() => createFood(getInitialSnake()))
  const [powerUp, setPowerUp] = useState(null)

  const [direction, setDirection] = useState({ x: 1, y: 0 })
  const nextDirection = useRef({ x: 1, y: 0 })

  const [gameStarted, setGameStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() =>
    getSaved('neon-high-score', 0)
  )

  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(() =>
    getSaved('neon-best-combo', 0)
  )

  const [soundOn, setSoundOn] = useState(() =>
    getSaved('neon-sound', true)
  )

  const [theme, setTheme] = useState(() =>
    getSaved('neon-theme', 'neon')
  )

  const [mode, setMode] = useState(() =>
    getSaved('neon-mode', 'classic')
  )

  const [playerName, setPlayerName] = useState(() =>
    getSaved('neon-player', 'Nova')
  )

  const [stats, setStats] = useState(() =>
    getSaved('neon-stats', DEFAULT_STATS)
  )

  const [achievements, setAchievements] = useState(() =>
    getSaved('neon-achievements', [])
  )

  const [leaderboard, setLeaderboard] = useState(() =>
    getSaved('neon-leaderboard', [])
  )

  const [activePowerUp, setActivePowerUp] = useState(null)
  const [powerUpTime, setPowerUpTime] = useState(0)

  const [timeLeft, setTimeLeft] = useState(60)

  const [message, setMessage] = useState('Ready?')
  const [screen, setScreen] = useState('game')

  const [walls, setWalls] = useState([])

  const touchStart = useRef(null)
  const audioContext = useRef(null)

  const currentTheme = THEMES[theme] || THEMES.neon

  const speed = useMemo(() => {
    let base = Math.max(70, 170 - (level - 1) * 12)

    if (activePowerUp === 'slow') {
      base += 100
    }

    if (mode === 'challenge') {
      base = Math.max(55, base - 10)
    }

    return base
  }, [level, activePowerUp, mode])

  const playSound = (frequency = 500, duration = 0.07) => {
    if (!soundOn) return

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext

      if (!AudioContext) return

      if (!audioContext.current) {
        audioContext.current = new AudioContext()
      }

      const ctx = audioContext.current

      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration
      )

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start()
      oscillator.stop(ctx.currentTime + duration)
    } catch {
      // Sound is optional
    }
  }

  const showMessage = (text) => {
    setMessage(text)

    window.setTimeout(() => {
      setMessage('')
    }, 1000)
  }

  const unlockAchievement = (id) => {
    setAchievements((current) => {
      if (current.includes(id)) return current

      const updated = [...current, id]
      const achievement = ACHIEVEMENT_LIST.find(
        (item) => item.id === id
      )

      if (achievement) {
        showMessage(`${achievement.icon} ${achievement.title}!`)
        playSound(850, 0.12)
      }

      return updated
    })
  }

  const generateWalls = () => {
    const newWalls = []

    const amount = Math.min(12, Math.floor(score / 75))

    for (let i = 0; i < amount; i++) {
      let position = randomPosition()

      let attempts = 0

      while (
        (
          snake.some((segment) =>
            isSamePosition(segment, position)
          ) ||
          isSamePosition(food, position) ||
          newWalls.some((wall) =>
            isSamePosition(wall, position)
          )
        ) &&
        attempts < 100
      ) {
        position = randomPosition()
        attempts++
      }

      newWalls.push(position)
    }

    setWalls(newWalls)
  }

  const changeDirection = (newDirection) => {
    const current = nextDirection.current

    if (
      newDirection.x === -current.x &&
      newDirection.y === -current.y
    ) {
      return
    }

    nextDirection.current = newDirection
  }

  const resetGame = () => {
    const newSnake = getInitialSnake()

    setSnake(newSnake)
    setFood(createFood(newSnake))
    setPowerUp(null)

    nextDirection.current = { x: 1, y: 0 }
    setDirection({ x: 1, y: 0 })

    setGameStarted(false)
    setPaused(false)
    setGameOver(false)

    setScore(0)
    setLevel(1)
    setCombo(0)

    setActivePowerUp(null)
    setPowerUpTime(0)

    setTimeLeft(60)

    setWalls([])

    setMessage('Ready?')
  }

  const startGame = () => {
    if (gameOver) {
      resetGame()
    }

    setGameStarted(true)
    setPaused(false)
    setGameOver(false)

    setMessage('GO!')

    playSound(700, 0.1)
  }

  const finishGame = () => {
    if (!gameStarted || gameOver) return

    setGameOver(true)
    setGameStarted(false)
    setPaused(false)

    playSound(180, 0.2)

    setStats((current) => {
      const updated = {
        ...current,
        games: current.games + 1,
        totalScore: current.totalScore + score,
        bestCombo: Math.max(current.bestCombo, combo),
        longestSnake: Math.max(
          current.longestSnake,
          snake.length
        ),
      }

      save('neon-stats', updated)

      return updated
    })

    if (score > highScore) {
      setHighScore(score)
      save('neon-high-score', score)
    }

    const newEntry = {
      name: playerName || 'Player',
      score,
      mode,
      date: new Date().toLocaleDateString(),
    }

    setLeaderboard((current) => {
      const updated = [...current, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      save('neon-leaderboard', updated)

      return updated
    })

    unlockAchievement('first')

    if (score >= 50) unlockAchievement('score50')
    if (score >= 100) unlockAchievement('score100')
    if (score >= 250) unlockAchievement('score250')
    if (combo >= 5) unlockAchievement('combo5')
    if (snake.length >= 15) unlockAchievement('long')
  }

  const eatFood = () => {
    const foodData = FOOD_TYPES[food.type]

    let points = foodData.points

    if (activePowerUp === 'multiplier') {
      points *= 2
    }

    const comboBonus = Math.max(0, combo * 2)

    points += comboBonus

    setScore((current) => {
      const updated = current + points

      const newLevel =
        updated >= 200
          ? 4
          : updated >= 100
            ? 3
            : updated >= 50
              ? 2
              : 1

      if (newLevel !== level) {
        setLevel(newLevel)
        showMessage(`LEVEL ${newLevel}!`)
        playSound(950, 0.12)
      }

      if (updated > highScore) {
        setHighScore(updated)
        save('neon-high-score', updated)
      }

      return updated
    })

    const newCombo = combo + 1

    setCombo(newCombo)
    setBestCombo((current) => {
      const updated = Math.max(current, newCombo)
      save('neon-best-combo', updated)
      return updated
    })

    setStats((current) => {
      const updated = {
        ...current,
        food: current.food + 1,
        bestCombo: Math.max(current.bestCombo, newCombo),
        goldenFood:
          current.goldenFood +
          (food.type === 'golden' ? 1 : 0),
        longestSnake: Math.max(
          current.longestSnake,
          snake.length + 1
        ),
      }

      save('neon-stats', updated)

      return updated
    })

    if (food.type === 'golden') {
      unlockAchievement('gold')
      playSound(1100, 0.14)
      showMessage('👑 GOLDEN +50!')
    } else if (food.type === 'bonus') {
      playSound(800, 0.1)
      showMessage(`◆ +${points}`)
    } else {
      playSound(600, 0.07)
    }

    const newFood = createFood(snake)
    setFood(newFood)

    const newPowerUp = createPowerUp(snake, newFood)

    if (newPowerUp) {
      setPowerUp(newPowerUp)
    }
  }

  const collectPowerUp = () => {
    if (!powerUp) return

    const data = POWER_UPS[powerUp.type]

    setActivePowerUp(powerUp.type)
    setPowerUpTime(data.duration)

    setStats((current) => {
      const updated = {
        ...current,
        powerUps: current.powerUps + 1,
      }

      save('neon-stats', updated)

      return updated
    })

    unlockAchievement('power')

    showMessage(`${data.symbol} ${data.name}!`)
    playSound(1000, 0.14)

    setPowerUp(null)
  }

  useEffect(() => {
    save('neon-sound', soundOn)
  }, [soundOn])

  useEffect(() => {
    save('neon-theme', theme)
  }, [theme])

  useEffect(() => {
    save('neon-mode', mode)
  }, [mode])

  useEffect(() => {
    save('neon-player', playerName)
  }, [playerName])

  useEffect(() => {
    if (!gameStarted || paused || gameOver) return

    const timer = window.setInterval(() => {
      setSnake((currentSnake) => {
        const move = nextDirection.current

        setDirection(move)

        const head = currentSnake[0]

        const newHead = {
          x: head.x + move.x,
          y: head.y + move.y,
        }

        let hitWall =
          newHead.x < 0 ||
          newHead.x >= BOARD_SIZE ||
          newHead.y < 0 ||
          newHead.y >= BOARD_SIZE

        const hitChallengeWall = walls.some((wall) =>
          isSamePosition(wall, newHead)
        )

        if (hitChallengeWall) {
          hitWall = true
        }

        if (hitWall) {
          if (activePowerUp === 'shield') {
            newHead.x =
              (newHead.x + BOARD_SIZE) % BOARD_SIZE
            newHead.y =
              (newHead.y + BOARD_SIZE) % BOARD_SIZE

            setActivePowerUp(null)
            setPowerUpTime(0)

            showMessage('🛡️ SHIELD SAVED YOU!')
            playSound(900, 0.1)
          } else if (mode === 'endless') {
            newHead.x =
              (newHead.x + BOARD_SIZE) % BOARD_SIZE
            newHead.y =
              (newHead.y + BOARD_SIZE) % BOARD_SIZE
          } else {
            finishGame()
            return currentSnake
          }
        }

        const willEat = isSamePosition(newHead, food)

        const bodyToCheck = willEat
          ? currentSnake
          : currentSnake.slice(0, -1)

        const hitSelf = bodyToCheck.some((segment) =>
          isSamePosition(segment, newHead)
        )

        if (hitSelf) {
          if (activePowerUp === 'shield') {
            setActivePowerUp(null)
            setPowerUpTime(0)

            showMessage('🛡️ SHIELD BROKE!')
            playSound(400, 0.1)
          } else {
            finishGame()
            return currentSnake
          }
        }

        const hitPowerUp =
          powerUp && isSamePosition(newHead, powerUp)

        if (hitPowerUp) {
          collectPowerUp()
        }

        let nextSnake = [newHead, ...currentSnake]

        if (willEat) {
          eatFood()
        } else {
          nextSnake.pop()
          setCombo((current) =>
            Math.max(0, current - 1)
          )
        }

        return nextSnake
      })
    }, speed)

    return () => window.clearInterval(timer)
  }, [
    gameStarted,
    paused,
    gameOver,
    speed,
    food,
    powerUp,
    activePowerUp,
    mode,
    walls,
  ])

  useEffect(() => {
    if (!activePowerUp) return

    const interval = window.setInterval(() => {
      setPowerUpTime((current) => {
        if (current <= 100) {
          setActivePowerUp(null)
          return 0
        }

        return current - 100
      })
    }, 100)

    return () => window.clearInterval(interval)
  }, [activePowerUp])

  useEffect(() => {
    if (
      mode === 'time' &&
      gameStarted &&
      !paused &&
      !gameOver
    ) {
      const timer = window.setInterval(() => {
        setTimeLeft((current) => {
          if (current <= 1) {
            finishGame()
            return 0
          }

          return current - 1
        })
      }, 1000)

      return () => window.clearInterval(timer)
    }
  }, [mode, gameStarted, paused, gameOver])

  useEffect(() => {
    if (
      mode === 'challenge' &&
      gameStarted &&
      score > 0 &&
      score % 75 === 0
    ) {
      generateWalls()
    }
  }, [score, mode, gameStarted])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if (
        [
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
          'w',
          'a',
          's',
          'd',
          ' ',
        ].includes(key)
      ) {
        event.preventDefault()
      }

      if (key === 'arrowup' || key === 'w') {
        changeDirection({ x: 0, y: -1 })
      }

      if (key === 'arrowdown' || key === 's') {
        changeDirection({ x: 0, y: 1 })
      }

      if (key === 'arrowleft' || key === 'a') {
        changeDirection({ x: -1, y: 0 })
      }

      if (key === 'arrowright' || key === 'd') {
        changeDirection({ x: 1, y: 0 })
      }

      if (key === ' ') {
        if (!gameStarted && !gameOver) {
          startGame()
        } else if (gameStarted) {
          setPaused((current) => !current)
        }
      }

      if (key === 'r') {
        resetGame()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () =>
      window.removeEventListener('keydown', handleKeyDown)
  }, [gameStarted, gameOver])

  const handleTouchStart = (event) => {
    const touch = event.touches[0]

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const handleTouchEnd = (event) => {
    if (!touchStart.current) return

    const touch = event.changedTouches[0]

    const dx =
      touch.clientX - touchStart.current.x

    const dy =
      touch.clientY - touchStart.current.y

    touchStart.current = null

    const minimumDistance = 25

    if (
      Math.abs(dx) < minimumDistance &&
      Math.abs(dy) < minimumDistance
    ) {
      return
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection({
        x: dx > 0 ? 1 : -1,
        y: 0,
      })
    } else {
      changeDirection({
        x: 0,
        y: dy > 0 ? 1 : -1,
      })
    }
  }

  const touchDirection = (event, move) => {
    event.preventDefault()
    event.stopPropagation()

    changeDirection(move)
  }

  const cells = []

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      cells.push({ x, y })
    }
  }

  return (
    <div
      className={`app ${currentTheme.className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="topbar">
        <div>
          <div className="logo">
            <span>🐍</span>
            <div>
              <h1>NEON SNAKE</h1>
              <p>ULTIMATE EDITION</p>
            </div>
          </div>
        </div>

        <div className="top-actions">
          <button
            className="icon-button"
            onClick={() => setSoundOn((current) => !current)}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>

          <button
            className="icon-button"
            onClick={() => setScreen('settings')}
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="main-content">
        {screen === 'game' && (
          <>
            <section className="game-layout">
              <aside className="side-panel">
                <div className="profile-card">
                  <div className="avatar">🎮</div>

                  <div>
                    <small>PLAYER</small>

                    <input
                      value={playerName}
                      onChange={(event) =>
                        setPlayerName(event.target.value)
                      }
                      maxLength={16}
                      aria-label="Player name"
                    />
                  </div>
                </div>

                <div className="stat-grid">
                  <div className="stat-card">
                    <span>🏆</span>
                    <small>HIGH SCORE</small>
                    <strong>{highScore}</strong>
                  </div>

                  <div className="stat-card">
                    <span>⭐</span>
                    <small>SCORE</small>
                    <strong>{score}</strong>
                  </div>

                  <div className="stat-card">
                    <span>⚡</span>
                    <small>COMBO</small>
                    <strong>x{combo}</strong>
                  </div>

                  <div className="stat-card">
                    <span>🚀</span>
                    <small>LEVEL</small>
                    <strong>{level}</strong>
                  </div>
                </div>

                <div className="mode-card">
                  <div className="section-title">
                    <span>🎮 GAME MODE</span>
                  </div>

                  <div className="mode-list">
                    {Object.entries(MODES).map(
                      ([key, item]) => (
                        <button
                          key={key}
                          className={
                            mode === key
                              ? 'mode-button active'
                              : 'mode-button'
                          }
                          onClick={() => {
                            if (!gameStarted) {
                              setMode(key)
                              resetGame()
                            }
                          }}
                        >
                          <span>{item.icon}</span>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.description}</small>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </aside>

              <section className="game-center">
                <div className="game-header">
                  <div>
                    <span className="mode-label">
                      {MODES[mode].icon} {MODES[mode].name}
                    </span>

                    <h2>
                      {mode === 'time'
                        ? `${timeLeft}s remaining`
                        : message || 'Keep going!'}
                    </h2>
                  </div>

                  <div className="level-pill">
                    LVL {level}
                  </div>
                </div>

                <div
                  className="board-wrapper"
                  onTouchStart={(event) => {
                    event.stopPropagation()
                    handleTouchStart(event)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    handleTouchEnd(event)
                  }}
                >
                  <div className="board">
                    {cells.map((cell) => {
                      const snakeIndex =
                        snake.findIndex((segment) =>
                          isSamePosition(segment, cell)
                        )

                      const isHead = snakeIndex === 0

                      const isFood =
                        isSamePosition(food, cell)

                      const isPowerUp =
                        powerUp &&
                        isSamePosition(powerUp, cell)

                      const isWall =
                        walls.some((wall) =>
                          isSamePosition(wall, cell)
                        )

                      let className = 'cell'

                      if (snakeIndex !== -1) {
                        className += ' snake-cell'

                        if (isHead) {
                          className += ' snake-head'
                        }
                      }

                      if (isFood) {
                        className += ` food-cell ${
                          FOOD_TYPES[food.type].className
                        }`
                      }

                      if (isPowerUp) {
                        className += ' power-cell'
                      }

                      if (isWall) {
                        className += ' wall-cell'
                      }

                      return (
                        <div
                          key={`${cell.x}-${cell.y}`}
                          className={className}
                        >
                          {isHead && '◆'}

                          {isFood &&
                            FOOD_TYPES[food.type].symbol}

                          {isPowerUp &&
                            POWER_UPS[powerUp.type].symbol}

                          {isWall && '▰'}
                        </div>
                      )
                    })}

                    {!gameStarted && !gameOver && (
                      <div className="overlay">
                        <div className="overlay-card">
                          <div className="big-icon">🐍</div>

                          <h2>NEON SNAKE</h2>

                          <p>
                            Eat. Grow. Survive. Break the
                            record.
                          </p>

                          <button
                            className="primary-button"
                            onClick={startGame}
                          >
                            ▶ START GAME
                          </button>

                          <small>
                            Arrow Keys / WASD / Swipe
                          </small>
                        </div>
                      </div>
                    )}

                    {paused && (
                      <div className="overlay">
                        <div className="overlay-card">
                          <div className="big-icon">⏸️</div>

                          <h2>PAUSED</h2>

                          <p>Your snake is waiting.</p>

                          <button
                            className="primary-button"
                            onClick={() =>
                              setPaused(false)
                            }
                          >
                            ▶ RESUME
                          </button>
                        </div>
                      </div>
                    )}

                    {gameOver && (
                      <div className="overlay">
                        <div className="overlay-card">
                          <div className="big-icon">💥</div>

                          <h2>GAME OVER</h2>

                          <p>
                            Final Score
                          </p>

                          <div className="final-score">
                            {score}
                          </div>

                          {score >= highScore && (
                            <div className="new-record">
                              🏆 NEW RECORD!
                            </div>
                          )}

                          <button
                            className="primary-button"
                            onClick={resetGame}
                          >
                            🔄 PLAY AGAIN
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="power-status">
                  {activePowerUp ? (
                    <>
                      <span>
                        {POWER_UPS[activePowerUp].symbol}
                      </span>

                      <strong>
                        {POWER_UPS[activePowerUp].name}
                      </strong>

                      <div className="power-bar">
                        <div
                          style={{
                            width: `${
                              (powerUpTime /
                                POWER_UPS[activePowerUp]
                                  .duration) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="power-hint">
                      Collect 🛡️ ⏱️ ✕2 power-ups
                    </span>
                  )}
                </div>

                <div className="mobile-controller">
                  <button
                    onPointerDown={(event) =>
                      touchDirection(event, {
                        x: 0,
                        y: -1,
                      })
                    }
                    onTouchStart={(event) =>
                      touchDirection(event, {
                        x: 0,
                        y: -1,
                      })
                    }
                  >
                    ▲
                  </button>

                  <div>
                    <button
                      onPointerDown={(event) =>
                        touchDirection(event, {
                          x: -1,
                          y: 0,
                        })
                      }
                      onTouchStart={(event) =>
                        touchDirection(event, {
                          x: -1,
                          y: 0,
                        })
                      }
                    >
                      ◀
                    </button>

                    <button
                      onPointerDown={(event) =>
                        touchDirection(event, {
                          x: 0,
                          y: 1,
                        })
                      }
                      onTouchStart={(event) =>
                        touchDirection(event, {
                          x: 0,
                          y: 1,
                        })
                      }
                    >
                      ▼
                    </button>

                    <button
                      onPointerDown={(event) =>
                        touchDirection(event, {
                          x: 1,
                          y: 0,
                        })
                      }
                      onTouchStart={(event) =>
                        touchDirection(event, {
                          x: 1,
                          y: 0,
                        })
                      }
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <div className="game-buttons">
                  {gameStarted && !gameOver && (
                    <button
                      className="secondary-button"
                      onClick={() =>
                        setPaused((current) => !current)
                      }
                    >
                      {paused ? '▶ RESUME' : '⏸ PAUSE'}
                    </button>
                  )}

                  <button
                    className="secondary-button"
                    onClick={resetGame}
                  >
                    🔄 RESET
                  </button>
                </div>
              </section>
            </section>
          </>
        )}

        {screen === 'leaderboard' && (
          <section className="page-section">
            <div className="page-heading">
              <span>🏆</span>

              <div>
                <h2>Leaderboard</h2>
                <p>Your best local scores</p>
              </div>
            </div>

            <div className="leaderboard">
              {leaderboard.length === 0 ? (
                <div className="empty-state">
                  🐍 No scores yet. Be the first!
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    className="leaderboard-row"
                    key={`${entry.name}-${entry.score}-${index}`}
                  >
                    <div className="rank">
                      {index === 0
                        ? '🥇'
                        : index === 1
                          ? '🥈'
                          : index === 2
                            ? '🥉'
                            : `#${index + 1}`}
                    </div>

                    <div className="leader-player">
                      <strong>{entry.name}</strong>
                      <small>
                        {MODES[entry.mode]?.name ||
                          entry.mode}{' '}
                        • {entry.date}
                      </small>
                    </div>

                    <strong className="leader-score">
                      {entry.score}
                    </strong>
                  </div>
                ))
              )}
            </div>

            {leaderboard.length > 0 && (
              <button
                className="danger-button"
                onClick={() => {
                  setLeaderboard([])
                  save('neon-leaderboard', [])
                }}
              >
                🗑 Clear Leaderboard
              </button>
            )}
          </section>
        )}

        {screen === 'achievements' && (
          <section className="page-section">
            <div className="page-heading">
              <span>🏅</span>

              <div>
                <h2>Achievements</h2>

                <p>
                  {achievements.length}/
                  {ACHIEVEMENT_LIST.length} unlocked
                </p>
              </div>
            </div>

            <div className="achievement-grid">
              {ACHIEVEMENT_LIST.map((achievement) => {
                const unlocked = achievements.includes(
                  achievement.id
                )

                return (
                  <div
                    className={
                      unlocked
                        ? 'achievement unlocked'
                        : 'achievement'
                    }
                    key={achievement.id}
                  >
                    <div className="achievement-icon">
                      {unlocked
                        ? achievement.icon
                        : '🔒'}
                    </div>

                    <div>
                      <strong>
                        {achievement.title}
                      </strong>

                      <p>
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {screen === 'stats' && (
          <section className="page-section">
            <div className="page-heading">
              <span>📊</span>

              <div>
                <h2>Statistics</h2>
                <p>Your Neon Snake journey</p>
              </div>
            </div>

            <div className="big-stats">
              <div>
                <span>🎮</span>
                <small>GAMES</small>
                <strong>{stats.games}</strong>
              </div>

              <div>
                <span>🍎</span>
                <small>FOOD EATEN</small>
                <strong>{stats.food}</strong>
              </div>

              <div>
                <span>⚡</span>
                <small>BEST COMBO</small>
                <strong>x{stats.bestCombo}</strong>
              </div>

              <div>
                <span>🐍</span>
                <small>LONGEST SNAKE</small>
                <strong>{stats.longestSnake}</strong>
              </div>

              <div>
                <span>👑</span>
                <small>GOLDEN FOOD</small>
                <strong>{stats.goldenFood}</strong>
              </div>

              <div>
                <span>🛡️</span>
                <small>POWER-UPS</small>
                <strong>{stats.powerUps}</strong>
              </div>

              <div>
                <span>⭐</span>
                <small>TOTAL SCORE</small>
                <strong>{stats.totalScore}</strong>
              </div>

              <div>
                <span>🏆</span>
                <small>HIGH SCORE</small>
                <strong>{highScore}</strong>
              </div>
            </div>
          </section>
        )}

        {screen === 'settings' && (
          <section className="page-section">
            <div className="page-heading">
              <span>⚙️</span>

              <div>
                <h2>Settings</h2>
                <p>Customize your game</p>
              </div>
            </div>

            <div className="settings-card">
              <div className="setting-row">
                <div>
                  <strong>🔊 Sound Effects</strong>
                  <p>Game sounds and achievement sounds</p>
                </div>

                <button
                  className={
                    soundOn
                      ? 'toggle active'
                      : 'toggle'
                  }
                  onClick={() =>
                    setSoundOn((current) => !current)
                  }
                >
                  {soundOn ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>👤 Player Name</strong>
                  <p>Name shown on the leaderboard</p>
                </div>

                <input
                  className="settings-input"
                  value={playerName}
                  onChange={(event) =>
                    setPlayerName(event.target.value)
                  }
                  maxLength={16}
                />
              </div>

              <div>
                <strong>🎨 Theme</strong>

                <div className="theme-grid">
                  {Object.entries(THEMES).map(
                    ([key, item]) => (
                      <button
                        key={key}
                        className={
                          theme === key
                            ? 'theme-button selected'
                            : 'theme-button'
                        }
                        onClick={() => setTheme(key)}
                      >
                        <span>{item.icon}</span>
                        {item.name}
                      </button>
                    )
                  )}
                </div>
              </div>

              <button
                className="danger-button"
                onClick={() => {
                  localStorage.clear()

                  window.location.reload()
                }}
              >
                🗑 RESET ALL SAVED DATA
              </button>
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={screen === 'game' ? 'active' : ''}
          onClick={() => setScreen('game')}
        >
          <span>🎮</span>
          <small>Game</small>
        </button>

        <button
          className={
            screen === 'leaderboard' ? 'active' : ''
          }
          onClick={() => setScreen('leaderboard')}
        >
          <span>🏆</span>
          <small>Ranks</small>
        </button>

        <button
          className={
            screen === 'achievements' ? 'active' : ''
          }
          onClick={() => setScreen('achievements')}
        >
          <span>🏅</span>
          <small>Badges</small>
        </button>

        <button
          className={screen === 'stats' ? 'active' : ''}
          onClick={() => setScreen('stats')}
        >
          <span>📊</span>
          <small>Stats</small>
        </button>

        <button
          className={screen === 'settings' ? 'active' : ''}
          onClick={() => setScreen('settings')}
        >
          <span>⚙️</span>
          <small>Settings</small>
        </button>
      </nav>

      <footer>
        <span>🐍 NEON SNAKE</span>
        <span>v1.0</span>
        <span>Built with React ⚡</span>
      </footer>
    </div>
  )
}

export default App