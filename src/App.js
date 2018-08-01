import React, { Component } from 'react';
import './App.css';

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

class CardName extends Component {
    render() {
        var cardObj = cards.filter(card=>(card.number==this.props.num))[0];
        return (
            <span>{cardObj.name} <button className="card-info" onClick={()=>this.props.show(this.props.num)}>?</button></span>
        );
    }
}

class PlayerDisplay extends Component {
    constructor(props) {
        super(props);
        this.handleCardChange = this.handleCardChange.bind(this);
        this.playSelected = this.playSelected.bind(this);
        this.getText = this.getText.bind(this);
        this.updateNumber = this.updateNumber.bind(this);

        this.state = {toPlay: 0, textShown: false};
    }

    handleCardChange(event) {
        this.setState({toPlay: event.target.value});
    }

    playSelected() {
        var cardSelected = this.state.toPlay;
        this.setState({toPlay: 0});
        this.props.play(cardSelected);
        this.updateNumber(false);
    }

    getText(cardNum) {
        for (let i=0; i<cards.length; i++) {
            if (cards[i].number == cardNum) {
                var cardObj = cards[i];
                break;
            }
        }
        if (!cardObj) {
            throw Error(`no card found with number ${cardNum}`);
        }
        return `${cardNum}: ${cardObj.name} - ${cardObj.text}`;
    }

    updateNumber(num) {
        this.setState({textShown: num});
    }

    render() {
            var options;
            // both cards can be played, with one exception: when a Countess(7) is held,
            // and the other card is a Prince(5) or King(6), the Countess must be played.
            // So we remove the King or Prince from the options.
            // NB it is still possible to play a Princess, even though doing so automatically loses the game!
            if (this.props.hand.indexOf(7) > -1 && (this.props.hand.indexOf(5) > -1 || this.props.hand.indexOf(6) > -1)) {
                options = (
                    <option key="7" value="7">{this.props.getCardName(7)}</option>
                );
            }
            else {
                options = (
                    this.props.hand.map((card, index) => <option key={index} value={card}>{this.props.getCardName(card)}</option>)
                ); 
            }
            var cardDetails;
            if (this.state.textShown) {
                cardDetails = this.getText(this.state.textShown);
            }
            return (
            <div>
                <p>Player {+this.props.playerNum+1}:
                hand - {this.props.hand.map((num, index) => (
                    <CardName key={index} num={num} show={this.updateNumber} />
                ))}</p>
                {this.state.textShown ? <p id="card-details">{cardDetails}<button onClick={()=>(this.setState({textShown: false}))}>X</button></p> : null}
                {this.props.allowToPlay ? <label htmlFor="card-choice">Choose card to play:</label> : null}
                {this.props.allowToPlay ? (
                    <select id="card-choice" onChange={this.handleCardChange} value={this.state.toPlay}>
                        <option value="0">Select</option>
                        {options}
                    </select>
                ) : null}
                {this.props.allowToPlay ? <button onClick={this.playSelected}>Play!</button> : null}
            </div>
        );
    }
}

class CardPlayed extends Component {
    constructor(props) {
        super(props);
        this.state = {player: -1, cardNum: 0};
        this.handleCardChange = this.handleCardChange.bind(this);
        this.handlePlayerChange = this.handlePlayerChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        switch(+props.cardPlayed) {
            case 1:
                Object.assign(this.state, {playerChoice: true, cardChoice: true});
                break;
            case 2:
            case 3:
            case 5:
            case 6:
                Object.assign(this.state, {playerChoice: true, cardChoice: false});
                break;
            case 4:
            case 7:
            case 8:
            default:
                Object.assign(this.state, {playerChoice: false, cardChoice: false});
                break;
        }
    }

    componentWillMount() {
        switch(+this.props.cardPlayed) {
            case 1:
                this.setState({playerChoice: true, cardChoice: true});
                break;
            case 2:
            case 3:
            case 5:
            case 6:
                this.setState({playerChoice: true, cardChoice: false});
                break;
            case 4:
            case 7:
            case 8:
            default:
                this.setState({playerChoice: false, cardChoice: false});
                break;
        }
    }

