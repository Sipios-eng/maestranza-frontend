// frontend/src/pages/SupplierPage.js

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

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState({
    id: null,
    name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    payment_terms: '',
    address: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const { userRole } = useAuth();
  const canModify = userRole === 'ADMIN' || userRole === 'COMPRADOR'; // Compador también puede gestionar proveedores

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      // CORRECCIÓN: Añadir 'api/' al endpoint de suppliers
      const response = await api.get('api/suppliers/'); // <--- CAMBIO AQUÍ
      setSuppliers(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('No se pudieron cargar los proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAddDialog = () => {
    setCurrentSupplier({
      id: null,
      name: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      payment_terms: '',
      address: ''
    });
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (supplier) => {
    setCurrentSupplier(supplier);
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEditMode) {
        // CORRECCIÓN: Añadir 'api/' al endpoint de suppliers
        await api.put(`api/suppliers/${currentSupplier.id}/`, currentSupplier); // <--- CAMBIO AQUÍ
      } else {
        // CORRECCIÓN: Añadir 'api/' al endpoint de suppliers
        await api.post('api/suppliers/', currentSupplier); // <--- CAMBIO AQUÍ
      }
      fetchSuppliers();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving supplier:', err.response?.data || err.message);
      setError('Error al guardar el proveedor. Revisa los datos.');
    }
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSupplierToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (supplierToDelete) {
      try {
        // CORRECCIÓN: Añadir 'api/' al endpoint de suppliers
        await api.delete(`api/suppliers/${supplierToDelete.id}/`); // <--- CAMBIO AQUÍ
        fetchSuppliers();
        handleCloseDeleteDialog();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        setError('No se pudo eliminar el proveedor. Puede estar en uso.');
        handleCloseDeleteDialog();
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando proveedores...</Typography>
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
          Gestión de Proveedores
        </Typography>
        {canModify && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ borderRadius: 2 }}
          >
            Añadir Proveedor
          </Button>
        )}
      </Box>

      {suppliers.length === 0 ? (
        <Alert severity="info">No se encontraron proveedores.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table sx={{ minWidth: 650 }} aria-label="suppliers table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Términos de Pago</TableCell>
                <TableCell>Dirección</TableCell>
                {canModify && <TableCell>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell component="th" scope="row">
                    {supplier.name}
                  </TableCell>
                  <TableCell>{supplier.contact_person || 'N/A'}</TableCell>
                  <TableCell>{supplier.contact_email || 'N/A'}</TableCell>
                  <TableCell>{supplier.contact_phone || 'N/A'}</TableCell>
                  <TableCell>{supplier.payment_terms || 'N/A'}</TableCell>
                  <TableCell>{supplier.address || 'N/A'}</TableCell>
                  {canModify && (
                    <TableCell>
                      <IconButton
                        aria-label="edit"
                        onClick={() => handleOpenEditDialog(supplier)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        onClick={() => handleDeleteClick(supplier)}
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

      {/* Dialogo para Añadir/Editar Proveedor */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre del Proveedor"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSupplier.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="contact_person"
            label="Persona de Contacto"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSupplier.contact_person}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="contact_email"
            label="Email de Contacto"
            type="email"
            fullWidth
            variant="outlined"
            value={currentSupplier.contact_email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="contact_phone"
            label="Teléfono de Contacto"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSupplier.contact_phone}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="payment_terms"
            label="Términos de Pago"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={currentSupplier.payment_terms}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="address"
            label="Dirección"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={currentSupplier.address}
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
            ¿Estás seguro de que deseas eliminar el proveedor "{supplierToDelete?.name}"? Esta acción no se puede deshacer.
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

export default SupplierPage;
