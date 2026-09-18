const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const isVercel = process.env.VERCEL;

// Configuración básica
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Para servir imagenes estáticas

// explicitly serve HTML files for Vercel
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://durqxkxriuijahwbvemv.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cnF4a3hyaXVpamFod2J2ZW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTczNzAyNywiZXhwIjoyMTA1MzEzMDI3fQ.QQ_z_5EHElUzLZpMtdmljCX4LWBF46uWz2YbKBYagOY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración para subir archivos a memoria y luego a Supabase
const upload = multer({ storage: multer.memoryStorage() });

// Autenticación básica
const ADMIN_USER = 'FabrizioPerez';
const ADMIN_PASS = '46829111'; // Contraseña sencilla requerida por el usuario
const AUTH_TOKEN = 'token-admin-wildfest-2026';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: AUTH_TOKEN });
  } else {
    res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
  }
});

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${AUTH_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }
};

// ENDPOINT: Obtener las fiestas (PÚBLICO)
app.get('/api/fiestas', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { data, error } = await supabase.from('wildfest_data').select('events').eq('id', 1).single();
    if (error || !data) {
      // Fallback a database.json local si falla o está vacío
      const localData = fs.readFileSync(path.join(__dirname, 'database.json'));
      return res.json(JSON.parse(localData));
    }
    res.json(data.events);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ENDPOINT: Guardar las fiestas (PROTEGIDO)
app.post('/api/fiestas', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('wildfest_data')
      .upsert({ id: 1, events: req.body });
      
    if (error) throw error;
    res.json({ success: true, message: "Datos actualizados correctamente en Supabase" });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error guardando en Supabase' });
  }
});

// ENDPOINT: Subir Imagen (PROTEGIDO)
app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  
  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = uniqueSuffix + path.extname(req.file.originalname);
    
    const { data, error } = await supabase.storage
      .from('imagenes')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });
      
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage.from('imagenes').getPublicUrl(fileName);
    
    // Devolvemos la URL pública de Supabase
    res.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Error subiendo imagen a Supabase' });
  }
});

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`🚀 Panel de Administrador corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
