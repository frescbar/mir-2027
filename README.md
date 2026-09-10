# MIR/27 · Entrenamiento personal

La comprobación semanal de las 22 referencias enlazadas está activada. Registra cambios pendientes de contraste clínico y avisa al propietario; no cambia respuestas ni aprueba contenido.

Proyecto independiente de Cultura365. La web está en `https://mir-2027.vercel.app` y su raíz de despliegue es `docs`.

## Versión 1.5.0 · Errores y recuerdo diferido

El motivo principal de cada error se registra por elección del usuario: desconocimiento, confusión, lectura o cálculo. La clasificación se sincroniza y no modifica la puntuación. Las comprobaciones de recuerdo usan conceptos específicos y familias de preguntas no respondidas: esperan siete días desde el último estudio y, tras un resultado seguro, treinta días. Volver a ver el contenido reinicia el intervalo. Los ejercicios que solo cambian cifras no cuentan como familias nuevas.

El corpus privado preparado contiene 3.298 preguntas, 48 casos didácticos originales, 953 recursos de imagen y 125 preguntas con explicación propia de todas sus opciones. Esta entrega añade 24 casos y recupera 19 paneles con guía de lectura. Corrige seis requisitos de imagen erróneos; siguen pendientes 60 imágenes y 3.173 ampliaciones completas. No se ha realizado revisión clínica externa.

«Revisión y fuentes» muestra cobertura real, procedencia y referencias enlazadas. El inventario y el formulario de revisión independiente incluyen todo el banco. Las propuestas conservan la versión y no publican ni alteran claves por sí solas. `scripts/check-sources.py` genera una cola de diferencias de referencias, sin convertir cambios de página en recomendaciones médicas.

## Versión 1.3.1 · Recordatorios preparados

«Para recordarlo» muestra la idea ya redactada cuando existe. En el resto de preguntas prepara un recordatorio extractivo con la respuesta atribuida a la fuente y frases completas seleccionadas del comentario de esa misma ficha. Conserva negaciones, condiciones, procedencia y la numeración original. Las preguntas en negativo y las incidencias mantienen su aviso; una clave cuestionada no se presenta como válida. Desaparecen la consigna de cerrar el comentario y el botón «Anotar mi idea clave» de ese apartado.

El bloque se muestra después de responder y en los cuadernos con soluciones; en simulacros, después de entregar. Funciona también con el contenido congelado de sesiones anteriores y en la copia privada, sin solicitudes de IA, servicios nuevos ni cambios al banco o al historial. La selección de extractos no equivale a una revisión clínica independiente ni a una síntesis clínica redactada individualmente para las 3.250 preguntas.

## Versión 1.3

Banco buscable por texto, asignatura, año y estado; comentarios de las fuentes con página; preguntas históricas de cuatro o cinco opciones; imágenes privadas ampliables; diez preguntas diarias por defecto y tamaño configurable de 5 a 50; modo mixto opcional; repasos, notas, favoritas, estadísticas; simulacros cronometrados con corrección al entregar; cuadernos A4 mediante impresión del navegador.

Las sesiones nuevas conservan una copia del contenido usado para que una actualización del banco no cambie retrospectivamente sus preguntas, opciones o claves. Las lecturas tienen paginación y búsqueda en el texto completo. La corrección identifica la respuesta por su texto y evita confundirla con la numeración de opciones mezcladas.

La versión 1.1.1 incorpora «He olvidado mi contraseña», solicitud de enlace por correo y formulario para elegir una contraseña nueva. El retorno valida la sesión con Supabase, retira los tokens de la dirección y permite volver a iniciar sesión sin modificar el progreso. La configuración del destino de los correos se detalla en [recuperación de acceso](ops/ACCESS_RECOVERY.md).

### Ampliación de la versión 1.3

Las **3.250 preguntas de la web** están disponibles para responder y estudiar. El banco abre con «Todas» y permite filtrar «Sin incidencias» o «Con observaciones». Los bloques de esa selección y los cuadernos impresos incluyen las preguntas elegidas, también si tienen incidencias.

La rutina habitual se conserva: diez preguntas por defecto, tamaño configurable, respuesta antes de explicación, repaso adaptativo y sesiones congeladas. La opción «Incluir preguntas con observaciones en mis sesiones» permite ampliar sesiones nuevas, bloques extra, temas y simulacros. Por defecto se conserva la selección anterior. Las versiones de la misma pregunta permanecen enlazadas y se agrupan en selecciones automáticas.

Los intentos con observaciones se guardan con `scored: false`, sin acierto/error ni efecto en los porcentajes, primeras vueltas o netas del simulacro. Disponen de un repaso de estudio independiente a siete días. Las anuladas, las impugnaciones pendientes documentadas, los conflictos, la ausencia de imagen y los problemas de extracción se identifican explícitamente; se muestran las claves atribuidas a cada fuente sin adjudicar una respuesta en caso de discrepancia.

El atlas ofrece el **catálogo completo de 899 imágenes incorporadas**, con filtros para preguntas, explicaciones y recursos conservados sin vínculo. Solo descarga metadatos al abrir el catálogo; las imágenes se cargan bajo demanda. Las imágenes no localizadas siguen señaladas en sus preguntas. No se declara que esos archivos faltantes hayan sido recuperados.

### Novedades de la versión 1.2

