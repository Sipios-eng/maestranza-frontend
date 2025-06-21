// frontend/src/components/ItemForm.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  MenuItem,
  Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const ItemForm = () => {
  const { id } = useParams(); // Para obtener el ID del ítem si estamos editando
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serial_number: '',
    location: '',
    quantity: 0,
    low_stock_threshold: 5,
    purchase_price: 0,
    expiration_date: '',
    category: '', // ID de la categoría
    supplier: '', // ID del proveedor
    tags: [], // Array de IDs de las etiquetas
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados para datos de opciones (categorías, proveedores, tags)
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [tags, setTags] = useState([]);

  const isEditMode = Boolean(id); // Verdadero si hay un ID en la URL

  // Cargar datos del ítem si estamos en modo edición
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Cargar opciones primero
        const [categoriesRes, suppliersRes, tagsRes] = await Promise.all([
          api.get('api/categories/'),
          api.get('api/suppliers/'),
          api.get('api/tags/'),
        ]);
        setCategories(categoriesRes.data.results || categoriesRes.data);
        setSuppliers(suppliersRes.data.results || suppliersRes.data);
        setTags(tagsRes.data.results || tagsRes.data);

        if (isEditMode) {
          const itemRes = await api.get(`api/inventory/${id}/`);
          const itemData = itemRes.data;
          setFormData({
            name: itemData.name || '',
            description: itemData.description || '',
            serial_number: itemData.serial_number || '',
            location: itemData.location || '',
            quantity: itemData.quantity || 0,
            low_stock_threshold: itemData.low_stock_threshold || 5,
            purchase_price: itemData.purchase_price || 0,
            expiration_date: itemData.expiration_date || '',
            category: itemData.category || '',
            supplier: itemData.supplier || '',
            tags: itemData.tags || [],
          });
        }
      } catch (err) {
        console.error('Error al cargar datos del formulario:', err);
        setError('No se pudieron cargar los datos necesarios. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    // CORRECCIÓN: Eliminado 'checked' de la desestructuración
    const { name, value, type } = e.target;
    // Manejo especial para campos numéricos y de selección múltiple (tags)
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        type === 'number'
          ? parseFloat(value) || 0 // Convertir a número, manejar NaN
          : name === 'tags'
          ? Array.isArray(value) ? value : [] // Asegurarse de que tags sea un array
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Formatear la fecha de vencimiento a YYYY-MM-DD si existe, o null
    const dataToSend = {
      ...formData,
      expiration_date: formData.expiration_date || null,
      purchase_price: formData.purchase_price || null, // Permite que sea null si no se ingresa
    };

    try {
      if (isEditMode) {
        await api.put(`api/inventory/${id}/`, dataToSend);
        setSuccess('Ítem actualizado exitosamente!');
      } else {
        await api.post('api/inventory/', dataToSend);
        setSuccess('Ítem creado exitosamente!');
        // Limpiar el formulario después de crear un nuevo ítem
        setFormData({
          name: '',
          description: '',
          serial_number: '',
          location: '',
          quantity: 0,
          low_stock_threshold: 5,
          purchase_price: 0,
          expiration_date: '',
          category: '',
          supplier: '',
          tags: [],
        });
      }
      setTimeout(() => navigate('/inventory'), 2000); // Redirigir después de 2 segundos
    } catch (err) {
      console.error('Error al guardar el ítem:', err.response?.data || err.message);
      setError('Error al guardar el ítem. Por favor, verifica los datos e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando formulario...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        {isEditMode ? 'Editar Ítem de Inventario' : 'Añadir Nuevo Ítem de Inventario'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombre del Ítem"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Serie"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ubicación en Almacén"
              name="location"
              value={formData.location}
              onChange={handleChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cantidad Actual"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              required
              variant="outlined"
              size="small"
              inputProps={{ step: "0.01" }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Umbral de Stock Bajo"
              name="low_stock_threshold"
              type="number"
              value={formData.low_stock_threshold}
              onChange={handleChange}
              required
              variant="outlined"
              size="small"
              inputProps={{ step: "0.01" }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Precio de Compra"
              name="purchase_price"
              type="number"
              value={formData.purchase_price}
              onChange={handleChange}
              variant="outlined"
              size="small"
              inputProps={{ step: "0.01" }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Fecha de Vencimiento"
              name="expiration_date"
              type="date"
              value={formData.expiration_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Categoría"
              name="category"
              value={formData.category}
              onChange={handleChange}
              variant="outlined"
              size="small"
              helperText="Selecciona una categoría"
            >
              <MenuItem value=""><em>Ninguna</em></MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Proveedor"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              variant="outlined"
              size="small"
              helperText="Selecciona un proveedor"
            >
              <MenuItem value=""><em>Ninguno</em></MenuItem>
              {suppliers.map((sup) => (
                <MenuItem key={sup.id} value={sup.id}>
                  {sup.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Etiquetas"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              variant="outlined"
              size="small"
              SelectProps={{
                multiple: true,
              }}
              helperText="Selecciona una o más etiquetas"
            >
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  {tag.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/inventory')}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={submitting}
            sx={{ borderRadius: 2 }}
          >
            {isEditMode ? 'Actualizar Ítem' : 'Crear Ítem'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ItemForm;
