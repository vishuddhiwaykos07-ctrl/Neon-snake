import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const GRID_SIZE = 20

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

const INITIAL_DIRECTION = { x: 1, y: 0 }

const FOOD_TYPES = {
  normal: {
    symbol: '●',
    points: 10,
    className: 'food-normal',
  },
  bonus: {
    symbol: '◆',
    points: 25,
    className: 'food-bonus',
  },
  golden: {
    symbol: '★',
    points: 50,
    className: 'food-golden',
  },
}

const POWER_UPS = {
  shield: {
    symbol: '🛡️',
    name: 'SHIELD',
    duration: 6000,
  },
  slow: {
    symbol: '⏱️',
    name: 'SLOW TIME',
    duration: 6000,
  },
  multiplier: {
    symbol: '✕2',
    name: '2X SCORE',
    duration: 6000,
  },
}

const getSavedData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

const createFood = (snake) => {
  const emptyCells = []

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const occupied = snake.some(
        (segment) => segment.x === x && segment.y === y
      )

      if (!occupied) {
        emptyCells.push({ x, y })
      }
    }
  }

  if (!emptyCells.length) {
    return { x: 0, y: 0, type: 'normal' }
  }

  const position =
    emptyCells[Math.floor(Math.random() * emptyCells.length)]

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
  if (Math.random() > 0.035) return null

  const emptyCells = []

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const occupiedBySnake = snake.some(
        (segment) => segment.x === x && segment.y === y
      )

      const occupiedByFood =
        food.x === x && food.y === y

      if (!occupiedBySnake && !occupiedByFood) {
        emptyCells.push({ x, y })
      }
    }
  }

  if (!emptyCells.length) return null

  const position =
    emptyCells[Math.floor(Math.random() * emptyCells.length)]

  const types = Object.keys(POWER_UPS)
  const type =
    types[Math.floor(Math.random() * types.length)]

  return {
    ...position,
    type,
  }
}

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [food, setFood] = useState(() =>
    createFood(INITIAL_SNAKE)
  )

  const [powerUp, setPowerUp] = useState(null)

  const [direction, setDirection] = useState(INITIAL_DIRECTION)
  const [nextDirection, setNextDirection] =
    useState(INITIAL_DIRECTION)

  const [score, setScore] = useState(0)

  const [highScore, setHighScore] = useState(() =>
    getSavedData('neonSnakeHighScore', 0)
  )

  const [level, setLevel] = useState(1)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const [newRecord, setNewRecord] = useState(false)

  const [soundEnabled, setSoundEnabled] = useState(true)

  const [combo, setCombo] = useState(0)

  const [activePowerUp, setActivePowerUp] = useState(null)

  const [powerUpTime, setPowerUpTime] = useState(0)

  const [message, setMessage] = useState('')

  const audioContextRef = useRef(null)

  const playSound = useCallback(
    (type) => {
      if (!soundEnabled) return

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (
            window.AudioContext ||
            window.webkitAudioContext
          )()
        }

        const audio = audioContextRef.current

        if (audio.state === 'suspended') {
          audio.resume()
        }

        const oscillator = audio.createOscillator()
        const gain = audio.createGain()

        oscillator.connect(gain)
        gain.connect(audio.destination)

        const now = audio.currentTime

        if (type === 'eat') {
          oscillator.frequency.setValueAtTime(500, now)
          oscillator.frequency.exponentialRampToValueAtTime(
            900,
            now + 0.08
          )

          gain.gain.setValueAtTime(0.08, now)
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.12
          )

          oscillator.start(now)
          oscillator.stop(now + 0.12)
        }

        if (type === 'power') {
          oscillator.frequency.setValueAtTime(500, now)
          oscillator.frequency.setValueAtTime(
            800,
            now + 0.08
          )
          oscillator.frequency.setValueAtTime(
            1100,
            now + 0.16
          )

          gain.gain.setValueAtTime(0.08, now)
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.3
          )

          oscillator.start(now)
          oscillator.stop(now + 0.3)
        }

        if (type === 'gameover') {
          oscillator.frequency.setValueAtTime(300, now)
          oscillator.frequency.exponentialRampToValueAtTime(
            100,
            now + 0.3
          )

          gain.gain.setValueAtTime(0.1, now)
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.35
          )

          oscillator.start(now)
          oscillator.stop(now + 0.35)
        }

        if (type === 'level') {
          oscillator.frequency.setValueAtTime(500, now)
          oscillator.frequency.setValueAtTime(
            700,
            now + 0.08
          )
          oscillator.frequency.setValueAtTime(
            1000,
            now + 0.16
          )

          gain.gain.setValueAtTime(0.08, now)
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.25
          )

          oscillator.start(now)
          oscillator.stop(now + 0.25)
        }
      } catch {
        // Sound is optional.
      }
    },
    [soundEnabled]
  )

  const showMessage = useCallback((text) => {
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 1000)
  }, [])

  const startGame = () => {
    setStarted(true)
    setPaused(false)
    setGameOver(false)
  }

  const restartGame = useCallback(() => {
    const newSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]

    const newDirection = { x: 1, y: 0 }

    setSnake(newSnake)
    setFood(createFood(newSnake))
    setPowerUp(null)

    setDirection(newDirection)
    setNextDirection(newDirection)

    setScore(0)
    setLevel(1)
    setCombo(0)

    setActivePowerUp(null)
    setPowerUpTime(0)

    setMessage('')
    setNewRecord(false)

    setStarted(true)
    setPaused(false)
    setGameOver(false)
  }, [])

  const changeDirection = useCallback(
    (newDirection) => {
      if (gameOver) return

      const opposite =
        newDirection.x === -direction.x &&
        newDirection.y === -direction.y

      if (opposite) return

      setNextDirection(newDirection)

      if (!started) {
        setStarted(true)
      }
    },
    [direction, gameOver, started]
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if (
        key === 'arrowup' ||
        key === 'w'
      ) {
        event.preventDefault()
        changeDirection({ x: 0, y: -1 })
      }

      if (
        key === 'arrowdown' ||
        key === 's'
      ) {
        event.preventDefault()
        changeDirection({ x: 0, y: 1 })
      }

      if (
        key === 'arrowleft' ||
        key === 'a'
      ) {
        event.preventDefault()
        changeDirection({ x: -1, y: 0 })
      }

      if (
        key === 'arrowright' ||
        key === 'd'
      ) {
        event.preventDefault()
        changeDirection({ x: 1, y: 0 })
      }

      if (key === ' ') {
        event.preventDefault()

        if (started && !gameOver) {
          setPaused((value) => !value)
        }
      }

      if (key === 'r') {
        restartGame()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [
    changeDirection,
    restartGame,
    started,
    gameOver,
  ])

  useEffect(() => {
    const newLevel =
      Math.floor(score / 50) + 1

    if (newLevel > level) {
      playSound('level')
      showMessage(`LEVEL ${newLevel}`)
    }

    setLevel(newLevel)
  }, [
    score,
    level,
    playSound,
    showMessage,
  ])

  useEffect(() => {
    if (!activePowerUp) return

    const interval = setInterval(() => {
      setPowerUpTime((time) => {
        if (time <= 100) {
          setActivePowerUp(null)
          return 0
        }

        return time - 100
      })
    }, 100)

    return () => clearInterval(interval)
  }, [activePowerUp])

  useEffect(() => {
    if (
      !started ||
      paused ||
      gameOver
    ) {
      return
    }

    const baseSpeed =
      150 - (level - 1) * 12

    const speed =
      activePowerUp === 'slow'
        ? Math.min(baseSpeed + 70, 220)
        : Math.max(baseSpeed, 55)

    const timer = setInterval(() => {
      setSnake((currentSnake) => {
        const head = currentSnake[0]

        const newHead = {
          x:
            head.x +
            nextDirection.x,

          y:
            head.y +
            nextDirection.y,
        }

        const hitWall =
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE

        if (hitWall) {
          if (activePowerUp === 'shield') {
            setActivePowerUp(null)
            setPowerUpTime(0)
            showMessage('🛡️ SHIELD SAVED YOU!')

            const safeHead = {
              x:
                newHead.x < 0
                  ? GRID_SIZE - 1
                  : newHead.x >= GRID_SIZE
                  ? 0
                  : newHead.x,

              y:
                newHead.y < 0
                  ? GRID_SIZE - 1
                  : newHead.y >= GRID_SIZE
                  ? 0
                  : newHead.y,
            }

            return [
              safeHead,
              ...currentSnake,
            ]
          }

          setGameOver(true)
          playSound('gameover')
          return currentSnake
        }

        const ateFood =
          newHead.x === food.x &&
          newHead.y === food.y

        const collectedPowerUp =
          powerUp &&
          newHead.x === powerUp.x &&
          newHead.y === powerUp.y

        const bodyToCheck = ateFood
          ? currentSnake
          : currentSnake.slice(0, -1)

        const hitSelf =
          bodyToCheck.some(
            (segment) =>
              segment.x === newHead.x &&
              segment.y === newHead.y
          )

        if (hitSelf) {
          if (activePowerUp === 'shield') {
            setActivePowerUp(null)
            setPowerUpTime(0)

            showMessage(
              '🛡️ SHIELD SAVED YOU!'
            )

            return currentSnake
          }

          setGameOver(true)
          playSound('gameover')
          return currentSnake
        }

        const newSnake = [
          newHead,
          ...currentSnake,
        ]

        if (ateFood) {
          const foodData =
            FOOD_TYPES[food.type]

          const multiplier =
            activePowerUp === 'multiplier'
              ? 2
              : 1

          const comboBonus =
            combo >= 3
              ? combo * 2
              : 0

          const earned =
            (foodData.points + comboBonus) *
            multiplier

          const newScore =
            score + earned

          setScore(newScore)

          setCombo((value) => value + 1)

          playSound('eat')

          if (food.type === 'golden') {
            showMessage(`⭐ +${earned}`)
          } else if (food.type === 'bonus') {
            showMessage(`◆ +${earned}`)
          } else if (combo >= 3) {
            showMessage(
              `🔥 COMBO x${combo + 1}`
            )
          }

          if (newScore > highScore) {
            setHighScore(newScore)
            setNewRecord(true)

            try {
              localStorage.setItem(
                'neonSnakeHighScore',
                String(newScore)
              )
            } catch {
              // Storage unavailable.
            }
          }

          setFood(createFood(newSnake))

          if (!powerUp) {
            const newPowerUp =
              createPowerUp(
                newSnake,
                food
              )

            if (newPowerUp) {
              setPowerUp(newPowerUp)
            }
          }

          return newSnake
        }

        setCombo(0)

        if (collectedPowerUp) {
          const powerData =
            POWER_UPS[powerUp.type]

          setActivePowerUp(powerUp.type)
          setPowerUpTime(
            powerData.duration
          )

          playSound('power')

          showMessage(
            `${powerData.symbol} ${powerData.name}!`
          )

          setPowerUp(null)
        }

        newSnake.pop()

        return newSnake
      })

      setDirection(nextDirection)
    }, speed)

    return () => clearInterval(timer)
  }, [
    started,
    paused,
    gameOver,
    level,
    nextDirection,
    food,
    score,
    highScore,
    combo,
    powerUp,
    activePowerUp,
    playSound,
    showMessage,
  ])

  const cells = []

  for (
    let y = 0;
    y < GRID_SIZE;
    y++
  ) {
    for (
      let x = 0;
      x < GRID_SIZE;
      x++
    ) {
      const snakeIndex =
        snake.findIndex(
          (segment) =>
            segment.x === x &&
            segment.y === y
        )

      const isSnake =
        snakeIndex !== -1

      const isHead =
        snakeIndex === 0

      const isFood =
        food.x === x &&
        food.y === y

      const isPowerUp =
        powerUp &&
        powerUp.x === x &&
        powerUp.y === y

      let className = 'cell'

      if (isSnake) {
        className += ' snake'

        if (isHead) {
          className += ' snake-head'
        } else {
          className +=
            snakeIndex % 2 === 0
              ? ' snake-dark'
              : ' snake-light'
        }
      }

      if (isFood) {
        className +=
          ` food ${FOOD_TYPES[food.type].className}`
      }

      if (isPowerUp) {
        className +=
          ` power-up power-${powerUp.type}`
      }

      cells.push(
        <div
          key={`${x}-${y}`}
          className={className}
        >
          {isPowerUp && (
            <span>
              {POWER_UPS[powerUp.type].symbol}
            </span>
          )}
        </div>
      )
    }
  }

  return (
    <main className="game">

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="game-header">

        <div className="brand">
          <p className="eyebrow">
            NEON ARCADE
          </p>

          <h1>
            <span className="brand-snake">
              🐍
            </span>
            NEON SNAKE
          </h1>

          <p className="tagline">
            Classic arcade energy. Neon era.
          </p>
        </div>

        <div className="header-actions">

          <button
            className="icon-button"
            onClick={() =>
              setSoundEnabled(
                (value) => !value
              )
            }
            aria-label="Toggle sound"
          >
            {soundEnabled
              ? '🔊'
              : '🔇'}
          </button>

          <div className="score-card">
            <span>SCORE</span>
            <strong>
              {score}
            </strong>
          </div>

        </div>

      </header>

      <section className="stats">

        <div className="stat-box">
          <span>
            HIGH SCORE
          </span>

          <strong>
            {highScore}
          </strong>
        </div>

        <div className="stat-box">
          <span>LEVEL</span>

          <strong>
            {level}
          </strong>
        </div>

        <div className="stat-box">
          <span>LENGTH</span>

          <strong>
            {snake.length}
          </strong>
        </div>

        <div className="stat-box">
          <span>COMBO</span>

          <strong>
            x{combo}
          </strong>
        </div>

      </section>

      {activePowerUp && (
        <div className="power-status">
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
                    POWER_UPS[
                      activePowerUp
                    ].duration) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      <section className="game-board">

        <div className="board-frame">

          <div className="board-label">
            <span className="status-dot" />
            SYSTEM ONLINE
          </div>

          <div className="snake-board">
            {cells}
          </div>

        </div>

        {message && (
          <div className="floating-message">
            {message}
          </div>
        )}

        {!started &&
          !gameOver && (
            <div className="game-overlay">

              <div className="overlay-card">

                <div className="big-icon">
                  🐍
                </div>

                <p className="mini-title">
                  WELCOME TO
                </p>

                <h2>
                  NEON SNAKE
                </h2>

                <p>
                  Eat glowing food.
                  <br />
                  Chase combos.
                  <br />
                  Grab power-ups.
                </p>

                <button
                  className="primary-button"
                  onClick={startGame}
                >
                  <span>▶</span>
                  START GAME
                </button>

                <div className="start-hint">
                  ⌨️ Arrow Keys / WASD
                </div>

              </div>

            </div>
          )}

        {paused &&
          !gameOver && (
            <div className="game-overlay">

              <div className="overlay-card">

                <div className="big-icon">
                  ⏸️
                </div>

                <p className="mini-title">
                  GAME PAUSED
                </p>

                <h2>
                  TAKE A BREATH
                </h2>

                <button
                  className="primary-button"
                  onClick={() =>
                    setPaused(false)
                  }
                >
                  ▶ CONTINUE
                </button>

              </div>

            </div>
          )}

        {gameOver && (
          <div className="game-overlay">

            <div className="overlay-card">

              <div className="big-icon">
                💥
              </div>

              <p className="mini-title">
                RUN COMPLETE
              </p>

              <h2>
                GAME OVER
              </h2>

              {newRecord && (
                <div className="record-badge">
                  🏆 NEW HIGH SCORE!
                </div>
              )}

              <div className="result-score">
                {score}
              </div>

              <div className="result-info">
                <span>
                  LEVEL {level}
                </span>

                <span>
                  LENGTH {snake.length}
                </span>
              </div>

              <button
                className="primary-button"
                onClick={restartGame}
              >
                🔄 PLAY AGAIN
              </button>

            </div>

          </div>
        )}

      </section>

      <section className="mobile-controls">

        <button
          onClick={() =>
            changeDirection({
              x: 0,
              y: -1,
            })
          }
        >
          ▲
        </button>

        <div className="middle-controls">

          <button
            onClick={() =>
              changeDirection({
                x: -1,
                y: 0,
              })
            }
          >
            ◀
          </button>

          <button
            onClick={() =>
              setPaused(
                (value) => !value
              )
            }
          >
            {paused
              ? '▶'
              : 'Ⅱ'}
          </button>

          <button
            onClick={() =>
              changeDirection({
                x: 1,
                y: 0,
              })
            }
          >
            ▶
          </button>

        </div>

        <button
          onClick={() =>
            changeDirection({
              x: 0,
              y: 1,
            })
          }
        >
          ▼
        </button>

      </section>

      <section className="controls">

        <div className="control-info">
          <span>🎮</span>

          <p>
            <strong>
              MOVE
            </strong>
            <br />
            Arrow Keys / WASD
          </p>
        </div>

        <div className="control-info">
          <span>⏸️</span>

          <p>
            <strong>
              PAUSE
            </strong>
            <br />
            Space
          </p>
        </div>

        <div className="control-info">
          <span>⚡</span>

          <p>
            <strong>
              POWER-UPS
            </strong>
            <br />
            Collect them
          </p>
        </div>

        <div className="control-info">
          <span>🔄</span>

          <p>
            <strong>
              RESTART
            </strong>
            <br />
            R
          </p>
        </div>

      </section>

      <footer>
        <span>
          NEON ARCADE
        </span>

        <span>•</span>

        <span>
          NEON SNAKE
        </span>

        <span>•</span>

        <span>
          v2.0
        </span>
      </footer>

    </main>
  )
}

export default App