// frontend/src/components/ItemForm.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container, Typography, Box, TextField, Button, Paper, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const ItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serial_number: '',
    batch_number: '',
    location: '',
    quantity: 0,
    low_stock_threshold: 5,
    purchase_price: '',
    expiration_date: '', // Mantener como cadena vacía inicialmente
    category: '',
    supplier: '',
    tags: [],
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItemData = useCallback(async () => {
    if (isEditing) {
      setLoading(true);
      try {
        const response = await api.get(`api/inventory/${id}/`);
        const itemData = response.data;
        setFormData({
          name: itemData.name || '',
          description: itemData.description || '',
          serial_number: itemData.serial_number || '',
          batch_number: itemData.batch_number || '',
          location: itemData.location || '',
          quantity: itemData.quantity || 0,
          low_stock_threshold: itemData.low_stock_threshold || 5,
          purchase_price: itemData.purchase_price || '',
          expiration_date: itemData.expiration_date || '', // Si es null del backend, se convierte a '' para el input
          category: itemData.category || '',
          supplier: itemData.supplier || '',
          tags: itemData.tags || [],
        });
      } catch (err) {
        console.error('Error fetching item data:', err);
        setError('Error al cargar los datos del ítem.');
      } finally {
        setLoading(false);
      }
    }
  }, [id, isEditing]);

  const fetchRelatedData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesRes, suppliersRes, tagsRes] = await Promise.all([
        api.get('api/categories/'),
        api.get('api/suppliers/'),
        api.get('api/tags/'),
      ]);
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setSuppliers(suppliersRes.data.results || suppliersRes.data);
      setAllTags(tagsRes.data.results || tagsRes.data);
    } catch (err) {
      console.error('Error fetching related data:', err);
      setError('Error al cargar categorías, proveedores o etiquetas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItemData();
    fetchRelatedData();
  }, [fetchItemData, fetchRelatedData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'quantity' || name === 'low_stock_threshold') {
      let numValue = value === '' ? '' : parseInt(value, 10);
      if (isNaN(numValue) && value !== '') {
        return; 
      }
      setFormData((prev) => ({ ...prev, [name]: numValue < 0 ? 0 : numValue }));
    } else if (name === 'purchase_price') {
      let numValue = value === '' ? '' : parseFloat(value);
      if (isNaN(numValue) && value !== '') {
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: numValue < 0 ? 0 : numValue }));
    } else if (name === 'expiration_date') {
      // Si el valor es una cadena vacía, guardamos null; de lo contrario, el valor de la fecha
      setFormData((prev) => ({ ...prev, [name]: value === '' ? null : value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTagChange = (e) => {
    setFormData((prev) => ({ ...prev, tags: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Crear una copia de formData para enviar, ajustando expiration_date si es null
    const dataToSend = { ...formData };
    if (dataToSend.expiration_date === '') {
      dataToSend.expiration_date = null;
    }

    try {
      if (isEditing) {
        await api.put(`api/inventory/${id}/`, dataToSend);
      } else {
        await api.post('api/inventory/', dataToSend);
      }
      navigate('/inventory');
    } catch (err) {
      console.error('Error submitting item:', err.response?.data || err.message);
      if (err.response && err.response.data) {
        let errorMessages = '';
        for (const key in err.response.data) {
          if (Object.hasOwnProperty.call(err.response.data, key)) {
            errorMessages += `${key}: ${err.response.data[key].join(', ')}\n`;
          }
        }
        setError('Error al guardar el ítem:\n' + errorMessages);
      } else {
        setError('Error al guardar el ítem. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const canEditOrCreate = userRole === 'ADMIN' || userRole === 'GESTOR_INV';

  if (!canEditOrCreate) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">No tienes permisos para acceder a esta página.</Alert>
      </Container>
    );
  }

  if (loading && !formData.name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        {isEditing ? 'Editar Ítem de Inventario' : 'Añadir Nuevo Ítem de Inventario'}
      </Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Nombre del Ítem"
            name="name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            label="Descripción"
            name="description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={formData.description}
            onChange={handleChange}
          />
          <TextField
            label="Número de Serie"
            name="serial_number"
            fullWidth
            margin="normal"
            value={formData.serial_number}
            onChange={handleChange}
          />
          <TextField
            label="Número de Lote"
            name="batch_number"
            fullWidth
            margin="normal"
            value={formData.batch_number}
            onChange={handleChange}
          />
          <TextField
            label="Ubicación en Almacén"
            name="location"
            fullWidth
            margin="normal"
            value={formData.location}
            onChange={handleChange}
          />
          <TextField
            label="Cantidad Actual"
            name="quantity"
            type="number"
            fullWidth
            margin="normal"
            value={formData.quantity}
            onChange={handleChange}
            required
            inputProps={{ min: "0" }}
          />
          <TextField
            label="Umbral de Stock Bajo"
            name="low_stock_threshold"
            type="number"
            fullWidth
            margin="normal"
            value={formData.low_stock_threshold}
            onChange={handleChange}
            required
            inputProps={{ min: "0" }}
          />
          <TextField
            label="Precio de Compra"
            name="purchase_price"
            type="number"
            fullWidth
            margin="normal"
            value={formData.purchase_price}
            onChange={handleChange}
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            label="Fecha de Vencimiento"
            name="expiration_date"
            type="date"
            fullWidth
            margin="normal"
            value={formData.expiration_date || ''} // Asegurarse de que el valor sea '' si es null para el input
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Categoría</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Categoría"
            >
              <MenuItem value=""><em>Ninguna</em></MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Proveedor</InputLabel>
            <Select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              label="Proveedor"
            >
              <MenuItem value=""><em>Ninguno</em></MenuItem>
              {suppliers.map((sup) => (
                <MenuItem key={sup.id} value={sup.id}>{sup.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="tags-label">Etiquetas</InputLabel>
            <Select
              labelId="tags-label"
              multiple
              name="tags"
              value={formData.tags}
              onChange={handleTagChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((tagId) => {
                    const tag = allTags.find(t => t.id === tagId);
                    return tag ? <Chip key={tagId} label={tag.name} /> : null;
                  })}
                </Box>
              )}
              label="Etiquetas"
            >
              {allTags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  {tag.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/inventory')}
              sx={{ borderRadius: 2 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : (isEditing ? 'Guardar Cambios' : 'Añadir Ítem')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ItemForm;
