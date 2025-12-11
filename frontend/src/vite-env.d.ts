/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly VITE_BACKEND_URL: string
    readonly VITE_TEST_VARIABLE: string
    // add more env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
