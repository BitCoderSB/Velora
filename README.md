# Interledger Modular Backend

Plataforma Node.js/Express orientada a pagos interoperables sobre Open Payments, con módulos desacoplados para onboarding biométrico, manejo de wallets y conciliaciones. El proyecto está listo para usarse como backend completo detrás de una app web/móvil y ya incluye un front-end (carpeta `frontend`) para pruebas internas.

---

## Propósito

- **Pagos interoperables**: exponer flujos de cobro basados en Interledger/Open Payments (incoming/outgoing/quotes, grants interactivos, etc.).
- **Onboarding biométrico**: registrar y validar rostros previo a autorizar pagos mediante `@vladmandic/face-api` y TensorFlow.
- **Dominio modular**: separar reglas de dominio, casos de uso y detalles de infraestructura para favorecer pruebas y evolución.
- **Integración rápida**: ofrecer endpoints REST claros para que otros equipos (mobile/web) consuman los flujos sin conocer la complejidad de Open Payments.

---

## Arquitectura

```
apps/
└── api/
    ├── src/
    │   ├── index.js              # Servidor Express, middlewares y montaje de módulos
    │   ├── modules/
    │   │   ├── payments/         # Dominio de pagos ILP/Open Payments
    │   │   │   ├── domain/       # Servicios puros (second flow, validaciones, helpers)
    │   │   │   ├── app/          # Casos de uso/application services
    │   │   │   └── infra/        # HTTP routes, adapters Open Payments
    │   │   ├── interledger/      # Adaptadores compartidos para grants, quotes, client
    │   │   ├── face-recognition/ # Registro/verificación facial + persistencia
    │   │   └── wallet/           # Utilidades de wallets/usuarios
    │   ├── shared/               # helpers comunes (errores, middlewares, etc.)
    │   └── use-cases/            # Scripts utilitarios (first-flow CLI, etc.)
    └── test/                     # (reservado) pruebas automáticas
frontend/                         # Cliente web (Vite) para consumir el backend
docs/                             # Documentación adicional
```

Características clave:

1. **Capas claras**: cada módulo replica la estructura _domain/app/infra_, minimizando dependencias cruzadas.
2. **Adaptadores Open Payments**: `modules/interledger/infra/adapters/open-payments` encapsula `createIncomingPayment`, `createQuote`, grants, etc.
3. **Servicios especializados**: `payments/domain/services/secondFlow.js` expone tres funciones reutilizables para el flujo de cobro dividido en etapas (incoming, autorización, finalización).
4. **Infraestructura Express**: `payments/infra/http/routes.js` publica endpoints REST (`/api/payments/**`) que orquestan los servicios.
5. **Automatización biométrica**: `modules/face-recognition` incluye controladores HTTP y scripts de migración (`createFaceRecognitionTables`) que se ejecutan al iniciar el server.

---

## Tecnologías principales

| Área                       | Tecnología/Lib |
|---------------------------|----------------|
| Runtime / Server          | Node.js 20+, Express 5, CORS, Helmet, Morgan |
| Pagos Interledger         | `@interledger/open-payments` |
| Autenticación / Criptografía | `jose`, `argon2`, `bcrypt` |
| Machine Learning          | `@tensorflow/tfjs-node`, `@vladmandic/face-api` |
| Persistencia              | PostgreSQL (principal), Sequelize, `pg`, `mysql2` (opcional) |
| Configuración             | `dotenv` |
| Validaciones              | `zod` |

---

## Endpoints principales

_Prefijo común_: `http://localhost:3000/api/payments`

| Método | Ruta                          | Descripción |
|--------|------------------------------|-------------|
| POST   | `/identify`                  | Valida que el par emisor/receptor puede operar. |
| POST   | `/charge`                    | Ejecuta el flujo “first-flow” (interactivo) completo. |
| POST   | `/second-flow/incoming`      | Crea el incoming payment y devuelve `confirmation`. |
| POST   | `/second-flow/authorize`     | Usa `confirmation` para generar quote y grant, devuelve `authorizationUrl` + `pendingAuthorization`. |
| POST   | `/second-flow/finalize`      | Recibe `pendingAuthorization`, continúa el grant y crea el outgoing payment. |

