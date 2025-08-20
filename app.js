// Game state and configuration
let gameState = {
    isRunning: false,
    isPaused: false,
    currentLevel: null,
    score: 0,
    highScores: { easy: 0, medium: 0, hard: 0 },
    snake: [],
    food: [],
    direction: 'RIGHT',
    gameLoop: null
};

// Game settings
const gameSettings = {
    easy: { foodCount: 2, speed: 150, theme: 'easy' },
    medium: { foodCount: 2, speed: 100, theme: 'medium' },
    hard: { foodCount: 1, speed: 60, theme: 'hard' }
};

const gridSize = { rows: 40, cols: 40, totalPixels: 1600 };
const initialPosition = { row: 20, col: 1, direction: 'RIGHT' };

// DOM elements
let levelSelection, gameScreen, gameOverScreen, gameBoard;
let currentScoreEl, highScoreEl, currentLevelEl, pauseIndicator, pauseBtn;
let finalScoreEl, newHighScoreEl;
let mobileControlsEl;

// Initialize game
function initializeGame() {
    levelSelection = document.getElementById('levelSelection');
    gameScreen = document.getElementById('gameScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    gameBoard = document.getElementById('gameBoard');
    currentScoreEl = document.getElementById('currentScore');
    highScoreEl = document.getElementById('highScore');
    currentLevelEl = document.getElementById('currentLevel');
    pauseIndicator = document.getElementById('pauseIndicator');
    pauseBtn = document.getElementById('pauseBtn');
    finalScoreEl = document.getElementById('finalScore');
    newHighScoreEl = document.getElementById('newHighScore');
    mobileControlsEl = document.getElementById('mobileControls');

    createGameBoard();
    addEventListeners();
    showLevelSelection();
}

// Create game board
function createGameBoard() {
    if (!gameBoard) return;
    gameBoard.innerHTML = '';
    for (let i = 1; i <= gridSize.totalPixels; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.id = `pixel${i}`;
        gameBoard.appendChild(pixel);
    }
}

// Add event listeners
function addEventListeners() {
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.currentTarget.dataset.level;
            startGame(level);
        });
    });

    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', backToMenu);
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', backToMenu);

    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);

    // Mobile controls
    if (mobileControlsEl) {
        mobileControlsEl.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dir = e.currentTarget.dataset.direction;
                changeDirection(dir);
            });
        });
    }
}

// Handle keyboard input
function handleKeyPress(e) {
    if (!gameState.isRunning) return;
    switch (e.key) {
        case ' ':
            e.preventDefault();
            togglePause();
            break;
        case 'ArrowUp':
            if (gameState.direction !== 'DOWN') changeDirection('UP');
            break;
        case 'ArrowDown':
            if (gameState.direction !== 'UP') changeDirection('DOWN');
            break;
        case 'ArrowLeft':
            if (gameState.direction !== 'RIGHT') changeDirection('LEFT');
            break;
        case 'ArrowRight':
            if (gameState.direction !== 'LEFT') changeDirection('RIGHT');
            break;
    }
}