- Sesión descargable con preguntas, comentarios e imágenes. El service worker guarda la interfaz; IndexedDB conserva únicamente la descarga solicitada y los avances de la cuenta. Al recuperar conexión se combinan los cambios mediante revisión de servidor. Salir de la cuenta elimina su descarga y copias locales; el progreso todavía pendiente se retiene para la misma cuenta.
- Tres copias recientes de progreso en el navegador: una automática al guardar, como máximo una al día, y una antes de importar avances. Pueden descargarse desde Biblioteca y copias. No sustituyen una copia exportada fuera del navegador.
- Repaso según fecha, seguridad, errores recientes y materia. Un error no vuelve automáticamente antes de cumplir su intervalo; una respuesta acertada al azar vuelve al día siguiente. Las reglas no predicen una nota MIR.
- Alternativas con extractos literales de sus comentarios, vinculados por el texto de la opción. La falta de explicación individual queda visible. Las imágenes explicativas aparecen después de responder.
- Controles táctiles, barra de avance en móvil y ampliación de imágenes. Las fichas con observaciones permiten responder antes de consultar su explicación, sin puntuar.

### Estado del contenido a 9 de septiembre de 2026

La web conserva 3.250 preguntas accesibles: 2.921 puntuables y 329 de estudio con observaciones (196 con incidencias documentales y 133 versiones agrupadas). Mantiene las nueve preguntas previas, 621 lecturas, 202 tarjetas, 324 temas y 26 fuentes. El archivo privado contiene las 3.241 preguntas del corpus revisado documentalmente.

Se recuperaron 51 enunciados del PDF de 2015 sin cambiar sus claves, se reconstruyeron fotografías divididas en tiras y se incorporaron 678 recursos visuales, para un total de 899 imágenes. El atlas se genera a partir de las preguntas: 309 fichas visuales del corpus sin versiones agrupadas. Hay extractos por alternativa en 2.436 preguntas; no se afirma que todas las alternativas tengan explicación individual.

La incorporación utilizó 88 lotes con actualizaciones de contenido condicionadas a su versión anterior, conservando los campos ajenos al cambio. Las 899 imágenes coinciden por hash con la copia preparada y no hay referencias de imagen sin resolver. El progreso anterior y posterior a la actualización es idéntico. Véase [el registro de verificación](ops/VERIFICATION.md).

### Verificación reproducible

`npm ci && npm test` ejecuta las pruebas del motor y de la interfaz en DOM simulado, con datos sintéticos y almacenamiento IndexedDB de prueba. No envía datos ni modifica la cuenta del usuario. Para comprobar también un banco privado local: `MIR_TEST_BANK=/ruta/fuera/del/repositorio/bank.json npm test`.

`python3 scripts/verify-bank.py BANCO.json --baseline BANCO_ANTERIOR.json` comprueba claves, exclusiones, referencias, imágenes y literalidad de los extractos.

`python3 scripts/prepare-bank.py ENTRADA.json SALIDA.json` normaliza etiquetas y aparta extracciones anómalas sin inventar contenido clínico. `python3 scripts/build-private.py BANCO.json SALIDA.html` crea una copia autocontenida. Las entradas y salidas privadas deben permanecer fuera del repositorio.

Las funciones se han probado con un corpus documental privado mediante pruebas unitarias y de interfaz en un entorno controlado. Esto **no** certifica revisión clínica completa ni sustituye una prueba de extremo a extremo con el navegador y cuenta del usuario.

## Arquitectura

- `core-v1.js`: selección, sesiones, corrección, intervalos y combinación de progreso.
- `store-v1.js`: Supabase Auth/REST, banco paginado, imágenes bajo demanda, descarga privada y guardado con detección de conflictos.
- `sw.js` y `offline-v1.js`: acceso sin conexión a la interfaz, sin almacenar respuestas de Supabase en la caché de red.
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
- Preguntas anuladas, con discrepancias, sin imagen necesaria o con problemas de extracción se pueden estudiar y añadir opcionalmente a las sesiones; sus intentos no alteran las estadísticas de aciertos.
- Recurrencia documental y rendimiento personal no son probabilidades validadas de aparecer en MIR 2027.
- Un bloque 200 + 10 es una simulación de entrenamiento, no el examen oficial de 2027.
- El recordatorio diario con el enlace está configurado como automatización independiente, por la mañana en Europe/Madrid. No envía el banco ni las soluciones por correo y no requiere SMTP en la app.
- La biblioteca original incluye archivos parcialmente extraíbles; no se afirma cobertura íntegra de todos los documentos.
- No se comparte banco, repositorio ni progreso con Cultura365.
# 1.4.1 · Explicaciones por alternativa

La corrección admite una ampliación didáctica fechada, con referencias, razonamiento de cada alternativa, contraste y trampa de examen. La clave y la elección se abren al corregir; el comentario documental permanece accesible. La ruta `#ampliaciones` muestra las preguntas con este formato, con soluciones ocultas hasta responder.

Los pasajes documentales compartidos se agrupan una sola vez. Las alternativas aún sin ampliación se identifican juntas, sin repetir bajo cada una el comentario completo. El contenido nuevo se sirve desde el banco privado; no se publica en este repositorio.

La ampliación puede aparecer al revisar una sesión guardada si enunciado, opciones y clave coinciden. No modifica respuestas, puntuación ni instantáneas. El formato de impresión conserva las ampliaciones presentes en la instantánea de su sesión.