Los módulos de reconocimiento facial exponen rutas adicionales bajo `/api/face` (ver `modules/face-recognition/infra/http`).

---

## Requisitos previos

1. **Node.js 20+** y **npm 10+**.
2. **PostgreSQL** accesible (o ajustar `DATABASE_URL` en `.env`).  
3. Credenciales Open Payments:
   - `CLIENT_WALLET` o `CLIENT_WALLET_ADDRESS_URL`
   - `KEY_ID` asociado a la wallet
   - Archivo PEM de la clave privada (`private.key` por defecto en la raíz)
4. Opcional: cámaras y dependencias del SO para TensorFlow/face-api cuando se usa la parte biométrica.

---

## Configuración

1. **Clonar y entrar al repo**
   ```bash
   git clone <repo-url>
   cd backend-modular
   ```
2. **Instalar dependencias**
   ```bash
   npm install
   ```
3. **Variables de entorno**  
   Copiar `.env.example` (si existe) o crear `.env` en la raíz. Valores mínimos:
   ```bash
   KEY_ID=<uuid-de-la-clave>
   CLIENT_WALLET=https://ilp.interledger-test.dev/2376c2db
   RECEIVER_WALLET=https://...
   SENDER_WALLET=https://...
   PRIVATE_KEY_PATH=private.key
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   PORT=3000
   ```
   > El servidor lee `.env` al arrancar (`apps/api/src/index.js`) y los servicios del flujo 2 usan los mismos valores como defaults.

4. **Clave privada**  
   Colocar el PEM en `private.key` (o actualizar `PRIVATE_KEY_PATH`). Asegurarse de que el proceso de Node pueda leerlo.

5. **Base de datos**  
   `createFaceRecognitionTables()` corre en el arranque; si prefieres hacerlo manualmente ejecuta `node scripts/create-face-db.js` (o el script equivalente) antes de iniciar.

---

## Ejecución

```bash
npm run dev        # si existe script de nodemon
# o
node apps/api/src/index.js
```

El servidor:
- Habilita CORS para `localhost:5173/5174/3000`.
- Monta `/api/payments` y `/api/face`.
- Corre el health-check en `/health`.

### Ejemplo de flujo Second Flow

1. `POST /api/payments/second-flow/incoming`
   ```json
   {
     "sendingWalletAddressUrl": "https://ilp.interledger-test.dev/mxn-tony",
     "receivingWalletAddressUrl": "https://ilp.interledger-test.dev/bitsb3",
     "amount": "1000",
     "clientWalletAddressUrl": "https://ilp.interledger-test.dev/2376c2db",
     "keyId": "f23930dc-0fb8-404e-b0f4-60d80d7900b8",
     "privateKeyPath": "private.key"
   }
   ```
2. Usar `confirmation` para `POST /second-flow/authorize` → recibirás `authorizationUrl`.
3. Tras aprobarla, enviar `pendingAuthorization` a `POST /second-flow/finalize`.

---

## Testing y calidad

- Pendiente definir suites automáticas (`npm test` es placeholder).  
- Recomendado: mocks de Open Payments + pruebas de integración con supertest para `/api/payments/**`.  
- Para face recognition, mantener un dataset controlado y habilitar GPU opcionalmente.

---

## Futuras mejoras

1. Script CLI para generar pares de claves y variables de entorno.
2. Contenedores Docker (API + DB + frontend).
3. Métricas/observabilidad (Prometheus, OpenTelemetry).
4. Pruebas e2e para los grants interactivos (incluir simulador de AS).

---

## Licencia

ISC (ver `package.json`). Ajustar según las necesidades del equipo.

---

Para dudas o contribuciones abre un issue/PR o contacta al equipo de Interledger. ¡Happy hacking! 🚀
