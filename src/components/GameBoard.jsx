import { useState, useEffect } from 'react';
import { Button, Typography, Grid, Paper, Box, CircularProgress, Alert } from '@mui/material';
import { io } from 'socket.io-client';
import { ELEMENTS } from '../gameLogic';

function GameBoard({ username }) {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('waiting');
  const [players, setPlayers] = useState([]);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState('');
  const [playerLives, setPlayerLives] = useState(3);
  const [computerLives, setComputerLives] = useState(3);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [playerHealthChange, setPlayerHealthChange] = useState(null);
  const [computerHealthChange, setComputerHealthChange] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPickingPhase, setIsPickingPhase] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('joinGame', username);
    });

    newSocket.on('waitingForPlayer', () => {
      console.log('Waiting for opponent');
      setGameState('waiting');
    });

    newSocket.on('gameStart', (data) => {
      console.log('Game starting:', data);
      setPlayers(data.players);
      setGameState('playing');
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult('');
      setPlayerLives(3);
      setComputerLives(3);
      setTimeLeft(10);
    });

    newSocket.on('roundResult', (roundData) => {
      const opponent = roundData.players.find(p => p.id !== newSocket.id);
      if (opponent) {
        setPlayerChoice(roundData.choices[newSocket.id]);
        setComputerChoice(roundData.choices[opponent.id]);
        
        if (roundData.lives) {
          setPlayerLives(roundData.lives[newSocket.id]);
          setComputerLives(roundData.lives[opponent.id]);
          
          const currentPlayer = roundData.players.find(p => p.id === newSocket.id);
          const opponentPlayer = roundData.players.find(p => p.id !== newSocket.id);
          setPlayerHealthChange(currentPlayer.lastChange);
          setComputerHealthChange(opponentPlayer.lastChange);
        }

        let resultMessage = '';
        if (roundData.result.superEffective) {
          resultMessage = `SUPER EFFECTIVE! ${roundData.result.message}`;
        } else {
          resultMessage = roundData.result.message;
        }
        setResult(resultMessage);

        if (roundData.winCondition) {
          setAnnouncement(roundData.winCondition);
        }
      }
      setIsPickingPhase(false);
      setTimeLeft(null);
    });

    newSocket.on('playerLeft', () => {
      setGameState('waiting');
      setPlayers([]);
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult('Opponent left the game');
    });

    newSocket.on('newRound', (data) => {
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult('');
      setTimeLeft(data.showTimer ? 10 : null);
      setPlayerHealthChange(null);
      setComputerHealthChange(null);
      setAnnouncement(data.message);
      setIsPickingPhase(data.isPickingPhase);
    });

    newSocket.on('timerUpdate', (data) => {
      if (typeof data === 'object') {
        setTimeLeft(data.time);
        setIsPickingPhase(data.isPickingPhase);
      } else {
        setTimeLeft(data);
      }
    });

    newSocket.on('gameReset', () => {
      setGameState('waiting');
      setPlayers([]);
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult('');
      setPlayerLives(3);
      setComputerLives(3);
      setShowConfirmation(false);
      setPendingChoice(null);
      setPlayerHealthChange(null);
      setComputerHealthChange(null);
      setAnnouncement('');
      setTimeLeft(10);
    });

    newSocket.on('waitingForRematch', () => {
      setGameState('waiting');
      setAnnouncement('Waiting for opponent to choose rematch...');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [username]);

  const handleElementChoice = (element) => {
    setPendingChoice(element);
    setShowConfirmation(true);
    setAnnouncement('');
    setPlayerHealthChange(null);
    setComputerHealthChange(null);
  };

  const handleConfirmChoice = (confirmed) => {
    if (confirmed && socket) {
      socket.emit('makeChoice', pendingChoice);
      setPlayerChoice(pendingChoice);
    }
    setShowConfirmation(false);
    setPendingChoice(null);
  };

  if (gameState === 'waiting') {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress />
          <Typography>
            {announcement || 'Waiting for opponent...'}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      {announcement && (
        <Alert 
          severity={
            announcement.includes('SUPER EFFECTIVE') ? 'warning' :
            announcement.includes('wins the game') ? 'success' : 'info'
          }
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" component="div">
            {announcement}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography>
          Your Lives: {playerLives}
          {playerHealthChange && (
            <span style={{ 
              color: playerHealthChange > 0 ? 'green' : 'red',
              marginLeft: '8px'
            }}>
              {playerHealthChange > 0 ? '+' : ''}{playerHealthChange}
            </span>
          )}
        </Typography>
        <Typography>
          {players.length > 1 ? `${players.find(p => p.id !== socket?.id)?.username}'s Lives` : 'Computer Lives'}: {computerLives}
          {computerHealthChange && (
            <span style={{ 
              color: computerHealthChange > 0 ? 'green' : 'red',
              marginLeft: '8px'
            }}>
              {computerHealthChange > 0 ? '+' : ''}{computerHealthChange}
            </span>
          )}
        </Typography>
      </Box>

      {result && (
        <Alert 
          severity={result.includes('win') ? 'success' : result.includes('draw') ? 'info' : 'error'}
          sx={{ mb: 2 }}
        >
          {result}
        </Alert>
      )}

      {gameState === 'playing' && timeLeft !== null && isPickingPhase && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" color={timeLeft <= 3 ? 'error' : 'inherit'}>
            Time remaining: {timeLeft}s
          </Typography>
        </Box>
      )}

      {showConfirmation ? (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h6">
            Are you sure you want to choose {pendingChoice}?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleConfirmChoice(true)}
              sx={{ mr: 2 }}
            >
              Confirm
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleConfirmChoice(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Grid container spacing={2} justifyContent="center">
          {ELEMENTS.map((element) => (
            <Grid item key={element}>
              <Button 
                variant={playerChoice === element ? "contained" : "outlined"}
                onClick={() => handleElementChoice(element)}
                disabled={
                  Boolean(playerChoice) || 
                  playerLives <= 0 || 
                  computerLives <= 0 || 
                  !isPickingPhase
                }
                sx={{ minWidth: 100 }}
              >
                {element}
              </Button>
            </Grid>
          ))}
        </Grid>
      )}

      {playerChoice && computerChoice && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography>Your choice: {playerChoice}</Typography>
          <Typography>
            {players.length > 1 ? "Opponent's" : "Computer's"} choice: {computerChoice}
          </Typography>
        </Box>
      )}

      {(playerLives <= 0 || computerLives <= 0) && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="h4">
            {playerLives <= 0 ? 'You Lost!' : 'You Won!'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              if (socket) {
                setGameState('waiting');
                setPlayers([]);
                setPlayerChoice(null);
                setComputerChoice(null);
                setResult('');
                setPlayerLives(3);
                setComputerLives(3);
                setShowConfirmation(false);
                setPendingChoice(null);
                setPlayerHealthChange(null);
                setComputerHealthChange(null);
                setAnnouncement('');
                setTimeLeft(10);
                
                socket.emit('resetGame', username);
              }
            }}
            sx={{ mt: 2 }}
          >
            Play Again
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default GameBoard;