    handleCardChange(event) {
        this.setState({cardNum: event.target.value});
    }

    handlePlayerChange(event) {
        this.setState({player: event.target.value-1});
    }

    handleSubmit() {
        if ((this.state.player > -1 || !this.state.playerChoice)
        && (this.state.cardNum || !this.state.cardChoice)) {
            this.props.getPlayerChoices(this.state.player, this.state.cardNum);
        }
        this.setState({player: -1, cardNum: 0});
    }

    render() {
        var cardAction;
        var playerChoices = [];
        for (let i=0; i<this.props.numPlayers; i++) {
            if ((i != this.props.playerNum || this.props.cardPlayed == 5) // Prince (5) player can target themself
             && this.props.eliminated.indexOf(i) == -1) {
                playerChoices.push(i);
            }
        }
        var cardChoices = [2, 3, 4, 5, 6, 7, 8];
        switch(+this.props.cardPlayed) {
            case 1:
                cardAction = (
                    <div>
                        <label htmlFor="player-choice">Choose player:</label>
                        <select id="player-choice" value={this.state.player+1} onChange={this.handlePlayerChange}>
                            <option value="0">Select</option>
                            {playerChoices.map(playerNum =>
                            <option key={playerNum+1} value={playerNum+1}>Player {playerNum+1}</option>)}
                        </select>
                        <label htmlFor="card-choice">Choose which card you think they have:</label>
                        <select id="card-choice" value={this.state.cardNum} onChange={this.handleCardChange}>
                            <option value="0">Select</option>
                            {cardChoices.map(cardNum =>
                            <option key={cardNum} value={cardNum}>{this.props.getCardName(cardNum)}</option>)}
                        </select>
                        <button onClick={this.handleSubmit}>Go</button>
                    </div>
                );
                break;
            case 2:
                cardAction = (
                    <div>
                        <label htmlFor="player-choice">Choose which player's hand to look at:</label>
                        <select id="player-choice" value={this.state.player+1} onChange={this.handlePlayerChange}>
                            <option value="0">Select</option>
                            {playerChoices.map(playerNum =>
                            <option key={playerNum+1} value={playerNum+1}>Player {playerNum+1}</option>)}
                        </select>
                        <button onClick={this.handleSubmit}>Go</button>
                    </div>
                );
                break;
            case 3:
                cardAction = (
                    <div>
                        <label htmlFor="player-choice">Choose which player's hand to compare with yours:</label>
                        <select id="player-choice" value={this.state.player+1} onChange={this.handlePlayerChange}>
                            <option value="0">Select</option>
                            {playerChoices.map(playerNum =>
                            <option key={playerNum+1} value={playerNum+1}>Player {playerNum+1}</option>)}
                        </select>
                        <button onClick={this.handleSubmit}>Go</button>
                    </div>
                );
                break;
            case 4:
                cardAction = (
                    <div>
                        <p>You are protected until your next turn!
                        <button className="ok-button" onClick={this.props.okClick}>OK</button></p>
                    </div>
                );
                break;
            case 5:
                cardAction = (
                    <div>
                        <label htmlFor="player-choice">Choose player to discard their hand:</label>
                        <select id="player-choice" value={this.state.player+1} onChange={this.handlePlayerChange}>
                            <option value="0">Select</option>
                            {playerChoices.map(playerNum =>
                            <option key={playerNum+1} value={playerNum+1}>Player {playerNum+1}</option>)}
                        </select>
                        <button onClick={this.handleSubmit}>Go</button>
                    </div>
                );
                break;
            case 6:
                cardAction = (
                    <div>
                        <label htmlFor="player-choice">Choose player to swap hands with:</label>
                        <select id="player-choice" value={this.state.player+1} onChange={this.handlePlayerChange}>
                            <option value="0">Select</option>
                            {playerChoices.map(playerNum =>
                            <option key={playerNum+1} value={playerNum+1}>Player {playerNum+1}</option>)}
                        </select>
                        <button onClick={this.handleSubmit}>Go</button>
                    </div>
                );
                break;
            case 7:
                cardAction = (
                    <div>
                        <p>No more decisions to make this turn!
                        <button className="ok-button" onClick={this.props.okClick}>OK</button></p>
                    </div>
                );
                break;
            case 8:
                cardAction = (
                    <div>
                        <p>Whoops - you have eliminated yourself by playing the Princess!</p>
                        <button onClick={this.handleSubmit}>OK</button>
                    </div>
                );
                break;               
            default:
                throw Error("unknown card played!");
        }
        return (
            <div>
                <p>Card played was: {this.props.getCardName(this.props.cardPlayed)}</p>
                {cardAction}
            </div>
        )
    }
}

