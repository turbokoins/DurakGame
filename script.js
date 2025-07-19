// =======================================================================
// ==                    ИГРА "ДУРАК" - ФИНАЛЬНАЯ ВЕРСИЯ                    ==
// =======================================================================

// --- Глобальное состояние игры ---
let playerHand = [];
let opponentHand = [];
let deck = [];
let trumpSuit = '';
let battleField = []; // [{ attack: card, defense: card/null }]
let isPlayerAttacker = false;
let gameState = 'waiting'; // 'playerAttack', 'playerDefend', 'opponentAttack', 'opponentDefend', 'gameOver'

// --- КОНСТАНТЫ ---
const CARDS_IN_HAND = 6;


// =======================================================================
// ==                       ЛОГИКА ИГРОВОГО ПРОЦЕССА                      ==
// =======================================================================

/** Инициализация новой игры */
function initGame() {
    const suits = ['♠', '♣', '♥', '♦'];
    const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const cardValues = ranks.reduce((acc, rank, i) => ({ ...acc, [rank]: i }), {});

    deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank, value: cardValues[rank] });
        }
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    playerHand = deck.splice(0, CARDS_IN_HAND);
    opponentHand = deck.splice(0, CARDS_IN_HAND);
    
    const trumpCard = deck.shift();
    trumpSuit = trumpCard.suit;
    deck.push(trumpCard);

    const getMinTrump = (hand) => hand.filter(c => c.suit === trumpSuit).sort((a, b) => a.value - b.value)[0];
    const playerMinTrump = getMinTrump(playerHand);
    const opponentMinTrump = getMinTrump(opponentHand);

    if (!playerMinTrump && opponentMinTrump) isPlayerAttacker = false;
    else if (playerMinTrump && !opponentMinTrump) isPlayerAttacker = true;
    else if (playerMinTrump && opponentMinTrump) isPlayerAttacker = playerMinTrump.value < opponentMinTrump.value;
    else isPlayerAttacker = true;

    gameState = isPlayerAttacker ? 'playerAttack' : 'opponentAttack';
    renderGame();

    if (!isPlayerAttacker) {
        setTimeout(aiTurn, 1000);
    }
}

/** Обработка клика по карте игрока */
function onPlayerCardClick(event) {
    const cardIndex = parseInt(event.currentTarget.dataset.cardIndex);
    const selectedCard = playerHand[cardIndex];

    if (gameState === 'playerAttack') {
        if (isValidAttack(selectedCard)) {
            playerHand.splice(cardIndex, 1);
            battleField.push({ attack: selectedCard, defense: null });
            gameState = 'opponentDefend';
            renderGame();
            setTimeout(aiTurn, 1000);
        } else {
            alert('Нельзя ходить этой картой!');
        }
    } else if (gameState === 'playerDefend') {
        const attackingCard = battleField.find(pair => !pair.defense).attack;
        if (canBeat(selectedCard, attackingCard)) {
            playerHand.splice(cardIndex, 1);
            const pairToDefend = battleField.find(pair => !pair.defense);
            pairToDefend.defense = selectedCard;
            
            const allDefended = battleField.every(pair => pair.defense);
            if (allDefended) {
                gameState = 'playerAttack'; // Можно подкинуть
            }
            renderGame();
        } else {
            alert('Эта карта не может побить атакующую!');
        }
    }
}

/** Игрок нажимает "Бито" */
function onPassClick() {
    if (gameState !== 'playerAttack' && gameState !== 'opponentDefend') return;
    
    const allDefended = battleField.every(pair => pair.defense);
    if (!allDefended) {
        alert("Вы еще не отбились!");
        return;
    }

    battleField = [];
    replenishHands();
    isPlayerAttacker = false;
    gameState = 'opponentAttack';
    renderGame();
    checkWinCondition();
    setTimeout(aiTurn, 1000);
}

