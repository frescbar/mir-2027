# Recuperación de acceso

Entrada de la aplicación: https://mir-2027.vercel.app/#recover.

La recuperación solicita un correo mediante `POST /auth/v1/recover`, con destino `https://mir-2027.vercel.app/`. Al abrir el enlace de Supabase, el cliente acepta el flujo de recuperación, retira el fragmento con credenciales de la URL y verifica la sesión mediante `GET /auth/v1/user`. El usuario elige y confirma una contraseña nueva, que se envía a `PUT /auth/v1/user`. A continuación se cierra la sesión temporal y se muestra el acceso habitual. Este flujo no crea cuentas ni escribe en las tablas de estudio o progreso.

## Destino comprobado

El 9 de septiembre de 2026, después del ajuste del propietario, una comprobación con token deliberadamente inválido devolvió una redirección 303 a `https://mir-2027.vercel.app/`. El destino ya no apunta a localhost. No se envió un nuevo correo ni se cambió la contraseña durante esta comprobación.

La configuración se mantiene en [Authentication → URL Configuration](https://supabase.com/dashboard/project/baplujcmcrqnjyarkere/auth/url-configuration). Los enlaces antiguos pueden haber caducado; la app permite solicitar otro. [Documentación de Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

## Comprobaciones

Las 22 pruebas automatizadas de la versión 1.2 pasan, incluidas cuatro de recuperación con respuestas HTTP simuladas: solicitud sin sesión ni escritura de progreso; validación del enlace y confirmación de la contraseña; caducidad; y rechazo de sesiones inválidas. El formulario no revela si un correo está registrado. El usuario comunicó que había recuperado el acceso. No se afirma haber efectuado personalmente su inicio de sesión ni leído su correo.
