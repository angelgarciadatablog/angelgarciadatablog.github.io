/**
 * Google Sheets API Integration
 * Conexión simple sin autenticación para hojas públicas
 */

const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: '1elCq8KOmeXghYSzVq9PEbIh5F_T5wxd1Gqh1vyNqg3E',
  baseUrl: 'https://docs.google.com/spreadsheets/d/',

  // Pestañas disponibles
  sheets: {
    cursosGratuitos: 'cursos-gratuitos',
    recursosNotion: 'recursos-notion',
    videosImportantes: 'videos-importantes',
    lineaTiempo: 'linea-tiempo'
  },

  // Duración del caché en milisegundos (60 minutos)
  cacheDuration: 60 * 60 * 1000
};

// Cache en memoria (más rápido durante la sesión actual)
const memoryCache = {};

/**
 * Convierte los datos CSV en un array de objetos
 * La primera fila se usa como keys (headers)
 * Maneja correctamente campos con comas (entre comillas)
 */
function parseCSVToJSON(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  /**
   * Parsea una línea CSV manejando campos entre comillas
   */
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Comillas dobles escapadas
          current += '"';
          i++;
        } else {
          // Toggle estado de comillas
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Fin de campo
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Agregar último campo
    result.push(current.trim());

    return result;
  }

  // Parsear headers
  const headers = parseCSVLine(lines[0]);

  // Parsear datos
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue; // Saltar líneas vacías

    const values = parseCSVLine(lines[i]);
    const obj = {};

    headers.forEach((header, index) => {
      // Limpiar comillas de los valores
      let value = values[index] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      obj[header] = value;
    });

    data.push(obj);
  }

  return data;
}

/**
 * Obtiene datos del caché (memoria o localStorage)
 */
function getCachedData(sheetName) {
  // 1. Revisar cache en memoria primero (más rápido)
  if (memoryCache[sheetName]) {
    const cached = memoryCache[sheetName];
    if (Date.now() - cached.timestamp < GOOGLE_SHEETS_CONFIG.cacheDuration) {
      console.log(`💾 Usando datos en caché de memoria para "${sheetName}"`);
      return cached.data;
    }
  }

  // 2. Revisar localStorage
  try {
    const cacheKey = `gs_${GOOGLE_SHEETS_CONFIG.spreadsheetId}_${sheetName}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < GOOGLE_SHEETS_CONFIG.cacheDuration) {
        console.log(`💾 Usando datos en caché de localStorage para "${sheetName}"`);
        // Actualizar memoria cache también
        memoryCache[sheetName] = { data, timestamp };
        return data;
      }
    }
  } catch (error) {
    console.warn('⚠️ Error leyendo caché:', error);
  }

  return null;
}

/**
 * Guarda datos en el caché (memoria y localStorage)
 */
function setCachedData(sheetName, data) {
  const timestamp = Date.now();

  // Guardar en memoria
  memoryCache[sheetName] = { data, timestamp };

  // Guardar en localStorage
  try {
    const cacheKey = `gs_${GOOGLE_SHEETS_CONFIG.spreadsheetId}_${sheetName}`;
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp }));
    console.log(`💾 Datos guardados en caché para "${sheetName}" (válido por ${GOOGLE_SHEETS_CONFIG.cacheDuration / 1000 / 60} minutos)`);
  } catch (error) {
    console.warn('⚠️ Error guardando caché (localStorage lleno?):', error);
  }
}

/**
 * Limpia el caché (útil para forzar actualización)
 */
function clearCache(sheetName = null) {
  if (sheetName) {
    // Limpiar caché de una pestaña específica
    delete memoryCache[sheetName];
    try {
      const cacheKey = `gs_${GOOGLE_SHEETS_CONFIG.spreadsheetId}_${sheetName}`;
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Caché limpiado para "${sheetName}"`);
    } catch (error) {
      console.warn('⚠️ Error limpiando caché:', error);
    }
  } else {
    // Limpiar todo el caché del spreadsheet
    Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
    try {
      const prefix = `gs_${GOOGLE_SHEETS_CONFIG.spreadsheetId}_`;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log(`🗑️ Todo el caché limpiado`);
    } catch (error) {
      console.warn('⚠️ Error limpiando caché:', error);
    }
  }
}

