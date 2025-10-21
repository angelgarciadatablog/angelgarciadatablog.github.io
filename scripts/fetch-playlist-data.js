#!/usr/bin/env node

/**
 * Script para obtener datos de playlists de YouTube
 * y generar el archivo JSON para uso en la web
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  cloudFunctionUrl: 'https://getyoutubevideos-35759247090.us-central1.run.app',
  outputFile: path.join(__dirname, '../datos/playlists.json'),

  // Definir las playlists del curso
  playlists: [
    {
      id: 'PLV4oS06_KpqbnahoXdN-A8Ql9zVblYUJl',
      moduloId: 1,
      titulo: 'Cláusulas Principales de SQL',
      descripcion: 'Nivel Básico',
      orden: 1
    },
    {
      id: 'PLV4oS06_KpqY-NCxlYCYMPENL0EUTLNuU',
      moduloId: 2,
      titulo: 'Manipulación de tablas',
      descripcion: 'Nivel Intermedio 2.1',
      orden: 2
    }
  ]
};

/**
 * Realiza una petición GET a la Cloud Function
 */
function fetchPlaylist(playlistId) {
  return new Promise((resolve, reject) => {
    const url = `${CONFIG.cloudFunctionUrl}?playlistId=${playlistId}&maxResults=60`;

    console.log(`\n📡 Obteniendo playlist: ${playlistId}...`);

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (result.success) {
            console.log(`✅ ${result.totalVideos} videos obtenidos`);
            if (result.cached) {
              console.log(`   ℹ️  Datos desde caché (${result.cacheAge}s)`);
            }
            if (result.playlistInfo) {
              console.log(`   📝 Descripción de playlist obtenida`);
            }
            resolve({
              videos: result.data,
              playlistInfo: result.playlistInfo || null
            });
          } else {
            reject(new Error(result.message || 'Error al obtener datos'));
          }
        } catch (error) {
          reject(new Error(`Error al parsear respuesta: ${error.message}`));
        }
      });

    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Procesa todas las playlists y genera el JSON
 */
async function generatePlaylistsJSON() {
  console.log('🚀 Iniciando obtención de datos de playlists...\n');
  console.log(`📋 Total de playlists a procesar: ${CONFIG.playlists.length}`);

  const cursoData = {
    curso: 'sql-bigquery',
    titulo: 'Curso de SQL en BigQuery',
    descripcion: 'Curso completo de SQL usando Google BigQuery',
    fechaActualizacion: new Date().toISOString(),
    modulos: []
  };

  try {
    // Procesar cada playlist
    for (const playlistInfo of CONFIG.playlists) {
      const playlistData = await fetchPlaylist(playlistInfo.id);
      const videos = playlistData.videos;
      const playlistMetadata = playlistData.playlistInfo;

      cursoData.modulos.push({
        moduloId: playlistInfo.moduloId,
        titulo: playlistInfo.titulo,
        descripcion: playlistInfo.descripcion,
        descripcionLarga: playlistMetadata?.description || '',
        playlistId: playlistInfo.id,
        playlistUrl: `https://www.youtube.com/playlist?list=${playlistInfo.id}`,
        totalVideos: videos.length,
        orden: playlistInfo.orden,
        videos: videos.map((video, index) => ({
          id: video.id,
          titulo: video.title,
          descripcion: video.description,
          thumbnail: video.thumbnail,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          publishedAt: video.publishedAt,
          posicion: video.position !== undefined ? video.position : index
        }))
      });

      // Pequeña pausa entre requests
      if (playlistInfo !== CONFIG.playlists[CONFIG.playlists.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Crear directorio si no existe
    const outputDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`\n📁 Directorio creado: ${outputDir}`);
    }

    // Guardar JSON
    fs.writeFileSync(
      CONFIG.outputFile,
      JSON.stringify(cursoData, null, 2),
      'utf8'
    );

    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log(`📄 Archivo generado: ${CONFIG.outputFile}`);
    console.log(`\n📊 Resumen:`);
    console.log(`   - Total de módulos: ${cursoData.modulos.length}`);
    cursoData.modulos.forEach(modulo => {
      console.log(`   - ${modulo.titulo}: ${modulo.totalVideos} videos`);
    });
    console.log(`\n💡 Próximo paso: Actualizar sql-bigquery.html para usar este JSON`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
generatePlaylistsJSON();
