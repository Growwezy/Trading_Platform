interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEV_TENANT_SUBDOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
