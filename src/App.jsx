import { useEffect, useRef, useState } from 'react'
import './App.css'

const BOARD_SIZE = 20

const START_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

const FOOD_TYPES = {
  normal: { symbol: '●', points: 10 },
  bonus: { symbol: '◆', points: 25 },
  golden: { symbol: '★', points: 50 },
}

const POWER_UPS = {
  shield: { symbol: '🛡️', name: 'SHIELD', duration: 6000 },
  slow: { symbol: '⏱️', name: 'SLOW', duration: 6000 },
  multiplier: { symbol: '✕2', name: 'MULTIPLIER', duration: 6000 },
}

const getSavedData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

const randomPosition = () => ({
  x: Math.floor(Math.random() * BOARD_SIZE),
  y: Math.floor(Math.random() * BOARD_SIZE),
})

const createFood = (snake) => {
  let position

  do {
    position = randomPosition()
  } while (
    snake.some(
      (segment) => segment.x === position.x && segment.y === position.y
    )
  )

  const random = Math.random()

  let type = 'normal'

  if (random > 0.92) {
    type = 'golden'
  } else if (random > 0.75) {
    type = 'bonus'
  }

  return {
    ...position,
    type,
  }
}

const createPowerUp = (snake, food) => {
  if (Math.random() > 0.25) return null

  let position

  do {
    position = randomPosition()
  } while (
    snake.some(
      (segment) => segment.x === position.x && segment.y === position.y
    ) ||
    (food.x === position.x && food.y === position.y)
  )

  const types = Object.keys(POWER_UPS)

  return {
    ...position,
    type: types[Math.floor(Math.random() * types.length)],
  }
}

