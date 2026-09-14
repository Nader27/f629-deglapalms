export interface AppSettings {
    payment_url: string | null;
    whatsapp_url: string | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
    payment_url: null,
    whatsapp_url: null,
};