/** Игрок нажимает "Беру" */
function onTakeClick() {
    if (gameState !== 'playerDefend') return;

    const cardsToTake = battleField.flatMap(pair => [pair.attack, pair.defense]).filter(Boolean);
    playerHand.push(...cardsToTake);
    battleField = [];
    
    // Противник не добирает, т.к. игрок взял
    replenishHands(false, true); 

    isPlayerAttacker = false; // Атакует снова противник
    gameState = 'opponentAttack';
    renderGame();
    setTimeout(aiTurn, 1000);
}


// =======================================================================
// ==                      ЛОГИКА ИСКУССТВЕННОГО ИНТЕЛЛЕКТА (ИИ)                      ==
// =======================================================================

/** Основная функция хода ИИ */
function aiTurn() {
    if (gameState === 'opponentAttack') {
        const cardToAttack = findCardToAttack(opponentHand);
        if (cardToAttack) {
            opponentHand.splice(opponentHand.indexOf(cardToAttack), 1);
            battleField.push({ attack: cardToAttack, defense: null });
            gameState = 'playerDefend';
        } else { // Если ИИ нечем ходить (все карты отдал)
            onAIPass();
        }
    } else if (gameState === 'opponentDefend') {
        const attackingCard = battleField.find(pair => !pair.defense).attack;
        const cardToDefend = findCardToDefend(opponentHand, attackingCard);
        if (cardToDefend) {
            opponentHand.splice(opponentHand.indexOf(cardToDefend), 1);
            battleField.find(p => !p.defense).defense = cardToDefend;
            
            // Проверяем, может ли игрок еще подкинуть
            const canPlayerAdd = playerHand.some(card => isValidAttack(card));
            if (!canPlayerAdd) {
                // Если игрок не может подкинуть, ИИ объявляет "Бито"
                 setTimeout(onAIPass, 1000);
            } else {
                gameState = 'playerAttack'; // Ждем, подкинет ли игрок
            }
        } else {
            onAITake();
        }
    }
    renderGame();
    checkWinCondition();
}

/** ИИ берет карты */
function onAITake() {
    const cardsToTake = battleField.flatMap(pair => [pair.attack, pair.defense]).filter(Boolean);
    opponentHand.push(...cardsToTake);
    battleField = [];
    replenishHands(true, false);
    isPlayerAttacker = true;
    gameState = 'playerAttack';
}

/** ИИ говорит "Бито" */
function onAIPass() {
    battleField = [];
    replenishHands();
    isPlayerAttacker = true;
    gameState = 'playerAttack';
    checkWinCondition();
}

/** Находит карту для атаки */
function findCardToAttack(hand) {
    const nonTrumps = hand.filter(c => c.suit !== trumpSuit).sort((a,b) => a.value - b.value);
    if (nonTrumps.length > 0) return nonTrumps[0];
    return hand.sort((a,b) => a.value - b.value)[0]; // Если только козыри
}

/** Находит карту для защиты */
function findCardToDefend(hand, attackingCard) {
    const sameSuitCards = hand.filter(c => c.suit === attackingCard.suit && c.value > attackingCard.value).sort((a,b) => a.value - b.value);
    if (sameSuitCards.length > 0) return sameSuitCards[0];
    
    if (attackingCard.suit !== trumpSuit) {
        const trumps = hand.filter(c => c.suit === trumpSuit).sort((a,b) => a.value - b.value);
        if (trumps.length > 0) return trumps[0];
    }
    return null;
}


// =======================================================================
// ==                       ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ                       ==
// =======================================================================

/** Проверка, можно ли атаковать этой картой */
function isValidAttack(card) {
    if (battleField.length === 0) return true;
    return battleField.some(pair => pair.attack.rank === card.rank || (pair.defense && pair.defense.rank === card.rank));
}

/** Проверка, может ли одна карта побить другую */
function canBeat(defenseCard, attackCard) {
    if (defenseCard.suit === attackCard.suit) {
        return defenseCard.value > attackCard.value;
    }
    return defenseCard.suit === trumpSuit && attackCard.suit !== trumpSuit;
}

