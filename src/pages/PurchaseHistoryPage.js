// frontend/src/pages/PurchaseHistoryPage.js

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import moment from 'moment';

const PurchaseHistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null); // Para editar
  const [items, setItems] = useState([]); // Para el selector de ítems en el formulario
  const [suppliers, setSuppliers] = useState([]); // Para el selector de proveedores en el formulario

  // Estados del formulario
  const [formData, setFormData] = useState({
    item: '',
    supplier: '',
    purchase_date: moment().format('YYYY-MM-DD'), // Fecha actual por defecto
    unit_price: '',
    quantity_purchased: '',
    notes: '',
  });

  const fetchPurchaseRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('api/purchase-records/');
      setRecords(response.data.results || response.data); // Asume que la respuesta puede ser un objeto con .results o un array directo
    } catch (err) {
      console.error('Error fetching purchase records:', err.response?.data || err.message);
      setError('Error al cargar el historial de precios.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItemsAndSuppliers = useCallback(async () => {
    try {
      const [itemsRes, suppliersRes] = await Promise.all([
        api.get('api/inventory/'), // Endpoint para ítems
        api.get('api/suppliers/') // Endpoint para proveedores
      ]);
      setItems(itemsRes.data.results || itemsRes.data);
      setSuppliers(suppliersRes.data.results || suppliersRes.data);
    } catch (err) {
      console.error('Error fetching items or suppliers:', err.response?.data || err.message);
      setError('Error al cargar ítems o proveedores para el formulario.');
    }
  }, []);

  useEffect(() => {
    fetchPurchaseRecords();
    fetchItemsAndSuppliers();
  }, [fetchPurchaseRecords, fetchItemsAndSuppliers]);

  const handleOpenDialog = (record = null) => {
    setCurrentRecord(record);
    if (record) {
      setFormData({
        item: record.item,
        supplier: record.supplier,
        purchase_date: moment(record.purchase_date).format('YYYY-MM-DD'),
        unit_price: record.unit_price,
        quantity_purchased: record.quantity_purchased,
        notes: record.notes || '',
      });
    } else {
      setFormData({
        item: '',
        supplier: '',
        purchase_date: moment().format('YYYY-MM-DD'),
        unit_price: '',
        quantity_purchased: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRecord(null);
    setError(null); // Limpiar errores del formulario
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Validación básica del formulario
    if (!formData.item || !formData.supplier || !formData.purchase_date || !formData.unit_price || !formData.quantity_purchased) {
      setError('Por favor, completa todos los campos obligatorios.');
      setLoading(false);
      return;
    }

    try {
      if (currentRecord) {
        // Actualizar registro existente
        await api.put(`api/purchase-records/${currentRecord.id}/`, formData);
      } else {
        // Crear nuevo registro
        await api.post('api/purchase-records/', formData);
      }
      handleCloseDialog();
      fetchPurchaseRecords(); // Recargar la lista
    } catch (err) {
      console.error('Error submitting purchase record:', err.response?.data || err.message);
      setError('Error al guardar el registro de compra. ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro de compra?')) {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`api/purchase-records/${id}/`);
        fetchPurchaseRecords(); // Recargar la lista
      } catch (err) {
        console.error('Error deleting purchase record:', err.response?.data || err.message);
        setError('Error al eliminar el registro de compra. ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Historial de Precios de Compra
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Añadir Registro de Compra
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />}
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      {!loading && !error && records.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>No hay registros de compra para mostrar.</Alert>
      )}

      {!loading && !error && records.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table aria-label="purchase history table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Ítem</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Fecha de Compra</TableCell>
                <TableCell align="right">Precio Unitario</TableCell>
                <TableCell align="right">Cantidad Comprada</TableCell>
                <TableCell>Notas</TableCell>
                <TableCell>Registrado por</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.item_name || 'N/A'}</TableCell>
                  <TableCell>{record.supplier_name || 'N/A'}</TableCell>
                  <TableCell>{moment(record.purchase_date).format('DD/MM/YYYY')}</TableCell>
                  <TableCell align="right">${record.unit_price}</TableCell>
                  <TableCell align="right">{record.quantity_purchased}</TableCell>
                  <TableCell>{record.notes || 'N/A'}</TableCell>
                  <TableCell>{record.recorded_by_username || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpenDialog(record)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => handleDelete(record.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogo para Añadir/Editar Registro de Compra */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{currentRecord ? 'Editar Registro de Compra' : 'Añadir Nuevo Registro de Compra'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Ítem</InputLabel>
            <Select
              name="item"
              value={formData.item}
              label="Ítem"
              onChange={handleChange}
              disabled={!!currentRecord} // No permitir cambiar el ítem si se está editando
            >
              <MenuItem value=""><em>Selecciona un ítem</em></MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Proveedor</InputLabel>
            <Select
              name="supplier"
              value={formData.supplier}
              label="Proveedor"
              onChange={handleChange}
            >
              <MenuItem value=""><em>Selecciona un proveedor</em></MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Fecha de Compra"
            type="date"
            name="purchase_date"
            fullWidth
            value={formData.purchase_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Precio Unitario"
            type="number"
            name="unit_price"
            fullWidth
            value={formData.unit_price}
            onChange={handleChange}
            sx={{ mb: 2 }}
            inputProps={{ step: "0.01" }}
          />

          <TextField
            label="Cantidad Comprada"
            type="number"
            name="quantity_purchased"
            fullWidth
            value={formData.quantity_purchased}
            onChange={handleChange}
            sx={{ mb: 2 }}
            inputProps={{ step: "0.01" }}
          />

          <TextField
            label="Notas"
            name="notes"
            fullWidth
            multiline
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (currentRecord ? 'Guardar Cambios' : 'Añadir Registro')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PurchaseHistoryPage;
