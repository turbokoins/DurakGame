// --- Создание колоды ---
const suits = ['♠', '♣', '♥', '♦'];
const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const deck = [];

for (const suit of suits) {
    for (const rank of ranks) {
        deck.push({ suit, rank });
    }
}

// --- Тасование колоды (алгоритм Фишера-Йетса) ---
for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
}

// --- Отображение карт на экране ---
const gameBoard = document.getElementById('game-board');

for (const card of deck) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    
    if (card.suit === '♥' || card.suit === '♦') {
        cardElement.classList.add('red');
    } else {
        cardElement.classList.add('black');
    }

    cardElement.textContent = `${card.rank}${card.suit}`;
    gameBoard.appendChild(cardElement);
}