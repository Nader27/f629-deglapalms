export interface AppSettings {
    payment_url: string | null;
    whatsapp_url: string | null;
    maintenance_fee: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
    payment_url: null,
    whatsapp_url: null,
    maintenance_fee: 2000,
};
