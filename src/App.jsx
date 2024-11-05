import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Game from './components/Game';

function App() {
  const [username, setUsername] = useState('');

  const handleLogin = (userData) => {
    setUsername(userData.username);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/game" element={<Game username={username} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 