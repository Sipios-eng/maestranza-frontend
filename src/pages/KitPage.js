// frontend/src/pages/KitPage.js

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, CircularProgress, Alert, Box,
  TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton,
  List, ListItem, ListItemText, Checkbox, // Eliminado ListItemIcon, FormControlLabel
  InputLabel, Select, MenuItem,
  FormControl
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
// Eliminado CheckBoxOutlineBlankIcon, CheckBoxIcon ya que no se usan directamente en el renderizado del MenuItem


const KitPage = () => {
  const [kits, setKits] = useState([]);
  const [items, setItems] = useState([]); // Para el select de ítems en el kit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentKit, setCurrentKit] = useState({
    id: null,
    name: '',
    description: '',
    item_ids: [], // Array de IDs de ítems para el campo de escritura
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [kitToDelete, setKitToDelete] = useState(null);

  const { userRole } = useAuth();
  const canModify = userRole === 'ADMIN' || userRole === 'GESTOR_INV';

  const fetchKitsAndItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const kitsRes = await api.get('api/kits/'); // Asegúrate de usar 'api/' aquí también
      const itemsRes = await api.get('api/inventory/'); // Asegúrate de usar 'api/' aquí también
      setKits(kitsRes.data.results || kitsRes.data);
      setItems(itemsRes.data.results || itemsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los kits o ítems.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitsAndItems();
  }, []);

  const handleOpenAddDialog = () => {
    setCurrentKit({
      id: null,
      name: '',
      description: '',
      item_ids: [],
    });
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (kit) => {
    // Al editar, el 'items' viene como un array de objetos KitItem con item_id y quantity
    // Necesitamos mapearlos a 'item_ids' para el formulario
    const itemIds = kit.items.map(kitItem => kitItem.item); // Extraer solo los IDs de los ítems
    setCurrentKit({
      ...kit,
      item_ids: itemIds,
    });
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentKit((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemSelectChange = (e) => {
    const { value } = e.target;
    setCurrentKit((prev) => ({
      ...prev,
      item_ids: typeof value === 'string' ? value.split(',').map(Number) : value, // Maneja si el valor es string o array
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEditMode) {
        await api.put(`api/kits/${currentKit.id}/`, currentKit); // Asegúrate de usar 'api/' aquí también
      } else {
        await api.post('api/kits/', currentKit); // Asegúrate de usar 'api/' aquí también
      }
      fetchKitsAndItems();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving kit:', err.response?.data || err.message);
      setError('Error al guardar el kit. Revisa los datos.');
    }
  };

  const handleDeleteClick = (kit) => {
    setKitToDelete(kit);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setKitToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (kitToDelete) {
      try {
        await api.delete(`api/kits/${kitToDelete.id}/`); // Asegúrate de usar 'api/' aquí también
        fetchKitsAndItems();
        handleCloseDeleteDialog();
      } catch (err) {
        console.error('Error deleting kit:', err);
        setError('No se pudo eliminar el kit. Puede contener ítems.');
        handleCloseDeleteDialog();
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando kits...</Typography>
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
          Gestión de Kits
        </Typography>
        {canModify && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ borderRadius: 2 }}
          >
            Añadir Kit
          </Button>
        )}
      </Box>

      {kits.length === 0 ? (
        <Alert severity="info">No se encontraron kits.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table sx={{ minWidth: 650 }} aria-label="kits table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Ítems Incluidos</TableCell>
                {canModify && <TableCell>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {kits.map((kit) => (
                <TableRow key={kit.id}>
                  <TableCell component="th" scope="row">
                    {kit.name}
                  </TableCell>
                  <TableCell>{kit.description || 'N/A'}</TableCell>
                  <TableCell>
                    {kit.items && kit.items.length > 0 ? (
                      <List dense disablePadding>
                        {kit.items.map((kitItem) => (
                          <ListItem key={kitItem.item} disablePadding>
                            {/* Eliminado ListItemIcon ya que no se usa */}
                            <ListItemText primary={`- ${kitItem.item_name} (${kitItem.quantity})`} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      'Ninguno'
                    )}
                  </TableCell>
                  {canModify && (
                    <TableCell>
                      <IconButton
                        aria-label="edit"
                        onClick={() => handleOpenEditDialog(kit)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        onClick={() => handleDeleteClick(kit)}
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

      {/* Dialogo para Añadir/Editar Kit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? 'Editar Kit' : 'Añadir Nuevo Kit'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre del Kit"
            type="text"
            fullWidth
            variant="outlined"
            value={currentKit.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Descripción del Kit"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={currentKit.description}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="items-select-label">Ítems del Kit</InputLabel>
            <Select
              labelId="items-select-label"
              id="items-select"
              name="item_ids"
              multiple
              value={currentKit.item_ids}
              onChange={handleItemSelectChange}
              label="Ítems del Kit"
              renderValue={(selected) => (
                items
                  .filter(item => selected.includes(item.id))
                  .map(item => item.name)
                  .join(', ')
              )}
            >
              {items.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  <Checkbox checked={currentKit.item_ids.includes(item.id)} />
                  <ListItemText primary={item.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary" sx={{ borderRadius: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" sx={{ borderRadius: 1 }}>
            {isEditMode ? 'Actualizar' : 'Añadir'}
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
            ¿Estás seguro de que deseas eliminar el kit "{kitToDelete?.name}"? Esta acción no se puede deshacer.
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

export default KitPage;
