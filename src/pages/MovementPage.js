// frontend/src/pages/MovementPage.js

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, CircularProgress, Alert, Box,
  TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton,
  MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import moment from 'moment'; // Asegúrate de haber instalado moment


const MOVEMENT_TYPES = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SALIDA', label: 'Salida' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DEVOLUCION', label: 'Devolución' },
];

const MovementPage = () => {
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]); // Para el select de ítems
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMovement, setCurrentMovement] = useState({
    id: null,
    item: '', // ID del ítem
    movement_type: 'ENTRADA',
    quantity: 0,
    project: '',
    notes: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState(null);

  const { userRole } = useAuth();
  const canModify = userRole === 'ADMIN' || userRole === 'GESTOR_INV' || userRole === 'LOGISTICA';
  const navigate = useNavigate(); // Inicializar useNavigate

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const movementsRes = await api.get('api/movements/');
      const itemsRes = await api.get('api/inventory/');
      setMovements(movementsRes.data.results || movementsRes.data);
      setItems(itemsRes.data.results || itemsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los movimientos o ítems.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const handleOpenAddDialog = () => {
    setCurrentMovement({
      id: null,
      item: '',
      movement_type: 'ENTRADA',
      quantity: 0,
      project: '',
      notes: '',
    });
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (movement) => {
    setCurrentMovement({
      ...movement,
      item: movement.item // Asegurarse de que el ID del item es correcto para el select
    });
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setCurrentMovement((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const dataToSend = {
        ...currentMovement,
        item: currentMovement.item,
      };

      if (isEditMode) {
        await api.put(`api/movements/${currentMovement.id}/`, dataToSend);
      } else {
        await api.post('api/movements/', dataToSend);
      }
      fetchMovements(); // Recarga la lista de movimientos en esta página
      handleCloseDialog();
      // Redirigir al dashboard y pasar un estado para forzar la recarga
      navigate('/dashboard', { state: { refresh: Date.now() }, replace: true }); // <-- CAMBIO CLAVE AQUÍ

    } catch (err) {
      console.error('Error saving movement:', err.response?.data || err.message);
      setError('Error al guardar el movimiento. Revisa los datos.');
    }
  };

  const handleDeleteClick = (movement) => {
    setMovementToDelete(movement);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setMovementToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (movementToDelete) {
      try {
        await api.delete(`api/movements/${movementToDelete.id}/`);
        fetchMovements(); // Recarga la lista de movimientos en esta página
        handleCloseDeleteDialog();
        // Redirigir al dashboard y pasar un estado para forzar la recarga
        navigate('/dashboard', { state: { refresh: Date.now() }, replace: true }); // <-- CAMBIO CLAVE AQUÍ
      } catch (err) {
        console.error('Error deleting movement:', err);
        setError('No se pudo eliminar el movimiento.');
        handleCloseDeleteDialog();
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando movimientos...</Typography>
      </Container>
    );
  }

  if (error && !openDialog) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Movimientos de Inventario
        </Typography>
        {canModify && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ borderRadius: 2 }}
          >
            Registrar Movimiento
          </Button>
        )}
      </Box>

      {movements.length === 0 ? (
        <Alert severity="info">No se encontraron movimientos de inventario.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table sx={{ minWidth: 650 }} aria-label="movements table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Ítem</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell>Realizado por</TableCell>
                <TableCell>Fecha y Hora</TableCell>
                <TableCell>Proyecto</TableCell>
                <TableCell>Notas</TableCell>
                {canModify && <TableCell>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell component="th" scope="row">
                    {movement.item_name}
                  </TableCell>
                  <TableCell>{movement.movement_type}</TableCell>
                  <TableCell align="right">{movement.quantity}</TableCell>
                  <TableCell>{movement.moved_by_username || 'N/A'}</TableCell>
                  <TableCell>{moment(movement.movement_date).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell>{movement.project || 'N/A'}</TableCell>
                  <TableCell>{movement.notes || 'N/A'}</TableCell>
                  {canModify && (
                    <TableCell>
                      <IconButton
                        aria-label="edit"
                        onClick={() => handleOpenEditDialog(movement)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        onClick={() => handleDeleteClick(movement)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogo para Añadir/Editar Movimiento */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? 'Editar Movimiento' : 'Registrar Nuevo Movimiento'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="item-select-label">Ítem</InputLabel>
            <Select
              labelId="item-select-label"
              id="item-select"
              name="item"
              value={currentMovement.item}
              label="Ítem"
              onChange={handleChange}
              required
            >
              <MenuItem value="">
                <em>Selecciona un ítem</em>
              </MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.quantity} en stock)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="movement-type-select-label">Tipo de Movimiento</InputLabel>
            <Select
              labelId="movement-type-select-label"
              id="movement-type-select"
              name="movement_type"
              value={currentMovement.movement_type}
              label="Tipo de Movimiento"
              onChange={handleChange}
              required
            >
              {MOVEMENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="quantity"
            label="Cantidad"
            type="number"
            fullWidth
            variant="outlined"
            value={currentMovement.quantity}
            onChange={handleChange}
            required
            inputProps={{ step: "0.01" }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="project"
            label="Proyecto Asociado"
            type="text"
            fullWidth
            variant="outlined"
            value={currentMovement.project}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="notes"
            label="Notas"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={currentMovement.notes}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary" sx={{ borderRadius: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" sx={{ borderRadius: 1 }}>
            {isEditMode ? 'Actualizar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo de Confirmación de Eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirmar Eliminación"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que deseas eliminar este movimiento? Ten en cuenta que la eliminación de movimientos en el inventario podría requerir una reversión manual del stock afectado.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary" sx={{ borderRadius: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus sx={{ borderRadius: 1 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MovementPage;
