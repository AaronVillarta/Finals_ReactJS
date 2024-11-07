import React, { useState } from 'react';
import { Container, Box, Fab } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Login from './pages/Login';
import GameBoard from './components/GameBoard';
import GameRules from './components/GameRules';

function App() {
  const [user, setUser] = useState(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const toggleRules = () => {
    setRulesOpen(!rulesOpen);
  };

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <GameBoard username={user.username} />
            <Fab 
              color="primary" 
              sx={{ 
                position: 'fixed', 
                right: 20, 
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1200
              }}
              onClick={toggleRules}
            >
              <MenuBookIcon />
            </Fab>
            {rulesOpen && (
              <GameRules onClose={toggleRules} />
            )}
          </>
        )}
      </Box>
    </Container>
  );
}

export default App; 