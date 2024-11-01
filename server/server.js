const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
// Add this at the top of server.js
const { WINNING_COMBINATIONS, SUPER_WEAKNESSES, ELEMENTS } = require('../src/gameLogic.js');


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
        
        // Add player to game with initial lives
        game.players.push({
            id: socket.id,
            username: username,
            ready: false,
            choice: null,
            lives: 3  // Initialize lives
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
        const game = games.get(socket.gameId);
        if (!game) return;

        // Find the current player and set their choice
        const currentPlayer = game.players.find(p => p.id === socket.id);
        if (currentPlayer) {
            currentPlayer.choice = choice;
        }

        // Check if both players have made their choices
        const [player1, player2] = game.players;
        if (player1.choice && player2.choice) {
            const result = determineWinner(player1.choice, player2.choice);
            
            // Update lives based on the result
            updateLives(game, {
                winner: result.winner === 'player1' ? player1.id : player2.id,
                isSuperWeakness: result.isSuperWeakness
            });

            // Emit the updated game state including new lives
            io.to(socket.gameId).emit('gameUpdate', {
                players: game.players,
                lives: {
                    [player1.id]: player1.lives,
                    [player2.id]: player2.lives
                }
            });
            
            io.to(socket.gameId).emit('roundResult', {
                player1Choice: player1.choice,
                player2Choice: player2.choice,
                winner: result.winner,
                isSuperWeakness: result.isSuperWeakness
            });

            setTimeout(() => {
                player1.choice = null;
                player2.choice = null;
                io.to(socket.gameId).emit('resetRound');
            }, 180000);
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

function determineWinner(player1Choice, player2Choice) {
    if (player1Choice === player2Choice) {
        return { winner: 'draw', isSuperWeakness: false };
    }
    
    if (SUPER_WEAKNESSES[player1Choice] === player2Choice) {
        return { winner: 'player2', isSuperWeakness: true };
    }
    
    if (SUPER_WEAKNESSES[player2Choice] === player1Choice) {
        return { winner: 'player1', isSuperWeakness: true };
    }
    
    if (WINNING_COMBINATIONS[player1Choice].includes(player2Choice)) {
        return { winner: 'player1', isSuperWeakness: false };
    }
    
    return { winner: 'player2', isSuperWeakness: false };
}

function updateLives(game, result) {
    const [player1, player2] = game.players;
    const { winner, isSuperWeakness } = result;

    // Initialize lives if they don't exist
    if (player1.lives === undefined) player1.lives = 3;
    if (player2.lives === undefined) player2.lives = 3;

    // No life changes on draw
    if (winner === 'draw') return;

    // Base damage is 1, additional +1 for super weakness
    const damage = isSuperWeakness ? 2 : 1;

    if (winner === player1.id) {
        player2.lives -= damage;  // Damage to loser
        player1.lives = Math.min(player1.lives + 1, 3);  // Add life to winner, cap at 3
    } else if (winner === player2.id) {
        player1.lives -= damage;  // Damage to loser
        player2.lives = Math.min(player2.lives + 1, 3);  // Add life to winner, cap at 3
    }
}


// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 