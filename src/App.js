// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryListPage from './pages/InventoryListPage';
import ItemForm from './components/ItemForm'; // Assuming ItemForm is still used for new/edit
import CategoryPage from './pages/CategoryPage';
import SupplierPage from './pages/SupplierPage';
import MovementPage from './pages/MovementPage'; // Renamed from MovementPage2.js in previous context
import KitPage from './pages/KitPage';
import ReportsPage from './pages/ReportsPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import PurchaseOrderListPage from './pages/PurchaseOrderListPage'; // <-- NUEVO: Importar la página de Órdenes de Compra
import { AuthProvider, useAuth } from './context/AuthContext';

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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      {isAuthenticated && <NavBar />}
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
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV']}>
              <ItemForm />
            </PrivateRoute>
          }/>
          <Route path="/inventory/edit/:id" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV']}>
              <ItemForm />
            </PrivateRoute>
          }/>
          <Route path="/categories" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV']}>
              <CategoryPage />
            </PrivateRoute>
          }/>
          <Route path="/suppliers" element={
            <PrivateRoute allowedRoles={['ADMIN', 'COMPRADOR']}>
              <SupplierPage />
            </PrivateRoute>
          }/>
          <Route path="/movements" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV', 'LOGISTICA']}>
              <MovementPage />
            </PrivateRoute>
          }/>
          <Route path="/kits" element={
            <PrivateRoute allowedRoles={['ADMIN', 'GESTOR_INV']}>
              <KitPage />
            </PrivateRoute>
          }/>
          <Route path="/reports" element={
            <PrivateRoute allowedRoles={['ADMIN', 'AUDITOR', 'GERENTE_PROY']}>
              <ReportsPage />
            </PrivateRoute>
          }/>
          <Route path="/purchase-history" element={
            <PrivateRoute allowedRoles={['ADMIN', 'COMPRADOR', 'AUDITOR', 'GERENTE_PROY']}>
              <PurchaseHistoryPage />
            </PrivateRoute>
          }/>
          {/* NUEVA RUTA para Órdenes de Compra */}
          <Route path="/purchase-orders" element={
            <PrivateRoute allowedRoles={['ADMIN', 'COMPRADOR', 'GESTOR_INV']}> {/* Roles que pueden ver las órdenes de compra */}
              <PurchaseOrderListPage />
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