class GameLog extends Component {
    constructor(props) {
        super(props);
        this.printLogLine = this.printLogLine.bind(this);

        this.bottom = React.createRef();
    }

    componentDidMount() {
        this.bottom.current.scrollIntoView();
    }

    componentDidUpdate() {
        this.bottom.current.scrollIntoView();
    }

    printLogLine(player, messageObj) {
        if (messageObj.special instanceof Array) {
            let index = messageObj.special.indexOf(player);
            if (index ==  -1) {
                return messageObj.normalMessage;
            }
            return messageObj.specialMessage[index];
        }
        if (messageObj.special != undefined) {
            return (player == messageObj.special ? messageObj.specialMessage : messageObj.normalMessage);
        }
        return messageObj.normalMessage;
    }

    render () {
        return (
            <div id="log">
                <ul>
                    {this.props.log.map((messageObj, index) => <li key={index}>{this.printLogLine(this.props.player, messageObj)}</li>)}
                </ul>
                <div id="log-bottom" ref={this.bottom}></div>
            </div>
        );
    }
}

class Game extends Component {
    constructor(props) {
        var startDeck = [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8];
        super(props);
        this.shuffle = this.shuffle.bind(this);
        this.draw = this.draw.bind(this);
        this.discardTop = this.discardTop.bind(this);
        this.play = this.play.bind(this);
        this.getCardName = this.getCardName.bind(this);
        this.getPlayerChoices = this.getPlayerChoices.bind(this);
        this.moveToNextTurn = this.moveToNextTurn.bind(this);
        this.eliminate = this.eliminate.bind(this);
        this.addToLog = this.addToLog.bind(this);

        this.state = {deck: startDeck, hands: {}, played: {}, discard: [], turn: 0,
                      lastPlayed: false, turnComplete: true, actionComplete: false,
                    eliminated: [], resultText: "", gameOver: false, waitingHandover: false,
                    log: [{normalMessage: "Game started"}]};

        this.shuffle(true);
        var hands = {}, played = {};
        for (let i=0; i<this.props.playerCount; i++) {
            hands[`p${i}`] = [];
            this.state.hands = hands
            this.draw(i, true, false);
            played[`p${i}`] = [];
        }

        this.state.played = played;
    
        this.discardTop(true);
        this.draw(0, true, true);
    }

    shuffle(isInit) {
        var result = [], size = this.state.deck.length;
        while (result.length < size) {
            var random = Math.floor(Math.random() * this.state.deck.length);
            var card = this.state.deck[random];
            result.push(card);
            this.state.deck.splice(random, 1);
        }
        if (isInit) {
            this.state.deck = result;
        }
        else {
            this.setState({deck: result});
        }        
    }

    draw(playerNo, isInit, shouldAddToLog) {
        if (shouldAddToLog === undefined) {
            shouldAddToLog = true;
        }
        if (!this.state.deck.length) {
            throw Error("Tried to draw card from empty deck!");
        }
        var hand = this.state.hands[`p${playerNo}`];
        var card = this.state.deck[0];
        hand.push(card);
        var newHands = {};
        for (let i=0; i<this.props.playerCount; i++) {
            if (i==playerNo) {
                newHands[`p${i}`] = hand;
            }
            else {
                newHands[`p${i}`] = this.state.hands[`p${i}`] || [];
            }
        }
        if (isInit) {
            this.state.deck = this.state.deck.slice(1);
            this.state.hands = newHands;
            if (shouldAddToLog) {
                this.addToLog({special: playerNo, specialMessage: `You drew a ${this.getCardName(card)}`,
                normalMessage: `Player ${playerNo+1} drew a card`});
            }
        }
        else {
            let newDeck = this.state.deck.slice(1);
            this.setState((prevState) => ({deck: newDeck, hands: newHands}));
            if (shouldAddToLog) {
                this.addToLog({special: playerNo, specialMessage: `You drew a ${this.getCardName(card)}`,
                normalMessage: `Player ${playerNo+1} drew a card`});
            }
        }
    }