// Show level selection
function showLevelSelection() {
    if (levelSelection) levelSelection.classList.remove('hidden');
    if (gameScreen) gameScreen.classList.add('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
}

// Start game
function startGame(level) {
    if (gameState.gameLoop) clearInterval(gameState.gameLoop);

    gameState.currentLevel = level;
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.direction = initialPosition.direction;
    gameState.food = [];

    const startPixel = getPixelNumber(initialPosition.row, initialPosition.col);
    gameState.snake = [startPixel, startPixel - 1, startPixel - 2];

    if (levelSelection) levelSelection.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    if (gameBoard) gameBoard.className = `game-board ${level}`;

    if (currentLevelEl) currentLevelEl.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    if (pauseIndicator) pauseIndicator.classList.add('hidden');

    updateScore();
    generateFood();
    drawGame();

    const speed = gameSettings[level].speed;
    gameState.gameLoop = setInterval(gameLoop, speed);
}

// Game loop
function gameLoop() {
    if (gameState.isPaused || !gameState.isRunning) return;
    moveSnake();
    drawGame();
}

// Move snake
function moveSnake() {
    const head = gameState.snake[0];
    const { row, col } = getPixelPosition(head);
    let newRow = row;
    let newCol = col;

    switch (gameState.direction) {
        case 'UP': newRow--; break;
        case 'DOWN': newRow++; break;
        case 'LEFT': newCol--; break;
        case 'RIGHT': newCol++; break;
    }

    // Wall collision
    if (newRow < 1 || newRow > gridSize.rows || newCol < 1 || newCol > gridSize.cols) {
        gameOver();
        return;
    }

    const newHead = getPixelNumber(newRow, newCol);

    // Self collision
    if (gameState.snake.includes(newHead)) {
        gameOver();
        return;
    }

    gameState.snake.unshift(newHead);

    // Food handling
    const foodIndex = gameState.food.indexOf(newHead);
    if (foodIndex !== -1) {
        gameState.food.splice(foodIndex, 1);
        gameState.score += 10;
        updateScore();
        generateFood();
    } else {
        gameState.snake.pop();
    }
}

// Generate food
function generateFood() {
    const foodCount = gameSettings[gameState.currentLevel].foodCount;
    while (gameState.food.length < foodCount) {
        let attempts = 0;
        let foodPixel;
        do {
            const row = Math.floor(Math.random() * gridSize.rows) + 1;
            const col = Math.floor(Math.random() * gridSize.cols) + 1;
            foodPixel = getPixelNumber(row, col);
            attempts++;
        } while ((gameState.snake.includes(foodPixel) || gameState.food.includes(foodPixel)) && attempts < 100);

        if (attempts < 100) gameState.food.push(foodPixel);
    }
}

// Draw game
function drawGame() {
    clearGameBoard();
    drawSnake();
    drawFood();
}

// Clear board
function clearGameBoard() {
    document.querySelectorAll('.pixel').forEach(p => p.className = 'pixel');
}

// Draw snake
function drawSnake() {
    gameState.snake.forEach(pixel => {
        const el = document.getElementById(`pixel${pixel}`);
        if (el) el.classList.add('snakeBodyPixel');
    });
}

// Draw food
function drawFood() {
    gameState.food.forEach(pixel => {
        const el = document.getElementById(`pixel${pixel}`);
        if (el) el.classList.add('food');
    });
}

// Change direction
function changeDirection(dir) {
    const opposite = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT' };
    if (dir !== opposite[gameState.direction]) gameState.direction = dir;
}

// Pause toggle
function togglePause() {
    if (!gameState.isRunning) return;
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        if (pauseIndicator) pauseIndicator.classList.remove('hidden');
        if (pauseBtn) pauseBtn.textContent = 'Resume';
    } else {
        if (pauseIndicator) pauseIndicator.classList.add('hidden');
        if (pauseBtn) pauseBtn.textContent = 'Pause';
    }
}

// Update score display
function updateScore() {
    if (currentScoreEl) currentScoreEl.textContent = gameState.score;
    if (highScoreEl) highScoreEl.textContent = gameState.highScores[gameState.currentLevel] || 0;
}

// Game over
function gameOver() {
    gameState.isRunning = false;
    if (gameState.gameLoop) clearInterval(gameState.gameLoop);

    const currentHigh = gameState.highScores[gameState.currentLevel] || 0;
    if (gameState.score > currentHigh) {
        gameState.highScores[gameState.currentLevel] = gameState.score;
        if (newHighScoreEl) newHighScoreEl.classList.remove('hidden');
    } else if (newHighScoreEl) {
        newHighScoreEl.classList.add('hidden');
    }

    if (finalScoreEl) finalScoreEl.textContent = gameState.score;
    if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}

// Restart
function restartGame() {
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    startGame(gameState.currentLevel);
}

// Back to menu
function backToMenu() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    if (gameState.gameLoop) clearInterval(gameState.gameLoop);
    if (pauseIndicator) pauseIndicator.classList.add('hidden');
    showLevelSelection();
}

// Utility
function getPixelNumber(row, col) {
    return (row - 1) * gridSize.cols + col;
}

function getPixelPosition(pixelNumber) {
    const row = Math.ceil(pixelNumber / gridSize.cols);
    const col = pixelNumber - (row - 1) * gridSize.cols;
    return { row, col };
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initializeGame);
