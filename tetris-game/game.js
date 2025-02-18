const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('start-btn');

const BLOCK_SIZE = 30;
const ROWS = 20;
const COLS = 10;
let score = 0;
let level = 1;
let gameLoop;
let currentPiece;
let nextPiece;
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));

const PIECES = [
    [[1, 1, 1, 1]],  // I
    [[1, 1], [1, 1]],  // O
    [[1, 1, 1], [0, 1, 0]],  // T
    [[1, 1, 1], [1, 0, 0]],  // L
    [[1, 1, 1], [0, 0, 1]],  // J
    [[1, 1, 0], [0, 1, 1]],  // S
    [[0, 1, 1], [1, 1, 0]]   // Z
];

const COLORS = [
    '#00f0f0',  // I - Cyan
    '#f0f000',  // O - Yellow
    '#a000f0',  // T - Purple
    '#f0a000',  // L - Orange
    '#0000f0',  // J - Blue
    '#00f000',  // S - Green
    '#f00000'   // Z - Red
];

class Piece {
    constructor(shape = null, color = null) {
        this.shape = shape || PIECES[Math.floor(Math.random() * PIECES.length)];
        this.color = color || COLORS[PIECES.indexOf(this.shape)];
        this.x = Math.floor((COLS - this.shape[0].length) / 2);
        this.y = 0;
    }

    draw(context, offsetX = 0, offsetY = 0) {
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    context.fillStyle = this.color;
                    context.fillRect(
                        (this.x + x + offsetX) * BLOCK_SIZE,
                        (this.y + y + offsetY) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = COLORS[value - 1];
                ctx.fillRect(
                    x * BLOCK_SIZE,
                    y * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const offsetX = (nextCanvas.width / BLOCK_SIZE - nextPiece.shape[0].length) / 2;
        const offsetY = (nextCanvas.height / BLOCK_SIZE - nextPiece.shape.length) / 2;
        nextPiece.draw(nextCtx, offsetX, offsetY);
    }
}

function moveDown() {
    currentPiece.y++;
    if (collision()) {
        currentPiece.y--;
        merge();
        clearLines();
        if (gameOver()) {
            endGame();
            return;
        }
        currentPiece = nextPiece;
        nextPiece = new Piece();
        drawNextPiece();
    }
}

function moveLeft() {
    currentPiece.x--;
    if (collision()) {
        currentPiece.x++;
    }
}

function moveRight() {
    currentPiece.x++;
    if (collision()) {
        currentPiece.x--;
    }
}

function rotate() {
    const oldShape = currentPiece.shape;
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    currentPiece.shape = rotated;
    if (collision()) {
        currentPiece.shape = oldShape;
    }
}

function collision() {
    return currentPiece.shape.some((row, dy) => {
        return row.some((value, dx) => {
            if (!value) return false;
            const newX = currentPiece.x + dx;
            const newY = currentPiece.y + dy;
            return (
                newX < 0 ||
                newX >= COLS ||
                newY >= ROWS ||
                (newY >= 0 && board[newY][newX])
            );
        });
    });
}

function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const newY = currentPiece.y + y;
                if (newY >= 0) {
                    board[newY][currentPiece.x + x] = PIECES.indexOf(currentPiece.shape) + 1;
                }
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        scoreElement.textContent = score;
        if (score >= level * 1000) {
            level++;
            levelElement.textContent = level;
        }
    }
}

function gameOver() {
    return board[0].some(value => value !== 0);
}

function endGame() {
    cancelAnimationFrame(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    startBtn.textContent = 'Play Again';
    startBtn.disabled = false;
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    currentPiece.draw(ctx);
    moveDown();
    gameLoop = requestAnimationFrame(update);
}

function startGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    currentPiece = new Piece();
    nextPiece = new Piece();
    drawNextPiece();
    startBtn.disabled = true;
    update();
}

document.addEventListener('keydown', event => {
    if (startBtn.disabled) {  // Only handle input when game is running
        switch (event.key) {
            case 'ArrowLeft':
                moveLeft();
                break;
            case 'ArrowRight':
                moveRight();
                break;
            case 'ArrowDown':
                moveDown();
                break;
            case 'ArrowUp':
                rotate();
                break;
        }
    }
});

startBtn.addEventListener('click', startGame);