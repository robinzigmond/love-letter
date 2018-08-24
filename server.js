const io = require("socket.io")();
const port = 8000;

const startDeck = [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8];

const cards = [
    {number: 1,
    name: "Guard",
    text: "Name a non-Guard card and choose a player. If that player has that card, he or she is out of the round"},
    {number: 2,
    name: "Priest",
    text: "Look at another player's hand"},
    {number: 3,
    name: "Baron",
    text: "You and another player secretly compare hands. The player with the lower value is out of the round"},
    {number: 4,
    name: "Handmaid",
    text: "Until your next turn, ignore all effects from other players' cards"},
    {number: 5,
    name: "Prince",
    text: "Choose any player (including yourself) to discard his or her hand and draw a new card"},
    {number: 6,
    name: "King",
    text: "Trade hands with another player of your choice"},
    {number: 7,
    name: "Countess",
    text: "If you have this card and the King or Prince in your hand, you must discard this card"},
    {number: 8,
    name: "Princess",
    text: "If you discard this card, you are out of the round"}
];

// game setup and functionality
const Game = {};

Game.deck = startDeck;

Game.getCardName = function(cardNum) {
    for (let i=0; i<cards.length; i++) {
        if (cards[i].number == cardNum) {
            return cards[i].name;
        }
    }
    throw Error(`no card found with number ${cardNum}`);
}

Game.shuffle = function() {
    var result = [], size = this.deck.length;
    while (result.length < size) {
        var random = Math.floor(Math.random() * this.deck.length);
        var card = this.deck[random];
        result.push(card);
        this.deck.splice(random, 1);
    }
    this.deck = result;
}

Game.discardTop = function() {
    var topCard = this.deck[0];
    this.discard.push(topCard);
    this.deck = this.deck.slice(1);
}

Game.draw = function(playerNo) {
    console.log(`player ${playerNo+1} draws!`);
    var card = this.deck[0];
    this.hands[playerNo].push(card);
    this.deck = this.deck.slice(1);
    this.log.push({special: playerNo, specialMessage: `You drew a ${this.getCardName(card)}`,
        normalMessage: `Player ${playerNo+1} drew a card`});
}

Game.play = function(playerNo, cardNo) {
    this.discarded[playerNo].push(cardNo);
    var index = this.hands[playerNo].indexOf(cardNo);
    this.hands[playerNo].splice(index, 1);
    this.log.push({special: playerNo, normalMessage: `Player ${playerNo+1} played a ${this.getCardName(cardNo)}`,
    specialMessage: `You played a ${this.getCardName(cardNo)}`});
}

Game.getPlayerOptions = function(playerNo, cardNo) {
    var output = [];
    if ([4, 7, 8].indexOf(cardNo) > -1) {
        return output;
    }
    for (let i=0; i<this.playerCount; i++) {
        if (this.protected.indexOf(i) == -1 && this.eliminated.indexOf(i) == -1 && (cardNo==5 || i!=playerNo)) {
            output.push(i);
        }
    }
    // allow to play one oneself if there is no other options
    if (!output.length) {
        output = [playerNo];
    }
    return output;
}

Game.getCardOptions = function(cardNo) {
    return (cardNo == 1 ? [2, 3, 4, 5, 6, 7, 8] : []);
}

