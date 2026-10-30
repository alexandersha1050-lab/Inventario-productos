const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'productos.json');

app.use(cors());
app.use(express.json());
// Archivos de la app (solo estos se publican, el resto del proyecto queda privado)
const PUBLICOS = ['index.html', 'manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png', 'icon.svg'];
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/:archivo', (req, res, next) => {
  if (!PUBLICOS.includes(req.params.archivo)) return next();
  res.sendFile(path.join(__dirname, req.params.archivo));
});

// ---- "Base de datos" simple en archivo JSON ----
function leer() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function guardar(datos) {
  fs.writeFileSync(DB_FILE, JSON.stringify(datos, null, 2));
}

function validar(body) {
  const { nombre, cantidad, precio } = body;
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) return 'El nombre es obligatorio';
  if (cantidad === undefined || isNaN(Number(cantidad)) || Number(cantidad) < 0) return 'La cantidad debe ser un número >= 0';
  if (precio === undefined || isNaN(Number(precio)) || Number(precio) < 0) return 'El precio debe ser un número >= 0';
  return null;
}

// ---- CRUD ----
// GET: listar todos
app.get('/api/productos', (req, res) => {
  res.json(leer());
});

// GET: uno por id
app.get('/api/productos/:id', (req, res) => {
  const p = leer().find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(p);
});

// POST: crear
app.post('/api/productos', (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  const datos = leer();
  const nuevo = {
    id: datos.length ? Math.max(...datos.map(d => d.id)) + 1 : 1,
    nombre: req.body.nombre.trim(),
    categoria: (req.body.categoria || '').trim(),
    cantidad: Number(req.body.cantidad),
    precio: Number(req.body.precio)
  };
  datos.push(nuevo);
  guardar(datos);
  res.status(201).json(nuevo);
});

// PUT: actualizar
app.put('/api/productos/:id', (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  const datos = leer();
  const i = datos.findIndex(x => x.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  datos[i] = {
    id: datos[i].id,
    nombre: req.body.nombre.trim(),
    categoria: (req.body.categoria || '').trim(),
    cantidad: Number(req.body.cantidad),
    precio: Number(req.body.precio)
  };
  guardar(datos);
  res.json(datos[i]);
});

// DELETE: eliminar
app.delete('/api/productos/:id', (req, res) => {
  const datos = leer();
  const i = datos.findIndex(x => x.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  const [borrado] = datos.splice(i, 1);
  guardar(datos);
  res.json({ mensaje: 'Producto eliminado', producto: borrado });
});

app.listen(PORT, () => console.log(`Servidor listo en http://localhost:${PORT}`));
