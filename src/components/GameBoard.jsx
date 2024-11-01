import { useState, useEffect } from 'react';
import { Button, Typography, Grid, Paper, Box, CircularProgress } from '@mui/material';
import { io } from 'socket.io-client';
import { ELEMENTS, WINNING_COMBINATIONS, SUPER_WEAKNESSES } from '../gameLogic';

function GameBoard({ username }) {
  
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('connecting');
  const [players, setPlayers] = useState([]);
  const [playerStatuses, setPlayerStatuses] = useState({});

  
  const [playerLives, setPlayerLives] = useState(3);
  const [computerLives, setComputerLives] = useState(3);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState('');
  const [rounds, setRounds] = useState(0);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChoice, setPendingChoice] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5001');

    const handleRoundResultInEffect = (roundData) => {
      const opponent = roundData.players.find(p => p.id !== newSocket.id);
      if (opponent) {
        setPlayerChoice(roundData.choices[newSocket.id]);
        setComputerChoice(roundData.choices[opponent.id]);
        
        if (roundData.lives) {
          setPlayerLives(roundData.lives[newSocket.id]);
          setComputerLives(roundData.lives[opponent.id]);
        }

        switch(roundData.result) {
          case 'win':
            setResult('You win! +1 life');
            break;
          case 'superwin':
            setResult('Super win! +1 life, opponent -2 lives');
            break;
          case 'loss':
            setResult('You lose! -1 life');
            break;
          case 'superloss':
            setResult('Super loss! -2 lives');
            break;
          case 'draw':
            setResult("It's a draw!");
            break;
          default:
            setResult('Unknown result');
            break;
        }

        setTimeout(() => {
          setPlayerChoice(null);
          setComputerChoice(null);
          setResult('');
        }, 2000);
      }
    };

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
      setRounds(0);
      
      setPlayerLives(3);
      setComputerLives(3);
    });

    newSocket.on('playerStatus', ({ playerId, ready }) => {
      console.log('Player status update:', playerId, ready);
      setPlayerStatuses(prev => ({ ...prev, [playerId]: ready }));
    });

    newSocket.on('gameUpdate', ({ players: updatedPlayers, lives }) => {
      if (updatedPlayers) setPlayers(updatedPlayers);
      if (lives) {
        const opponent = updatedPlayers.find(p => p.id !== newSocket.id);
        if (opponent) {
          setPlayerLives(lives[newSocket.id]);
          setComputerLives(lives[opponent.id]);
        }
      }
    });

    newSocket.on('roundResult', handleRoundResultInEffect);

    newSocket.on('playerLeft', () => {
      setGameState('waiting');
      setPlayers([]);
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult('Opponent left the game');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [username]);

  const handleElementChoice = (element) => {
    setPendingChoice(element);
    setShowConfirmation(true);
  };

  const handleConfirmChoice = (confirmed) => {
    if (confirmed && gameState === 'playing' && socket) {
      socket.emit('makeChoice', pendingChoice);
      setPlayerChoice(pendingChoice);
    } else if (confirmed) {
      const computerElement = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      setPlayerChoice(pendingChoice);
      setComputerChoice(computerElement);
      
      const outcome = determineWinner(pendingChoice, computerElement);
      updateLives(outcome);
      handleNextRound();
    }
    
    setShowConfirmation(false);
    setPendingChoice(null);
  };

  
  const determineWinner = (player1Choice, player2Choice) => {
    if (player1Choice === player2Choice) {
      return 'draw';
    }
    
    if (SUPER_WEAKNESSES[player1Choice] === player2Choice) {
      return 'player2'; 
    }
    
    if (SUPER_WEAKNESSES[player2Choice] === player1Choice) {
      return 'player1'; 
    }
    
    if (WINNING_COMBINATIONS[player1Choice].includes(player2Choice)) {
      return 'player1';
    }
    
    return 'player2';
  };

  const updateLives = (outcome) => {
    switch (outcome) {
      case 'win':
        setPlayerLives(prev => prev + 1);
        setComputerLives(prev => prev - 1);
        setResult('You win! +1 life');
        break;
      case 'superwin':
        setPlayerLives(prev => prev + 1);
        setComputerLives(prev => prev - 2);
        setResult('Super win! +1 life, opponent -2 lives');
        break;
      case 'loss':
        setPlayerLives(prev => prev - 1);
        setComputerLives(prev => prev + 1);
        setResult('You lose! -1 life');
        break;
      case 'superloss':
        setPlayerLives(prev => prev - 2);
        setComputerLives(prev => prev + 1);
        setResult('Super loss! -2 lives');
        break;
      default:
        setResult("It's a draw!");
    }
  };

  const handleNextRound = () => {
    setRounds(prev => prev + 1);
  };

  const handleRestart = () => {
    if (gameState === 'playing' && socket) {
      
      socket.emit('joinGame', username);
    } else {
      
      setRounds(0);
      setPlayerLives(3);
      setComputerLives(3);
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult('');
    }
  };

  
  if (gameState === 'connecting' || gameState === 'waiting') {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress />
          <Typography>
            {gameState === 'connecting' ? 'Connecting to server...' : 'Waiting for opponent...'}
          </Typography>
          {gameState === 'waiting' && (
            <Button 
              variant="contained"
              onClick={() => setGameState('playing')}
            >
              Play Single Player
            </Button>
          )}
          {gameState === 'waiting' && players.map(player => (
            <Typography key={player.id}>
              {player.username}: {playerStatuses[player.id] ? 'Ready' : 'Not Ready'}
            </Typography>
          ))}
        </Box>
      </Paper>
    );
  }

  
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>Lives</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
        <Typography>Your Lives: {playerLives}</Typography>
        <Typography>
          {players.length > 1 ? `${players.find(p => p.id !== socket?.id)?.username}'s Lives` : 'Computer Lives'}: {computerLives}
        </Typography>
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Round: {rounds}
      </Typography>

      {showConfirmation && (
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
      )}

      <Grid container spacing={2} justifyContent="center">
        {ELEMENTS.map((element) => (
          <Grid item key={element}>
            <Button 
              variant={playerChoice === element ? "contained" : "outlined"}
              onClick={() => handleElementChoice(element)}
              disabled={Boolean(
                playerLives <= 0 || 
                computerLives <= 0 || 
                (gameState === 'playing' && playerChoice) ||
                showConfirmation
              )}
              sx={{ minWidth: 100 }}
            >
              {element}
            </Button>
          </Grid>
        ))}
      </Grid>

      {playerChoice && (computerChoice || gameState === 'playing') && (
        <Box sx={{ mt: 3 }}>
          <Typography>Your choice: {playerChoice}</Typography>
          {computerChoice && (
            <Typography>
              {players.length > 1 ? "Opponent's" : "Computer's"} choice: {computerChoice}
            </Typography>
          )}
          <Typography variant="h6" sx={{ mt: 1 }}>{result}</Typography>
        </Box>
      )}

      {(playerLives <= 0 || computerLives <= 0) && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4">Game Over!</Typography>
          <Typography>
            {playerLives <= 0 ? 
              (players.length > 1 ? `${players.find(p => p.id !== socket?.id)?.username} Wins!` : 'Computer Wins!') : 
              'You Win!'}
          </Typography>
        </Box>
      )}

      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleRestart}
        sx={{ mt: 2 }}
      >
        {players.length > 1 ? 'Play Again' : 'Restart'}
      </Button>
    </Paper>
  );
}

export default GameBoard;