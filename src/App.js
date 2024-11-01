import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import Login from './pages/Login';
import GameBoard from './components/GameBoard';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <GameBoard username={user.username} />
        )}
      </Box>
    </Container>
  );
}

export default App; 