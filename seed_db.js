const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://durqxkxriuijahwbvemv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cnF4a3hyaXVpamFod2J2ZW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTczNzAyNywiZXhwIjoyMTA1MzEzMDI3fQ.QQ_z_5EHElUzLZpMtdmljCX4LWBF46uWz2YbKBYagOY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dataPath = path.join(__dirname, 'database.json');
  if (fs.existsSync(dataPath)) {
    let eventsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Convertir todas las referencias de "imagenes/..." a la URL de Supabase
    const publicUrlPrefix = `${supabaseUrl}/storage/v1/object/public/`;
    
    const replaceUrl = (url) => {
      if (url && url.startsWith('imagenes/')) {
        return publicUrlPrefix + url;
      }
      return url;
    };

    eventsData = eventsData.map(evt => {
      evt.logo = replaceUrl(evt.logo);
      evt.image = replaceUrl(evt.image);
      if (evt.gallery) evt.gallery = evt.gallery.map(replaceUrl);
      if (evt.sponsors) evt.sponsors = evt.sponsors.map(s => ({...s, logo: replaceUrl(s.logo)}));
      if (evt.prNetwork) evt.prNetwork = evt.prNetwork.map(pr => ({...pr, image: replaceUrl(pr.image)}));
      if (evt.djs) evt.djs = evt.djs.map(dj => ({...dj, image: replaceUrl(dj.image)}));
      return evt;
    });

    const { error } = await supabase
      .from('wildfest_data')
      .upsert({ id: 1, events: eventsData });
      
    if (error) {
      console.error('Error insertando datos:', error.message);
    } else {
      console.log('Datos migrados exitosamente con URLs actualizadas.');
    }
  }
}
run();