    discardTop(isInit) {
        var discard = this.state.discard;
        discard.push(this.state.deck[0]);
        this.setState({discard: discard});
        if (isInit) {
            this.state.deck = this.state.deck.slice(1);
        }
        else {
            this.setState({deck: this.state.deck.slice(1)});
        }
    }

    play(player, cardNum) {
        if (!cardNum) {
            return;
        }
        this.addToLog({special: player, normalMessage: `Player ${player+1} played a ${this.getCardName(cardNum)}`,
        specialMessage: `You played a ${this.getCardName(cardNum)}`});
        var hands = this.state.hands, played = this.state.played;
        var thisHand = hands[`p${player}`], thisPlayed = played[`p${player}`];
        for (let i=0; i<thisHand.length; i++) {
            if (thisHand[i] == cardNum) {
                thisPlayed.push(cardNum);
                thisHand.splice(i, 1);
                this.setState({hands: hands, played: played, lastPlayed: cardNum,
                    turnComplete: false, chosenNum: 0, chosenPlayer: -1}); 
                return;
            }
        }
        throw Error(`card number ${cardNum} not found in p${player}'s hand`);
    }

    getCardName(cardNum) {
        for (let i=0; i<cards.length; i++) {
            if (cards[i].number == cardNum) {
                return cards[i].name;
            }
        }
        throw Error(`no card found with number ${cardNum}`);
    }

