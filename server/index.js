const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const socketIO = require('socket.io');


const { WINNING_COMBINATIONS, SUPER_WEAKNESSES } = require('../src/gameLogic');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key'; 


app.use(cors());
app.use(express.json());


const db = new sqlite3.Database('game.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    createTables();
  }
});


function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}


app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      
      const hashedPassword = await bcrypt.hash(password, 10);

      
      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error creating user' });
          }
          res.status(201).json({ message: 'User created successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
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

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    }
  );
});

const playerChoices = {};
const playerReadyStatus = {};

const io = socketIO(app.listen(PORT));


function getPlayersInRoom(room) {
  const roomSockets = io.sockets.adapter.rooms.get(room);
  return roomSockets ? Array.from(roomSockets) : [];
}

io.on('connection', (socket) => {
  socket.on('makeChoice', ({ choice }) => {
    playerChoices[socket.id] = choice;
    console.log('Player made choice:', socket.id, choice);
    
    const room = [...socket.rooms][1]; 
    const playersInRoom = getPlayersInRoom(room);
    
    
    const allPlayersChosen = playersInRoom.every(playerId => playerChoices[playerId]);
    
    if (allPlayersChosen) {
      
      const result = calculateRoundResult(playerChoices, playersInRoom);
      
      
      io.to(room).emit('roundResult', {
        choices: playerChoices,
        result: result
      });
      
      
      playersInRoom.forEach(playerId => {
        playerChoices[playerId] = null;
      });
    }
  });

  socket.on('readyForNextRound', () => {
    playerReadyStatus[socket.id] = true;
    const room = [...socket.rooms][1];
    const playersInRoom = getPlayersInRoom(room);
    
    const allPlayersReady = playersInRoom.every(playerId => playerReadyStatus[playerId]);
    
    if (allPlayersReady) {
      
      io.to(room).emit('readyForNextRound');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function calculateRoundResult(choices, players) {
  const p1 = choices[players[0]];
  const p2 = choices[players[1]];
  
  if (p1 === p2) return 'tie';
  if (SUPER_WEAKNESSES[p1] === p2) return players[1];
  if (SUPER_WEAKNESSES[p2] === p1) return players[0];
  if (WINNING_COMBINATIONS[p1].includes(p2)) return players[0];
  return players[1];
} 