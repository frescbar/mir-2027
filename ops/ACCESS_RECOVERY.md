# Recuperación de acceso

Entrada de la aplicación: https://mir-2027.vercel.app/#recover.

La recuperación solicita un correo mediante `POST /auth/v1/recover`, con destino `https://mir-2027.vercel.app/`. Al abrir el enlace de Supabase, el cliente acepta el flujo de recuperación, retira el fragmento con credenciales de la URL y verifica la sesión mediante `GET /auth/v1/user`. El usuario elige y confirma una contraseña nueva, que se envía a `PUT /auth/v1/user`. A continuación se cierra la sesión temporal y se muestra el acceso habitual. Este flujo no crea cuentas ni escribe en las tablas de estudio o progreso.

## Ajuste pendiente del propietario

La comprobación del 9 de septiembre de 2026 con un enlace de prueba inválido redirigió a `http://localhost:3000`, por lo que el destino publicado aún no está autorizado. La conexión administrativa disponible no expone la edición de esa configuración y el navegador pide iniciar sesión.

En [Authentication → URL Configuration](https://supabase.com/dashboard/project/baplujcmcrqnjyarkere/auth/url-configuration):

1. Establecer **Site URL** en `https://mir-2027.vercel.app/` y guardar.
2. Añadir `https://mir-2027.vercel.app/` a **Redirect URLs** y guardar.

Después solicitar un enlace nuevo desde la aplicación. No reutilizar correos anteriores con un destino incorrecto. [Documentación de Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

## Comprobaciones

Las doce pruebas automatizadas pasan, incluidas cuatro de recuperación con respuestas HTTP simuladas: solicitud sin sesión ni escritura de progreso; validación del enlace y confirmación de la contraseña; caducidad; y rechazo de sesiones inválidas. El formulario no revela si un correo está registrado. La entrega real del correo y el cambio de contraseña por el propietario aún no se han probado.
