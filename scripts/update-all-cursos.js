#!/usr/bin/env node

/**
 * Script universal para actualizar todos los cursos desde YouTube
 * Lee la configuración desde config/cursos.json y actualiza todos los archivos JSON
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Leer configuración
const CONFIG_FILE = path.join(__dirname, '../config/cursos.json');
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

// Estadísticas globales
let totalPlaylists = 0;
let totalVideos = 0;
let totalUnitsUsed = 0;

/**
 * Realiza una petición GET a la Cloud Function
 */
function fetchPlaylist(playlistId) {
  return new Promise((resolve, reject) => {
    const url = `${config.cloudFunctionUrl}?playlistId=${playlistId}&maxResults=60`;

    console.log(`   📡 Obteniendo playlist: ${playlistId.substring(0, 20)}...`);

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (result.success) {
            console.log(`   ✅ ${result.totalVideos} videos obtenidos`);
            if (result.cached) {
              console.log(`      ℹ️  Datos desde caché (${result.cacheAge}s) - Sin consumo de cuota`);
            } else {
              // Estimación: ~1 unidad por video + ~1 para la playlist
              const estimatedUnits = result.totalVideos + 1;
              totalUnitsUsed += estimatedUnits;
              console.log(`      📊 Estimado: ~${estimatedUnits} unidades consumidas`);
            }
            if (result.playlistInfo) {
              console.log(`      📝 Metadata de playlist obtenida`);
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
 * Procesa un curso completo
 */
async function processCurso(curso) {
  console.log(`\n🎓 Procesando: ${curso.titulo}`);
  console.log(`   📋 Módulos a procesar: ${curso.modulos.length}`);

  const cursoData = {
    curso: curso.id,
    titulo: curso.titulo,
    descripcion: curso.descripcion,
    fechaActualizacion: new Date().toISOString(),
    modulos: []
  };

  try {
    // Procesar cada módulo/playlist
    for (const moduloInfo of curso.modulos) {
      console.log(`\n   📚 Módulo ${moduloInfo.moduloId}: ${moduloInfo.titulo}`);

      const playlistData = await fetchPlaylist(moduloInfo.playlistId);
      const videos = playlistData.videos;
      const playlistMetadata = playlistData.playlistInfo;

      totalPlaylists++;
      totalVideos += videos.length;

      cursoData.modulos.push({
        moduloId: moduloInfo.moduloId,
        titulo: moduloInfo.titulo,
        descripcion: moduloInfo.descripcion,
        descripcionLarga: playlistMetadata?.description || '',
        playlistId: moduloInfo.playlistId,
        playlistUrl: `https://www.youtube.com/playlist?list=${moduloInfo.playlistId}`,
        totalVideos: videos.length,
        orden: moduloInfo.orden,
        videos: videos.map((video, index) => ({
          id: video.id,
          titulo: video.title,
          descripcion: video.description,
          thumbnail: video.thumbnail,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          publishedAt: video.publishedAt,
          posicion: video.position !== undefined ? video.position : index,
          duracion: video.duration || null,
          vistas: video.viewCount || 0,
          likes: video.likeCount || 0,
          comentarios: video.commentCount || 0
        }))
      });

      // Pequeña pausa entre requests para no saturar
      if (moduloInfo !== curso.modulos[curso.modulos.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Crear directorio si no existe
    const outputDir = path.dirname(path.join(__dirname, '..', curso.outputFile));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`\n   📁 Directorio creado: ${outputDir}`);
    }

    // Guardar JSON
    const outputPath = path.join(__dirname, '..', curso.outputFile);
    fs.writeFileSync(
      outputPath,
      JSON.stringify(cursoData, null, 2),
      'utf8'
    );

    console.log(`\n   ✅ Archivo guardado: ${curso.outputFile}`);
    console.log(`   📊 Total de videos: ${totalVideos}`);

    return true;

  } catch (error) {
    console.error(`\n   ❌ Error procesando ${curso.titulo}:`, error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando actualización de todos los cursos...\n');
  console.log(`📋 Total de cursos configurados: ${config.cursos.length}\n`);
  console.log('═'.repeat(60));

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  // Procesar cada curso
  for (const curso of config.cursos) {
    const success = await processCurso(curso);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Pausa entre cursos
    if (curso !== config.cursos[config.cursos.length - 1]) {
      console.log('\n' + '─'.repeat(60));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Resumen final
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 ¡Proceso completado!\n');
  console.log('📊 Resumen de actualización:');
  console.log(`   ✅ Cursos actualizados: ${successCount}`);
  if (failCount > 0) {
    console.log(`   ❌ Cursos con errores: ${failCount}`);
  }
  console.log(`   📚 Total de playlists: ${totalPlaylists}`);
  console.log(`   🎬 Total de videos: ${totalVideos}`);
  console.log(`   ⏱️  Tiempo total: ${duration}s`);
  console.log(`\n💰 Consumo estimado de YouTube API:`);
  console.log(`   📊 Unidades utilizadas: ~${totalUnitsUsed}`);
  console.log(`   📈 Cuota diaria: 10,000 unidades`);
  console.log(`   📉 Uso: ${((totalUnitsUsed / 10000) * 100).toFixed(2)}% de la cuota diaria`);

  if (totalUnitsUsed > 5000) {
    console.log(`\n   ⚠️  Advertencia: Has usado más del 50% de tu cuota diaria`);
  }

  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisa los archivos JSON generados');
  console.log('   2. Haz commit de los cambios');
  console.log('   3. Push a GitHub Pages\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

// Ejecutar
main().catch(error => {
  console.error('\n💥 Error fatal:', error.message);
  process.exit(1);
});
