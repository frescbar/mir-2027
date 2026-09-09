# MIR/27 · Entrenamiento personal

Proyecto independiente de Cultura365. La web está en `https://mir-2027.vercel.app` y su raíz de despliegue es `docs`.

## Versión 1.1

Banco buscable por texto, asignatura, año y estado; comentarios de las fuentes con página; preguntas históricas de cuatro o cinco opciones; imágenes privadas ampliables; diez preguntas diarias por defecto y tamaño configurable de 5 a 50; modo mixto opcional; repasos, notas, favoritas, estadísticas; simulacros cronometrados con corrección al entregar; cuadernos A4 mediante impresión del navegador.

Las sesiones nuevas conservan una copia del contenido usado para que una actualización del banco no cambie retrospectivamente sus preguntas, opciones o claves. Las lecturas tienen paginación y búsqueda en el texto completo. La corrección identifica la respuesta por su texto y evita confundirla con la numeración de opciones mezcladas.

### Estado del contenido a 9 de septiembre de 2026

La copia privada preparada contiene 3.241 preguntas, 621 lecturas, 202 tarjetas y 221 imágenes. Tras detectar errores de extracción, 2.832 preguntas quedan habilitadas y 409 apartadas de la selección automática. El filtrado es estructural, no una revisión clínica.

La incorporación autorizada a Supabase se completó: 50 lotes, 4.856 registros procesados y ninguno rechazado. La web contiene 3.250 preguntas (3.241 del corpus y 9 previas conservadas), 621 lecturas, 202 tarjetas, 221 fichas de atlas con imagen, 221 imágenes, 324 temas y 26 fuentes. Hay 2.841 preguntas habilitadas para practicar y 409 apartadas de la selección automática.

Se verificó por hash que los enunciados, opciones, claves y comentarios importados coinciden con el archivo preparado y que las 221 imágenes coinciden íntegramente. No quedan referencias a imágenes inexistentes. El progreso anterior sigue idéntico; se comprobaron la lectura autorizada, el guardado y los conflictos de revisión en una transacción revertida. La vía temporal de carga quedó cerrada. Véase [el registro de verificación](ops/VERIFICATION.md).

### Verificación reproducible

`npm ci && npm test` ejecuta las pruebas del motor y de la interfaz en DOM simulado, con datos sintéticos y almacenamiento IndexedDB de prueba. No envía datos ni modifica la cuenta del usuario. Para comprobar también un banco privado local: `MIR_TEST_BANK=/ruta/fuera/del/repositorio/bank.json npm test`.

`python3 scripts/prepare-bank.py ENTRADA.json SALIDA.json` normaliza etiquetas y aparta extracciones anómalas sin inventar contenido clínico. `python3 scripts/build-private.py BANCO.json SALIDA.html` crea una copia autocontenida. Las entradas y salidas privadas deben permanecer fuera del repositorio.

Las funciones se han probado con un corpus documental privado mediante pruebas unitarias y de interfaz en un entorno controlado. Esto **no** certifica revisión clínica completa ni sustituye una prueba de extremo a extremo con el navegador y cuenta del usuario.

## Arquitectura

- `core-v1.js`: selección, sesiones, corrección, intervalos y combinación de progreso.
- `store-v1.js`: Supabase Auth/REST, banco paginado, imágenes bajo demanda y guardado con detección de conflictos.
- `app-v1.js`: interfaz y transferencia autorizada del paquete privado.
- `print-v1.js`: cuadernos de preguntas y comentarios, sin exponer soluciones antes de entregar un examen.
- `mir_content` y `mir_media`: contenido documental privado con RLS y acceso de miembros.
- `mir_import_batch`: importación autenticada de administrador, por lotes e identificadores estables.
- `mir_save_state`: guardado exclusivo del usuario con control de revisión.

Las tablas y ficheros de la versión piloto se conservan como respaldo. El índice carga exclusivamente los ficheros `*-v1`.

## Importación del banco

El código público **no contiene** los PDF, comentarios ni imágenes privadas. Desplegar este repositorio no equivale a importar el corpus.

El paquete local `MIR27.html` incluye su propio banco. Desde **Biblioteca y copias → Conectar este banco con mi web**, el usuario abre su web, entra con la cuenta existente y autoriza la incorporación. El navegador transmite el banco directamente al proyecto Supabase; no transmite contraseñas al archivo local ni utiliza Drive.

Alternativa: el administrador puede importar el JSON privado desde la web. La importación se puede repetir porque actualiza por identificador; no genera una copia por cada ejecución. El progreso local y el progreso web son diferentes hasta exportarlos/combinarlos expresamente.

## Privacidad

El cliente utiliza solamente una clave publicable. Nunca añadir claves secretas, sesiones de acceso, bancos personales, PDFs ni imágenes clínicas al repositorio público. Las políticas restringen la lectura a miembros y la importación a administradores.

El guardado local utiliza IndexedDB. Se recomienda exportar copias; el historial local no es una copia duradera en la unidad D: y limpiar los datos del navegador puede borrarlo.

## Límites explícitos

- Comentarios históricos conservados como fuente, no como revisión clínica vigente.
- Preguntas anuladas, con discrepancias, sin imagen necesaria o con problemas de extracción quedan fuera del entrenamiento automático.
- Recurrencia documental y rendimiento personal no son probabilidades validadas de aparecer en MIR 2027.
- Un bloque 200 + 10 es una simulación de entrenamiento, no el examen oficial de 2027.
- El recordatorio diario con el enlace está configurado como automatización independiente, por la mañana en Europe/Madrid. No envía el banco ni las soluciones por correo y no requiere SMTP en la app.
- La biblioteca original incluye archivos parcialmente extraíbles; no se afirma cobertura íntegra de todos los documentos.
- No se comparte banco, repositorio ni progreso con Cultura365.
