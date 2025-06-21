// frontend/src/pages/LoginPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa el hook de autenticación
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/system';

// Estilos personalizados para el formulario
const LoginContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
}));

const LoginFormBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#fff',
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  width: '100%',
  maxWidth: 400,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // Obtiene la función de login del contexto

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard'); // Redirige al dashboard al iniciar sesión exitosamente
      } else {
        setError('Nombre de usuario o contraseña incorrectos. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      // El error ya es manejado en AuthContext, aquí solo se asegura de mostrar un mensaje genérico
      setError('Ocurrió un error inesperado al intentar iniciar sesión. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer component="main" maxWidth="xs">
      <LoginFormBox>
        <Typography component="h1" variant="h5" sx={{ textAlign: 'center', mb: 2 }}>
          Iniciar Sesión
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Nombre de Usuario"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            size="small"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            size="small"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Acceder'}
          </Button>
        </Box>
      </LoginFormBox>
    </LoginContainer>
  );
};

export default LoginPage;