    getPlayerChoices(player, cardNum) {
        var handMaid;
        // handmaid protects! And guard against dummy player value of -1
        if (player > -1 && this.state.played[`p${player}`][this.state.played[`p${player}`].length-1] == 4
            && this.state.played[`p${this.state.turn}`][this.state.played[`p${this.state.turn}`].length-1] != 4) {
            this.setState({resultText: `No effect, player ${player+1} played a Handmaid last turn!`});
            handMaid = true;
        }
        else {
            switch (+this.state.lastPlayed) {
                case 1:
                    // guard - compare named card with named player's card
                    this.addToLog({special: this.state.turn,
                        normalMessage: `Player ${this.state.turn+1} picked player ${player+1} and named ${this.getCardName(cardNum)}`,
                        specialMessage: `You picked player ${player+1} and named ${this.getCardName(cardNum)}`});
                    if (cardNum == this.state.hands[`p${player}`][0]) {
                        this.eliminate(player);
                        this.setState({resultText: `You guessed correct! Player ${player+1} does have a ${this.getCardName(cardNum)}! They are eliminated!`});
                        this.addToLog({normalMessage: `Player ${player+1} did have a ${this.getCardName(cardNum)} and was eliminated!`});
                    }
                    else {
                        this.setState({resultText: `Player ${player+1} does not have a ${this.getCardName(cardNum)}!`});
                        this.addToLog({normalMessage: `Player ${player+1} did not have a ${this.getCardName(cardNum)}`});
                    }
                    break;
                case 2:
                    let cardSeen = this.state.hands[`p${player}`][0];
                    this.setState({resultText: `Player ${player+1} has a ${this.getCardName(cardSeen)}`});
                    this.addToLog({special: this.state.turn,
                    normalMessage: `Player ${this.state.turn+1} looked at player ${player+1}'s hand`,
                    specialMessage: `You saw a ${this.getCardName(cardSeen)} in player ${player+1}'s hand`})
                    break;
                case 3:
                    let yourCard = this.state.hands[`p${this.state.turn}`][0];
                    let theirCard = this.state.hands[`p${player}`][0];
                    if (yourCard > theirCard) {
                        this.eliminate(player);
                        this.setState({resultText: `Player ${player+1} has a ${this.getCardName(theirCard)} and is eliminated`});
                        this.addToLog({special: this.state.turn,
                            normalMessage: `Player ${this.state.turn+1} had a higher card than player ${player+1}'s ${this.getCardName(theirCard)} - player ${player+1} is eliminated!`,
                        specialMessage: `Your ${this.getCardName(yourCard)} was higher than player ${player+1}'s ${this.getCardName(theirCard)} - player ${player+1} is eliminated!`})
                    }
                    else if (theirCard > yourCard) {
                        this.eliminate(this.state.turn);
                        this.setState({resultText: `Player ${player+1} has a ${this.getCardName(theirCard)} - you are eliminated!`});
                        this.addToLog({special: player,
                            normalMessage: `Player ${player+1} had a higher card than player ${this.state.turn+1}'s ${this.getCardName(yourCard)} - player ${this.state.turn+1} is eliminated!`,
                        specialMessage: `Your ${this.getCardName(theirCard)} was higher than player ${this.state.turn+1}'s ${this.getCardName(yourCard)} - player ${this.state.turn+1} is eliminated!`})
                    }
                    else {
                        this.setState({resultText: `Player ${player+1} has the same card as you!`});
                        this.addToLog({special: [player, this.state.turn],
                        normalMessage: `Player ${player+1} had the same card as player ${this.state.turn+1}!`,
                        specialMessage: [`Player ${this.state.turn+1} also had a ${this.getCardName(yourCard)}!`,
                        `Player ${this.state.turn+1} also had a ${this.getCardName(theirCard)}!`]});
                    }
                    break;
                case 4:
                case 7:
                    this.setState({resultText: "No other decisions required this turn!"});
                    break;
                case 5:
                    let card = this.state.hands[`p${player}`][0];
                    let topCard = this.state.deck[0];
                    if (this.state.deck.length && card != 8) { // if Princess was discarded (eliminating that player), it makes no sense to draw
                        this.draw(player, false, false);
                    }
                    let newHands = this.state.hands, played = this.state.played;
                    newHands[`p${player}`] = newHands[`p${player}`].slice(1);
                    if (card != 4) {
                        played[`p${player}`].push(card);
                    }
                    else {
                        played[`p${player}`] = played[`p${player}`].slice(0, -1).concat([card]).concat(played[`p${player}`].slice(-1));
                    }
                    let playerText = (player==this.state.turn ? "You discarded your" : `Player ${player+1} discarded their`);
                    let newCardText = (player==this.state.turn ? this.getCardName(topCard) : "new one")
                    if (card == 8) { // a discarded Princess eliminates that player!
                        this.eliminate(player);
                        newCardText += `\n This means that ${this.state.turn == player ? "you are " : `player ${player+1} is `} eliminated!`;
                    }
                    if (this.state.gameOver) {
                        this.setState(()=>({hands: newHands, played: played}));
                    }
                    else {
                        this.setState(()=>({hands: newHands, played: played,
                            resultText: `${playerText} ${this.getCardName(card)} and drew a ${newCardText}`}));
                    }
                    var logMessage;
                    if (this.state.turn == player) {
                        logMessage = {special: this.state.turn,
                        normalMessage: `Player ${this.state.turn+1} discarded their card and drew a new one`,
                        specialMessage: `You discarded your ${this.getCardName(card)} and drew a ${this.getCardName(topCard)}`};
                    }
                    else {
                        logMessage = {special: [this.state.turn, player],
                        normalMessage: `Player ${this.state.turn+1} made player ${player+1} discard. They discarded their ${this.getCardName(card)} and ${card == 8 ? "were eliminated" : "drew a new card"}`,
                        specialMessage: [`You made player ${player+1} discard their ${this.getCardName(card)} and ${card==8 ? "they were eliminated!" : "draw a new one"}`,
                                        `You had to discard your ${this.getCardName(card)} and drew a ${this.getCardName(topCard)}`]};
                    }
                    this.addToLog(logMessage);
                    break;
                case 6:
                    let myCard = this.state.hands[`p${this.state.turn}`][0];
                    let otherCard = this.state.hands[`p${player}`][0];
                    let swappedHands = this.state.hands;
                    swappedHands[`p${this.state.turn}`] = [otherCard];
                    swappedHands[`p${player}`] = [myCard];
                    this.setState({hands: swappedHands,
                        resultText: `You gave player ${player+1} your ${this.getCardName(myCard)} and received a ${this.getCardName(otherCard)}`});
                    this.addToLog({special: [this.state.turn, player],
                    normalMessage: `Player ${this.state.turn+1} swapped hands with player ${player+1}`,
                    specialMessage: [`You gave player ${player+1} your ${this.getCardName(myCard)} and received his ${this.getCardName(otherCard)}`,
                                    `Player ${this.state.turn+1} gave you his ${this.getCardName(myCard)} in exchange for your ${this.getCardName(otherCard)}`]});
                    break;
                case 8:
                    this.eliminate(this.state.turn);
                    this.setState({resultText: "Oh dear!"});
                    this.addToLog({normalMessage: `Player ${this.state.turn+1} played a Princess and eliminated themself!`});
                    break;
                default:
                    throw Error("unknown card played!");
            }
        }
        if (handMaid) {
            this.addToLog({normalMessage: `No effect, player ${player+1} is protected by the Handmaid`});
        }
        this.setState({chosenPlayer: player, chosenNum: cardNum, actionComplete: true, lastPlayed: false});
    }

