import React, { useState } from 'react';
import { Container, Typography } from '@mui/material';
import Login from './pages/Login';
import Game from './components/Game';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  if (!isLoggedIn) {
    return <Login onLogin={(user) => {
      setIsLoggedIn(true);
      setUsername(user.username);
    }} />;
  }

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Super RPS
      </Typography>
      <Game username={username} />
    </Container>
  );
}

export default App; 