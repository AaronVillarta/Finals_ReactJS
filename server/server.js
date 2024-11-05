const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { determineWinner } = require('../src/gameLogic.js');


const app = express();
const httpServer = createServer(app);


app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST"]
}));
app.use(express.json());


const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

const PORT = 5001;


const games = new Map();


const playAgainPlayers = new Set();


app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Rock Paper Scissors API' });
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/login', (req, res) => {
    console.log('Login attempt received:', req.body);
    
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ 
            error: 'Username is required' 
        });
    }
    
    return res.status(200).json({
        success: true,
        user: {
            id: Date.now(),
            username: username
        }
    });
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinGame', (username) => {
        console.log(`${username} (${socket.id}) joining game`);
  
        let gameId = findAvailableGame() || createNewGame();
        let game = games.get(gameId);

        game.players.push({
            id: socket.id,
            username: username,
            ready: false,
            choice: null,
            lives: 3
        });

        socket.join(gameId);
        socket.gameId = gameId;

        if (game.players.length === 2) {
 
            game.players.forEach(player => {
                player.lives = 3;
            });
            
            io.to(gameId).emit('gameStart', {
                players: game.players.map(p => ({
                    id: p.id,
                    username: p.username
                }))
            });

            game.timeoutId = setTimeout(() => {
                handleRoundEnd(gameId, game);
            }, 10000);
        } else {
            socket.emit('waitingForPlayer');
        }

        console.log(`Game ${gameId} status:`, game.players.length === 2 ? 'starting' : 'waiting');
    });

    socket.on('makeChoice', (choice) => {
        console.log(`Player ${socket.id} chose ${choice}`);
        
        for (const [gameId, game] of games.entries()) {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                player.choice = choice;
           
                if (game.players.length === 2) {
                    if (game.players.every(p => p.choice)) {
                        if (!game.timeoutId) {
                            handleRoundEnd(gameId, game);
                        }
                    }
                }
                break;
            }
        }
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (game) {

                if (game.timeoutId) {
                    clearInterval(game.timeoutId);
                    game.timeoutId = null;
                }

                game.players = game.players.filter(p => p.id !== socket.id);           
                io.to(socket.gameId).emit('playerLeft');
                if (game.players.length === 0) {
                    games.delete(socket.gameId);
                }
            }
        }
    });

    socket.on('resetGame', (username) => {
        console.log(`${username} requesting game reset`);
        
        // Clear any existing timeouts/intervals
        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (game) {   
                playAgainPlayers.add(socket.id);               
                const bothPlayersWantRematch = game.players.every(p => 
                    playAgainPlayers.has(p.id)
                );
                if (bothPlayersWantRematch) {
                   
                    if (game.timeoutId) {
                        clearInterval(game.timeoutId);
                        game.timeoutId = null;
                    }

                    game.players.forEach(player => {
                        player.lives = 3;
                        player.choice = null;
                    });
                    game.rounds = 0;

                    playAgainPlayers.clear();

                    io.to(socket.gameId).emit('gameStart', {
                        players: game.players.map(p => ({
                            id: p.id,
                            username: p.username
                        }))
                    });
                    game.timeoutId = setTimeout(() => {
                        handleRoundEnd(socket.gameId, game);
                    }, 10000);
                } else {
                    socket.emit('waitingForRematch');
                }
            }
        }
    });
});

function findAvailableGame() {
    for (const [gameId, game] of games.entries()) {
        if (game.players.length < 2) {
            return gameId;
        }
    }
    return null;
}

function createNewGame() {
    const gameId = Math.random().toString(36).substring(7);
    games.set(gameId, {
        players: [],
        status: 'waiting',
        rounds: 0
    });
    return gameId;
}

function updateLives(game, result) {
    const [player1, player2] = game.players;

    if (player1.lives === undefined) player1.lives = 3;
    if (player2.lives === undefined) player2.lives = 3;
    
    let player1Change = 0;
    let player2Change = 0;
    let winCondition = '';
    
    if (result.result === 'player2') {
        if (result.superEffective) {
            player1Change = -2;
            player1.lives = Math.max(0, player1.lives - 2);
            winCondition = `${player2.username} dealt SUPER EFFECTIVE damage!`;
        } else {
            player1Change = -1;
            player2Change = +1;
            player1.lives = Math.max(0, player1.lives - 1);
            player2.lives += 1;
            winCondition = `${player2.username} won and gained 1 life!`;
        }
    } else if (result.result === 'player1') {
        if (result.superEffective) {
            player2Change = -2;
            player2.lives = Math.max(0, player2.lives - 2);
            winCondition = `${player1.username} dealt SUPER EFFECTIVE damage!`;
        } else {
            player2Change = -1;
            player1Change = +1;
            player2.lives = Math.max(0, player2.lives - 1);
            player1.lives += 1;
            winCondition = `${player1.username} won and gained 1 life!`;
        }
    }

    player1.lastChange = player1Change;
    player2.lastChange = player2Change;

    if (player1.lives <= 0) {
        winCondition = `${player2.username} wins the game! ${player1.username} ran out of lives!`;
    } else if (player2.lives <= 0) {
        winCondition = `${player1.username} wins the game! ${player2.username} ran out of lives!`;
    }
    
    return winCondition;
}

function handleRoundEnd(gameId, game) {
    const [player1, player2] = game.players;

    if (!player1.choice) player1.choice = 'forfeit';
    if (!player2.choice) player2.choice = 'forfeit';
    
    const result = determineWinner(player1.choice, player2.choice);
    const winCondition = updateLives(game, result);

    io.to(gameId).emit('roundResult', {
        players: game.players,
        choices: {
            [player1.id]: player1.choice,
            [player2.id]: player2.choice
        },
        result: result,
        lives: {
            [player1.id]: player1.lives,
            [player2.id]: player2.lives
        },
        winCondition: winCondition
    });

    if (player1.lives > 0 && player2.lives > 0) {
        // Wait 10 seconds to show results
        setTimeout(() => {
            // Reset choices for next round
            player1.choice = null;
            player2.choice = null;
            game.rounds++;
            
            // Clear any existing interval first
            if (game.timeoutId) {
                clearInterval(game.timeoutId);
                game.timeoutId = null;
            }
            
            // Emit new round event with round number
            io.to(gameId).emit('newRound', {
                roundNumber: game.rounds,
                message: `Round ${game.rounds} Starting!`,
                showTimer: false  // Don't show timer during padding
            });
            
            // Wait 5 seconds before starting the picking phase
            setTimeout(() => {
                // Announce picking phase
                io.to(gameId).emit('newRound', {
                    roundNumber: game.rounds,
                    message: `Picking Phase - Make Your Choice!`,
                    showTimer: true  // Show timer during picking phase
                });

                // Start server-side timer and send updates to clients
                let timeLeft = 10;
                game.timeoutId = setInterval(() => {
                    io.to(gameId).emit('timerUpdate', timeLeft);
                    timeLeft--;
                    
                    if (timeLeft < 0) {
                        clearInterval(game.timeoutId);
                        game.timeoutId = null;
                        handleRoundEnd(gameId, game);
                    }
                }, 1000);
            }, 5000); // 5-second padding before picking phase
            
        }, 10000); // Show results for 10 seconds
    }
}

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 