// frontend/src/pages/InventoryListPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Importar useLocation
import api from '../services/api';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { red } from '@mui/material/colors';
import { useAuth } from '../context/AuthContext';


const InventoryListPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Inicializar useLocation
  const { userRole } = useAuth(); // Obtiene el rol del usuario para permisos de UI

  // Define roles que pueden editar y eliminar
  const canModify = userRole === 'ADMIN' || userRole === 'GESTOR_INV';

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`api/inventory/?search=${searchTerm}`);
      setItems(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError('No se pudieron cargar los ítems de inventario.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // CAMBIO CLAVE AQUÍ: Agregar location.state?.refresh como dependencia
  useEffect(() => {
    fetchItems();
  }, [fetchItems, location.state?.refresh]); // Ahora cumple con la regla de exhaustivity-deps Y refresca en navegación

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await api.delete(`api/inventory/${itemToDelete.id}/`);
        handleCloseDeleteDialog();
        // Redirigir al dashboard para actualizar sus estadísticas y luego a inventario para asegurar la recarga
        // Pasamos el refresh trigger en ambas navegaciones.
        navigate('/dashboard', { state: { refresh: Date.now() }, replace: true });
        // Podrías poner un pequeño delay o usar una cadena de promesas para ir a /inventory después.
        // O más simple, asumir que el usuario navegará si quiere ver la lista de inventario actualizada.
      } catch (err) {
        console.error('Error deleting item:', err);
        setError('No se pudo eliminar el ítem.');
        handleCloseDeleteDialog();
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando ítems...</Typography>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventario de Productos
        </Typography>
        {canModify && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/inventory/new')}
            sx={{ borderRadius: 2 }}
          >
            Añadir Nuevo Ítem
          </Button>
        )}
      </Box>

      <TextField
        fullWidth
        label="Buscar por nombre o número de serie"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3, borderRadius: 2 }}
      />

      {items.length === 0 ? (
        <Alert severity="info">No se encontraron ítems de inventario.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table sx={{ minWidth: 650 }} aria-label="inventory table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Número de Serie</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Umbral Bajo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    backgroundColor: item.quantity <= item.low_stock_threshold ? red[50] : 'inherit',
                  }}
                >
                  <TableCell component="th" scope="row">
                    {item.name}
                  </TableCell>
                  <TableCell>{item.serial_number || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Typography color={item.quantity <= item.low_stock_threshold ? red[700] : 'inherit'} fontWeight={item.quantity <= item.low_stock_threshold ? 'bold' : 'normal'}>
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{item.low_stock_threshold}</TableCell>
                  <TableCell>{item.category_name || 'N/A'}</TableCell>
                  <TableCell>{item.supplier_name || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="view details"
                      component={Link}
                      to={`/inventory/edit/${item.id}`} // En un sistema más completo, sería una vista de detalles
                      color="info"
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {canModify && (
                      <>
                        <IconButton
                          aria-label="edit"
                          component={Link}
                          to={`/inventory/edit/${item.id}`}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          onClick={() => handleDeleteClick(item)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirmar Eliminación"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que deseas eliminar el ítem "{itemToDelete?.name}"? Esta acción no se puede deshacer.
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

export default InventoryListPage;
