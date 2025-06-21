// frontend/src/pages/CategoryPage.js

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, CircularProgress, Alert, Box,
  TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';


const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', description: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const { userRole } = useAuth();
  const canModify = userRole === 'ADMIN' || userRole === 'GESTOR_INV';

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      // CORRECCIÓN: Añadir 'api/' al endpoint de categories
      const response = await api.get('api/categories/'); // <--- CAMBIO AQUÍ
      setCategories(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('No se pudieron cargar las categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAddDialog = () => {
    setCurrentCategory({ id: null, name: '', description: '' });
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (category) => {
    setCurrentCategory(category);
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null); // Limpiar errores al cerrar
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEditMode) {
        // CORRECCIÓN: Añadir 'api/' al endpoint de categories
        await api.put(`api/categories/${currentCategory.id}/`, currentCategory); // <--- CAMBIO AQUÍ
      } else {
        // CORRECCIÓN: Añadir 'api/' al endpoint de categories
        await api.post('api/categories/', currentCategory); // <--- CAMBIO AQUÍ
      }
      fetchCategories(); // Refrescar la lista
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving category:', err.response?.data || err.message);
      setError('Error al guardar la categoría. Revisa los datos.');
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setCategoryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      try {
        // CORRECCIÓN: Añadir 'api/' al endpoint de categories
        await api.delete(`api/categories/${categoryToDelete.id}/`); // <--- CAMBIO AQUÍ
        fetchCategories();
        handleCloseDeleteDialog();
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('No se pudo eliminar la categoría. Puede estar en uso.');
        handleCloseDeleteDialog();
      }
    }
  };


  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando categorías...</Typography>
      </Container>
    );
  }

  if (error && !openDialog) { // Muestra el error principal si no está en un diálogo
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Categorías
        </Typography>
        {canModify && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ borderRadius: 2 }}
          >
            Añadir Categoría
          </Button>
        )}
      </Box>

      {categories.length === 0 ? (
        <Alert severity="info">No se encontraron categorías.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table sx={{ minWidth: 400 }} aria-label="categories table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                {canModify && <TableCell>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell component="th" scope="row">
                    {category.name}
                  </TableCell>
                  <TableCell>{category.description || 'N/A'}</TableCell>
                  {canModify && (
                    <TableCell>
                      <IconButton
                        aria-label="edit"
                        onClick={() => handleOpenEditDialog(category)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        onClick={() => handleDeleteClick(category)}
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

      {/* Dialogo para Añadir/Editar Categoría */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditMode ? 'Editar Categoría' : 'Añadir Nueva Categoría'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre de la Categoría"
            type="text"
            fullWidth
            variant="outlined"
            value={currentCategory.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Descripción"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={currentCategory.description}
            onChange={handleChange}
          />
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
            ¿Estás seguro de que deseas eliminar la categoría "{categoryToDelete?.name}"? Esta acción no se puede deshacer y podría afectar a los ítems asociados.
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

export default CategoryPage;
