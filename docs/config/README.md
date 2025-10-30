# Configuración de Cursos

Esta carpeta contiene la configuración centralizada de todos los cursos del sitio web.

## Archivos

### cursos.json

Archivo de configuración principal que define:
- URL de la Cloud Function para obtener datos de YouTube
- Lista de cursos disponibles
- Módulos y playlists de cada curso

## Estructura del archivo cursos.json

```json
{
  "cloudFunctionUrl": "URL_DE_TU_CLOUD_FUNCTION",
  "cursos": [
    {
      "id": "identificador-unico",
      "titulo": "Nombre del Curso",
      "descripcion": "Descripción breve",
      "outputFile": "ruta/del/archivo-generado.json",
      "modulos": [
        {
          "moduloId": 1,
          "playlistId": "ID_PLAYLIST_YOUTUBE",
          "titulo": "Nombre del Módulo",
          "descripcion": "Descripción del módulo",
          "orden": 1
        }
      ]
    }
  ]
}
```

## Campos explicados

### Nivel raíz
- **cloudFunctionUrl**: URL de tu Cloud Function desplegada en Google Cloud que obtiene los datos de YouTube de forma segura

### Objeto curso
- **id**: Identificador único del curso (usar formato kebab-case: `sql-bigquery`, `power-bi`)

- **titulo**: Nombre completo del curso que se mostrará en la web

- **descripcion**: Descripción breve del curso

- **outputFile**: Ruta relativa donde se guardará el JSON generado (ej: `datos/sql-bigquery-playlist.json`)

### Objeto módulo
- **moduloId**: Número único que identifica el módulo dentro del curso

- **playlistId**: ID de la playlist de YouTube (se encuentra en la URL: `https://www.youtube.com/playlist?list=AQUI_ESTA_EL_ID`)

- **titulo**: Nombre del módulo

- **descripcion**: Descripción corta del módulo (nivel, tema, etc.)

- **orden**: Orden en que aparecerá el módulo (1, 2, 3...)

## Cómo agregar un nuevo curso

1. Abre [cursos.json](cursos.json)
2. Agrega un nuevo objeto en el array `cursos`:

```json
{
  "id": "mi-nuevo-curso",
  "titulo": "Mi Nuevo Curso Increíble",
  "descripcion": "Curso completo de...",
  "outputFile": "datos/mi-nuevo-curso-playlist.json",
  "modulos": [
    {
      "moduloId": 1,
      "playlistId": "ABC123XYZ",
      "titulo": "Módulo 1 - Fundamentos",
      "descripcion": "Nivel Básico",
      "orden": 1
    }
  ]
}
```

3. Ejecuta el script de actualización (cuando esté disponible para tu curso)

## Cómo agregar un módulo a un curso existente

1. Localiza el curso en [cursos.json](cursos.json)
2. Agrega un nuevo objeto en el array `modulos`:

```json
{
  "moduloId": 3,
  "playlistId": "NUEVA_PLAYLIST_ID",
  "titulo": "Módulo 3 - Avanzado",
  "descripcion": "Nivel Avanzado",
  "orden": 3
}
```

3. Ejecuta el script de actualización correspondiente

## Scripts que utilizan esta configuración

- [scripts/update-sql-course.js](../scripts/update-sql-course.js) - Actualiza el curso de SQL leyendo esta configuración
- Workflow automático de GitHub Actions: [.github/workflows/update-videos.yml](../.github/workflows/update-videos.yml)

## Ejemplo de uso

Cuando ejecutas:
```bash
node scripts/update-sql-course.js
```

El script:
1. Lee [cursos.json](cursos.json)
2. Busca el curso con `id: "sql-bigquery"`
3. Para cada módulo, llama a la Cloud Function con el `playlistId`
4. Obtiene los videos de YouTube
5. Genera el archivo JSON en la ruta especificada en `outputFile`

## Notas importantes

- Siempre usa el formato correcto de los IDs de YouTube
- Mantén el orden lógico de los módulos (básico → intermedio → avanzado)
- Los `moduloId` deben ser únicos dentro de cada curso
- El `outputFile` debe apuntar a la carpeta [datos/](../datos/)
- La Cloud Function URL debe terminar con `.run.app` (Google Cloud Run)

## Seguridad

Este archivo NO contiene información sensible:
- No incluye API keys
- Solo referencias a playlists públicas de YouTube
- La URL de la Cloud Function es pública pero protegida (rate limiting, CORS)

Para más información sobre seguridad, consulta [SEGURIDAD.md](../SEGURIDAD.md)
