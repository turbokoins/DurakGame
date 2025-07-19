// =======================================================================
// ==                    ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ИГРЫ                     ==
// =======================================================================
let playerHand = [];
let opponentHand = [];
let deck = [];
let trumpSuit = '';
let battleField = []; // Карты, которые лежат на столе в текущем бою
let isPlayerTurn = false;

// =======================================================================
// ==                       ОСНОВНЫЕ ФУНКЦИИ ИГРЫ                       ==
// =======================================================================

/**
 * Запускает игру с самого начала: создает и тасует колоду, раздает карты,
 * определяет козырь и первого ходящего, после чего отрисовывает стол.
 */
function initGame() {
    // --- Создание и тасование колоды ---
    const suits = ['♠', '♣', '♥', '♦'];
    const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    // Добавляем 'value' для простого сравнения карт (6 - самая младшая, туз - старший)
    const cardValues = ranks.reduce((acc, rank, i) => ({ ...acc, [rank]: i }), {});

    deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank, value: cardValues[rank] });
        }
    }

    // Тасование колоды (алгоритм Фишера-Йетса)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // --- Раздача карт и определение козыря ---
    playerHand = deck.splice(0, 6);
    opponentHand = deck.splice(0, 6);
    const trumpCard = deck.shift(); // Берем верхнюю карту как козырь
    trumpSuit = trumpCard.suit;
    deck.push(trumpCard); // Кладем козырную карту под низ колоды

    // --- Определяем, кто ходит первым ---
    const getMinTrump = (hand) => hand
        .filter(card => card.suit === trumpSuit)
        .sort((a, b) => a.value - b.value)[0];

    const playerMinTrump = getMinTrump(playerHand);
    const opponentMinTrump = getMinTrump(opponentHand);

    if (!playerMinTrump && opponentMinTrump) {
        isPlayerTurn = false; // У оппонента есть козырь, у нас нет -> ходит он
    } else if (playerMinTrump && !opponentMinTrump) {
        isPlayerTurn = true; // У нас есть козырь, у оппонента нет -> ходим мы
    } else if (playerMinTrump && opponentMinTrump) {
        isPlayerTurn = playerMinTrump.value < opponentMinTrump.value; // У кого козырь младше
    } else {
        isPlayerTurn = true; // Ни у кого нет козырей, ходит игрок (по умолчанию)
    }

    // --- Полностью перерисовываем весь игровой стол ---
    renderGame();
}

/**
 * Обработчик клика по карте в руке игрока.
 * @param {MouseEvent} event - Событие клика.
 */
function onPlayerCardClick(event) {
    if (!isPlayerTurn) {
        alert("Сейчас не ваш ход!");
        return;
    }

    // Получаем карту, по которой кликнули, через ее data-атрибут
    const cardIndex = parseInt(event.currentTarget.dataset.cardIndex);
    const selectedCard = playerHand[cardIndex];

    // TODO: Добавить правила, можно ли этой картой ходить
    // Пока что можно ходить любой картой.
    
    battleField.push(selectedCard); // Перемещаем карту на стол
    playerHand.splice(cardIndex, 1); // Удаляем карту из руки

    isPlayerTurn = false; // Передаем ход
    renderGame(); // Перерисовываем стол с новым состоянием
}

// =======================================================================
// ==                    ФУНКЦИИ ОТРИСОВКИ ИНТЕРФЕЙСА                   ==
// =======================================================================

/**
 * Полностью перестраивает и отрисовывает весь игровой стол на основе текущих данных.
 */
function renderGame() {
    // Вставляем всю HTML-структуру в body
    document.body.innerHTML = `
        <div class="game-table">
            <div class="opponent-area">
                <h2>Противник (${opponentHand.length} карт)</h2>
                <div id="opponent-hand" class="card-area"></div>
            </div>
            
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

            <div class="player-area">
                <h2 id="player-turn-indicator"></h2>
                <div id="player-hand" class="card-area"></div>
            </div>
        </div>
    `;

    // Отображаем все зоны с картами
    displayCards('player-hand', playerHand, false);
    displayCards('opponent-hand', opponentHand, true);
    displayCards('deck', deck, true, true); // Отображаем колоду как одну карту
    displayCards('trump-card', [deck[deck.length - 1]], false); // Козырь - последняя карта
    displayCards('battle-field', battleField, false);

    // Обновляем текстовые индикаторы
    const trumpSuitElement = document.getElementById('trump-suit');
    trumpSuitElement.textContent = `Козырь: ${trumpSuit}`;
    if (['♥', '♦'].includes(trumpSuit)) {
        trumpSuitElement.style.color = '#ff5555';
    }

    const playerTurnIndicator = document.getElementById('player-turn-indicator');
    playerTurnIndicator.textContent = isPlayerTurn ? 'Ваш ход!' : 'Ход противника';
    if(isPlayerTurn) {
        playerTurnIndicator.style.color = '#55ff55';
    }
}

/**
 * Отображает массив карт в указанной области на столе.
 * @param {string} areaId - ID div-элемента, куда вставлять карты.
 * @param {Array} cards - Массив объектов карт для отображения.
 * @param {boolean} showBack - Показывать карты рубашкой вверх.
 * @param {boolean} stack - Показать только одну карту как стопку.
 */
function displayCards(areaId, cards, showBack = false, stack = false) {
    const areaElement = document.getElementById(areaId);
    areaElement.innerHTML = ''; // Очищаем зону перед отрисовкой

    const cardsToDisplay = stack && cards.length > 0 ? [cards[0]] : cards;

    for (const [index, card] of cardsToDisplay.entries()) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        // Сохраняем реальный индекс карты из руки для обработчика клика
        cardElement.dataset.cardIndex = playerHand.indexOf(card);

        if (showBack) {
            cardElement.classList.add('back');
        } else {
            if (['♥', '♦'].includes(card.suit)) {
                cardElement.classList.add('red');
            }
            cardElement.textContent = `${card.rank}${card.suit}`;
        }
        
        // Добавляем обработчик клика ТОЛЬКО на карты игрока
        if (areaId === 'player-hand') {
            cardElement.addEventListener('click', onPlayerCardClick);
        }

        areaElement.appendChild(cardElement);
    }
}

/**
 * Создает и добавляет все CSS стили на страницу.
 */
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        body { background-color: #0e501e; color: white; font-family: sans-serif; text-align: center; margin: 0; padding: 10px; box-sizing: border-box; }
        .game-table { width: 100%; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; justify-content: space-between; height: 100vh; }
        .card-area { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px; min-height: 122px; padding: 10px; border: 2px dashed #ffffff55; border-radius: 10px; margin-top: 5px; }
        .middle-area { display: flex; justify-content: center; align-items: flex-start; gap: 20px; margin: 20px 0; }
        .deck-area, .trump-display { flex-basis: 120px; }
        .battle-area { flex-grow: 1; }
        .card { width: 80px; height: 112px; border-radius: 5px; background-color: white; border: 1px solid black; display: flex; justify-content: center; align-items: center; font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .card.back { background: linear-gradient(135deg, #6B73FF, #000DFF); border: 3px solid white; }
        .card.red { color: red; }
        h2 { margin-bottom: 5px; margin-top: 10px; }
    `;
    document.head.appendChild(style);
}

// =======================================================================
// ==                      ТОЧКА ВХОДА - ЗАПУСК ИГРЫ                    ==
// =======================================================================
injectStyles();
initGame();