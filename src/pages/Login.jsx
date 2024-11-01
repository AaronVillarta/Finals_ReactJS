import { Box, Button, Container, TextField, Typography, Alert } from '@mui/material';
import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Signup from './Signup';

const Login = ({ onLogin }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
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
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError('');

    if (validateForm()) {
      // TODO: Add actual authentication logic here
      // For demo purposes, let's check for a dummy username/password
      if (formData.username === 'admin' && formData.password === 'password123') {
        onLogin();
      } else {
        setSubmitError('Invalid username or password');
      }
    }
  };

  if (isSignup) {
    return <Signup 
      onSignup={(userData) => {
        // TODO: Add actual registration logic here
        console.log('Register user:', userData);
        setIsSignup(false);
      }}
      onBackToLogin={() => setIsSignup(false)}
    />;
  }

  return (
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
            onClick={() => setIsSignup(true)}
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