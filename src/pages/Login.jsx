import { Box, Button, Container, TextField, Typography, Alert } from '@mui/material';
import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Signup from './Signup';

const API_URL = 'http://localhost:5001';

const Login = ({ onLogin }) => {
  const theme = useTheme();
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (validateForm()) {
      try {
        console.log('Attempting login with:', formData);
        
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        console.log('Login successful:', data);
        onLogin(data.user);
      } catch (error) {
        console.error('Login error:', error);
        setSubmitError(error.message || 'Failed to connect to server');
      }
    }
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
    setErrors({});
  };

  return showSignup ? (
    <Signup onSignup={onLogin} onBackToLogin={handleBackToLogin} />
  ) : (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
          padding: 4,
          borderRadius: 2,
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Super RPS
        </Typography>
        
        {submitError && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={errors.username}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          
          <Button
            fullWidth
            onClick={() => setShowSignup(true)}
            sx={{ mt: 1 }}
          >
            Create New Account
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login; 