// frontend/src/pages/DashboardPage.js

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLocation } from 'react-router-dom'; // Importar useLocation
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import { red, green, blue, orange } from '@mui/material/colors';
import moment from 'moment'; // Para formatear fechas

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    recentMovements: [],
  });

  const location = useLocation(); // Inicializar useLocation

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const itemsRes = await api.get('api/inventory/');
        const allItems = itemsRes.data.results || itemsRes.data;

        const totalItems = allItems.length;
        const lowStockItems = allItems.filter(item => item.quantity <= item.low_stock_threshold).length;

        const movementsRes = await api.get('api/movements/?limit=5');
        const recentMovements = movementsRes.data.results || movementsRes.data;

        setStats({
          totalItems,
          lowStockItems,
          recentMovements,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    // CAMBIO CLAVE AQUÍ: Depender de location.state.refresh
    fetchDashboardData();
  }, [location.state?.refresh]); // Depende del valor de 'refresh' en el estado de la ubicación

  const getMovementIcon = (type) => {
    switch (type) {
      case 'ENTRADA':
        return <TrendingUpIcon sx={{ color: green[500] }} />;
      case 'SALIDA':
        return <TrendingDownIcon sx={{ color: red[500] }} />;
      case 'TRANSFERENCIA':
        return <SwapHorizIcon sx={{ color: blue[500] }} />;
      case 'DEVOLUCION':
        return <ReplyAllIcon sx={{ color: orange[500] }} />;
      default:
        return <AssignmentTurnedInIcon />;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando dashboard...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Dashboard del Inventario
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <InventoryIcon sx={{ fontSize: 60, color: blue[500], mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div">
                  {stats.totalItems}
                </Typography>
                <Typography color="text.secondary">
                  Ítems Totales
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <WarningIcon sx={{ fontSize: 60, color: red[500], mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div">
                  {stats.lowStockItems}
                </Typography>
                <Typography color="text.secondary">
                  Ítems con Stock Bajo
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <AssignmentTurnedInIcon sx={{ fontSize: 60, color: green[500], mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div">
                  {stats.recentMovements.length}
                </Typography>
                <Typography color="text.secondary">
                  Últimos Movimientos (Top 5)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Últimos 5 Movimientos de Inventario
        </Typography>
        {stats.recentMovements.length === 0 ? (
          <Alert severity="info">No hay movimientos recientes.</Alert>
        ) : (
          <List>
            {stats.recentMovements.map((movement, index) => (
              <React.Fragment key={movement.id}>
                <ListItem>
                  <ListItemIcon>
                    {getMovementIcon(movement.movement_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <>
                        <Typography component="span" variant="subtitle1" fontWeight="bold">
                          {movement.movement_type}:
                        </Typography>
                        {' '}
                        {movement.quantity} unidades de "{movement.item_name}"
                      </>
                    }
                    secondary={
                      <>
                        Realizado por {movement.moved_by_username} el{' '}
                        {moment(movement.movement_date).format('DD/MM/YYYY HH:mm')}
                        {movement.project && ` (Proyecto: ${movement.project})`}
                      </>
                    }
                  />
                </ListItem>
                {index < stats.recentMovements.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Card>
    </Container>
  );
};

export default DashboardPage;
