import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const GRID_SIZE = 20

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

const INITIAL_DIRECTION = { x: 1, y: 0 }

const getSavedHighScore = () => {
  try {
    return Number(localStorage.getItem('neonSnakeHighScore')) || 0
  } catch {
    return 0
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

  if (emptyCells.length === 0) {
    return { x: 0, y: 0 }
  }

  return emptyCells[
    Math.floor(Math.random() * emptyCells.length)
  ]
}

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [food, setFood] = useState(() =>
    createFood(INITIAL_SNAKE)
  )

  const [direction, setDirection] =
    useState(INITIAL_DIRECTION)

  const [nextDirection, setNextDirection] =
    useState(INITIAL_DIRECTION)

  const [score, setScore] = useState(0)

  const [highScore, setHighScore] =
    useState(getSavedHighScore)

  const [level, setLevel] = useState(1)

  const [started, setStarted] = useState(false)

  const [paused, setPaused] = useState(false)

  const [gameOver, setGameOver] = useState(false)

  const [newRecord, setNewRecord] = useState(false)

  const [soundEnabled, setSoundEnabled] = useState(true)

  const audioContextRef = useRef(null)

  /* =========================================
     SOUND
  ========================================= */

  const playSound = useCallback(
    (type) => {
      if (!soundEnabled) return

      try {
        if (!audioContextRef.current) {
          audioContextRef.current =
            new (
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
          oscillator.frequency.setValueAtTime(
            500,
            now
          )

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

        if (type === 'gameover') {
          oscillator.frequency.setValueAtTime(
            300,
            now
          )

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
          oscillator.frequency.setValueAtTime(
            500,
            now
          )

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

  /* =========================================
     START GAME
  ========================================= */

  const startGame = () => {
    setStarted(true)
    setPaused(false)
    setGameOver(false)
  }

  /* =========================================
     RESTART
  ========================================= */

  const restartGame = useCallback(() => {
    const newSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]

    const newDirection = {
      x: 1,
      y: 0,
    }

    setSnake(newSnake)
    setFood(createFood(newSnake))

    setDirection(newDirection)
    setNextDirection(newDirection)

    setScore(0)
    setLevel(1)

    setStarted(true)
    setPaused(false)
    setGameOver(false)
    setNewRecord(false)
  }, [])

  /* =========================================
     CHANGE DIRECTION
  ========================================= */

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

  /* =========================================
     KEYBOARD
  ========================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if (
        key === 'arrowup' ||
        key === 'w'
      ) {
        event.preventDefault()

        changeDirection({
          x: 0,
          y: -1,
        })
      }

      if (
        key === 'arrowdown' ||
        key === 's'
      ) {
        event.preventDefault()

        changeDirection({
          x: 0,
          y: 1,
        })
      }

      if (
        key === 'arrowleft' ||
        key === 'a'
      ) {
        event.preventDefault()

        changeDirection({
          x: -1,
          y: 0,
        })
      }

      if (
        key === 'arrowright' ||
        key === 'd'
      ) {
        event.preventDefault()

        changeDirection({
          x: 1,
          y: 0,
        })
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

  /* =========================================
     LEVEL
  ========================================= */

  useEffect(() => {
    const newLevel =
      Math.floor(score / 50) + 1

    if (newLevel > level) {
      playSound('level')
    }

    setLevel(newLevel)
  }, [score, level, playSound])

  /* =========================================
     GAME LOOP
  ========================================= */

  useEffect(() => {
    if (
      !started ||
      paused ||
      gameOver
    ) {
      return
    }

    const speed = Math.max(
      55,
      150 - (level - 1) * 12
    )

    const timer = setInterval(() => {
      setSnake((currentSnake) => {
        const head = currentSnake[0]

        const newHead = {
          x: head.x + nextDirection.x,
          y: head.y + nextDirection.y,
        }

        /* WALL COLLISION */

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true)
          playSound('gameover')

          return currentSnake
        }

        const ateFood =
          newHead.x === food.x &&
          newHead.y === food.y

        /*
          If the snake is not eating,
          its tail will move away.
          Therefore we don't need to
          consider the final tail cell
          for collision.
        */

        const bodyToCheck = ateFood
          ? currentSnake
          : currentSnake.slice(0, -1)

        const hitSelf = bodyToCheck.some(
          (segment) =>
            segment.x === newHead.x &&
            segment.y === newHead.y
        )

        if (hitSelf) {
          setGameOver(true)
          playSound('gameover')

          return currentSnake
        }

        const newSnake = [
          newHead,
          ...currentSnake,
        ]

        if (ateFood) {
          const newScore = score + 10

          setScore(newScore)

          playSound('eat')

          if (newScore > highScore) {
            setHighScore(newScore)
            setNewRecord(true)

            try {
              localStorage.setItem(
                'neonSnakeHighScore',
                String(newScore)
              )
            } catch {
              // localStorage unavailable.
            }
          }

          setFood(createFood(newSnake))

          return newSnake
        }

        newSnake.pop()

        return newSnake
      })

      setDirection(nextDirection)
    }, speed)

    return () => {
      clearInterval(timer)
    }
  }, [
    started,
    paused,
    gameOver,
    level,
    nextDirection,
    food,
    score,
    highScore,
    playSound,
  ])

  /* =========================================
     GRID
  ========================================= */

  const cells = []

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const snakeIndex = snake.findIndex(
        (segment) =>
          segment.x === x &&
          segment.y === y
      )

      const isSnake = snakeIndex !== -1

      const isHead = snakeIndex === 0

      const isFood =
        food.x === x &&
        food.y === y

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
        className += ' food'
      }

      cells.push(
        <div
          key={`${x}-${y}`}
          className={className}
        />
      )
    }
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <main className="game">

      {/* HEADER */}

      <header className="game-header">

        <div className="brand">
          <p className="eyebrow">
            NEON ARCADE
          </p>

          <h1>
            <span>🐍</span> Neon Snake
          </h1>
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
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          <div className="score-card">
            <span>SCORE</span>
            <strong>{score}</strong>
          </div>

        </div>

      </header>

      {/* STATS */}

      <section className="stats">

        <div className="stat-box">
          <span>HIGH SCORE</span>
          <strong>{highScore}</strong>
        </div>

        <div className="stat-box">
          <span>LEVEL</span>
          <strong>{level}</strong>
        </div>

        <div className="stat-box">
          <span>LENGTH</span>
          <strong>{snake.length}</strong>
        </div>

      </section>

      {/* GAME */}

      <section className="game-board">

        <div className="snake-board">
          {cells}
        </div>

        {/* START */}

        {!started && !gameOver && (
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
                Eat the glowing food.
                <br />
                Grow longer. Beat your record.
              </p>

              <button
                className="primary-button"
                onClick={startGame}
              >
                START GAME
              </button>

              <div className="start-hint">
                <span>⌨️</span>
                Arrow Keys / WASD
              </div>

            </div>

          </div>
        )}

        {/* PAUSE */}

        {paused && !gameOver && (
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

              <p>
                Your snake is waiting.
                <br />
                Ready when you are.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setPaused(false)
                }
              >
                CONTINUE
              </button>

            </div>

          </div>
        )}

        {/* GAME OVER */}

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
                PLAY AGAIN
              </button>

            </div>

          </div>
        )}

      </section>

      {/* MOBILE CONTROLS */}

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
            {paused ? '▶' : 'Ⅱ'}
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

      {/* DESKTOP CONTROLS */}

      <section className="controls">

        <div className="control-info">
          <span>🎮</span>

          <p>
            <strong>MOVE</strong>
            <br />
            Arrow Keys / WASD
          </p>
        </div>

        <div className="control-info">
          <span>⏸️</span>

          <p>
            <strong>PAUSE</strong>
            <br />
            Space
          </p>
        </div>

        <div className="control-info">
          <span>🔄</span>

          <p>
            <strong>RESTART</strong>
            <br />
            R
          </p>
        </div>

      </section>

      <footer>
        NEON ARCADE • NEON SNAKE
      </footer>

    </main>
  )
}

export default App