/** Добрать карты из колоды */
function replenishHands(playerFirst = isPlayerAttacker, opponentFirst = !isPlayerAttacker) {
    const replenish = (hand) => {
        while (hand.length < CARDS_IN_HAND && deck.length > 0) {
            hand.push(deck.shift());
        }
    };
    if (playerFirst) {
        replenish(playerHand);
        replenish(opponentHand);
    } else if (opponentFirst) {
        replenish(opponentHand);
        replenish(playerHand);
    }
}

/** Проверка на победу/поражение */
function checkWinCondition() {
    if (deck.length === 0) {
        if (playerHand.length === 0 && opponentHand.length === 0) {
            gameState = 'gameOver';
            renderGame("Ничья!");
        } else if (playerHand.length === 0) {
            gameState = 'gameOver';
            renderGame("Вы победили!");
        } else if (opponentHand.length === 0) {
            gameState = 'gameOver';
            renderGame("Вы проиграли!");
        }
    }
}


// =======================================================================
// ==                    ФУНКЦИИ ОТРИСОВКИ ИНТЕРФЕЙСА                   ==
// =======================================================================

/** Полностью перерисовывает игровой стол */
function renderGame(gameOverMessage = null) {
    document.body.innerHTML = `
        <div class="game-table">
            <!-- Зона противника -->
            <div class="player-zone">
                <h2>Противник (${opponentHand.length} карт)</h2>
                <div id="opponent-hand" class="card-area"></div>
            </div>
            
            <!-- Центральная зона -->
            <div class="middle-area">
                <div class="deck-area">
                    <h2>Колода (${deck.length})</h2>
                    <div id="deck" class="card-area"></div>
                </div>
                <div class="battle-area">
                    <h2>Битва</h2>
                    <div id="battle-field" class="card-area"></div>
                </div>
                <div class="trump-display">
                    <h2 id="trump-suit"></h2>
                    <div id="trump-card" class="card-area"></div>
                </div>
            </div>

            <!-- Зона игрока -->
            <div class="player-zone">
                <h2 id="player-turn-indicator"></h2>
                <div id="player-hand" class="card-area"></div>
                <div id="player-actions" class="actions-area"></div>
            </div>
        </div>
        ${gameOverMessage ? `<div class="game-over-screen"><h1>${gameOverMessage}</h1><button onclick="initGame()">Играть снова</button></div>` : ''}
    `;

    displayCards('player-hand', playerHand, false);
    displayCards('opponent-hand', opponentHand, true);
    displayCards('deck', deck, true, true);
    displayCards('trump-card', [deck[deck.length - 1]], false);
    displayBattlefield('battle-field', battleField);

    document.getElementById('trump-suit').textContent = `Козырь: ${trumpSuit}`;
    const playerTurnIndicator = document.getElementById('player-turn-indicator');
    
    // Индикатор хода
    if (isPlayerAttacker) {
       playerTurnIndicator.textContent = gameState === 'playerAttack' ? 'Ваша атака!' : 'Ждем ответа...';
    } else {
       playerTurnIndicator.textContent = gameState === 'playerDefend' ? 'Ваша защита!' : 'Атака противника...';
    }

    // Кнопки действий
    const actionsArea = document.getElementById('player-actions');
    if (gameState === 'playerDefend') {
        actionsArea.innerHTML = `<button onclick="onTakeClick()">Беру</button>`;
    } else if (battleField.length > 0 && battleField.every(p => p.defense) && isPlayerAttacker) {
        actionsArea.innerHTML = `<button onclick="onPassClick()">Бито</button>`;
    }
}

