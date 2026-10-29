# `@field-service/config`

Paquete reservado para configuración compartida cuando pueda reutilizarse sin romper la resolución de herramientas.

Hoy los archivos activos están en la raíz, por un motivo concreto:

- `tsconfig.base.json` lo extienden los paquetes con una ruta relativa corta.
- `eslint.config.js` permanece en la raíz porque ESLint resuelve sus plugins desde la ubicación del archivo de configuración. Con el aislamiento de pnpm, moverlo aquí obligaría a duplicar esas dependencias.

No añadas una copia de esas configuraciones en este paquete solo para que el directorio parezca ocupado.
