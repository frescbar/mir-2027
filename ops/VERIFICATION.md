# Verificación de MIR/27 1.2

Fecha: 9 de septiembre de 2026. Aplicación: https://mir-2027.vercel.app/.

## Contenido y cambios documentales

| Contenido | Corpus privado | Total conservado en la web |
| --- | ---: | ---: |
| Registros de preguntas | 3.241 | 3.250 |
| Preguntas habilitadas | 2.912 | 2.921 |
| Fichas pendientes | 196 | 196 |
| Versiones agrupadas | 133 | 133 |
| Lecturas | 621 | 621 |
| Tarjetas | 202 | 202 |
| Imágenes | 899 | 899 |
| Temas | 324 | 324 |
| Fuentes | 25 | 26 |

Se reextrajeron 51 enunciados del PDF de 2015 eliminando glifos superpuestos, sin cambiar ninguna clave. Las imágenes de PDF divididas en tiras se recompusieron mediante sus posiciones. Se separaron regiones anteriores y posteriores a la solución, conservando página y coordenadas. Se inspeccionaron visualmente casos de 2010, 2015, 2018, 2021 y 2022; esto es un muestreo, no inspección clínica individual de las 899 imágenes.

Se vincularon imágenes entre versiones únicamente con enunciado normalizado, opciones y clave documental coincidentes. Las referencias secundarias ya consolidadas requieren opciones y clave compatibles. Las 133 versiones agrupadas conservan sus fichas, fuentes e historial: sus equivalencias se aplican al seleccionar repasos y reconocer intentos anteriores.

Hay extractos literales por alternativa en 2.436 preguntas. La correspondencia usa el texto de la opción de cada fuente, por lo que un orden diferente no cambia su destino. Cuando una fuente no explica una alternativa por separado, la interfaz lo dice expresamente. Se conservan los comentarios completos.

## Incorporación y preservación

Se completaron 88 lotes: 678 medios nuevos y actualizaciones de las 3.241 preguntas. Las modificaciones fusionan solo los campos cambiados y exigen coincidencia con sus valores anteriores o con el resultado ya aplicado. No se eliminó contenido previo ni se reabrió la función temporal de carga anónima.

- Las 899 imágenes se decodificaron y coinciden por MD5 agregado de identificador y contenido: `0a008fe791e3129505b0c79a805a8d29`.
- Todas las referencias a imágenes de preguntas y explicaciones resuelven en la base de datos.
- Las claves de todas las preguntas coinciden con la copia anterior.
- El resumen del progreso antes y después de esta incorporación coincide: no se modificó el historial del usuario.
- El atlas se deriva del banco: 309 fichas visuales del corpus sin versiones agrupadas. Se conservan los 221 registros de atlas anteriores por compatibilidad.

## Funcionamiento

Las 22 pruebas automatizadas pasan con datos sintéticos y con el corpus privado. Cubren sesiones y claves congeladas, corrección con opciones mezcladas, exclusiones, simulacros, intervalos, equivalencias, lectura, impresión, recuperación de contraseña, almacenamiento y sincronización.

El recorrido sin conexión se verifica con IndexedDB de prueba y respuestas HTTP simuladas: descargar una sesión con sus imágenes, recrear la página sin red, responder y anotar, volver a recrearla, y sincronizar ante un conflicto con cambios de otro dispositivo. Se conservan ambos intentos, notas y favorita. Una descarga incompleta conserva la anterior. Otra cuenta no accede a esa descarga, salir la elimina y una membresía revocada con red no activa la alternativa sin conexión.

El service worker se prueba de forma aislada: ofrece la interfaz cuando falla la red y no intercepta Supabase ni archivos privados arbitrarios. Las tres copias de seguridad son locales al navegador, con exportación manual; limpiar sus datos puede eliminarlas. Para estudiar sin conexión hay que descargar primero la sesión en ese mismo navegador.

La recuperación vuelve correctamente al dominio publicado tras el ajuste del propietario. Las cuatro pruebas de recuperación no envían correos reales ni cambian la cuenta.

Estas comprobaciones no equivalen a iniciar sesión con la cuenta del propietario ni a completar una prueba real de modo avión en su móvil. La revisión final del usuario es abrir la web, estudiar y comprobar la descarga en su navegador habitual.

## Límites conservados

Las 196 fichas pendientes siguen excluidas: 119 necesitan imagen y 77 requieren revisión. Las fuentes son históricas; no se declara revisión clínica vigente de todo el banco ni validación oficial ministerial. La adaptación del repaso es una regla de estudio, no una predicción de resultado MIR.

El banco y el progreso requieren membresía. El repositorio de código seguía público al comprobarlo en esta revisión; no contiene el corpus privado. Cambiar su visibilidad requiere el propietario. Los dos avisos de Supabase documentados en la revisión anterior no se presentan como resueltos: la función restringida de invitaciones con privilegios elevados y la protección de contraseñas filtradas desactivada.
