const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Configuración básica
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Para servir imagenes estáticas

// Configuración para guardar imágenes subidas
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'imagenes');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Archivo de base de datos JSON local
const dataPath = path.join(__dirname, 'database.json');

// Si no existe la base de datos, la inicializamos con los datos por defecto
if (!fs.existsSync(dataPath)) {
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

// ENDPOINT: Obtener las fiestas
app.get('/api/fiestas', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const rawData = fs.readFileSync(dataPath);
  res.json(JSON.parse(rawData));
});

// ENDPOINT: Guardar las fiestas
app.post('/api/fiestas', (req, res) => {
  fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2));
  res.json({ success: true, message: "Datos actualizados correctamente" });
});

// ENDPOINT: Subir Imagen
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  // Devolvemos la ruta relativa para que el HTML la pueda usar
  res.json({ url: `imagenes/${req.file.filename}` });
});

app.listen(PORT, () => {
  console.log(`🚀 Panel de Administrador corriendo en http://localhost:${PORT}`);
});
