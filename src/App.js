import React, { Component } from 'react';
import './App.css';
import openSocket from "socket.io-client";

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
            if (this.props.isEliminated) {
                return (
                    <p>You are eliminated from the game!</p>
                );
            }
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
            this.props.resolve(this.state.player, this.state.cardNum);
        }
        this.setState({player: -1, cardNum: 0});
    }

    render() {
        var cardAction;
        var playerChoices = this.props.options.playerOptions, cardChoices = this.props.options.cardOptions;
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
                        <button className="ok-button" onClick={()=>this.props.resolve(0, 0)}>OK</button></p>
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
                        <button className="ok-button" onClick={()=>this.props.resolve(0, 0)}>OK</button></p>
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
        this.bottom = React.createRef();
    }

    componentDidMount() {
        this.bottom.current.scrollIntoView();
    }

    componentDidUpdate() {
        this.bottom.current.scrollIntoView();
    }

    render () {
        return (
            <div id="log">
                <h4 id="log-title">Game Log</h4>
                <ul>
                    {this.props.log.map((logEntry, index) => <li key={index}>{logEntry}</li>)}
                </ul>
                <div id="log-bottom" ref={this.bottom}></div>
            </div>
        );
    }
}

class Game extends Component {
    constructor(props) {
        super(props);
        this.getCardName = this.getCardName.bind(this);
        this.resolve = this.resolve.bind(this);

        this.state = {hand: [], discarded: [], log: [], eliminated: [], protected: [], gameOver: false,
            lastPlayed: 0, turn: 0, winner: false};
        for (let i=0; i<this.props.playerCount; i++) {
            this.state.discarded.push([]);
        }
    }

    componentDidMount() {
        const socket = openSocket("http://localhost:8000");
        socket.on("gameStart", (obj) => {
            this.setState({myNum: obj.playerId, hand: obj.hand, discarded: obj.discarded, log: obj.log,
                eliminated: obj.eliminated, protected: obj.protected, gameOver: false,
                lastPlayed: 0, turn: 0, cardsInDeck: obj.cardsInDeck, winner: false});
        });
        socket.on("stateChange", (state) => {
            this.setState(state);
        });
        socket.on("options", (optionsObj) => {
            this.setState({options: optionsObj});
        });
        socket.on("result", (state) => {
            this.setState(state);
            if (state.winner) {
                this.setState({gameOver: true});
            }
        });
        this.socket = socket;
        socket.emit("gameJoin", {playerCount: this.props.playerCount});
    }

    componentWillUnmount() {
        this.socket.close();
    }

    getCardName(cardNum) {
        for (let i=0; i<cards.length; i++) {
            if (cards[i].number == cardNum) {
                return cards[i].name;
            }
        }
        throw Error(`no card found with number ${cardNum}`);
    }

    resolve(player, card) {
        this.socket.emit("playChoice", {player: this.state.myNum, cardPlayed: this.state.lastPlayed, cardChosen: card, playerChosen: player});
    }

    render() {
        var cardPlayedDisplay;
        if (this.state.lastPlayed && (this.state.myNum == this.state.turn)) {
            cardPlayedDisplay = <CardPlayed numPlayers={this.props.playerCount} getCardName={this.getCardName} options={this.state.options}
            playerNum={this.state.turn} cardPlayed={this.state.lastPlayed} eliminated={this.state.eliminated}
            resolve={this.resolve}/>;
        }
        else {
            cardPlayedDisplay = null;
        }
 
        var gameEnd, winner, winningCard;
        if(this.state.gameOver) {
            winner = this.state.winner.player;
            winningCard = this.state.winner.card;
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
                    winnerText = `The winners are players ${winner[0]+1} and ${winner[1]+1} who both hold a ${this.getCardName(winningCard)}!`;
                }
                else {
                    winnerText = `The winner is player ${winner+1} who holds a ${this.getCardName(winningCard)}!`;
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
                    <h3>Player {this.state.turn+1}'s turn:</h3>
                    {cardPlayedDisplay}
                    <PlayerDisplay playerNum={this.state.myNum} hand={this.state.hand}
                    play={(cardNum)=>this.socket.emit("play", {player: +this.state.myNum, card: +cardNum})}
                    getCardName={this.getCardName} isEliminated={this.state.eliminated.indexOf(this.state.myNum)>-1}
                    allowToPlay={(this.state.turn == this.state.myNum) && !this.state.lastPlayed && !this.state.actionComplete && !this.state.gameOver} />
                    <h3>All played cards:</h3>
                    <ul>
                        {this.state.discarded.map((discards, playerNo) =>
                        <li key={playerNo}>
                            <span className={this.state.eliminated.indexOf(playerNo) > -1 ? "eliminated" : ""}>Player {playerNo+1}</span>:&nbsp;
                            {discards.map(this.getCardName).join(", ")}
                        </li>)}
                    </ul>
                    <p>
                        Deck: {this.state.cardsInDeck} card{this.state.cardsInDeck==1 ? "" : "s"}
                    </p>
                    {gameEnd}
                </div>
                <GameLog log={this.state.log} player={this.props.me} />
            </div>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.handlePlayerCountChange = this.handlePlayerCountChange.bind(this);
        this.handlePlayerChange = this.handlePlayerChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.restart = this.restart.bind(this);

        this.state = {running: false};
    }

    handlePlayerCountChange(e) {
        this.setState({playerCount: e.target.value});
    }

    handlePlayerChange(e) {
        this.setState({playerNo: e.target.value});
    }

    handleSubmit() {
        if (this.state.playerCount && this.state.playerNo) {
            this.setState({running: true});
        }
    }

    restart() {
        this.setState({running: false, playerCount: 0, playerNo: 0});
    }

    render() {
        if (this.state.running) {
            return <Game playerCount={this.state.playerCount} me={this.state.playerNo-1} restart={this.restart}/>
        }
        var playerOptions = [];
        if (this.state.playerCount) {
            for (let i=1; i<=this.state.playerCount; i++) {
                playerOptions.push(i);
            }
        }
        var dropdownOptions = (
            playerOptions.map((num) => (
                <option key={num} value={num}>{num}</option>
            ))
        );
        return (
            <div>
                <h1 id="title">Love Letter</h1>
                <p id="description">Online implementation of the popular card game by Seiji Kanai, published by Asmodee</p>
                <p id="author">Made for fun and education by <a href="https://github.com/robinzigmond">Robin Zigmond</a></p>
                <div id="game-setup">
                    <p>Please select how many players will be in the game:</p>
                    <select onChange = {this.handlePlayerCountChange}>
                        <option value="0">Select</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                    <p>Please choose which player number to be</p>
                    <select onChange = {this.handlePlayerChange}>
                        <option value="0">Select</option>
                        {dropdownOptions}
                    </select>
                    <button onClick={this.handleSubmit}>Start game!</button>
                </div>
            </div>
        );
    }
}

export default App;
