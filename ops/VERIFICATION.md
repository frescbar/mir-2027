# Verificación de MIR/27 1.3.1

Fecha: 9 de septiembre de 2026.

- 38 pruebas superadas con el corpus privado: incluyen contenido listo para leer, conservación de condiciones y negaciones, enunciados negativos, fuentes con distinto orden de alternativas, sesiones congeladas, persistencia e impresión sin adelantar soluciones.
- Cobertura recorrida en las 3.250 preguntas de la web: 36 ideas existentes y 3.214 recordatorios extractivos. Cada frase seleccionada se comprobó como parte del comentario de esa misma pregunta (normalizando espacios). Esta comprobación es documental, no una validación clínica individual.
- Se han retirado del apartado la instrucción «Cierra el comentario…» y el botón «Anotar mi idea clave». Las notas personales del usuario se conservan.
- La lógica se ejecuta en el cliente sobre el contenido de cada sesión. No se modifica Supabase, el banco, las imágenes, las claves ni el progreso remoto.
- La copia privada autocontenida se reconstruye con el mismo banco de 3.241 preguntas.
- La comprobación visual local no pudo completarse: el navegador devolvió ERR_BLOCKED_BY_CLIENT al abrir el servidor local. No se afirma una prueba visual de extremo a extremo dentro de la cuenta del usuario.

---

# Verificación de MIR/27 1.3

Fecha: 9 de septiembre de 2026. Aplicación: https://mir-2027.vercel.app/.

## Resultado de la ampliación

- 3.250 preguntas disponibles para responder y estudiar; 2.921 puntuables y 329 con observaciones sin puntuación.
- Las diez preguntas diarias, la selección por temas, la explicación tras responder, los repasos, las notas, las favoritas, los simulacros y el modo sin conexión siguen disponibles.
- «Todas» es el filtro inicial del banco. La inclusión de observaciones en sesiones automáticas es una preferencia opcional y solo afecta a sesiones nuevas.
- El atlas incluye los 899 recursos incorporados, también explicaciones y medios conservados sin pregunta vinculada. El catálogo solicita metadatos y descarga cada imagen bajo demanda.
- Las imágenes que faltan siguen identificadas como no localizadas; no se han sustituido por imágenes generadas ni se declara su recuperación.

## Comprobaciones

Las 33 pruebas automatizadas cubren los recorridos anteriores y la ampliación. Entre las nuevas: responder una ficha con observaciones antes de ver su comentario; no clasificar ese intento como acierto, error o blanco; mantener estadísticas y netas; persistir preferencias y repaso de estudio; imprimir incidencias y claves divergentes; mostrar el catálogo completo; y conservar esos avances tras una descarga, cierre sin red, reapertura y sincronización.

Además, se recorrieron las 3.241 preguntas del corpus privado preparado: todas permiten registrar una respuesta; 2.912 se puntúan y 329 se conservan como estudio con observaciones. Todos esos intentos sin puntuación tienen un aviso y las estadísticas resultan coherentes. Las nueve preguntas previas de la web se conservan.

Las pruebas de interfaz utilizan DOM simulado e IndexedDB de prueba; las respuestas de red son simuladas. No se afirma haber iniciado sesión como el propietario ni haber completado una prueba real de modo avión en su móvil.

La actualización conserva los registros de preguntas, las 899 imágenes y el progreso. Solo se actualiza el manifiesto de la versión en la base de datos; la ampliación de acceso se aplica en el cliente, sin convertir las marcas documentales de calidad en validaciones clínicas.

Los intentos antiguos sin el nuevo campo `scored` siguen contando como antes. Las sesiones nuevas congelan su condición de puntuación junto al contenido. El repaso de observaciones usa `studySchedule`, independiente del calendario que registra aciertos y errores; ambos calendarios se combinan al sincronizar.

La caché de la interfaz distingue versiones de los recursos. El índice detecta módulos anteriores durante una actualización, muestra el aviso de actualización y recarga al activarse la nueva versión. Una página anterior ya abierta conserva su sesión.

## Límite documental

El acceso a todo el banco no certifica vigencia clínica ni resuelve las incidencias de las fuentes. Anulación, impugnación pendiente y discrepancia son estados distintos y se muestran solo cuando constan en los datos. Las explicaciones y claves se atribuyen a su documento.

---

# Registro anterior: MIR/27 1.2

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
# Verificación 1.4.0 · 2026-09-09

- 45 pruebas automatizadas: memoria diaria, práctica con ayuda, recuerdo separado en el tiempo, persistencia, impresión, sesión sin conexión y protección del examen.
- La copia HTML completa arranca con su banco privado; las fuentes y los datos clínicos permanecen fuera del repositorio público.
- Se incorporan tarjetas de memoria y ejercicios originales mediante el banco privado. No se generan explicaciones clínicas mediante reglas léxicas: los pasajes encontrados se presentan como extractos; la ausencia de una explicación individual continúa indicada.
- La práctica iniciada tras una pista se registra como asistida. Los ejercicios de transferencia son voluntarios y no sustituyen las preguntas diarias.
- La nueva medición agrupa por concepto y asignatura, requiere dos preguntas distintas acertadas con seguridad en días separados por al menos siete días, y no declara dominio validado.
- Las imágenes recuperadas conservan cuadernillo, página, número y correspondencia comprobada con el texto del examen. Se mantienen las sesiones antiguas y sus reglas de puntuación.
- La revisión clínica global del banco y la recuperación de todas las imágenes siguen incompletas. La revisión del flujo autenticado de producción no se ha realizado sin acceso a la cuenta del usuario.