    moveToNextTurn() {
        // find next non-eliminated player
        var current = this.state.turn;
        current = (current + 1) % this.props.playerCount;
        while (this.state.eliminated.indexOf(current) > -1) {
            current = (current + 1) % this.props.playerCount;
        }
        this.setState({turnComplete: true, actionComplete: false, waitingHandover: false,
            turn: current, chosenPlayer: false, chosenNum: false, lastPlayed: false});
        if (this.state.deck.length) {
            this.draw(current);
        }
        else {
            this.setState({gameOver: true});
        }
    }

    eliminate(playerNum) {
        var hands = this.state.hands;
        var card = this.state.hands[`p${playerNum}`][0];
        hands[`p${playerNum}`] = [];
        var newDiscards = this.state.played;
        if (card) { // guard against the case where Price has been played on a player with Princess -
            // in that case the eliminated player hasn't drawn and therefore has an empty hand
            newDiscards[`p${playerNum}`].push(card);
        }
        var eliminated = this.state.eliminated;
        eliminated.push(playerNum);
        var allEliminated = (eliminated.length == this.props.playerCount-1);
        this.setState(()=>({played: newDiscards, hands: hands, eliminated: eliminated, gameOver: allEliminated}));
    }

    addToLog(messageObj) {
        var log = this.state.log;
        log.push(messageObj);
        this.setState(()=>({log: log}));
    }

