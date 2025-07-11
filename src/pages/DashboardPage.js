// frontend/src/pages/DashboardPage.js

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Container, Typography, Box, Paper, Grid, CircularProgress, Alert, List, ListItem, ListItemText,
  ListItemIcon, Divider
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import moment from 'moment'; // Asegúrate de tener moment.js instalado (npm install moment)

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    low_stock_items: [],
    expiring_soon_items: [], // Mantener para HU07
    expired_items: [],       // Mantener para HU07
    recent_movements: [],    // Mantener para una visión general
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch ítems con stock bajo (para HU02 / HU12)
      const lowStockRes = await api.get('api/inventory/low_stock_items/');
      
      // Fetch ítems por vencer y vencidos (para HU07, aunque no esté activa aún la HU)
      const expiringSoonRes = await api.get('api/inventory/expiring_soon_items/');
      const expiredRes = await api.get('api/inventory/expired_items/');

      // Fetch últimos movimientos (para visión general)
      const recentMovementsRes = await api.get('api/movements/'); // No hay límite, trae todos y luego se pueden truncar si es necesario

      setDashboardData({
        low_stock_items: lowStockRes.data || [],
        expiring_soon_items: expiringSoonRes.data || [],
        expired_items: expiredRes.data || [],
        recent_movements: recentMovementsRes.data.results ? recentMovementsRes.data.results.slice(0, 5) : (recentMovementsRes.data || []).slice(0, 5), // Tomar los 5 más recientes
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err.response?.data || err.message);
      setError('Error al cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Opcional: Refrescar datos cada cierto tiempo
    // const interval = setInterval(fetchDashboardData, 60000); // Cada 1 minuto
    // return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Dashboard del Inventario
      </Typography>

      <Grid container spacing={3}>
        {/* Sección de Alertas de Stock Bajo (HU02) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, border: dashboardData.low_stock_items.length > 0 ? '2px solid #ef5350' : 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <WarningIcon color="error" fontSize="large" />
              </ListItemIcon>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#ef5350' }}>
                Stock Bajo ({dashboardData.low_stock_items.length})
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {dashboardData.low_stock_items.length === 0 ? (
              <Alert severity="success">No hay ítems con stock bajo. ¡Todo en orden!</Alert>
            ) : (
              <List dense>
                {dashboardData.low_stock_items.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={`${item.name} (Actual: ${item.quantity}, Umbral: ${item.low_stock_threshold})`}
                      secondary={`Categoría: ${item.category_name || 'N/A'}, Proveedor: ${item.supplier_name || 'N/A'}`}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Sección de Alertas de Vencimiento (Para HU07, pero visible ahora) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, border: (dashboardData.expiring_soon_items.length > 0 || dashboardData.expired_items.length > 0) ? '2px solid #ff9800' : 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ErrorIcon color="warning" fontSize="large" />
              </ListItemIcon>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                Alertas de Vencimiento ({dashboardData.expiring_soon_items.length + dashboardData.expired_items.length})
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {dashboardData.expiring_soon_items.length === 0 && dashboardData.expired_items.length === 0 ? (
              <Alert severity="success">No hay ítems por vencer o vencidos. ¡Excelente!</Alert>
            ) : (
              <List dense>
                {dashboardData.expiring_soon_items.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={`${item.name} (Vence: ${moment(item.expiration_date).format('DD/MM/YYYY')})`}
                      secondary={`Lote: ${item.batch_number || 'N/A'}`}
                      primaryTypographyProps={{ fontWeight: 'medium', color: '#ff9800' }}
                    />
                  </ListItem>
                ))}
                {dashboardData.expired_items.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={`${item.name} (VENCIDO: ${moment(item.expiration_date).format('DD/MM/YYYY')})`}
                      secondary={`Lote: ${item.batch_number || 'N/A'}`}
                      primaryTypographyProps={{ fontWeight: 'medium', color: '#d32f2f' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Sección de Últimos Movimientos (Para visión general) */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <CheckCircleIcon color="info" fontSize="large" />
              </ListItemIcon>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                Últimos Movimientos
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {dashboardData.recent_movements.length === 0 ? (
              <Alert severity="info">No hay movimientos recientes para mostrar.</Alert>
            ) : (
              <List dense>
                {dashboardData.recent_movements.map((movement) => (
                  <ListItem key={movement.id}>
                    <ListItemText
                      primary={`${movement.movement_type} de ${movement.quantity} de ${movement.item_name}`}
                      secondary={`Por: ${movement.moved_by_username || 'N/A'} el ${moment(movement.movement_date).format('DD/MM/YYYY HH:mm')}`}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
};

export default DashboardPage;
