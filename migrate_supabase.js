const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://durqxkxriuijahwbvemv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cnF4a3hyaXVpamFod2J2ZW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTczNzAyNywiZXhwIjoyMTA1MzEzMDI3fQ.QQ_z_5EHElUzLZpMtdmljCX4LWBF46uWz2YbKBYagOY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Creando bucket imagenes en Supabase...');
  const { data, error } = await supabase.storage.createBucket('imagenes', { public: true });
  if (error && error.message !== 'The resource already exists') {
    console.error('Error creando bucket:', error);
  } else {
    console.log('Bucket "imagenes" listo.');
  }

  console.log('Subiendo imágenes locales a Supabase...');
  const imgDir = path.join(__dirname, 'imagenes');
  if (fs.existsSync(imgDir)) {
    const files = fs.readdirSync(imgDir);
    for (const file of files) {
      const filePath = path.join(imgDir, file);
      if (fs.statSync(filePath).isFile()) {
        const fileBuffer = fs.readFileSync(filePath);
        // Usar mimetype correcto heurísticamente
        let contentType = 'image/jpeg';
        if (file.endsWith('.png')) contentType = 'image/png';
        if (file.endsWith('.svg')) contentType = 'image/svg+xml';
        if (file.endsWith('.webp')) contentType = 'image/webp';
        if (file.endsWith('.gif')) contentType = 'image/gif';
        
        await supabase.storage.from('imagenes').upload(file, fileBuffer, { upsert: true, contentType });
        console.log(`- ${file} subido.`);
      }
    }
  }
  
  console.log('\n--- TAREA FINALIZADA ---');
}

run();
