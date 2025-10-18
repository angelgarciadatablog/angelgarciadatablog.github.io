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
    recursosNotion: 'recursos-notion'
  }
};

/**
 * Convierte los datos CSV en un array de objetos
 * La primera fila se usa como keys (headers)
 */
function parseCSVToJSON(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  // Primera fila = headers
  const headers = lines[0].split(',').map(h => h.trim());

  // Resto de filas = datos
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

/**
 * Obtiene datos de una pestaña específica del Google Sheet
 * @param {string} sheetName - Nombre de la pestaña
 * @returns {Promise<Array>} Array de objetos con los datos
 */
async function fetchSheetData(sheetName) {
  try {
    const url = `${GOOGLE_SHEETS_CONFIG.baseUrl}${GOOGLE_SHEETS_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`);
    }

    const csvData = await response.text();
    const jsonData = parseCSVToJSON(csvData);

    console.log(`✅ Datos obtenidos de "${sheetName}":`, jsonData);
    return jsonData;

  } catch (error) {
    console.error(`❌ Error al cargar datos de "${sheetName}":`, error);
    return [];
  }
}

/**
 * Obtiene datos de múltiples pestañas
 * @param {Array<string>} sheetNames - Array con nombres de pestañas
 * @returns {Promise<Object>} Objeto con los datos de cada pestaña
 */
async function fetchMultipleSheets(sheetNames) {
  try {
    const promises = sheetNames.map(name => fetchSheetData(name));
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
  async getCursosGratuitos() {
    return await fetchSheetData(GOOGLE_SHEETS_CONFIG.sheets.cursosGratuitos);
  },

  // Obtener recursos de Notion
  async getRecursosNotion() {
    return await fetchSheetData(GOOGLE_SHEETS_CONFIG.sheets.recursosNotion);
  },

  // Obtener ambas pestañas para el home
  async getHomeData() {
    return await fetchMultipleSheets([
      GOOGLE_SHEETS_CONFIG.sheets.cursosGratuitos,
      GOOGLE_SHEETS_CONFIG.sheets.recursosNotion
    ]);
  }
};

// Exportar para uso global
window.GoogleSheets = GoogleSheets;
