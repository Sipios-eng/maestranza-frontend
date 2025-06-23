import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Container, Typography, Box, FormControl, InputLabel, Select, MenuItem,
  Button, TextField, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Grid
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SearchIcon from '@mui/icons-material/Search';
import moment from 'moment'; // Mantener moment.js para el frontend

const ReportsPage = () => {
  const [reportType, setReportType] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedMovementType, setSelectedMovementType] = useState('');

  const [items, setItems] = useState([]);

  const fetchFilterData = useCallback(async () => {
    try {
      const itemsRes = await api.get('api/inventory/');
      setItems(itemsRes.data.results || itemsRes.data);
    } catch (err) {
      console.error('Error fetching filter data:', err);
      setError('No se pudieron cargar los datos para los filtros.');
    }
  }, []);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      let params = { report_type: reportType };

      if (reportType === 'movement_history') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (selectedItemId) params.item_id = selectedItemId;
        if (selectedMovementType) params.movement_type = selectedMovementType;
      }

      const response = await api.get('api/reports/', { params });
      setReportData(response.data);
    } catch (err) {
      console.error('Error generating report:', err.response?.data || err.message);
      setError('Error al generar el reporte. ' + (err.response?.data?.error || 'Verifica tu selección.'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = { report_type: reportType, format: 'pdf' };

      if (reportType === 'movement_history') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (selectedItemId) params.item_id = selectedItemId;
        if (selectedMovementType) params.movement_type = selectedMovementType;
      }

      const response = await api.get('api/reports/', { params, responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${reportType}_report.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exporting PDF:', err.response?.data || err.message);
      // Mejorar el manejo de errores para Blobs que son JSON (errores del backend)
      if (err.response && err.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = async (event) => {
              try {
                  const errorText = event.target.result;
                  const errorJson = JSON.parse(errorText); // Intentar parsear como JSON
                  setError('Error al exportar el reporte: ' + (errorJson.error || JSON.stringify(errorJson)));
              } catch (parseError) {
                  // Si no es JSON, mostrar el mensaje de error general
                  setError('Error al exportar el reporte: ' + (err.response.statusText || err.message || 'Error desconocido del servidor.'));
              }
          };
          reader.readAsText(err.response.data);
      } else {
          setError('Error al exportar el reporte: ' + (err.response?.data?.error || err.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderReportFilters = () => {
    if (reportType === 'movement_history') {
      return (
        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}> {/* Restaurado 'item' prop, es una prop válida para Grid container/item */}
            <TextField
              label="Fecha Inicio"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}> {/* Restaurado 'item' prop */}
            <TextField
              label="Fecha Fin"
              type="date"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}> {/* Restaurado 'item' prop */}
            <FormControl fullWidth>
              <InputLabel>Ítem</InputLabel>
              <Select
                value={selectedItemId}
                label="Ítem"
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {items.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}> {/* Restaurado 'item' prop */}
            <FormControl fullWidth>
              <InputLabel>Tipo Movimiento</InputLabel>
              <Select
                value={selectedMovementType}
                label="Tipo Movimiento"
                onChange={(e) => setSelectedMovementType(e.target.value)}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                <MenuItem value="ENTRADA">Entrada</MenuItem>
                <MenuItem value="SALIDA">Salida</MenuItem>
                <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                <MenuItem value="DEVOLUCION">Devolución</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      );
    }
    return null;
  };

  const renderReportTable = () => {
    if (!reportData || reportData.data.length === 0) {
      return <Alert severity="info" sx={{ mt: 3 }}>No hay datos para el reporte seleccionado o los filtros aplicados.</Alert>;
    }

    if (reportData.report_type === 'current_stock' || reportData.report_type === 'low_stock' || reportData.report_type === 'expiring_soon') {
      return (
        <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table aria-label="inventory report table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Número de Serie</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Umbral Bajo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Fecha Vencimiento</TableCell>
                <TableCell>Estado Stock</TableCell>
                <TableCell>Estado Vencimiento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell component="th" scope="row">
                    {item.name}
                  </TableCell>
                  <TableCell>{item.serial_number || 'N/A'}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{item.low_stock_threshold}</TableCell>
                  <TableCell>{item.category_name || 'N/A'}</TableCell>
                  <TableCell>{item.supplier_name || 'N/A'}</TableCell>
                  <TableCell>{item.expiration_date ? moment(item.expiration_date).format('DD/MM/YYYY') : 'N/A'}</TableCell>
                  <TableCell>
                    <span style={{ color: item.is_low_stock ? 'red' : 'green', fontWeight: 'bold' }}>
                      {item.is_low_stock ? 'Bajo' : 'Normal'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ color: item.is_expired ? 'darkred' : (item.is_expiring_soon ? 'orange' : 'green'), fontWeight: 'bold' }}>
                      {item.is_expired ? 'VENCIDO' : (item.is_expiring_soon ? 'Pronto' : 'Normal')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else if (reportData.report_type === 'movement_history') {
      return (
        <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table aria-label="movement report table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell>Ítem</TableCell>
                <TableCell>Tipo Movimiento</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell>Realizado por</TableCell>
                <TableCell>Fecha y Hora</TableCell>
                <TableCell>Proyecto</TableCell>
                <TableCell>Notas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.data.map((movement) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Generación de Informes
      </Typography>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Seleccionar Tipo de Informe</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="report-type-label">Tipo de Reporte</InputLabel>
          <Select
            labelId="report-type-label"
            value={reportType}
            label="Tipo de Reporte"
            onChange={(e) => {
              setReportType(e.target.value);
              setReportData(null);
              setError(null);
            }}
          >
            <MenuItem value=""><em>Selecciona un tipo de reporte</em></MenuItem>
            <MenuItem value="current_stock">Stock Actual</MenuItem>
            <MenuItem value="low_stock">Stock Bajo</MenuItem>
            <MenuItem value="expiring_soon">Por Vencer Pronto</MenuItem>
            <MenuItem value="movement_history">Historial de Movimientos</MenuItem>
          </Select>
        </FormControl>

        {reportType && renderReportFilters()}

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={handleGenerateReport}
            disabled={!reportType || loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generar Reporte'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPdf}
            disabled={!reportType || loading || !reportData || reportData.data.length === 0}
            sx={{ borderRadius: 2 }}
          >
            Exportar PDF
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      {reportData && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Resultados del Reporte: {reportData.report_type.replace('_', ' ').toUpperCase()}
          </Typography>
          {renderReportTable()}
        </Box>
      )}
    </Container>
  );
};

export default ReportsPage;