/** Отображает карты в указанной области */
function displayCards(areaId, cards = [], showBack, stack = false) {
    const areaElement = document.getElementById(areaId);
    if (!areaElement) return;
    areaElement.innerHTML = '';

    const cardsToDisplay = stack && cards.length > 0 ? [cards[0]] : cards;

    for (const [index, card] of cardsToDisplay.entries()) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        if (card) {
            cardElement.dataset.cardIndex = playerHand.indexOf(card);
            if (showBack) {
                cardElement.classList.add('back');
            } else {
                cardElement.classList.add((['♥', '♦'].includes(card.suit)) ? 'red' : 'black');
                cardElement.textContent = `${card.rank}${card.suit}`;
            }
            if (areaId === 'player-hand') {
                cardElement.addEventListener('click', onPlayerCardClick);
            }
        }
        areaElement.appendChild(cardElement);
    }
}

/** Отдельная функция для отрисовки поля битвы парами */
function displayBattlefield(areaId, pairs) {
    const areaElement = document.getElementById(areaId);
    areaElement.innerHTML = '';
    for (const pair of pairs) {
        const pairContainer = document.createElement('div');
        pairContainer.className = 'battle-pair';
        
        const attackCardEl = document.createElement('div');
        attackCardEl.className = 'card';
        attackCardEl.classList.add((['♥', '♦'].includes(pair.attack.suit)) ? 'red' : 'black');
        attackCardEl.textContent = `${pair.attack.rank}${pair.attack.suit}`;
        pairContainer.appendChild(attackCardEl);

        if (pair.defense) {
            const defenseCardEl = document.createElement('div');
            defenseCardEl.className = 'card defended';
            defenseCardEl.classList.add((['♥', '♦'].includes(pair.defense.suit)) ? 'red' : 'black');
            defenseCardEl.textContent = `${pair.defense.rank}${pair.defense.suit}`;
            pairContainer.appendChild(defenseCardEl);
        }
        areaElement.appendChild(pairContainer);
    }
}

/** Внедряет все CSS стили в head документа */
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        body { background-color: #0e501e; color: white; font-family: sans-serif; text-align: center; margin: 0; padding: 10px; box-sizing: border-box; }
        .game-table { width: 100%; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; justify-content: space-between; height: 100vh; }
        .player-zone { padding: 10px; }
        .card-area { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px; min-height: 122px; padding: 10px; border: 2px dashed #ffffff33; border-radius: 10px; margin-top: 5px; }
        .middle-area { display: flex; justify-content: center; align-items: flex-start; gap: 20px; margin: 0; }
        .deck-area, .trump-display { flex-basis: 120px; text-align: center; }
        .battle-area { flex-grow: 1; display: flex; justify-content: center; flex-wrap: wrap; align-items: flex-start; }
        .battle-pair { position: relative; margin: 5px; }
        .battle-pair .card { margin: 0; }
        .battle-pair .defended { position: absolute; top: -10px; left: 10px; transform: rotate(15deg); }
        .actions-area { margin-top: 15px; height: 50px; }
        .actions-area button { background-color: #ffc107; border: none; padding: 10px 20px; font-size: 18px; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .card { width: 70px; height: 98px; border-radius: 5px; background-color: white; border: 1px solid black; display: flex; justify-content: center; align-items: center; font-size: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .player-hand .card:hover { transform: translateY(-10px); }
        .card.back { background: linear-gradient(135deg, #0d1e70, #254fde); border: 3px solid white; }
        .card.red { color: #d32f2f; }
        .card.black { color: #000000; }
        h2 { margin-bottom: 5px; margin-top: 10px; font-size: 1em; }
        .game-over-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 100; }
        .game-over-screen h1 { font-size: 3em; color: #ffc107; }
        .game-over-screen button { background-color: #4CAF50; color: white; padding: 15px 30px; font-size: 24px; border: none; border-radius: 10px; cursor: pointer; }
    `;
    document.head.appendChild(style);
}


// =======================================================================
// ==                      ТОЧКА ВХОДА - ЗАПУСК ИГРЫ                    ==
// =======================================================================
injectStyles();
initGame();