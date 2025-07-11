// frontend/src/pages/PurchaseOrderListPage.js

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert
} from '@mui/material';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';

const PurchaseOrderListPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userRole } = useAuth(); // Obtener el rol del usuario

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('api/purchase-orders/');
      // Asegurarse de que la respuesta sea un array, ya sea directamente o de 'results'
      setPurchaseOrders(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching purchase orders:', err.response?.data || err.message);
      setError('Error al cargar las órdenes de compra.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Roles que pueden ver las órdenes de compra (Admin, Comprador, Gestor de Inventario)
  const canViewPurchaseOrders = userRole === 'ADMIN' || userRole === 'COMPRADOR' || userRole === 'GESTOR_INV';

  if (!canViewPurchaseOrders) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">No tienes permisos para acceder a esta página.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Órdenes de Compra Generadas
      </Typography>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />}
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      {!loading && !error && purchaseOrders.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>No hay órdenes de compra para mostrar.</Alert>
      )}

      {!loading && !error && purchaseOrders.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table aria-label="purchase orders table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>ID Orden</TableCell>
                <TableCell>Ítem</TableCell>
                <TableCell>Proveedor Sugerido</TableCell>
                <TableCell align="right">Cantidad a Ordenar</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha de Generación</TableCell>
                <TableCell>Notas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.item_name || 'N/A'}</TableCell>
                  <TableCell>{order.supplier_name || 'N/A'}</TableCell>
                  <TableCell align="right">{order.quantity_to_order}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{moment(order.generated_at).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell>{order.notes || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default PurchaseOrderListPage;