    render() {
        var playerNumArray = [], cardPlayedDisplay, cardPlayedResult;
        for (let i=0; i<this.props.playerCount; i++) {
            playerNumArray.push(i);
        }
        if (this.state.lastPlayed) {
            cardPlayedDisplay = <CardPlayed numPlayers={this.props.playerCount} getCardName={this.getCardName} getPlayerChoices={this.getPlayerChoices}
            playerNum={this.state.turn} cardPlayed={this.state.lastPlayed} eliminated={this.state.eliminated} okClick={()=>(this.setState({waitingHandover: true, lastPlayed: false}))}/>;
        }
        else {
            cardPlayedDisplay = "";
        }
        if (this.state.gameOver) {
            cardPlayedResult = null;
        }
        else if (this.state.turnComplete) {
            cardPlayedResult = <p>Player {this.state.turn+1}'s turn!</p>
        }
        else if (this.state.waitingHandover){
            cardPlayedResult = (
                <div>
                    <p>Pass the device to the next player, who can click to start their turn:</p>
                    <button onClick={this.moveToNextTurn}>Start Turn</button>
                </div>
            );
        }
        else if (this.state.actionComplete){
            cardPlayedResult = (
                <p>{this.state.resultText}<button className="ok-button" onClick={()=>(this.setState({waitingHandover: true}))}>OK</button></p>
            );
        }
        var winner;
        if (this.state.gameOver) {
            let value = 0;
            for (let i=0; i<this.props.playerCount; i++) {
                if (this.state.eliminated.indexOf(i) == -1) {
                    let card = this.state.hands[`p${i}`][0];
                    if (card > value) {
                        value = card;
                        winner = i;
                    }
                    else if (card == value) {
                        winner = [winner, i];
                    }
                }
            }
        }
        var gameEnd;
        if(this.state.gameOver) {
            if (this.state.eliminated.length == this.props.playerCount - 1) {
                gameEnd = 
                    (
                        <div>
                            <p className="game-end">Game Over! Player {winner+1} wins - all other players were eliminated!</p>
                            <button onClick={this.props.restart}>New Game</button>
                        </div>
                    );
            }
            else {
                // handle case of multiple winners (EXTREMELY rare, but it did happen once in testing!)
                var winnerText;
                if (winner instanceof Array) {
                    winnerText = `The winners are players ${winner[0]+1} and ${winner[1]+1} who both hold a ${this.getCardName(this.state.hands[`p${winner[0]}`][0])}!`;
                }
                else {
                    winnerText = `The winner is player ${winner+1} who holds a ${this.getCardName(this.state.hands[`p${winner}`][0])}!`;
                }
                gameEnd = (
                    <div>
                        <p className="game-end">Game Over! {winnerText}</p>
                        <button onClick={this.props.restart}>New Game</button>
                    </div>
                );
            }
        }
        return (
            <div id="game-container">
                <div id="game">
                    {cardPlayedDisplay}
                    {cardPlayedResult}
                    <h3>Current player's turn:</h3>
                    {(!this.state.waitingHandover) ? 
                    <PlayerDisplay playerNum={this.state.turn} hand={this.state.hands[`p${this.state.turn}`]}
                    played={this.state.played[`p${this.state.turn}`]} 
                    play={(cardNum)=>this.play(+this.state.turn, +cardNum)} getCardName={this.getCardName}
                    allowToPlay={!this.state.lastPlayed && !this.state.actionComplete && !this.state.gameOver} />
                    : null}
                    <h3>All played cards:</h3>
                    <ul>
                        {Object.keys(this.state.played).sort().map(playerKey =>
                        <li key={playerKey}>Player {+playerKey.slice(1)+1} {this.state.eliminated.indexOf(+playerKey.slice(1)) > -1 ? " (ELIMINATED)" : ""}:
                        {this.state.played[playerKey].map(this.getCardName).join(", ")}</li>)}
                    </ul>
                    <p>
                        Deck: {this.state.deck.length} card{this.state.deck.length==1 ? "" : "s"}
                    </p>
                    {gameEnd}
                </div>
                {(!this.state.waitingHandover) ? <GameLog log={this.state.log} player={this.state.turn} /> : null}
            </div>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.restart = this.restart.bind(this);

        this.state = {running: false};
    }

    handleChange(e) {
        if (e.target.value > 0) {
            this.setState({playerCount: e.target.value});
        }
    }

    handleSubmit() {
        if (this.state.playerCount) {
            this.setState({running: true});
        }
    }

    restart() {
        this.setState({running: false, playerCount: 0});
    }

    render() {
        if (this.state.running) {
            return <Game playerCount={this.state.playerCount} restart={this.restart}/>
        }
        return (
            <div>
                <h1 id="title">Love Letter</h1>
                <p id="author">Made for fun and education by <a href="https://github.com/robinzigmond">Robin Zigmond</a></p>
                <div id="game-setup">
                    <p>Please select how many players will be in the game:</p>
                    <select onChange = {this.handleChange}>
                        <option value="0">Select</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                    <button onClick={this.handleSubmit}>Start game!</button>
                </div>
            </div>
        );
    }
}

export default App;