Game.resolve = function(choiceObj) {
    switch(choiceObj.cardPlayed) {
        case 1:
            this.log.push({special: [this.turn, choiceObj.playerChosen],
                normalMessage: `Player ${this.turn+1} picked player ${choiceObj.playerChosen+1} and named ${this.getCardName(choiceObj.cardChosen)}`,
                specialMessage: [`You picked player ${choiceObj.playerChosen+1} and named ${this.getCardName(choiceObj.cardChosen)}`,
                `Player ${this.turn+1} picked you and named ${this.getCardName(choiceObj.cardChosen)}`]});
            if (this.hands[choiceObj.playerChosen][0] == choiceObj.cardChosen) {
                this.eliminate(choiceObj.playerChosen);
                this.log.push({normalMessage: `Player ${choiceObj.playerChosen+1} did have a ${this.getCardName(choiceObj.cardChosen)} and was eliminated!`});
            }
            else {
                this.log.push({special: choiceObj.playerChosen,
                    normalMessage: `Player ${choiceObj.playerChosen+1} did not have a ${this.getCardName(choiceObj.cardChosen)}`,
                    specialMessage: `You did not have a ${this.getCardName(choiceObj.cardChosen)}`});
            }
            break;
        case 2:
            let cardSeen = this.hands[choiceObj.playerChosen][0];
            this.log.push({special: [this.turn, choiceObj.playerChosen],
                normalMessage: `Player ${this.turn+1} looked at player ${choiceObj.playerChosen+1}'s hand`,
                specialMessage:[`You saw a ${this.getCardName(cardSeen)} in player ${choiceObj.playerChosen+1}'s hand`,
                `Player ${this.turn+1} looked at your hand and saw your ${this.getCardName(cardSeen)}`]});
            break;
        case 3:
            this.log.push({special: [this.turn, choiceObj.playerChosen],
                normalMessage: `Player ${this.turn+1} compared hands with player ${choiceObj.playerChosen+1}`,
                specialMessage: [`You compared hands with player ${choiceObj.playerChosen+1}`,
                `Player ${this.turn+1} compared hands with you`]});
            let yourCard = this.hands[this.turn][0], theirCard = this.hands[choiceObj.playerChosen][0],
                difference = yourCard - theirCard;
            let loser;
            if (difference > 0) {
                loser = choiceObj.playerChosen;
                this.log.push({special: this.turn,
                    normalMessage: `Player ${this.turn+1} had a higher card than player ${choiceObj.playerChosen+1}'s ${this.getCardName(theirCard)} - player ${choiceObj.playerChosen+1} is eliminated!`,
                    specialMessage: `Your ${this.getCardName(yourCard)} was higher than player ${choiceObj.playerChosen+1}'s ${this.getCardName(theirCard)} - player ${choiceObj.playerChosen+1} is eliminated!`});
            }
            else if (difference < 0) {
                loser = this.turn;
                this.log.push({special: choiceObj.playerChosen,
                    normalMessage: `Player ${choiceObj.playerChosen+1} had a higher card than player ${this.turn+1}'s ${this.getCardName(yourCard)} - player ${this.turn+1} is eliminated!`,
                    specialMessage: `Your ${this.getCardName(theirCard)} was higher than player ${this.turn+1}'s ${this.getCardName(yourCard)} - player ${this.turn+1} is eliminated!`});
            }
            else {
                this.log.push({special: [choiceObj.playerChosen, this.turn],
                    normalMessage: `Player ${choiceObj.playerChosen+1} had the same card as player ${this.turn+1}!`,
                    specialMessage: [`Player ${this.turn+1} also had a ${this.getCardName(yourCard)}!`,
                    `Player ${choiceObj.playerChosen+1} also had a ${this.getCardName(theirCard)}!`]});
            }
            if (loser != undefined) {
                this.eliminate(loser);
            }
            break;
        case 4:
            this.protected.push(this.turn);
            break;
        case 5:
            let discarded = this.hands[choiceObj.playerChosen][0];
            let logMessage, topCard;
            this.discarded[choiceObj.playerChosen].push(discarded);
            this.hands[choiceObj.playerChosen] = [];
            if (discarded == 8) {
                this.eliminate(choiceObj.playerChosen);
            }
            else if (this.deck.length) {
                topCard = this.deck[0];
                this.draw(choiceObj.playerChosen);
            }
            else {
                let discard = this.discard[0];
                this.discard = [];
                this.hands[choiceObj.playerChosen] = [discard];
            }
            if (this.turn == choiceObj.playerChosen) {
                logMessage = {special: this.turn,
                    normalMessage: `Player ${this.turn+1} discarded their ${this.getCardName(discarded)} and drew a new card`,
                    specialMessage: `You discarded your ${this.getCardName(discarded)} ${topCard ? `and drew a ${this.getCardName(topCard)}` : ""}`};
            }
            else {
                logMessage = {special: [this.turn, choiceObj.playerChosen],
                    normalMessage: `Player ${this.turn+1} made player ${choiceObj.playerChosen+1} discard. They discarded their ${this.getCardName(discarded)} and ${discarded == 8 ? "were eliminated" : "drew a new card"}`,
                    specialMessage: [`You made player ${choiceObj.playerChosen+1} discard their ${this.getCardName(discarded)} and ${discarded==8 ? "they were eliminated!" : "draw a new card"}`,
                        `You had to discard your ${this.getCardName(discarded)} ${topCard ? `and drew a ${this.getCardName(topCard)}` : ""}`]};
            }
            this.log.push(logMessage);
            break;
        case 6:
            let myCard = this.hands[this.turn][0], otherCard = this.hands[choiceObj.playerChosen][0];
            this.hands[this.turn] = [otherCard];
            this.hands[choiceObj.playerChosen] = [myCard];
            this.log.push({special: [this.turn, choiceObj.playerChosen],
                normalMessage: `Player ${this.turn+1} swapped hands with player ${choiceObj.playerChosen+1}`,
                specialMessage: [`You gave player ${choiceObj.playerChosen+1} your ${this.getCardName(myCard)} and received his ${this.getCardName(otherCard)}`,
                    `Player ${this.turn+1} gave you his ${this.getCardName(myCard)} in exchange for your ${this.getCardName(otherCard)}`]});
            break;
        case 7:
            break;
        case 8:
            this.eliminate(this.turn);
            this.log.push({normalMessage: `Player ${this.turn+1} played a Princess and eliminated themself!`});
            break;
        default:
            throw Error("unknown card played!");
    }
}

Game.eliminate = function(playerNo) {
    this.eliminated.push(playerNo);
    this.discarded[playerNo].push(this.hands[playerNo][0]);
    this.hands[playerNo] = [];
    if (this.eliminated.length == this.playerCount - 1) {
        let winner;
        for (let i=0; i<this.playerCount; i++) {
            if (this.eliminated.indexOf(i) == -1) {
                winner = i;
                break;
            }
        }
        this.winner = {player: winner};
    }
}

