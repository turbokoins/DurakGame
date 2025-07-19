// =======================================================================
// ==            ИГРА "ДУРАК" - ФИНАЛЬНЫЙ РАБОЧИЙ КОД (v4)             ==
// =======================================================================

// --- Глобальное состояние игры ---
let playerHand = [], opponentHand = [], deck = [], battleField = [];
let trumpSuit = '', isPlayerAttacker = false;
let gameState = 'waiting'; // 'playerAttack', 'playerDefend', 'gameOver'

const CARDS_IN_HAND = 6;

// =======================================================================
// ==                       ЛОГИКА ИГРОВОГО ПРОЦЕССА                      ==
// =======================================================================

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
    
    const trumpCard = deck.length > 0 ? deck.shift() : null;
    if (trumpCard) {
        trumpSuit = trumpCard.suit;
        deck.push(trumpCard);
    } else { 
        trumpSuit = suits[0]; 
    }

    const getMinTrump = (hand) => hand.filter(c => c.suit === trumpSuit).sort((a, b) => a.value - b.value)[0];
    const playerMinTrump = getMinTrump(playerHand);
    const opponentMinTrump = getMinTrump(opponentHand);

    if (playerMinTrump && opponentMinTrump) isPlayerAttacker = playerMinTrump.value < opponentMinTrump.value;
    else if (playerMinTrump) isPlayerAttacker = true;
    else isPlayerAttacker = false;

    gameState = isPlayerAttacker ? 'playerAttack' : 'opponentAttack';
    renderGame();
    if (!isPlayerAttacker) setTimeout(aiTurn, 1000);
}

function onPlayerCardClick(event) {
    const cardIndex = parseInt(event.currentTarget.dataset.cardIndex);
    const selectedCard = playerHand[cardIndex];

    if (gameState === 'playerAttack') {
        if (isValidAttack(selectedCard)) {
            performMove(playerHand, selectedCard, 'opponentDefend');
            setTimeout(aiTurn, 1000);
        } else alert('Нельзя ходить этой картой!');
    } else if (gameState === 'playerDefend') {
        const attackingCard = battleField.find(pair => !pair.defense).attack;
        if (canBeat(selectedCard, attackingCard)) {
            playerHand.splice(cardIndex, 1);
            battleField.find(p => !p.defense).defense = selectedCard;
            
            const canOpponentAdd = opponentHand.some(card => isValidAttack(card));
            gameState = canOpponentAdd ? 'opponentAttack' : 'playerAttack';
            renderGame();
            if (gameState === 'opponentAttack') setTimeout(aiTurn, 1000);

        } else alert('Эта карта не может побить атакующую!');
    }
}

function onPassClick() {
    if (battleField.length === 0 || !battleField.every(p => p.defense)) return;
    battleField = [];
    replenishHands();
    isPlayerAttacker = false;
    gameState = 'opponentAttack';
    renderGame();
    if (!checkWinCondition()) setTimeout(aiTurn, 1000);
}

function onTakeClick() {
    if (gameState !== 'playerDefend') return;
    const cardsToTake = battleField.flatMap(pair => [pair.attack, pair.defense]).filter(Boolean);
    playerHand.push(...cardsToTake);
    battleField = [];
    replenishHands(false, true); 
    isPlayerAttacker = false; 
    gameState = 'opponentAttack';
    renderGame();
    if (!checkWinCondition()) setTimeout(aiTurn, 1000);
}

function performMove(hand, card, nextState) {
    hand.splice(hand.indexOf(card), 1);
    battleField.push({ attack: card, defense: null });
    gameState = nextState;
    renderGame();
}

function aiTurn() {
    if (gameState === 'opponentAttack') {
        const cardToAttack = findCardToAttack(opponentHand, battleField.length > 0);
        if (cardToAttack) performMove(opponentHand, cardToAttack, 'playerDefend');
        else onAIPass();
    } else if (gameState === 'opponentDefend') {
        const attackingCard = battleField.find(p => !p.defense).attack;
        const cardToDefend = findCardToDefend(opponentHand, attackingCard);
        if (cardToDefend) {
            opponentHand.splice(opponentHand.indexOf(cardToDefend), 1);
            battleField.find(p => !p.defense).defense = cardToDefend;
            gameState = 'opponentAttack';
            renderGame();
            if (!checkWinCondition()) setTimeout(aiTurn, 500);
        } else onAITake();
    }
    renderGame();
}

