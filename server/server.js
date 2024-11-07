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


const ALLOWED_ORIGINS = [
    'http://localhost:3000',  
    'http://localhost:3001',  
    'http://localhost:5001'
];

app.use(cors({
    origin: function(origin, callback) {
  
        if (!origin) return callback(null, true);
        
        if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
}));


app.use(express.json());

const io = new Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true
    }
});

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5001;


const games = new Map();
const playAgainPlayers = new Set();
const activeUsers = new Set(); 

const dbPath = path.join(__dirname, 'database', 'game.db');

if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}


const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        console.log('Database location:', dbPath);
        createTables();
    }
});


function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            wins INTEGER DEFAULT 0,
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

app.get('/test/wins', (req, res) => {
    db.all('SELECT username, wins FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error fetching wins:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ users: rows });
    });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        
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


app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user is already logged in
    if (activeUsers.has(username)) {
        return res.status(400).json({ error: 'User already logged in' });
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

                
                activeUsers.add(username);

                const token = jwt.sign(
                    { userId: user.id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                console.log('User logged in successfully:', username);
                console.log('Active users:', Array.from(activeUsers));

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


app.post('/logout', (req, res) => {
    const { username } = req.body;
    if (username) {
        activeUsers.delete(username);
        console.log(`User logged out: ${username}`);
        console.log('Active users:', Array.from(activeUsers));
    }
    res.json({ message: 'Logged out successfully' });
});


const userSockets = new Map(); // Track username to socket mapping

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('joinHub', (username) => {
        console.log(`${username} joining hub with socket ${socket.id}`);
        socket.username = username;
        userSockets.set(username, socket);
        activeUsers.add(username);
        
        io.emit('updateOnlineUsers', Array.from(activeUsers));
        
        // Fetch and send wins data
        db.all(`SELECT username, wins FROM users`, [], (err, rows) => {
            if (err) {
                console.error('Error fetching wins:', err);
            } else {
                const winsData = {};
                rows.forEach(row => {
                    winsData[row.username] = row.wins;
                });
                io.emit('syncWins', winsData);
            }
        });
    });

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
            game.rounds = 1;
            
            io.to(gameId).emit('gameStart', {
                players: game.players.map(p => ({
                    id: p.id,
                    username: p.username
                })),
                message: 'Game Starting!',
                roundNumber: 1
            });

            io.to(gameId).emit('newRound', {
                roundNumber: 1,
                message: `Round 1 Starting!`,
                showTimer: false,
                isPickingPhase: false
            });

            setTimeout(() => {
                io.to(gameId).emit('newRound', {
                    roundNumber: 1,
                    message: `Picking Phase - Make Your Choice!`,
                    showTimer: true,
                    isPickingPhase: true
                });

                let timeLeft = 10;
                game.timeoutId = setInterval(() => {
                    io.to(gameId).emit('timerUpdate', {
                        time: timeLeft,
                        isPickingPhase: true
                    });
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
        if (socket.username) {
            console.log(`${socket.username} disconnected`);
            userSockets.delete(socket.username);
            activeUsers.delete(socket.username);
            io.emit('updateOnlineUsers', Array.from(activeUsers));
        }
    });

    socket.on('resetGame', (username) => {
        console.log(`${username} requesting game reset`);
        
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
                    game.rounds = 1;

                    playAgainPlayers.clear();

                    
                    io.to(socket.gameId).emit('gameStart', {
                        players: game.players.map(p => ({
                            id: p.id,
                            username: p.username
                        })),
                        message: 'Game Starting!',
                        roundNumber: 1
                    });

                    
                    io.to(socket.gameId).emit('newRound', {
                        roundNumber: 1,
                        message: `Round 1 Starting!`,
                        showTimer: false,
                        isPickingPhase: false
                    });

                    
                    setTimeout(() => {
                        io.to(socket.gameId).emit('newRound', {
                            roundNumber: 1,
                            message: `Picking Phase - Make Your Choice!`,
                            showTimer: true,
                            isPickingPhase: true
                        });

                        let timeLeft = 10;
                        game.timeoutId = setInterval(() => {
                            io.to(socket.gameId).emit('timerUpdate', {
                                time: timeLeft,
                                isPickingPhase: true
                            });
                            timeLeft--;
                            
                            if (timeLeft < 0) {
                                clearInterval(game.timeoutId);
                                game.timeoutId = null;
                                handleRoundEnd(socket.gameId, game);
                            }
                        }, 1000);
                    }, 5000);
                } else {
                    socket.emit('waitingForRematch');
                }
            }
        }
    });

    socket.on('challengePlayer', ({ challenger, opponent }) => {
        console.log(`Challenge request: ${challenger} -> ${opponent}`);
        const opponentSocket = userSockets.get(opponent);
        
        if (opponentSocket) {
            console.log(`Found opponent socket ${opponentSocket.id}, sending challenge`);
            opponentSocket.emit('receiveChallenge', challenger);
        } else {
            console.log(`Opponent socket not found for ${opponent}`);
            // Notify challenger that opponent is not available
            socket.emit('challengeError', 'Opponent is not available');
        }
    });

    socket.on('acceptChallenge', ({ challenger, opponent }) => {
        console.log(`Challenge accepted: ${challenger} <- ${opponent}`);
        const challengerSocket = userSockets.get(challenger);
        const opponentSocket = userSockets.get(opponent);

        if (challengerSocket && opponentSocket) {
            // Create game and handle game start
            const gameId = findAvailableGame() || createNewGame();
            const game = games.get(gameId);

            challengerSocket.join(gameId);
            opponentSocket.join(gameId);
            
            challengerSocket.gameId = gameId;
            opponentSocket.gameId = gameId;

            game.players = [
                { id: challengerSocket.id, username: challenger, ready: false, choice: null, lives: 3 },
                { id: opponentSocket.id, username: opponent, ready: false, choice: null, lives: 3 }
            ];

            io.to(gameId).emit('gameStart', {
                players: game.players.map(p => ({
                    id: p.id,
                    username: p.username
                })),
                message: 'Game Starting!',
                roundNumber: 1
            });
        }
    });

    socket.on('leaveGame', () => {
        const gameId = socket.gameId;
        if (gameId) {
            const game = games.get(gameId);
            if (game) {
                const opponent = game.players.find(p => p.id !== socket.id);
                if (opponent) {
                    io.to(opponent.id).emit('opponentLeft', socket.username);
                    io.to(opponent.id).emit('leaveGame');
                }
                game.players = game.players.filter(p => p.id !== socket.id);
                if (game.players.length === 0) {
                    games.delete(gameId);
                }
            }
            socket.leave(gameId);
            delete socket.gameId;
        }
    });

    socket.on('requestWinsUpdate', () => {
        db.all(`SELECT username, wins FROM users`, [], (err, rows) => {
            if (err) {
                console.error('Error fetching all wins:', err);
            } else {
                const winsData = {};
                rows.forEach(row => {
                    winsData[row.username] = row.wins;
                });
                socket.emit('syncWins', winsData);
            }
        });
    });

    socket.on('logout', (username) => {
        console.log(`User logging out: ${username}`);
        userSockets.delete(username);
        activeUsers.delete(username);
        io.emit('updateOnlineUsers', Array.from(activeUsers));
        socket.disconnect(true);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            console.log(`User disconnected: ${socket.username}`);
            activeUsers.delete(socket.username);
            io.emit('updateOnlineUsers', Array.from(activeUsers));
        }
    });

    socket.on('joinGame', (username) => {
        socket.username = username;
        // Store the game ID if player is in a game
        const game = Array.from(games.values()).find(g => 
            g.players.some(p => p.username === username)
        );
        if (game) {
            socket.gameId = game.id;
        }
    });

    socket.on('disconnect', () => {
        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (game) {
                // Find the opponent
                const opponent = game.players.find(p => p.username !== socket.username);
                if (opponent) {
                    // Notify opponent about disconnection
                    const opponentSocket = Array.from(io.sockets.sockets.values())
                        .find(s => s.username === opponent.username);
                    
                    if (opponentSocket) {
                        opponentSocket.emit('opponentDisconnected', {
                            username: socket.username,
                            message: 'Your opponent has disconnected from the game.'
                        });
                    }
                }
                // Clean up the game
                games.delete(socket.gameId);
            }
        }
        // ... existing disconnect logic ...
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
    const MAX_LIVES = 10;  
    
    if (player1.lives === undefined) player1.lives = 3;
    if (player2.lives === undefined) player2.lives = 3;
    
    let player1Change = 0;
    let player2Change = 0;
    let winCondition = '';
    let gameWinner = null;
    
    if (result.result === 'player2') {
        if (result.superEffective) {
            player1Change = -2;
            player1.lives = Math.max(0, player1.lives - 2);
            winCondition = `${player2.username} dealt SUPER EFFECTIVE damage!`;
        } else {
            player1Change = -1;
            player2Change = +1;
            player1.lives = Math.max(0, player1.lives - 1);
            
            player2.lives = Math.min(MAX_LIVES, player2.lives + 1);
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
            
            player1.lives = Math.min(MAX_LIVES, player1.lives + 1);
            winCondition = `${player1.username} won and gained 1 life!`;
        }
    }

    
    player1.lives = Math.max(0, Math.min(MAX_LIVES, player1.lives));
    player2.lives = Math.max(0, Math.min(MAX_LIVES, player2.lives));

    player1.lastChange = player1Change;
    player2.lastChange = player2Change;

    if (player1.lives <= 0) {
        winCondition = `${player2.username} wins the game! ${player1.username} ran out of lives!`;
        gameWinner = player2.username;
    } else if (player2.lives <= 0) {
        winCondition = `${player1.username} wins the game! ${player2.username} ran out of lives!`;
        gameWinner = player1.username;
    }

    if (gameWinner) {
        updatePlayerWins(gameWinner);
    }
    
    return winCondition;
}

function updatePlayerWins(username) {
    db.run(`UPDATE users SET wins = wins + 1 WHERE username = ?`, [username], (err) => {
        if (err) {
            console.error('Error updating wins:', err);
        } else {
            console.log(`Updated wins for ${username}`);
            db.all(`SELECT username, wins FROM users`, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching all wins:', err);
                } else {
                    const winsData = {};
                    rows.forEach(row => {
                        winsData[row.username] = row.wins;
                    });
                    io.emit('syncWins', winsData);
                }
            });
        }
    });
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
        winCondition: winCondition,
        isPickingPhase: false
    });

    if (player1.lives > 0 && player2.lives > 0) {
        setTimeout(() => {
            player1.choice = null;
            player2.choice = null;
            game.rounds++;
            
            if (game.timeoutId) {
                clearInterval(game.timeoutId);
                game.timeoutId = null;
            }
            
            io.to(gameId).emit('newRound', {
                roundNumber: game.rounds,
                message: `Round ${game.rounds} Starting!`,
                showTimer: false,
                isPickingPhase: false
            });
            
            setTimeout(() => {
                io.to(gameId).emit('newRound', {
                    roundNumber: game.rounds,
                    message: `Picking Phase - Make Your Choice!`,
                    showTimer: true,
                    isPickingPhase: true
                });

                let timeLeft = 10;
                game.timeoutId = setInterval(() => {
                    io.to(gameId).emit('timerUpdate', {
                        time: timeLeft,
                        isPickingPhase: true
                    });
                    timeLeft--;
                    
                    if (timeLeft < 0) {
                        clearInterval(game.timeoutId);
                        game.timeoutId = null;
                        handleRoundEnd(gameId, game);
                    }
                }, 1000);
            }, 5000);
        }, 5000);
    }
}


httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- POST /register');
    console.log('- POST /login');
    console.log('- GET /test');
    console.log('- GET /test/wins');
    console.log('- GET /test/users');
}); 

app.get('/verify-token', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}); 