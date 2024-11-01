import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Grid, Paper } from '@mui/material';
import { io } from 'socket.io-client';
import { ELEMENTS } from '../gameLogic';

const Game = ({ username }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('connecting');
  const [players, setPlayers] = useState([]);
  const [myChoice, setMyChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [lives, setLives] = useState({});
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('joinGame', username);
    });

    newSocket.on('waitingForPlayer', () => {
      console.log('Waiting for opponent');
      setGameState('waiting');
    });

    newSocket.on('gameStart', ({ players }) => {
      console.log('Game starting with players:', players);
      setPlayers(players);
      setGameState('playing');
      setMyChoice(null);
      setResult(null);
      const initialLives = {};
      players.forEach(p => initialLives[p.id] = 3);
      setLives(initialLives);
      setRounds(0);
    });

    newSocket.on('gameUpdate', (data) => {
      console.log('Game update:', data);
      if (data.players) setPlayers(data.players);
      if (data.lives) setLives(data.lives);
      if (typeof data.rounds === 'number') setRounds(data.rounds);
    });

    newSocket.on('gameResult', (data) => {
      console.log('Game result:', data);
      setResult(data);
      setGameState(data.gameOver ? 'gameOver' : 'playing');
      setMyChoice(null);
    });

    newSocket.on('playerLeft', () => {
      setGameState('waiting');
      setPlayers([]);
      setMyChoice(null);
      setResult(null);
      setLives({});
      setRounds(0);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [username]);

  const makeChoice = (choice) => {
    if (socket && gameState === 'playing' && !myChoice) {
      console.log('Making choice:', choice);
      socket.emit('makeChoice', choice);
      setMyChoice(choice);
    }
  };

  const getOpponent = () => {
    if (!socket?.id || !players.length) return null;
    return players.find(p => p.id !== socket.id);
  };

  const renderGameContent = () => {
    const opponent = getOpponent();
    const myId = socket?.id;

    if (!myId) {
      return (
        <Typography>Connecting to server...</Typography>
      );
    }

    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
        <Typography variant="h5">Round {rounds + 1}</Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', mb: 2 }}>
          <Typography>
            Your Lives: {lives[myId] ?? 3}
          </Typography>
          <Typography>
            Opponent Lives: {opponent ? (lives[opponent.id] ?? 3) : '?'}
          </Typography>
        </Box>

        <Grid container spacing={2} justifyContent="center">
          {ELEMENTS.map((element) => (
            <Grid item key={element}>
              <Button
                variant={myChoice === element ? "contained" : "outlined"}
                onClick={() => makeChoice(element)}
                disabled={myChoice !== null || gameState !== 'playing'}
                sx={{ minWidth: 120, height: 80 }}
              >
                {element}
              </Button>
            </Grid>
          ))}
        </Grid>

        {result && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">{result.message}</Typography>
            {result.choices && (
              <>
                <Typography>
                  Your choice: {result.choices[myId] || '?'}
                </Typography>
                {opponent && (
                  <Typography>
                    Opponent's choice: {result.choices[opponent.id] || '?'}
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderGame = () => {
    switch (gameState) {
      case 'connecting':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress />
            <Typography>Connecting to server...</Typography>
          </Box>
        );

      case 'waiting':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress />
            <Typography>Waiting for opponent...</Typography>
          </Box>
        );

      case 'playing':
        return renderGameContent();

      case 'gameOver':
        const myId = socket?.id;
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
            <Typography variant="h4">Game Over!</Typography>
            {myId && (
              <Typography variant="h5">
                {lives[myId] <= 0 ? 'You Lost!' : 'You Won!'}
              </Typography>
            )}
            <Button 
              variant="contained"
              onClick={() => {
                if (socket) {
                  socket.emit('joinGame', username);
                }
              }}
            >
              Play Again
            </Button>
          </Box>
        );

      default:
        return <Typography>Unknown state: {gameState}</Typography>;
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      textAlign: 'center', 
      mt: 4,
      p: 4,
      maxWidth: 800,
      mx: 'auto',
      backgroundColor: 'background.paper'
    }}>
      {renderGame()}
    </Paper>
  );
};

export default Game;