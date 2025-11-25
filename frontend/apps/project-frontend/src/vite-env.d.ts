/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_SERVICE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
