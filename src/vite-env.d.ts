/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVICENOW_INSTANCE_URL: string;
  readonly VITE_SERVICENOW_CLIENT_ID: string;
  readonly VITE_SERVICENOW_CLIENT_SECRET: string;
  readonly VITE_SERVICENOW_USERNAME: string;
  readonly VITE_SERVICENOW_PASSWORD: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
