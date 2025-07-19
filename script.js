// --- Инициализация игры ---
function initGame() {
    // --- Создание и тасование колоды ---
    const suits = ['♠', '♣', '♥', '♦'];
    const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // --- Раздача карт ---
    const playerHand = deck.slice(0, 6);   // Первые 6 карт игроку
    const opponentHand = deck.slice(6, 12); // Следующие 6 карт оппоненту
    
    // --- Определяем козырь ---
    const trumpCard = deck[12]; // Карта под колодой
    const trumpSuit = trumpCard.suit;
    
    // --- Оставшаяся колода (прикуп) ---
    const remainingDeck = deck.slice(13);

    // --- Отображение ---
    displayArea('player-hand', playerHand);
    displayArea('opponent-hand', opponentHand, true); // true, чтобы показать рубашки
    displayArea('remaining-deck', remainingDeck, true); // Показываем стопку рубашек
    displayArea('trump-area', [trumpCard]); // Показываем козырь
    
    // Отображаем масть козыря
    const trumpSuitElement = document.getElementById('trump-suit');
    trumpSuitElement.textContent = `Козырь: ${trumpSuit}`;
    if (trumpSuit === '♥' || trumpSuit === '♦') {
        trumpSuitElement.classList.add('red');
    }
}

// --- Функция для отображения карт в определенной области ---
function displayArea(areaId, cards, showBack = false) {
    const areaElement = document.getElementById(areaId);
    areaElement.innerHTML = ''; // Очищаем область перед отрисовкой

    for (const card of cards) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        if (showBack) {
            cardElement.classList.add('back'); // Показываем рубашку
        } else {
            if (card.suit === '♥' || card.suit === '♦') {
                cardElement.classList.add('red');
            } else {
                cardElement.classList.add('black');
            }
            cardElement.textContent = `${card.rank}${card.suit}`;
        }
        areaElement.appendChild(cardElement);
    }
}

// --- HTML структура в JavaScript ---
// Мы создаем игровые зоны прямо здесь, чтобы не менять HTML файл
document.body.innerHTML = `
    <h1>Игра в Дурака</h1>
    <div class="game-table">
        <div class="opponent-area">
            <h2>Противник</h2>
            <div id="opponent-hand" class="card-area"></div>
        </div>
        
        <div class="middle-area">
            <div class="deck-area">
                <h2>Колода</h2>
                <div id="remaining-deck" class="card-area"></div>
            </div>
            <div class="trump-display">
                <h2 id="trump-suit">Козырь: ?</h2>
                <div id="trump-area" class="card-area"></div>
            </div>
        </div>

        <div class="player-area">
            <h2>Вы</h2>
            <div id="player-hand" class="card-area"></div>
        </div>
    </div>
`;


// --- Стили в JavaScript ---
// Мы добавляем новые стили для игровых зон
const style = document.createElement('style');
style.textContent = `
    body {
        background-color: #0e501e;
        color: white;
        font-family: sans-serif;
        text-align: center;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .game-table {
        width: 100%;
        max-width: 900px;
    }
    .card-area {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        min-height: 120px;
        padding: 10px;
        border: 2px dashed #ffffff55;
        border-radius: 10px;
        margin-top: 10px;
    }
    .middle-area {
        display: flex;
        justify-content: space-around;
        align-items: center;
        margin: 20px 0;
    }
    .card {
        width: 80px;
        height: 112px;
        border-radius: 5px;
        background-color: white;
        border: 1px solid black;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
    }
    .card.back {
        background: linear-gradient(135deg, #6B73FF, #000DFF);
        color: transparent;
    }
    .card.red { color: red; }
    .card.black { color: black; }
    #trump-suit.red { color: #ff5555; }
`;
document.head.appendChild(style);

// --- Запускаем игру ---
initGame();