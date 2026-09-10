# Completar el banco MIR/27

Encargo autorizado por el propietario: ampliar todas las explicaciones pendientes y localizar las imágenes originales. No hay autorización para contratar servicios, pagar APIs, contactar a terceros ni simular revisión clínica externa.

La tarea recurrente continúa desde el banco remoto, nunca desde el estado de una conversación o una copia antigua. Se ejecuta por lotes y solo publica contenido que haya podido comprobar. Una ejecución no debe limitarse a contar pendientes.

## Lectura y selección

Supabase: proyecto `baplujcmcrqnjyarkere`, tabla `public.mir_content`. Las preguntas tienen `kind='question'`; el manifiesto es `kind='manifest', external_id='documental-v1'`. Las imágenes están en `public.mir_media`. No modificar `public.user_state`, autenticación ni políticas.

Lee el manifiesto y un lote de hasta 20 preguntas todavía sin explicación propia de todas sus opciones. Usa `MIRCore.optionReason(q,i).kind==='authored'` para la cobertura real; comprueba siempre la identidad de `optionTeaching[i].optionText`. Prioriza lotes de un mismo concepto o especialidad, sin repetir preguntas ya completadas. Las que no se puedan resolver se registran aparte con motivo y fecha; pasa a la siguiente, sin fabricar relleno.

Al empezar, reserva `learning.automaticCompletion.lease` con un `runId` único y caducidad de 90 minutos mediante actualización condicionada al `updated_at` leído, únicamente si no existe otra reserva vigente. Si está ocupada, termina esta ejecución. Al finalizar, libera solo tu propia reserva. La caducidad permite continuar tras una ejecución interrumpida; las condiciones de versión de cada pregunta siguen siendo obligatorias.

## Redacción individual

Lee enunciado, opciones, clave, comentarios completos, incidencias y referencias de cada pregunta. Consulta fuentes oficiales o primarias accesibles; PubMed sirve para localizar el artículo, no para inventar su contenido. Verifica fecha y alcance. Distingue una respuesta histórica de una recomendación actual. Conserva negaciones, contexto, edad, unidades y posibles anulaciones.

Cada propuesta incluye `id`, `previousVersion`, `optionTexts`, explicación del caso, `takeaway` ya redactado, `optionTeaching` con `optionText`, `reason`, `contrast`, `pitfall`, y `sources` con `title`, `url`, `checkedAt`, `supports`. Añade `clinicalUpdate` si existe una discrepancia demostrada. No repitas el mismo párrafo bajo todas las alternativas, no uses frases genéricas para rellenar huecos y no conviertas una búsqueda fallida en certeza.

`qualityChecks` registra las comprobaciones realmente hechas: `caseRead`, `negativeQuestionChecked`, `optionSpecificity`, `sourceSupportChecked`, `historicalKeyPreserved`; `imageInspected` solo después de ver la imagen. Son comprobaciones editoriales por IA, no aval médico independiente.

Usa `scripts/editorial-batch.cjs` con un banco y propuestas privados para producir parches. Sus controles son estructurales: además revisa tú la coherencia clínica y que cada fuente sostenga lo escrito. No reduzcas sus requisitos para aumentar la cifra. El script conserva la redacción anterior y no permite cambiar clave, opciones, enunciado ni elegibilidad.

## Publicación sin perder cambios

Comprueba otra vez `versionHash` en Supabase. En una transacción, verifica que todos los registros tengan la versión anterior esperada; actualiza únicamente `data=data||patch` y `updated_at`. Si la versión cambió, vuelve a leer y reevalúa; no fuerces ni sobrescribas la pregunta completa. Un reintento que encuentre exactamente el mismo parche es idempotente.

Actualiza solo los campos propios del manifiesto: cobertura real, fecha, referencias enlazadas y `learning.automaticCompletion.lastBatch`. Fusiona las referencias por URL y sus questionIds. Usa el `updated_at` leído como condición y no sobrescribas eventos de guías ni otra actividad concurrente. Conserva la versión de la interfaz; registra revisiones de contenido por separado.

Verifica en la base de datos que cada campo publicado coincide y que la cifra pendiente disminuye. Anota IDs, fecha y cifras reales. Si hay bloqueo, deja la causa concreta, no un estado de éxito. No publiques el banco, documentos ni imágenes en GitHub: el repositorio es público.

## Imágenes y revisión externa

Faltan las 35 imágenes AMIR 2018 y 25 AMIR 2022. Identifica cada documento por el enunciado y las opciones, no solo por su año. No sustituyas una radiografía, ECG o anatomía patológica original por una recreación. Solo elimina una incidencia tras localizar y ver el panel correcto. Guarda URL/documento/página/hash y explica dónde mirar, el hallazgo decisivo y su límite. Si un recurso está bloqueado o exige pago, registra el obstáculo y no intentes eludirlo.

La revisión clínica externa requiere una persona independiente cuya identidad, cualificación, fecha, decisión y versión revisada estén documentadas. Consultar una guía, ejecutar tests o repetir la revisión con IA no cumple este requisito. El paquete privado ya creado puede utilizarse para registrar propuestas de ese profesional; no se envía a nadie sin destinatario autorizado.

## Continuidad y cierre

Reanuda por el inventario remoto en cada ejecución. Comprueba también imágenes pendientes a partir de nuevas fuentes concretas, sin repetir indefinidamente enlaces bloqueados. Notifica una vez al día avances verificables y bloqueos relevantes; no un mensaje por pregunta. Cuando no quede ninguna explicación pendiente, pausa la parte de redacción y comunica el resultado. El seguimiento semanal de guías es otra tarea: consérvalo. Si solo faltan imágenes o un revisor externo, comunica esa dependencia real y no declares terminado todo el proyecto.
