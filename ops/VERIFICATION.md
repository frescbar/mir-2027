# Verificación de MIR/27 1.1

Fecha: 9 de septiembre de 2026. Aplicación: https://mir-2027.vercel.app/.

## Contenido incorporado

| Contenido | Corpus importado | Total conservado en la web |
| --- | ---: | ---: |
| Preguntas | 3.241 | 3.250 |
| Lecturas | 621 | 621 |
| Tarjetas | 202 | 202 |
| Fichas de atlas | 221 | 221 |
| Imágenes | 221 | 221 |
| Temas | 324 | 324 |
| Fuentes | 25 | 26 |

Se completaron 50 de 50 lotes con validación SHA-256 de cada carga, sin rechazos. Los identificadores de temas se alinearon con los que utiliza el cliente para evitar duplicados en una incorporación posterior. Se conservaron nueve preguntas y una fuente de la versión previa que no estaban en el corpus incorporado.

Comparación final entre el archivo preparado y la base de datos:

- Preguntas del corpus: MD5 agregado de identificador, enunciado, clave, opciones ordenadas y comentario: `e0769b892e7b17589a206bef0455621c`.
- Imágenes: MD5 agregado de identificador y contenido: `5c991793e0cc60f2c790b688233f2f04`.
- Ambas comparaciones coinciden. Las 221 imágenes se decodificaron correctamente en la verificación local; ninguna referencia de imagen queda sin resolver en la web.
- El estado y la revisión del progreso existente son idénticos antes y después de la importación y de las comprobaciones.

## Funcionamiento y acceso

Ocho pruebas de motor e interfaz pasaron con datos sintéticos y con el corpus privado preparado: tamaño diario, exclusiones, copia del contenido de las sesiones, corrección, simulacros, combinación y persistencia de progreso, paginación de lecturas e impresión. Las pruebas de interfaz utilizan DOM simulado e IndexedDB de prueba.

Se comprobó en la base de datos que el rol autenticado de un miembro puede leer el banco completo, guardar su propio progreso y detectar una revisión obsoleta. Un usuario autenticado sin membresía no puede leer el contenido ni guardar progreso. Las escrituras de comprobación se revirtieron en la misma transacción. No se crearon cuentas ni sesiones nuevas.

Las peticiones HTTP sin iniciar sesión no devolvieron contenido ni progreso. Después se retiraron los permisos anónimos restantes, los permisos de operaciones destructivas de los clientes y la ejecución de la función temporal de transferencia. El trabajo de transferencia quedó expirado y completado.

La web publicada muestra correctamente el formulario de acceso de la versión 1.1. La comprobación pendiente del usuario es entrar con su cuenta y revisar la experiencia real en su navegador; no se afirma haber realizado ese inicio de sesión.

## Límites y ajustes pendientes

Hay 2.841 preguntas habilitadas (2.832 del corpus y nueve conservadas) y 409 apartadas por problemas de extracción, claves o imágenes. La validación estructural no sustituye una revisión clínica de todas las fuentes históricas.

El banco y el progreso requieren acceso de miembro. El repositorio de código sigue público a la fecha de esta revisión: cambiar su visibilidad requiere una acción del propietario en [los ajustes de GitHub](https://github.com/frescbar/mir-2027/settings). El repositorio no contiene el corpus privado.

El asesor de seguridad de Supabase mantiene dos avisos: la función de canje de invitaciones usa intencionadamente privilegios elevados y valida la identidad y el código de invitación ([referencia](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)); la comprobación de contraseñas filtradas está desactivada ([ajuste de Auth](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). Estos avisos no se presentan como resueltos.
