document.addEventListener("DOMContentLoaded", () => {
    const gameBoard = document.getElementById("game-board");
    const scoreDisplay = document.getElementById("score");
    const bestScoreDisplay = document.getElementById("best-score");
    const gameOverMessage = document.getElementById("game-over-message");
    const restartButton = document.getElementById("restart-button");

    const upButton = document.getElementById("up-button");
    const downButton = document.getElementById("down-button");
    const leftButton = document.getElementById("left-button");
    const rightButton = document.getElementById("right-button");

	const bestScoreKey = "bestScore";
    const boardSize = 4;
    let board = [];
    let score = 0;
	let bestScore = 0;
    let isGameOver = false;

    // ゲームの初期化
    function initializeGame() {
        board = Array(boardSize).fill(0).map(() => Array(boardSize).fill(0));
        score = 0;
		bestScore = (() => {
			if (window.localStorage.hasOwnProperty(bestScoreKey)) {
				return window.localStorage.getItem(bestScoreKey);
			} else {
				window.localStorage.setItem(bestScoreKey, 0);
				return 0;
			}
		})()

        isGameOver = false;
        scoreDisplay.textContent = score;
        bestScoreDisplay.textContent = bestScore;
        gameOverMessage.classList.add("hidden");
        gameBoard.innerHTML = ""; // ボードをクリア

        // 背景のグリッドセルを作成
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const cell = document.createElement("div");
                cell.classList.add("grid-cell");
                gameBoard.appendChild(cell);
            }
        }

        addNewTile();
        addNewTile();
        updateBoardView();
    }

    // 新しいパネル (2または4) をランダムな空きセルに生成
    function addNewTile() {
        const availableCells = [];
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] === 0) {
                    availableCells.push({ r, c });
                }
            }
        }

        if (availableCells.length > 0) {
            const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4; // 90%の確率で2, 10%で4
            board[randomCell.r][randomCell.c] = value;
        }
    }

    // ボードの表示を更新
    function updateBoardView() {
        // すべての現在のタイル要素を削除
        document.querySelectorAll(".tile").forEach(tile => tile.remove());

        // 新しいボードの状態に基づいてHTML要素を作成
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const value = board[r][c];
                if (value !== 0) {
                    const tile = document.createElement("div");
                    tile.classList.add("tile", `tile-${value}`);
                    tile.textContent = value;
                    // 各セルに直接タイルを追加
                    gameBoard.children[r * boardSize + c].appendChild(tile);
                }
            }
        }
        scoreDisplay.textContent = score;
    }

    // パネルの移動処理 (共通ロジック)
    // direction: "up", "down", "left", "right"
    function moveTiles(direction) {
        if (isGameOver) return;

        let boardChanged = false;
        let prevBoard = board.map(row => [...row]); // 移動前のボードを保存

        if (direction === "up" || direction === "down") {
            for (let c = 0; c < boardSize; c++) {
                let column = [];
                for (let r = 0; r < boardSize; r++) {
                    column.push(board[r][c]);
                }
                const movedColumn = slideAndCombine(column, direction === "down");
                for (let r = 0; r < boardSize; r++) {
                    if (board[r][c] !== movedColumn[r]) {
                        boardChanged = true;
                    }
                    board[r][c] = movedColumn[r];
                }
            }
        } else if (direction === "left" || direction === "right") {
            for (let r = 0; r < boardSize; r++) {
                let row = [...board[r]];
                const movedRow = slideAndCombine(row, direction === "right");
                if (board[r].some((val, i) => val !== movedRow[i])) {
                    boardChanged = true;
                }
                board[r] = movedRow;
            }
        }

        if (boardChanged) {
            addNewTile();
            updateBoardView();
            checkGameOver();
        }
    }

    // スライドと結合のロジック
    function slideAndCombine(line, reverse) {
        let filteredLine = line.filter(val => val !== 0);
        let newLine = Array(boardSize).fill(0);

        if (reverse) {
            filteredLine.reverse();
        }

        for (let i = 0; i < filteredLine.length; i++) {
            if (i + 1 < filteredLine.length && filteredLine[i] === filteredLine[i + 1]) {
                filteredLine[i] *= 2;
                score += filteredLine[i];
                filteredLine.splice(i + 1, 1); // 結合されたタイルを削除
            }
        }

        for (let i = 0; i < filteredLine.length; i++) {
            newLine[i] = filteredLine[i];
        }

        if (reverse) {
            newLine.reverse();
        }
        return newLine;
    }

    // ゲームオーバー判定
    function checkGameOver() {
        // 空きセルがあるか確認
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] === 0) {
                    return; // 空きセルがあればゲームはまだ終わらない
                }
            }
        }

        // 移動できるか確認
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const value = board[r][c];
                // 右または下と同じ値のタイルがあれば移動可能
                if (c < boardSize - 1 && value === board[r][c + 1]) return;
                if (r < boardSize - 1 && value === board[r + 1][c]) return;
            }
        }

        isGameOver = true;
		
		if (score > window.localStorage.getItem(bestScoreKey)) {
			window.localStorage.setItem(bestScoreKey, score);
			bestScoreDisplay.textContent = score;
		}
		
        gameOverMessage.classList.remove("hidden");
    }

    // イベントリスナー
    document.addEventListener("keydown", (e) => {
        if (isGameOver) return;
        let direction = "";
        switch (e.key) {
            case "ArrowUp":
                direction = "up";
                break;
            case "ArrowDown":
                direction = "down";
                break;
            case "ArrowLeft":
                direction = "left";
                break;
            case "ArrowRight":
                direction = "right";
                break;
        }
        if (direction) {
            e.preventDefault(); // デフォルトのスクロールを防止
            moveTiles(direction);
        }
    });

    // 十字キーイベントリスナー
    upButton.addEventListener("click", () => { if (!isGameOver) moveTiles("up"); });
    downButton.addEventListener("click", () => { if (!isGameOver) moveTiles("down"); });
    leftButton.addEventListener("click", () => { if (!isGameOver) moveTiles("left"); });
    rightButton.addEventListener("click", () => { if (!isGameOver) moveTiles("right"); });

    restartButton.addEventListener("click", initializeGame);

    // ゲーム開始
    initializeGame();
});
