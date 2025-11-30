#  Control de Finanzas (Balute)

Una aplicación web moderna y robusta para la gestión de finanzas personales. Diseñada para ser segura, rápida y fácil de usar tanto en móviles como en escritorio.

🔗 **Demo en Vivo:** [https://balute-37f93.web.app](https://balute-37f93.web.app)

##  Características Principales

*   ** Arquitectura Multi-Usuario:** Cada usuario tiene su propia "billetera" privada e independiente. El registro es abierto y seguro.
*   ** Modo Espectador (Viewer):** Comparte tus finanzas en modo "solo lectura" con familiares o socios sin compartir tu contraseña.
*   ** Dashboard Inteligente:** Visualiza tu balance, gastos del mes y progreso hacia tu objetivo mensual de un vistazo.
*   ** Exportación Avanzada:** Genera reportes detallados en Excel (.xlsx) por Semana o Mes, incluyendo resúmenes por categoría.
*   ** Mobile-First:** Interfaz optimizada para funcionar como una app nativa en tu celular.
*   ** Cloud Sync:** Tus datos están sincronizados en tiempo real gracias a Firebase.

##  Tecnologías

*   **Frontend:** React.js
*   **Estilos:** Tailwind CSS
*   **Backend (Serverless):** Firebase Cloud Functions
*   **Base de Datos:** Cloud Firestore
*   **Autenticación:** Firebase Auth
*   **Hosting:** Firebase Hosting

##  Instalación Local

Si quieres correr este proyecto en tu máquina:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/endeeeeeeeee/balute.git
    cd balute/balute
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Firebase:**
    -   Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
    -   Crea un archivo `.env` en la raíz de `balute/` con tus credenciales.

4.  **Correr el servidor de desarrollo:**
    ```bash
    npm start
    ```

## 📄 Licencia

Este proyecto es de uso personal y educativo.
