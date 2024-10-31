import { useState } from 'react';
import { Container, Button, Typography } from '@mui/material';
import GameBoard from './components/GameBoard';
import GameRules from './components/GameRules';

function App() {
  const [showRules, setShowRules] = useState(false);

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Super RPS
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setShowRules(!showRules)}
        sx={{ mb: 2 }}
      >
        {showRules ? 'Hide Rules' : 'Show Rules'}
      </Button>
      {showRules && <GameRules />}
      <GameBoard />
    </Container>
  );
}

export default App; 