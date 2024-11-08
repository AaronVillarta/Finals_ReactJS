import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PlayerHub from './pages/PlayerHub';
import GameBoard from './components/GameBoard';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5001/verify-token', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(JSON.parse(savedUser));
        } else {
          localStorage.clear();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return null; 
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/hub" /> : <Login onLogin={setUser} />} 
        />
        <Route 
          path="/hub" 
          element={
            user ? (
              <PlayerHub 
                username={user.username} 
                onLogout={() => {
                  localStorage.clear();
                  setUser(null);
                }}
              />
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/game" 
          element={user ? <GameBoard username={user.username} /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App; 