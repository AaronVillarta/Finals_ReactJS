import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, AppBar, Toolbar } from '@mui/material';
import { io } from 'socket.io-client';

function PlayerHub({ username, onLogout }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userWins, setUserWins] = useState({});
  const [socket, setSocket] = useState(null);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [challengedUser, setChallengedUser] = useState('');
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (socket) {
      socket.emit('logout', username);
      socket.disconnect();
    }
    onLogout();
    window.location.href = '/';
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!savedUser || !token) {
      handleLogout();
      return;
    }

    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server, joining hub as', username);
      newSocket.emit('joinHub', username);
    });

    newSocket.on('updateOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('syncWins', (winsData) => {
      setUserWins(winsData);
    });

    newSocket.on('receiveChallenge', (challenger) => {
      console.log('Received challenge from:', challenger);
      setIncomingChallenge(challenger);
    });

    newSocket.on('challengeError', (error) => {
      console.error('Challenge error:', error);
      // Optionally show an error message to the user
    });

    newSocket.on('gameStart', () => {
      navigate('/game');
    });

    return () => {
      if (newSocket) {
        console.log('Disconnecting socket');
        newSocket.disconnect();
      }
    };
  }, [username]);

  const handleChallenge = (opponent) => {
    console.log('Challenging:', opponent);
    setChallengedUser(opponent);
    setChallengeDialogOpen(true);
  };

  const confirmChallenge = () => {
    console.log('Confirming challenge to:', challengedUser);
    if (socket) {
      socket.emit('challengePlayer', { 
        challenger: username, 
        opponent: challengedUser 
      });
    }
    setChallengeDialogOpen(false);
  };

  const declineChallenge = () => {
    setChallengeDialogOpen(false);
  };

  const acceptIncomingChallenge = () => {
    if (socket && incomingChallenge) {
      socket.emit('acceptChallenge', { challenger: incomingChallenge, opponent: username });
    }
    setIncomingChallenge(null);
  };

  const declineIncomingChallenge = () => {
    setIncomingChallenge(null);
  };

  return (
    <Box>
      <AppBar position="fixed" color="primary">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Player Hub
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ mt: 8, p: 2 }}>  {/* Increased top margin to account for AppBar */}
        <List>
          {onlineUsers.map((user) => (
            <ListItem key={user} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <ListItemText primary={`${user} - Wins: ${userWins[user] || 0}`} />
              {user !== username && (
                <Button variant="contained" onClick={() => handleChallenge(user)}>
                  Challenge
                </Button>
              )}
            </ListItem>
          ))}
        </List>

        {/* Challenge Confirmation Dialog */}
        <Dialog open={challengeDialogOpen} onClose={declineChallenge}>
          <DialogTitle>Challenge Player</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Do you want to challenge {challengedUser}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={declineChallenge} color="primary">
              No
            </Button>
            <Button onClick={confirmChallenge} color="primary" autoFocus>
              Yes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Incoming Challenge Dialog */}
        {incomingChallenge && (
          <Dialog open={Boolean(incomingChallenge)} onClose={declineIncomingChallenge}>
            <DialogTitle>Incoming Challenge</DialogTitle>
            <DialogContent>
              <DialogContentText>
                You are being challenged by {incomingChallenge}. Do you accept?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={declineIncomingChallenge} color="primary">
                No
              </Button>
              <Button onClick={acceptIncomingChallenge} color="primary" autoFocus>
                Yes
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Box>
  );
}

export default PlayerHub; 