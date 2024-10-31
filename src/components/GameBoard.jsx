import { useState } from 'react';
import { Button, Typography, Grid, Paper, Box } from '@mui/material';
import { ELEMENTS, WINNING_COMBINATIONS, SUPER_WEAKNESSES } from '../gameLogic';

function GameBoard() {
  const [playerLives, setPlayerLives] = useState(3);
  const [computerLives, setComputerLives] = useState(3);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState('');
  const [rounds, setRounds] = useState(0);

  const handleElementChoice = (element) => {
    const computerElement = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    setPlayerChoice(element);
    setComputerChoice(computerElement);
    
    const outcome = determineWinner(element, computerElement);
    updateLives(outcome);
    handleNextRound();
  };

  const determineWinner = (player, computer) => {
    if (player === computer) return 'draw';
    
    const isSuperWeakness = SUPER_WEAKNESSES[computer] === player;
    const playerWins = WINNING_COMBINATIONS[player].includes(computer);
    
    if (playerWins) return isSuperWeakness ? 'superwin' : 'win';
    return SUPER_WEAKNESSES[player] === computer ? 'superloss' : 'loss';
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
    setRounds(0);
    // Reset other game state here
    window.location.reload();
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>Lives</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
        <Typography>Your Lives: {playerLives}</Typography>
        <Typography>Computer Lives: {computerLives}</Typography>
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Round: {rounds}
      </Typography>

      <Grid container spacing={2} justifyContent="center">
        {ELEMENTS.map((element) => (
          <Grid item key={element}>
            <Button 
              variant="outlined" 
              onClick={() => handleElementChoice(element)}
              disabled={playerLives <= 0 || computerLives <= 0}
              sx={{ minWidth: 100 }}
            >
              {element}
            </Button>
          </Grid>
        ))}
      </Grid>

      {playerChoice && computerChoice && (
        <Box sx={{ mt: 3 }}>
          <Typography>Your choice: {playerChoice}</Typography>
          <Typography>Computer's choice: {computerChoice}</Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>{result}</Typography>
        </Box>
      )}

      {(playerLives <= 0 || computerLives <= 0) && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4">Game Over!</Typography>
          <Typography>{playerLives <= 0 ? 'Computer Wins!' : 'You Win!'}</Typography>
        </Box>
      )}

      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleRestart}
        sx={{ mt: 2 }}
      >
        Restart
      </Button>
    </Paper>
  );
}

export default GameBoard;