function onAITake() {
    const cardsToTake = battleField.flatMap(pair => [pair.attack, pair.defense]).filter(Boolean);
    opponentHand.push(...cardsToTake);
    battleField = [];
    replenishHands(true, false);
    isPlayerAttacker = true;
    gameState = 'playerAttack';
    renderGame();
    checkWinCondition();
}

function onAIPass() {
    battleField = [];
    replenishHands();
    isPlayerAttacker = true;
    gameState = 'playerAttack';
    renderGame();
    checkWinCondition();
}

function findCardToAttack(hand, isAdding) {
    let possibleCards;
    if (!isAdding) {
        const nonTrumps = hand.filter(c => c.suit !== trumpSuit).sort((a,b) => a.value - b.value);
        possibleCards = nonTrumps.length > 0 ? nonTrumps : hand.sort((a,b) => a.value - b.value);
    } else {
        const validRanks = new Set(battleField.flatMap(p => [p.attack.rank, p.defense ? p.defense.rank : null]));
        possibleCards = hand.filter(c => validRanks.has(c.rank)).sort((a,b) => a.value - b.value);
    }
    return possibleCards.length > 0 ? possibleCards[0] : null;
}

function findCardToDefend(hand, attackingCard) {
    const sameSuit = hand.filter(c => c.suit === attackingCard.suit && c.value > attackingCard.value).sort((a,b) => a.value - b.value);
    if (sameSuit.length > 0) return sameSuit[0];
    if (attackingCard.suit !== trumpSuit) {
        const trumps = hand.filter(c => c.suit === trumpSuit).sort((a,b) => a.value - b.value);
        if (trumps.length > 0) return trumps[0];
    }
    return null;
}

function isValidAttack(card) {
    if (battleField.length === 0) return true;
    const validRanks = new Set(battleField.flatMap(p => [p.attack.rank, p.defense ? p.defense.rank : null]));
    return validRanks.has(card.rank);
}

function canBeat(defenseCard, attackCard) {
    if (defenseCard.suit === attackCard.suit) return defenseCard.value > attackCard.value;
    return defenseCard.suit === trumpSuit && attackCard.suit !== trumpSuit;
}

function replenishHands() {
    const replenish = (hand) => {
        while (hand.length < CARDS_IN_HAND && deck.length > 0) hand.push(deck.shift());
    };
    if (isPlayerAttacker) { replenish(playerHand); replenish(opponentHand); }
    else { replenish(opponentHand); replenish(playerHand); }
}

function checkWinCondition() {
    if (deck.length === 0) {
        if (playerHand.length === 0 && opponentHand.length === 0) { renderGame("Ничья!"); return true; }
        if (playerHand.length === 0) { renderGame("Вы победили!"); return true; }
        if (opponentHand.length === 0) { renderGame("Вы проиграли!"); return true; }
    }
    return false;
}

