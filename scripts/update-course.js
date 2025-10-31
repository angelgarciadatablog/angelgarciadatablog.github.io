#!/usr/bin/env node

/**
 * Script UNIVERSAL para actualizar cualquier curso
 * Lee config/cursos.json y actualiza el curso especificado
 *
 * Uso:
 *   node scripts/update-course.js <cursoId>
 *
 * Ejemplos:
 *   node scripts/update-course.js sql-bigquery --clear-cache
 *   node scripts/update-course.js power-bi --clear-cache
 *   node scripts/update-course.js google-analytics --clear-cache
 *   node scripts/update-course.js mi-nuevo-curso --clear-cache
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Obtener cursoId y clearCache desde argumentos de línea de comando
const cursoId = process.argv[2];
const clearCache = process.argv.includes('--clear-cache');

if (!cursoId) {
  console.error('❌ Error: Debes especificar el ID del curso');
  console.log('\n📖 Uso:');
  console.log('   node scripts/update-course.js <cursoId> [--clear-cache]');
  console.log('\n📚 Ejemplos:');
  console.log('   node scripts/update-course.js sql-bigquery');
  console.log('   node scripts/update-course.js power-bi --clear-cache');
  console.log('   node scripts/update-course.js google-analytics --clear-cache');
  console.log('\n💡 Los IDs de cursos están definidos en: config/cursos.json');
  console.log('💡 Usa --clear-cache para forzar actualización ignorando caché de 12h');
  process.exit(1);
}

// Leer configuración desde config/cursos.json
const configPath = path.join(__dirname, '..', 'config', 'cursos.json');

if (!fs.existsSync(configPath)) {
  console.error('❌ Error: No se encontró el archivo config/cursos.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Buscar el curso por ID
const curso = config.cursos.find(c => c.id === cursoId);

if (!curso) {
  console.error(`❌ Error: No se encontró el curso con id "${cursoId}"`);
  console.log('\n📚 Cursos disponibles:');
  config.cursos.forEach(c => {
    console.log(`   - ${c.id} (${c.titulo})`);
  });
  console.log('\n💡 Para agregar un curso nuevo, edita: config/cursos.json');
  process.exit(1);
}

const CLOUD_FUNCTION_URL = config.cloudFunctionUrl;

/**
 * Fetch con promesa
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Procesar un módulo
 */
async function processModule(moduleConfig) {
  console.log(`\n📥 Obteniendo módulo ${moduleConfig.moduloId}: ${moduleConfig.titulo}...`);

  let url = `${CLOUD_FUNCTION_URL}?playlistId=${moduleConfig.playlistId}&maxResults=50`;

  // Agregar parámetro clearCache si se especificó
  if (clearCache) {
    url += '&clearCache=true';
    console.log('   🔄 Forzando actualización (ignorando caché)...');
  }

  try {
    const response = await fetchData(url);

    if (!response.success) {
      throw new Error(response.error || 'Error desconocido');
    }

    // Obtener información de la playlist (incluye description)
    const playlistInfo = response.playlistInfo || {};

    // Transformar videos al formato esperado
    const videos = response.data.map((video, index) => ({
      id: video.id,
      titulo: video.title,
      descripcion: video.description,
      thumbnail: video.thumbnail,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      publishedAt: video.publishedAt,
      posicion: video.position !== undefined ? video.position : index,
      duracion: video.duration || 'PT0S',
      vistas: video.viewCount || 0,
      likes: video.likeCount || 0,
      comentarios: video.commentCount || 0
    }));

    console.log(`   ✅ ${videos.length} videos obtenidos`);

    // Determinar descripcionLarga:
    // 1. Si está en config/cursos.json, usar esa
    // 2. Si no, usar la descripción de la playlist de YouTube
    // 3. Si no hay ninguna, usar la descripción corta del config
    const descripcionLarga = moduleConfig.descripcionLarga
                          || playlistInfo.description
                          || moduleConfig.descripcion;

    return {
      moduloId: moduleConfig.moduloId,
      titulo: moduleConfig.titulo,
      descripcion: moduleConfig.descripcion,
      descripcionLarga: descripcionLarga,
      playlistId: moduleConfig.playlistId,
      playlistUrl: `https://www.youtube.com/playlist?list=${moduleConfig.playlistId}`,
      orden: moduleConfig.orden,
      totalVideos: videos.length,
      videos: videos
    };

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Main
 */
async function main() {
  console.log(`🚀 Actualizando curso: ${curso.titulo}\n`);
  console.log(`📚 ID del curso: ${curso.id}`);
  console.log(`📦 Módulos configurados: ${curso.modulos.length}`);
  console.log(`📄 Archivo de salida: ${curso.outputFile}`);
  if (clearCache) {
    console.log(`🔄 Modo: Forzar actualización (caché ignorado)`);
  }
  console.log('');

  try {
    // Procesar todos los módulos
    const modulos = [];

    for (const moduleConfig of curso.modulos) {
      const modulo = await processModule(moduleConfig);
      modulos.push(modulo);
    }

    // Preparar JSON final
    const output = {
      curso: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      fechaActualizacion: new Date().toISOString(),
      modulos: modulos
    };

    // Guardar archivo
    const outputPath = path.join(__dirname, '..', curso.outputFile);

    // Crear directorio si no existe
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log(`\n✅ Archivo actualizado: ${outputPath}`);
    console.log(`📊 Total de módulos: ${modulos.length}`);
    console.log(`📊 Total de videos: ${modulos.reduce((sum, m) => sum + m.totalVideos, 0)}`);

    // Mostrar resumen
    console.log('\n📋 Resumen:');
    modulos.forEach(m => {
      console.log(`   - Módulo ${m.moduloId} (${m.titulo}): ${m.totalVideos} videos`);
    });

    console.log('\n💡 Para agregar más módulos, edita: config/cursos.json');
    console.log(`💡 Curso actualizado: ${curso.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
