# MIR 2027 · Mi entrenamiento

Proyecto personal e independiente de `cultura365` para preparación MIR.

## Arquitectura

- **Frontend** en `/docs`.
- **Supabase Auth** para acceso personal.
- **PostgreSQL + RLS** para banco privado, membresía y progreso.
- **Estado sincronizado** entre dispositivos mediante `user_state`.
- El repositorio no contiene los PDF originales ni imágenes extraídas de libros.

## Funciones actuales

Sesión diaria adaptativa de 10 actividades, preguntas, tarjetas, microlecturas, práctica por temas, repaso de errores, atlas con trazabilidad, bloques de simulacro, estadísticas e impresión de sesiones.

La selección diaria prioriza repaso vencido y errores previos, mantiene preguntas nuevas y usa repetición espaciada sencilla. Los primeros intentos se separan de las repeticiones en las estadísticas.

## Privacidad y derechos

El cliente usa únicamente la clave **publicable** de Supabase. El contenido se protege con autenticación, lista privada de miembros y Row Level Security. No deben añadirse al repositorio libros, claves secretas, datos clínicos ni copias del material protegido.

## Contenido

El banco inicial es un piloto revisado y trazable. La extracción histórica no revisada permanece fuera de producción. Las frecuencias históricas, recomendaciones editoriales y rendimiento personal son señales distintas; la aplicación no presenta porcentajes de probabilidad MIR 2027 sin validación.

## Separación

No comparte repositorio, base de datos, almacenamiento ni progreso con Cultura365.

## Pendiente antes de producción estable

Despliegue final en hosting compatible con repositorio privado, configuración del dominio de retorno de Supabase Auth, ampliación y cotejo del banco oficial —incluido MIR 2026— e incorporación segura de imágenes permitidas.