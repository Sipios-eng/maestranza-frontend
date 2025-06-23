// frontend/src/components/NavBar.js

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // Para Proveedores
import CommuteIcon from '@mui/icons-material/Commute'; // Para Movimientos
import GroupWorkIcon from '@mui/icons-material/GroupWork'; // Para Kits
import PersonIcon from '@mui/icons-material/Person'; // Para usuario/perfil
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment'; // Icono para Informes
import HistoryIcon from '@mui/icons-material/History'; // <-- NUEVO: Icono para Historial de Precios

// Estas son las únicas importaciones que NavBar.js necesita para su funcionamiento:
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const NavBar = () => {
  const { logout, username, userRole } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['ADMIN', 'GESTOR_INV', 'LOGISTICA', 'JEFE_PROD', 'AUDITOR', 'GERENTE_PROY', 'USUARIO_FINAL'] },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory', roles: ['ADMIN', 'GESTOR_INV', 'LOGISTICA', 'JEFE_PROD', 'AUDITOR', 'GERENTE_PROY', 'USUARIO_FINAL'] },
    { text: 'Categorías', icon: <CategoryIcon />, path: '/categories', roles: ['ADMIN', 'GESTOR_INV'] },
    { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/suppliers', roles: ['ADMIN', 'COMPRADOR'] },
    { text: 'Movimientos', icon: <CommuteIcon />, path: '/movements', roles: ['ADMIN', 'GESTOR_INV', 'LOGISTICA'] },
    { text: 'Kits', icon: <GroupWorkIcon />, path: '/kits', roles: ['ADMIN', 'GESTOR_INV'] },
    { text: 'Informes', icon: <AssessmentIcon />, path: '/reports', roles: ['ADMIN', 'AUDITOR', 'GERENTE_PROY'] },
    { text: 'Historial Precios', icon: <HistoryIcon />, path: '/purchase-history', roles: ['ADMIN', 'COMPRADOR', 'AUDITOR', 'GERENTE_PROY'] }, // Este es el que queríamos añadir
  ];

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navItems.map((item) => (
          (item.roles.includes(userRole) || userRole === 'ADMIN') && (
            <ListItem button key={item.text} component={Link} to={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          )
        ))}
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="static" sx={{ borderRadius: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Maestranza Inventory
        </Typography>

        {isMobile ? (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {navItems.map((item) => (
              (item.roles.includes(userRole) || userRole === 'ADMIN') && (
                <Button key={item.text} color="inherit" component={Link} to={item.path} sx={{ mx: 1 }}>
                  {item.text}
                </Button>
              )
            ))}
            <Box sx={{ ml: 3, display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 0.5 }} />
              <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'medium' }}>
                {username} ({userRole})
              </Typography>
            </Box>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ ml: 2, border: '1px solid rgba(255,255,255,0.5)', borderRadius: 2 }}
            >
              Cerrar Sesión
            </Button>
          </Box>
        )}
      </Toolbar>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default NavBar;
