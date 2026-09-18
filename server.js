const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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

const isVercel = process.env.VERCEL;
const dataPath = isVercel ? path.join('/tmp', 'database.json') : path.join(__dirname, 'database.json');
const imgDir = isVercel ? path.join('/tmp', 'imagenes') : path.join(__dirname, 'imagenes');

// Configuración para guardar imágenes subidas
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(imgDir)){
        fs.mkdirSync(imgDir, { recursive: true });
    }
    cb(null, imgDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Servir la carpeta de imágenes (en Vercel será /tmp/imagenes y fallback a local)
if (isVercel) {
  app.use('/imagenes', express.static(path.join('/tmp', 'imagenes')));
}
app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));

// Si no existe la base de datos, la inicializamos
if (!fs.existsSync(dataPath)) {
  if (isVercel && fs.existsSync(path.join(__dirname, 'database.json'))) {
    // En Vercel, copiamos la db original la primera vez (Cold Start)
    fs.copyFileSync(path.join(__dirname, 'database.json'), dataPath);
  } else {
    const initialData = [
        {
          slug: "wild-fest",
          name: "Wild Fest",
          logo: "imagenes/logo-wild.jpg",
          logoWidth: "250px",
          theme: "Jungle & Neon",
          color: "#39FF14",
          date: "2026-10-31T23:30:00-03:00",
          image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1920&auto=format&fit=crop",
          prNetwork: []
        },
        {
          slug: "geminis",
          name: "Geminis",
          logo: "imagenes/logo-geminis.jpg",
          logoWidth: "250px",
          theme: "Esotérico & Deep Dark",
          color: "#FF00FF",
          date: "2026-11-15T23:00:00-03:00",
          image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=1920&auto=format&fit=crop",
          prNetwork: []
        },
        {
          slug: "70-30",
          name: "70/30",
          logo: "imagenes/logo_7030.jpg",
          logoWidth: "250px",
          theme: "Retro & Disco",
          color: "#00FFFF",
          date: "2026-12-05T23:30:00-03:00",
          image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?q=80&w=1920&auto=format&fit=crop",
          prNetwork: []
        }
      ];
      fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
  }
}

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
app.get('/api/fiestas', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const rawData = fs.readFileSync(dataPath);
  res.json(JSON.parse(rawData));
});

// ENDPOINT: Guardar las fiestas (PROTEGIDO)
app.post('/api/fiestas', requireAuth, (req, res) => {
  fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2));
  res.json({ success: true, message: "Datos actualizados correctamente" });
});

// ENDPOINT: Subir Imagen (PROTEGIDO)
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  // Devolvemos la ruta relativa para que el HTML la pueda usar
  res.json({ url: `imagenes/${req.file.filename}` });
});

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`🚀 Panel de Administrador corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
