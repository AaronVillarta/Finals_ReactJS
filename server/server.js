const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Express app setup
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = 5001;

// Store active games
const games = new Map();

// Express routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Rock Paper Scissors API' });
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/login', (req, res) => {
    console.log('Login attempt received:', req.body);
    
    const { username } = req.body;
    
    // Basic validation
    if (!username) {
        return res.status(400).json({ 
            error: 'Username is required' 
        });
    }

    // For testing purposes - accept any login
    return res.status(200).json({
        success: true,
        user: {
            id: Date.now(),
            username: username
        }
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle joining game
    socket.on('joinGame', (username) => {
        console.log(`${username} (${socket.id}) joining game`);
        
        // Find an available game or create new one
        let gameId = findAvailableGame() || createNewGame();
        let game = games.get(gameId);
        
        // Add player to game
        game.players.push({
            id: socket.id,
            username: username,
            ready: false,
            choice: null
        });

        // Join socket room
        socket.join(gameId);
        socket.gameId = gameId;

        // If game is full, start it
        if (game.players.length === 2) {
            io.to(gameId).emit('gameStart', {
                players: game.players.map(p => ({
                    id: p.id,
                    username: p.username
                }))
            });
        } else {
            socket.emit('waitingForPlayer');
        }

        console.log(`Game ${gameId} status:`, game.players.length === 2 ? 'starting' : 'waiting');
    });

    // Handle player choice
    socket.on('makeChoice', (choice) => {
        console.log(`Player ${socket.id} chose ${choice}`);
        
        for (const [gameId, game] of games.entries()) {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                // Update the player's choice
                player.choice = choice;
                
                // Only proceed if there are 2 players
                if (game.players.length === 2) {
                    const [player1, player2] = game.players;
                    
                    // Debug log to see actual choices
                    console.log('Current choices:', {
                        [player1.username]: player1.choice,
                        [player2.username]: player2.choice
                    });

                    const allPlayersChosen = game.players.every(p => p.choice);
                    console.log('All players chosen:', allPlayersChosen);
                    
                    if (allPlayersChosen) {
                        const result = determineWinner(player1.choice, player2.choice);
                        updateLives(game, result);

                        // Emit the round result immediately when both players have chosen
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
                            }
                        });

                        // Reset choices for next round
                        player1.choice = null;
                        player2.choice = null;
                        game.rounds++;
                    }
                }
                break;
            }
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (game) {
                // Remove player from game
                game.players = game.players.filter(p => p.id !== socket.id);
                // Notify other player
                io.to(socket.gameId).emit('playerLeft');
                // Clean up empty game
                if (game.players.length === 0) {
                    games.delete(socket.gameId);
                }
            }
        }
    });
});

// Helper functions
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
        status: 'waiting'
    });
    return gameId;
}

function determineWinner(choice1, choice2) {
    if (choice1 === choice2) {
        return 'draw';
    }
    return WINNING_COMBINATIONS[choice1].includes(choice2) ? 'player1' : 'player2';
}

function updateLives(game, result) {
    const [player1, player2] = game.players;
    
    // Initialize lives if they don't exist
    if (player1.lives === undefined) player1.lives = 3;
    if (player2.lives === undefined) player2.lives = 3;
    
    // Update lives based on result
    if (result === player2.id) {
        player1.lives--;
    } else if (result === player1.id) {
        player2.lives--;
    }
    // No lives are deducted on a draw
}

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 