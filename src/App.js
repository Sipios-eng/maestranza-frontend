// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material'; // Importar CircularProgress
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryListPage from './pages/InventoryListPage';
import ItemForm from './components/ItemForm';
import CategoryPage from './pages/CategoryPage';
import SupplierPage from './pages/SupplierPage';
import MovementPage from './pages/MovementPage';
import KitPage from './pages/KitPage';
import { AuthProvider, useAuth } from './context/AuthContext'; // Importar useAuth

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3', // Azul para elementos primarios
    },
    secondary: {
      main: '#f50057', // Rosa para elementos secundarios
    },
    background: {
      default: '#f4f6f8', // Fondo claro
      paper: '#ffffff', // Fondo de tarjetas/paneles
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h4: {
      fontWeight: 600,
      color: '#333',
    },
    body1: {
      color: '#555',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

// Componente de Ruta Privada
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isAuthLoading, userRole } = useAuth();

  if (isAuthLoading) {
    // Si la autenticación está cargando, muestra un spinner
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirige al login
    return <Navigate to="/login" replace />;
  }

  // Si hay roles permitidos y el rol del usuario no está en ellos, redirige al dashboard (o a una página de acceso denegado)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />; // O a una página de "Acceso Denegado"
  }

  return children;
};

function AppContent() {
  const { isAuthenticated, isAuthLoading } = useAuth(); // Obtener isAuthLoading desde el contexto

  if (isAuthLoading) {
    // Mostrar un spinner de carga mientras se verifica la autenticación inicial
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      {isAuthenticated && <NavBar />} {/* Mostrar NavBar solo si está autenticado */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: isAuthenticated ? '64px' : 0 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV', 'LOGISTICA', 'JEFE_PROD', 'AUDITOR', 'GERENTE_PROY', 'USUARIO_FINAL']}>
              <DashboardPage />
            </PrivateRoute>
          }/>
          <Route path="/inventory" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV', 'LOGISTICA', 'JEFE_PROD', 'AUDITOR', 'GERENTE_PROY', 'USUARIO_FINAL']}>
              <InventoryListPage />
            </PrivateRoute>
          }/>
          <Route path="/inventory/new" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV']}> {/* Solo ADMIN y GESTOR_INV pueden añadir */}
              <ItemForm />
            </PrivateRoute>
          }/>
          <Route path="/inventory/edit/:id" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV']}> {/* Solo ADMIN y GESTOR_INV pueden editar */}
              <ItemForm />
            </PrivateRoute>
          }/>
          <Route path="/categories" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV']}> {/* Solo ADMIN y GESTOR_INV pueden gestionar categorías */}
              <CategoryPage />
            </PrivateRoute>
          }/>
          <Route path="/suppliers" element={
            <PrivateRoute allowedRoles={['ADMIN', 'COMPRADOR']}> {/* Solo ADMIN y COMPRADOR pueden gestionar proveedores */}
              <SupplierPage />
            </PrivateRoute>
          }/>
          <Route path="/movements" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV', 'LOGISTICA']}> {/* Roles para movimientos */}
              <MovementPage />
            </PrivateRoute>
          }/>
          <Route path="/kits" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV']}> {/* Roles para kits */}
              <KitPage />
            </PrivateRoute>
          }/>

          {/* Redirigir la ruta raíz a /dashboard si está autenticado, de lo contrario a /login */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          
          {/* Ruta por defecto para manejar rutas no encontradas (404) o redirigir */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