function App() {
  const [snake, setSnake] = useState(START_SNAKE)
  const [food, setFood] = useState(() => createFood(START_SNAKE))
  const [powerUp, setPowerUp] = useState(null)

  const [direction, setDirection] = useState({ x: 1, y: 0 })
  const nextDirection = useRef({ x: 1, y: 0 })

  const [gameStarted, setGameStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() =>
    getSavedData('neonSnakeHighScore', 0)
  )

  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(0)

  const [activePowerUp, setActivePowerUp] = useState(null)
  const [powerUpTime, setPowerUpTime] = useState(0)

  const [soundOn, setSoundOn] = useState(() =>
    getSavedData('neonSnakeSound', true)
  )

  const [gamesPlayed, setGamesPlayed] = useState(() =>
    getSavedData('neonSnakeGames', 0)
  )

  const [totalFood, setTotalFood] = useState(() =>
    getSavedData('neonSnakeFood', 0)
  )

  const [bestCombo, setBestCombo] = useState(() =>
    getSavedData('neonSnakeBestCombo', 0)
  )

  const [achievements, setAchievements] = useState(() =>
    getSavedData('neonSnakeAchievements', [])
  )

  const [message, setMessage] = useState('')

  const audioContext = useRef(null)

  const playSound = (type) => {
    if (!soundOn) return

    try {
      if (!audioContext.current) {
        audioContext.current = new (
          window.AudioContext || window.webkitAudioContext
        )()
      }

      const ctx = audioContext.current
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      const sounds = {
        eat: [520, 0.08],
        power: [780, 0.16],
        level: [980, 0.2],
        gameover: [160, 0.3],
      }

      const [frequency, duration] = sounds[type] || [440, 0.1]

      oscillator.frequency.value = frequency
      oscillator.type = 'square'

      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration
      )

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start()
      oscillator.stop(ctx.currentTime + duration)
    } catch {
      // Sound is optional.
    }
  }

  const showMessage = (text) => {
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 1200)
  }

  const unlockAchievement = (id, text) => {
    setAchievements((current) => {
      if (current.includes(id)) return current

      showMessage(`🏆 ${text}`)
      return [...current, id]
    })
  }

  useEffect(() => {
    localStorage.setItem('neonSnakeHighScore', JSON.stringify(highScore))
  }, [highScore])

  useEffect(() => {
    localStorage.setItem('neonSnakeSound', JSON.stringify(soundOn))
  }, [soundOn])

  useEffect(() => {
    localStorage.setItem('neonSnakeGames', JSON.stringify(gamesPlayed))
  }, [gamesPlayed])

  useEffect(() => {
    localStorage.setItem('neonSnakeFood', JSON.stringify(totalFood))
  }, [totalFood])

  useEffect(() => {
    localStorage.setItem('neonSnakeBestCombo', JSON.stringify(bestCombo))
  }, [bestCombo])

  useEffect(() => {
    localStorage.setItem(
      'neonSnakeAchievements',
      JSON.stringify(achievements)
    )
  }, [achievements])

  useEffect(() => {
    if (!activePowerUp) return

    const started = Date.now()

    const timer = setInterval(() => {
      const remaining =
        POWER_UPS[activePowerUp].duration - (Date.now() - started)

      if (remaining <= 0) {
        setActivePowerUp(null)
        setPowerUpTime(0)
      } else {
        setPowerUpTime(remaining)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [activePowerUp])

  const resetGame = () => {
    const newSnake = [...START_SNAKE]

    setSnake(newSnake)
    setFood(createFood(newSnake))
    setPowerUp(null)

    setDirection({ x: 1, y: 0 })
    nextDirection.current = { x: 1, y: 0 }

    setScore(0)
    setLevel(1)
    setCombo(0)

    setActivePowerUp(null)
    setPowerUpTime(0)

    setGameOver(false)
    setPaused(false)
    setGameStarted(true)
  }

  const startGame = () => {
    resetGame()
  }

  const changeDirection = (newDirection) => {
    const current = nextDirection.current

    if (
      current.x + newDirection.x === 0 &&
      current.y + newDirection.y === 0
    ) {
      return
    }

    nextDirection.current = newDirection
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if (key === 'arrowup' || key === 'w') {
        event.preventDefault()
        changeDirection({ x: 0, y: -1 })
      }

      if (key === 'arrowdown' || key === 's') {
        event.preventDefault()
        changeDirection({ x: 0, y: 1 })
      }

      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        changeDirection({ x: -1, y: 0 })
      }

      if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        changeDirection({ x: 1, y: 0 })
      }

      if (key === ' ') {
        event.preventDefault()

        if (gameStarted && !gameOver) {
          setPaused((value) => !value)
        }
      }

      if (key === 'r') {
        resetGame()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameStarted, gameOver])

  useEffect(() => {
    if (!gameStarted || paused || gameOver) return

    const baseSpeed = Math.max(75, 170 - (level - 1) * 10)
    const speed = activePowerUp === 'slow' ? baseSpeed * 1.65 : baseSpeed

    const timer = setInterval(() => {
      setSnake((currentSnake) => {
        const move = nextDirection.current

        setDirection(move)

        const head = currentSnake[0]

        let newHead = {
          x: head.x + move.x,
          y: head.y + move.y,
        }

        const hitWall =
          newHead.x < 0 ||
          newHead.x >= BOARD_SIZE ||
          newHead.y < 0 ||
          newHead.y >= BOARD_SIZE

        if (hitWall) {
          if (activePowerUp === 'shield') {
            setActivePowerUp(null)
            setPowerUpTime(0)
            showMessage('🛡️ SHIELD SAVED YOU!')

            newHead = {
              x: (newHead.x + BOARD_SIZE) % BOARD_SIZE,
              y: (newHead.y + BOARD_SIZE) % BOARD_SIZE,
            }
          } else {
            setGameOver(true)
            setGamesPlayed((value) => value + 1)
            playSound('gameover')
            return currentSnake
          }
        }

        const ateFood =
          newHead.x === food.x && newHead.y === food.y

        const collectedPowerUp =
          powerUp &&
          newHead.x === powerUp.x &&
          newHead.y === powerUp.y

        const bodyToCheck = ateFood
          ? currentSnake
          : currentSnake.slice(0, -1)

        const hitSelf = bodyToCheck.some(
          (segment) =>
            segment.x === newHead.x && segment.y === newHead.y
        )

        if (hitSelf) {
          if (activePowerUp === 'shield') {
            setActivePowerUp(null)
            setPowerUpTime(0)
            showMessage('🛡️ SHIELD SAVED YOU!')
            return currentSnake
          }

          setGameOver(true)
          setGamesPlayed((value) => value + 1)
          playSound('gameover')
          return currentSnake
        }

        const newSnake = [newHead, ...currentSnake]

        if (collectedPowerUp) {
          const power = powerUp.type

          setActivePowerUp(power)
          setPowerUpTime(POWER_UPS[power].duration)
          setPowerUp(null)

          showMessage(
            `${POWER_UPS[power].symbol} ${POWER_UPS[power].name}!`
          )

          playSound('power')
        }

        if (ateFood) {
          const foodData = FOOD_TYPES[food.type]

          let earned = foodData.points

          const newCombo = combo + 1

          if (newCombo >= 3) {
            earned += newCombo * 2
          }

          if (activePowerUp === 'multiplier') {
            earned *= 2
          }

          const newScore = score + earned

          setScore(newScore)
          setTotalFood((value) => value + 1)
          setCombo(newCombo)

          if (newCombo > bestCombo) {
            setBestCombo(newCombo)
          }

          if (newScore > highScore) {
            setHighScore(newScore)
          }

          if (newScore >= 50 && level === 1) {
            setLevel(2)
            playSound('level')
            showMessage('⚡ LEVEL 2!')
          }

          if (newScore >= 100 && level === 2) {
            setLevel(3)
            playSound('level')
            showMessage('🔥 LEVEL 3!')
          }

          if (newScore >= 200 && level === 3) {
            setLevel(4)
            playSound('level')
            showMessage('💥 LEVEL 4!')
          }

          if (newScore >= 500) {
            unlockAchievement('score500', '500 POINTS!')
          }

          if (newCombo >= 5) {
            unlockAchievement('combo5', 'COMBO MASTER!')
          }

          if (food.type === 'golden') {
            unlockAchievement('golden', 'GOLDEN CATCH!')
          }

          playSound('eat')

          if (newCombo >= 3) {
            showMessage(`🔥 COMBO x${newCombo} +${earned}`)
          }

          setFood(createFood(newSnake))

          if (!powerUp) {
            const newPower = createPowerUp(newSnake, food)

            if (newPower) {
              setPowerUp(newPower)
            }
          }

          return newSnake
        }

        setCombo(0)

        return newSnake.slice(0, -1)
      })
    }, speed)

    return () => clearInterval(timer)
  }, [
    gameStarted,
    paused,
    gameOver,
    level,
    food,
    powerUp,
    activePowerUp,
    score,
    combo,
    highScore,
    bestCombo,
  ])

  useEffect(() => {
    if (score >= 100) {
      unlockAchievement('score100', 'CENTURY!')
    }

    if (score >= 250) {
      unlockAchievement('score250', 'NEON LEGEND!')
    }

    if (gamesPlayed >= 5) {
      unlockAchievement('games5', 'VETERAN PLAYER!')
    }

    if (totalFood >= 50) {
      unlockAchievement('food50', 'FOOD HUNTER!')
    }
  }, [score, gamesPlayed, totalFood])

  const getCellClass = (x, y) => {
    const snakeIndex = snake.findIndex(
      (segment) => segment.x === x && segment.y === y
    )

    if (snakeIndex === 0) return 'cell snake-head'
    if (snakeIndex > 0) return 'cell snake-body'

    if (food.x === x && food.y === y) {
      return `cell food ${food.type}`
    }

    if (powerUp && powerUp.x === x && powerUp.y === y) {
      return `cell power-up ${powerUp.type}`
    }

    return 'cell'
  }

  const touchDirection = (event, move) => {
    event.preventDefault()
    event.stopPropagation()

    if (!gameStarted) {
      startGame()
      return
    }

    if (gameOver) {
      resetGame()
      return
    }

    changeDirection(move)
  }

  const achievementList = [
    ['score100', '💯 Century', 'Reach 100 points'],
    ['score250', '👑 Neon Legend', 'Reach 250 points'],
    ['score500', '🏆 500 Club', 'Reach 500 points'],
    ['combo5', '🔥 Combo Master', 'Reach a x5 combo'],
    ['golden', '⭐ Golden Catch', 'Eat golden food'],
    ['games5', '🎮 Veteran', 'Play 5 games'],
    ['food50', '🍎 Food Hunter', 'Eat 50 food items'],
  ]

  return (
    <div className="app">
      <div className="background-grid" />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="header">
        <div>
          <div className="eyebrow">
            NEON ARCADE // SYSTEM ONLINE
          </div>

          <h1>
            NEON <span>SNAKE</span>
          </h1>
        </div>

        <button
          type="button"
          className="sound-button"
          onClick={() => setSoundOn((value) => !value)}
        >
          {soundOn ? '🔊 SOUND' : '🔇 MUTED'}
        </button>
      </header>

      <main className="game-wrapper">
        <section className="dashboard">
          <div className="score-card">
            <span>SCORE</span>
            <strong>{score.toString().padStart(4, '0')}</strong>
          </div>

          <div className="score-card">
            <span>BEST</span>
            <strong>{highScore.toString().padStart(4, '0')}</strong>
          </div>

          <div className="score-card">
            <span>LEVEL</span>
            <strong>{level}</strong>
          </div>

          <div className="score-card">
            <span>COMBO</span>
            <strong>x{combo}</strong>
          </div>
        </section>

        {activePowerUp && (
          <div className={`power-status ${activePowerUp}`}>
            <span>
              {POWER_UPS[activePowerUp].symbol}{' '}
              {POWER_UPS[activePowerUp].name}
            </span>

            <div className="power-progress">
              <div
                style={{
                  width: `${
                    (powerUpTime /
                      POWER_UPS[activePowerUp].duration) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="game-area">
          <div className="board-frame">
            <div className="board">
              {Array.from({
                length: BOARD_SIZE * BOARD_SIZE,
              }).map((_, index) => {
                const x = index % BOARD_SIZE
                const y = Math.floor(index / BOARD_SIZE)

                return (
                  <div
                    key={index}
                    className={getCellClass(x, y)}
                  >
                    {snake[0]?.x === x &&
                      snake[0]?.y === y && (
                        <span className="eye">◆</span>
                      )}

                    {food.x === x &&
                      food.y === y && (
                        <span className="food-symbol">
                          {FOOD_TYPES[food.type].symbol}
                        </span>
                      )}

                    {powerUp &&
                      powerUp.x === x &&
                      powerUp.y === y && (
                        <span className="power-symbol">
                          {POWER_UPS[powerUp.type].symbol}
                        </span>
                      )}
                  </div>
                )
              })}

              {!gameStarted && (
                <div className="overlay">
                  <div className="overlay-content">
                    <div className="big-icon">🐍</div>

                    <h2>NEON SNAKE</h2>

                    <p>ENTER THE GRID</p>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={startGame}
                    >
                      START GAME
                    </button>
                  </div>
                </div>
              )}

              {paused && !gameOver && (
                <div className="overlay">
                  <div className="overlay-content">
                    <div className="big-icon">⏸️</div>

                    <h2>PAUSED</h2>

                    <p>PRESS SPACE TO CONTINUE</p>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setPaused(false)}
                    >
                      RESUME
                    </button>
                  </div>
                </div>
              )}

              {gameOver && (
                <div className="overlay">
                  <div className="overlay-content">
                    <div className="big-icon">💥</div>

                    <h2>GAME OVER</h2>

                    <p>FINAL SCORE</p>

                    <div className="final-score">
                      {score}
                    </div>

                    {score >= highScore && score > 0 && (
                      <div className="record">
                        NEW HIGH SCORE!
                      </div>
                    )}

                    <button
                      type="button"
                      className="primary-button"
                      onClick={resetGame}
                    >
                      PLAY AGAIN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {message && (
            <div className="floating-message">
              {message}
            </div>
          )}
        </div>

        <section className="info-panel">
          <div>
            <span>FOOD</span>

            <div className="legend">
              <span>● 10</span>
              <span>◆ 25</span>
              <span>★ 50</span>
            </div>
          </div>

          <div>
            <span>POWER</span>

            <div className="legend">
              <span>🛡️ Shield</span>
              <span>⏱️ Slow</span>
              <span>✕2 Score</span>
            </div>
          </div>
        </section>

        <section className="controls-section">
          <h3>TOUCH CONTROLS</h3>

          <div className="mobile-controller">
            <button
              type="button"
              className="control-up"
              onPointerDown={(event) =>
                touchDirection(event, { x: 0, y: -1 })
              }
              onTouchStart={(event) =>
                touchDirection(event, { x: 0, y: -1 })
              }
            >
              ▲
            </button>

            <div className="control-middle">
              <button
                type="button"
                onPointerDown={(event) =>
                  touchDirection(event, { x: -1, y: 0 })
                }
                onTouchStart={(event) =>
                  touchDirection(event, { x: -1, y: 0 })
                }
              >
                ◀
              </button>

              <button
                type="button"
                onPointerDown={(event) =>
                  touchDirection(event, { x: 0, y: 1 })
                }
                onTouchStart={(event) =>
                  touchDirection(event, { x: 0, y: 1 })
                }
              >
                ▼
              </button>

              <button
                type="button"
                onPointerDown={(event) =>
                  touchDirection(event, { x: 1, y: 0 })
                }
                onTouchStart={(event) =>
                  touchDirection(event, { x: 1, y: 0 })
                }
              >
                ▶
              </button>
            </div>
          </div>

          <p className="desktop-controls">
            DESKTOP: WASD / ARROW KEYS • SPACE = PAUSE • R = RESTART
          </p>

          <p className="mobile-controls">
            📱 TAP THE ARROWS TO MOVE
          </p>
        </section>

        <section className="stats-section">
          <div className="section-title">
            <span>PLAYER DATA</span>
            <small>SAVED LOCALLY</small>
          </div>

          <div className="stats-grid">
            <div>
              <span>GAMES</span>
              <strong>{gamesPlayed}</strong>
            </div>

            <div>
              <span>FOOD EATEN</span>
              <strong>{totalFood}</strong>
            </div>

            <div>
              <span>BEST COMBO</span>
              <strong>x{bestCombo}</strong>
            </div>

            <div>
              <span>ACHIEVEMENTS</span>
              <strong>
                {achievements.length}/{achievementList.length}
              </strong>
            </div>
          </div>
        </section>

        <section className="achievements-section">
          <div className="section-title">
            <span>ACHIEVEMENTS</span>

            <small>
              {achievements.length}/{achievementList.length} UNLOCKED
            </small>
          </div>

          <div className="achievement-grid">
            {achievementList.map(
              ([id, title, description]) => {
                const unlocked = achievements.includes(id)

                return (
                  <div
                    className={`achievement ${
                      unlocked ? 'unlocked' : ''
                    }`}
                    key={id}
                  >
                    <div className="achievement-icon">
                      {unlocked ? '🏆' : '🔒'}
                    </div>

                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </section>
      </main>

      <footer>
        NEON SNAKE v3.0 • BUILT FOR THE GRID • GAME ON ⚡
      </footer>
    </div>
  )
}

export default App