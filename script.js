body {
    background-color: #0e501e;
    color: white;
    font-family: sans-serif;
    text-align: center;
    padding: 10px;
}

.game-board {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px; /* Расстояние между картами */
    padding: 20px;
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
    cursor: pointer; /* Делает курсор как у ссылки */
}

.card.red {
    color: red;
}

.card.black {
    color: black;
}