/**
 * Obtiene datos de una pestaña específica del Google Sheet
 * @param {string} sheetName - Nombre de la pestaña
 * @param {boolean} forceRefresh - Si true, ignora el caché y obtiene datos frescos
 * @returns {Promise<Array>} Array de objetos con los datos
 */
async function fetchSheetData(sheetName, forceRefresh = false) {
  try {
    // Revisar caché si no se fuerza actualización
    if (!forceRefresh) {
      const cachedData = getCachedData(sheetName);
      if (cachedData) {
        return cachedData;
      }
    }

    // Obtener datos frescos del Google Sheet
    const url = `${GOOGLE_SHEETS_CONFIG.baseUrl}${GOOGLE_SHEETS_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    console.log(`📥 Obteniendo datos frescos de "${sheetName}"...`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`);
    }

    const csvData = await response.text();
    const jsonData = parseCSVToJSON(csvData);

    console.log(`✅ ${jsonData.length} filas obtenidas de "${sheetName}"`);

    // Guardar en caché
    setCachedData(sheetName, jsonData);

    return jsonData;

  } catch (error) {
    console.error(`❌ Error al cargar datos de "${sheetName}":`, error);
    return [];
  }
}

/**
 * Obtiene datos de múltiples pestañas
 * @param {Array<string>} sheetNames - Array con nombres de pestañas
 * @param {boolean} forceRefresh - Si true, ignora el caché
 * @returns {Promise<Object>} Objeto con los datos de cada pestaña
 */
async function fetchMultipleSheets(sheetNames, forceRefresh = false) {
  try {
    const promises = sheetNames.map(name => fetchSheetData(name, forceRefresh));
    const results = await Promise.all(promises);

    const data = {};
    sheetNames.forEach((name, index) => {
      data[name] = results[index];
    });

    return data;

  } catch (error) {
    console.error('❌ Error al cargar múltiples pestañas:', error);
    return {};
  }
}

/**
 * Funciones específicas para cada pestaña
 */
const GoogleSheets = {
  // Obtener cursos gratuitos
  async getCursosGratuitos(forceRefresh = false) {
    return await fetchSheetData(GOOGLE_SHEETS_CONFIG.sheets.cursosGratuitos, forceRefresh);
  },

  // Obtener recursos de Notion
  async getRecursosNotion(forceRefresh = false) {
    return await fetchSheetData(GOOGLE_SHEETS_CONFIG.sheets.recursosNotion, forceRefresh);
  },

  // Obtener videos importantes
  async getVideosImportantes(forceRefresh = false) {
    return await fetchSheetData(GOOGLE_SHEETS_CONFIG.sheets.videosImportantes, forceRefresh);
  },

  // Obtener línea de tiempo
  async getLineaTiempo(forceRefresh = false) {
    return await fetchSheetData(GOOGLE_SHEETS_CONFIG.sheets.lineaTiempo, forceRefresh);
  },

  // Obtener ambas pestañas para el home
  async getHomeData(forceRefresh = false) {
    return await fetchMultipleSheets([
      GOOGLE_SHEETS_CONFIG.sheets.cursosGratuitos,
      GOOGLE_SHEETS_CONFIG.sheets.recursosNotion
    ], forceRefresh);
  },

  // Limpiar caché (para forzar actualización manual)
  clearCache: clearCache,

  // Obtener información del caché
  getCacheInfo() {
    const info = {
      cacheDuration: `${GOOGLE_SHEETS_CONFIG.cacheDuration / 1000 / 60} minutos`,
      cachedSheets: []
    };

    // Info de memoria cache
    Object.keys(memoryCache).forEach(sheetName => {
      const cached = memoryCache[sheetName];
      const age = Date.now() - cached.timestamp;
      const remainingTime = Math.max(0, GOOGLE_SHEETS_CONFIG.cacheDuration - age);
      info.cachedSheets.push({
        sheet: sheetName,
        type: 'memoria',
        age: `${Math.floor(age / 1000)} segundos`,
        remaining: `${Math.floor(remainingTime / 1000)} segundos`,
        items: cached.data.length
      });
    });

    return info;
  }
};

// Exportar para uso global
window.GoogleSheets = GoogleSheets;
