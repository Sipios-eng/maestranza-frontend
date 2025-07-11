// frontend/src/pages/MovementListPage.js

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // Asume que 'api' está configurado para tu backend
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
import { useAuth } from '../context/AuthContext';

const MovementListPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMovement, setCurrentMovement] = useState(null); // Para editar
  const [items, setItems] = useState([]); // Para el selector de ítems en el formulario

  // Estados del formulario
  const [formData, setFormData] = useState({
    item: '',
    movement_type: '',
    quantity: '',
    project: '',
    notes: '',
  });

  const { userRole } = useAuth(); // Obtener el rol del usuario

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('api/movements/');
      setMovements(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching movements:', err.response?.data || err.message);
      setError('Error al cargar los movimientos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const itemsRes = await api.get('api/inventory/'); // Endpoint original para ítems
      setItems(itemsRes.data.results || itemsRes.data);
    } catch (err) {
      console.error('Error fetching items:', err.response?.data || err.message);
      setError('Error al cargar ítems para el formulario.');
    }
  }, []);

  useEffect(() => {
    fetchMovements();
    fetchItems();
  }, [fetchMovements, fetchItems]);

  const handleOpenDialog = (movement = null) => {
    setCurrentMovement(movement);
    if (movement) {
      setFormData({
        item: movement.item,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        project: movement.project || '',
        notes: movement.notes || '',
      });
    } else {
      setFormData({
        item: '',
        movement_type: '',
        quantity: '',
        project: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentMovement(null);
    setError(null); // Limpiar errores del formulario
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quantity') {
      let numValue = value === '' ? '' : parseInt(value, 10);
      if (isNaN(numValue) && value !== '') {
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!formData.item || !formData.movement_type || formData.quantity === '') {
      setError('Por favor, completa todos los campos obligatorios.');
      setLoading(false);
      return;
    }

    try {
      if (currentMovement) {
        await api.put(`api/movements/${currentMovement.id}/`, formData);
      } else {
        await api.post('api/movements/', formData);
      }
      handleCloseDialog();
      fetchMovements();
    } catch (err) {
      console.error('Error submitting movement:', err.response?.data || err.message);
      if (err.response && err.response.data) {
        let errorMessages = '';
        for (const key in err.response.data) {
          if (Object.hasOwnProperty.call(err.response.data, key)) {
            errorMessages += `${key}: ${err.response.data[key].join(', ')}\n`;
          }
        }
        setError('Error al guardar el movimiento:\n' + errorMessages);
      } else {
        setError('Error al guardar el movimiento. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`api/movements/${id}/`);
        fetchMovements();
      } catch (err) {
        console.error('Error deleting movement:', err.response?.data || err.message);
        setError('Error al eliminar el movimiento. ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const canManageMovements = userRole === 'ADMIN' || userRole === 'GESTOR_INV' || userRole === 'LOGISTICA';

  if (!canManageMovements) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">No tienes permisos para acceder a esta página.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Historial de Movimientos de Inventario
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Añadir Movimiento
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />}
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      {!loading && !error && movements.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>No hay movimientos para mostrar.</Alert>
      )}

      {!loading && !error && movements.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table aria-label="movements table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Ítem</TableCell>
                <TableCell>Lote</TableCell> {/* <-- NUEVA COLUMNA para el lote */}
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell>Realizado por</TableCell>
                <TableCell>Fecha y Hora</TableCell>
                <TableCell>Proyecto</TableCell>
                <TableCell>Notas</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.map((movement) => {
                // Buscar el ítem asociado para obtener el número de lote
                const associatedItem = items.find(item => item.id === movement.item);
                const batchNumber = associatedItem ? associatedItem.batch_number : 'N/A';

                return (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.item_name || 'N/A'}</TableCell>
                    <TableCell>{batchNumber}</TableCell> {/* <-- Mostrar el número de lote */}
                    <TableCell>{movement.movement_type}</TableCell>
                    <TableCell align="right">{movement.quantity}</TableCell>
                    <TableCell>{movement.moved_by_username || 'N/A'}</TableCell>
                    <TableCell>{moment(movement.movement_date).format('DD/MM/YYYY HH:mm')}</TableCell>
                    <TableCell>{movement.project || 'N/A'}</TableCell>
                    <TableCell>{movement.notes || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenDialog(movement)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => handleDelete(movement.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogo para Añadir/Editar Movimiento */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{currentMovement ? 'Editar Movimiento de Inventario' : 'Añadir Nuevo Movimiento de Inventario'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Ítem</InputLabel>
            <Select
              name="item"
              value={formData.item}
              label="Ítem"
              onChange={handleChange}
              disabled={!!currentMovement}
            >
              <MenuItem value=""><em>Selecciona un ítem</em></MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de Movimiento</InputLabel>
            <Select
              name="movement_type"
              value={formData.movement_type}
              label="Tipo de Movimiento"
              onChange={handleChange}
            >
              <MenuItem value=""><em>Selecciona un tipo</em></MenuItem>
              <MenuItem value="ENTRADA">Entrada</MenuItem>
              <MenuItem value="SALIDA">Salida</MenuItem>
              <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
              <MenuItem value="DEVOLUCION">Devolución</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Cantidad"
            name="quantity"
            type="number"
            fullWidth
            value={formData.quantity}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            label="Proyecto Asociado"
            name="project"
            fullWidth
            value={formData.project}
            onChange={handleChange}
            sx={{ mb: 2 }}
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
            {loading ? <CircularProgress size={24} /> : (currentMovement ? 'Guardar Cambios' : 'Añadir Movimiento')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MovementListPage;