Game.startTurn = function() {
    this.draw(this.turn);
    var idx = this.protected.indexOf(this.turn);
    if (idx > -1) {
        this.protected.splice(idx, 1);
    }
}

Game.endTurn = function() {
    var current = this.turn;
    current = (current + 1) % this.playerCount;
    while (this.eliminated.indexOf(current) > -1) {
        current = (current + 1) % this.playerCount;
    }
    this.turn = current;
    if (this.deck.length) {
        this.startTurn();
    }
    else {
        this.gameEnd();
    }
}

Game.gameEnd = function() {
    var value = 0, winner;
    for (let i=0; i<this.playerCount; i++) {
        if (this.eliminated.indexOf(i) == -1) {
            let card = this.hands[i][0];
            if (card > value) {
                value = card;
                winner = i;
            }
            else if (card == value) {
                winner = [winner, i];
            }
        }
    }
    this.winner = {player: winner, card: value};
}

Game.getLogMessage = function(messageObj, playerNo) {
    if (messageObj.special instanceof Array) {
        let index = messageObj.special.indexOf(playerNo);
        if (index == -1) {
            return messageObj.normalMessage;
        }
        return messageObj.specialMessage[index];
    }
    if (messageObj.special != undefined) {
        return (playerNo == messageObj.special ? messageObj.specialMessage : messageObj.normalMessage);
    }
    return messageObj.normalMessage;
}

Game.init = function(playerCount) {
    this.playerCount = playerCount;
    this.deck = startDeck.slice(); // clone array so that we can return to it when a new game starts
    this.shuffle(); // initialises random deck
    this.discard = [];
    this.hands = [];
    this.discarded = [];
    this.eliminated = [];
    this.protected = [];
    this.turn = 0;
    this.winner = false;
    this.log = [{normalMessage: "Game started"}];
    this.discardTop();
    for (let i=0; i<playerCount; i++) {
        this.hands.push([]);
        this.discarded.push([]);
    }
    for (let i=0; i<playerCount; i++) {
        this.draw(i);
    }
}


io.on("connection", (socket) => {
    console.log("client connected!");
    socket.on("gameJoin", game => {
        // don't allow to join if game is already full
        if (io.engine.clientsCount > game.playerCount) {
            console.log("connection refused - game full!");
            return;
        }
        // store information about which player # has joined (needed for printing correct log)
        socket.playerNum = io.engine.clientsCount - 1;
        console.log(`player ${socket.playerNum+1} joined`);
        if (io.engine.clientsCount == 1) {
            // first connection, so start game
            Game.init(game.playerCount);
            Game.startTurn();
        }
        var log = Game.log.map(logMessage => Game.getLogMessage(logMessage, socket.playerNum));
        socket.emit("gameStart", {playerId: socket.playerNum, hand: Game.hands[socket.playerNum],
            discarded: Game.discarded, cardsInDeck: Game.deck.length, eliminated: Game.eliminated,
            protected: Game.protected, log: log});
    });
    socket.on("play", play => {
        Game.play(play.player, play.card);
        socket.emit("stateChange", {hand: Game.hands[play.player]});
        Object.values(io.sockets.connected).forEach(function(client) {
            client.emit("stateChange", 
            {log: Game.log.map(logMessage => Game.getLogMessage(logMessage, client.playerNum))})
        });
        io.emit("stateChange", {discarded: Game.discarded});
        socket.emit("options", {playerOptions: Game.getPlayerOptions(play.player, play.card),
            cardOptions: Game.getCardOptions(play.card)});
        socket.emit("stateChange", {lastPlayed: play.card});
    });
    socket.on("playChoice", choice => {
        Game.resolve(choice);
        io.emit("result", {discarded: Game.discarded, eliminated: Game.eliminated,
            protected: Game.protected, winner: Game.winner, cardsInDeck: Game.deck.length,
            lastPlayed: false});
        Object.values(io.sockets.connected).forEach(function(client) {
            client.emit("stateChange", 
            {log: Game.log.map(logMessage => Game.getLogMessage(logMessage, client.playerNum))})
        });
        Game.endTurn();
        socket.emit("stateChange", {hand: Game.hands[choice.player]});
        io.emit("stateChange", {turn: Game.turn,
            discarded: Game.discarded, eliminated: Game.eliminated,
            protected: Game.protected, winner: Game.winner, cardsInDeck: Game.deck.length});
        Object.values(io.sockets.connected).forEach(function(client) {
            var newState = {log: Game.log.map(logMessage => Game.getLogMessage(logMessage, client.playerNum))};
            if (client.playerNum == Game.turn) {
                newState.hand = Game.hands[Game.turn];
            }
            client.emit("stateChange", newState);
        });
    });
    socket.on("disconnect", () => {
        console.log("client disconnected!");
    });
});

io.listen(port);
console.log(`listening on port ${port}`);
