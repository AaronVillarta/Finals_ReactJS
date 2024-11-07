require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { determineWinner } = require('../src/gameLogic.js');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
}));

// Important: This needs to be before any routes
app.use(express.json());

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5001;

// In-memory storage
const games = new Map();
const users = new Map();
const playAgainPlayers = new Set();

// Update the database path to be relative to the server directory
const dbPath = path.join(__dirname, 'database', 'game.db');

// Create database directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}

// Update database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        console.log('Database location:', dbPath);
        createTables();
    }
});

// Update createTables function to log when tables are created
function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating tables:', err);
        } else {
            console.log('Database tables created/verified successfully');
        }
    });
}

// API Routes
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.get('/test/users', (req, res) => {
    db.all('SELECT id, username, created_at FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ users: rows });
    });
});

// Registration endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check for existing user
        db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
            if (err) {
                console.error('Database error during registration:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (row) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                
                db.run(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    function(err) {
                        if (err) {
                            console.error('Error inserting new user:', err);
                            return res.status(500).json({ error: 'Error creating user' });
                        }
                        
                        console.log('New user registered:', username, 'with ID:', this.lastID);
                        res.status(201).json({ 
                            message: 'User created successfully',
                            userId: this.lastID 
                        });
                    }
                );
            } catch (hashError) {
                console.error('Password hashing error:', hashError);
                res.status(500).json({ error: 'Error processing password' });
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, user) => {
            if (err) {
                console.error('Database error during login:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            try {
                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                const token = jwt.sign(
                    { userId: user.id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                console.log('User logged in successfully:', username);
                res.json({
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.id,
                        username: user.username
                    }
                });
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: 'Server error' });
            }
        }
    );
});

// Socket.IO logic
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

            game.rounds = 0;
            io.to(gameId).emit('newRound', {
                roundNumber: 1,
                message: 'Round 1 Starting!',
                showTimer: false
            });

            setTimeout(() => {
                io.to(gameId).emit('newRound', {
                    roundNumber: 1,
                    message: 'Picking Phase - Make Your Choice!',
                    showTimer: true
                });

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
            }, 5000);
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

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- POST /register');
    console.log('- POST /login');
    console.log('- GET /test');
}); 