function renderGame(gameOverMessage = null) {
    document.body.innerHTML = `
        <div class="game-table">
            <div class="player-zone">
                <h2>Противник (${opponentHand.length} карт)</h2>
                <div id="opponent-hand" class="card-area"></div>
            </div>
            <div class="middle-area">
                <div class="deck-area"><h2>Колода (${deck.length})</h2><div id="deck" class="card-area"></div></div>
                <div class="battle-area"><h2>Битва</h2><div id="battle-field" class="card-area"></div></div>
                <div class="trump-display"><h2>Козырь: ${trumpSuit}</h2><div id="trump-card" class="card-area"></div></div>
            </div>
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
    const trumpCard = deck.length > 0 ? deck[deck.length-1] : null;
    displayCards('trump-card', trumpCard ? [trumpCard] : [], false);
    displayBattlefield('battle-field', battleField);

    document.getElementById('player-turn-indicator').textContent = 
        gameState === 'playerAttack' ? 'Ваша атака!' :
        gameState === 'playerDefend' ? 'Ваша защита!' : 'Ход противника...';

    const actionsArea = document.getElementById('player-actions');
    actionsArea.innerHTML = '';
    if (gameState === 'playerDefend') {
        actionsArea.innerHTML = `<button onclick="onTakeClick()">Беру</button>`;
    }
    else if (gameState === 'playerAttack' && battleField.length > 0 && battleField.every(p => p.defense)) {
        actionsArea.innerHTML = `<button onclick="onPassClick()">Бито</button>`;
    }
}

function displayCards(areaId, cards = [], showBack, stack = false) {
    const areaElement = document.getElementById(areaId);
    if (!areaElement) return;
    areaElement.innerHTML = '';
    const cardsToDisplay = stack && cards.length > 0 ? [cards[0]] : cards;
    for (const card of cardsToDisplay) {
        if (!card) continue; // Пропускаем пустые слоты
        const cardElement = createCardElement(card, showBack);
        areaElement.appendChild(cardElement);
    }
}

function displayBattlefield(areaId, pairs) {
    const areaElement = document.getElementById(areaId);
    areaElement.innerHTML = '';
    for (const pair of pairs) {
        const pairContainer = document.createElement('div');
        pairContainer.className = 'battle-pair';
        pairContainer.appendChild(createCardElement(pair.attack));
        if (pair.defense) {
            const defenseCardEl = createCardElement(pair.defense);
            defenseCardEl.classList.add('defended');
            pairContainer.appendChild(defenseCardEl);
        }
        areaElement.appendChild(pairContainer);
    }
}

function createCardElement(card, showBack = false) {
    const el = document.createElement('div');
    el.className = 'card';
    if (!card) {
        el.classList.add('empty');
        return el;
    }

    if (playerHand.includes(card)) {
        el.dataset.cardIndex = playerHand.indexOf(card);
        el.addEventListener('click', onPlayerCardClick);
    }

    if (showBack) {
        el.classList.add('back');
    } else {
        el.classList.add((['♥', '♦'].includes(card.suit)) ? 'red' : 'black');
        el.textContent = `${card.rank}${card.suit}`;
    }
    return el;
}

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        body { background-color: #0e501e; color: white; font-family: sans-serif; text-align: center; margin: 0; padding: 10px; box-sizing: border-box; }
        .game-table { width: 100%; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; justify-content: space-between; height: 100vh; }
        .card-area { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px; min-height: 112px; padding: 5px; border: 2px dashed #ffffff33; border-radius: 10px; margin-top: 5px; }
        .middle-area { display: flex; justify-content: center; align-items: flex-start; gap: 20px; }
        .battle-area { flex-grow: 1; }
        .battle-pair { position: relative; margin: 5px; width: 72px; height: 100px;}
        .battle-pair .card { position: absolute; top: 0; left: 0; }
        .battle-pair .defended { transform: translate(15px, -15px) rotate(15deg); z-index: 1; }
        .actions-area { margin-top: 10px; height: 40px; }
        .actions-area button { background-color: #ffc107; border: none; padding: 10px 20px; font-size: 16px; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .card { width: 70px; height: 98px; border-radius: 5px; background-color: white; border: 1px solid black; display: flex; justify-content: center; align-items: center; font-size: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: transform 0.2s; user-select: none;}
        #player-hand .card:hover { transform: translateY(-15px); z-index: 10; }
        .card.back { background: linear-gradient(135deg, #0d1e70, #254fde); border: 3px solid white; }
        .card.red { color: #d32f2f; }
        .card.empty { background-color: #ffffff11; border-style: dashed; }
        h2 { margin: 10px 0 5px; font-size: 1em; }
        .game-over-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.85); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 100; }
        .game-over-screen h1 { font-size: 3em; color: #ffc107; text-shadow: 2px 2px 5px black; }
        .game-over-screen button { background-color: #4CAF50; color: white; padding: 15px 30px; font-size: 24px; border: none; border-radius: 10px; cursor: pointer; margin-top: 20px; }
    `;
    document.head.appendChild(style);
}

// --- Запуск игры ---
injectStyles();
initGame();