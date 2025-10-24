#!/usr/bin/env node

/**
 * Script para actualizar sql-bigquery-playlist.json
 * Obtiene datos de la Cloud Function y genera el JSON en el formato correcto
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Leer configuración desde config/cursos.json
const configPath = path.join(__dirname, '..', 'config', 'cursos.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Obtener configuración del curso SQL
const sqlCurso = config.cursos.find(c => c.id === 'sql-bigquery');

if (!sqlCurso) {
  console.error('❌ No se encontró la configuración del curso sql-bigquery');
  process.exit(1);
}

const CLOUD_FUNCTION_URL = config.cloudFunctionUrl;

// Descripción larga del módulo 1 (guardada aquí porque es muy extensa)
const DESCRIPCIONES_LARGAS = {
  1: 'Bienvenido a este curso gratuito y completo de SQL nivel básico, diseñado para que cualquier persona —sin experiencia previa— pueda aprender paso a paso a consultar, filtrar y analizar datos como un profesional.\n\n💡No necesitas instalar nada ni pagar por herramientas. Todo el curso se realiza en una plataforma gratuita y en la nube, para que puedas practicar desde cualquier dispositivo con conexión a internet. En esta lista de reproducción encontrarás lecciones explicadas de forma sencilla y progresiva.\n\n🎯 Objetivo del curso:\n\n-Entender cómo funcionan las bases de datos y las consultas SQL.\n-Aprender a obtener información útil a partir de tablas.\n-Desarrollar una base sólida para avanzar a niveles intermedios y aplicar SQL en análisis de datos, -marketing digital o cualquier entorno profesional.\n\n✅ Ventajas del curso:\n\n-100% gratuito y accesible desde el navegador.\n-Lecciones cortas, claras y en español.\n-Ejemplos prácticos que puedes adaptar a tus propios proyectos.\n-Explicaciones guiadas para que entiendas el "por qué" detrás de cada consulta.\n\n📚 Ideal para:\n\n-Principiantes absolutos.\n-Estudiantes o profesionales que quieren iniciarse en análisis de datos.\n-Emprendedores y creadores digitales que buscan entender mejor la información de sus negocios.\n\n🔔 Suscríbete al canal para no perderte los siguientes niveles del curso (intermedio y avanzado) y seguir aprendiendo herramientas de análisis de datos paso a paso.\n\n👨‍💻 Aprende a tu ritmo, sin descargas, sin complicaciones y con explicaciones pensadas para que realmente entiendas cómo funciona SQL.\nEmpieza hoy y da tu primer paso en el mundo del análisis de datos.',
  2: 'Módulo intermedio del curso de SQL en BigQuery, enfocado en manipulación de tablas y técnicas avanzadas.'
};

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

  const url = `${CLOUD_FUNCTION_URL}?playlistId=${moduleConfig.playlistId}&maxResults=50`;

  try {
    const response = await fetchData(url);

    if (!response.success) {
      throw new Error(response.error || 'Error desconocido');
    }

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

    return {
      moduloId: moduleConfig.moduloId,
      titulo: moduleConfig.titulo,
      descripcion: moduleConfig.descripcion,
      descripcionLarga: DESCRIPCIONES_LARGAS[moduleConfig.moduloId] || moduleConfig.descripcion,
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
  console.log('🚀 Actualizando curso de SQL en BigQuery...\n');
  console.log(`📚 Curso: ${sqlCurso.titulo}`);
  console.log(`📦 Módulos configurados: ${sqlCurso.modulos.length}\n`);

  try {
    // Procesar todos los módulos
    const modulos = [];

    for (const moduleConfig of sqlCurso.modulos) {
      const modulo = await processModule(moduleConfig);
      modulos.push(modulo);
    }

    // Preparar JSON final
    const output = {
      curso: sqlCurso.id,
      titulo: sqlCurso.titulo,
      descripcion: sqlCurso.descripcion,
      fechaActualizacion: new Date().toISOString(),
      modulos: modulos
    };

    // Guardar archivo
    const outputPath = path.join(__dirname, '..', sqlCurso.outputFile);
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

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
