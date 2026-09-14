import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Apartment } from '../models/building';
import { AppSettings, DEFAULT_SETTINGS } from '../models/settings';

export interface Transaction {
    id?: string;
    type: 'income' | 'expense';
    amount: number;
    title: string;
    apt_number?: string | null;
    receipt_url?: string | null;
    created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    client: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

    // --- Auth ---
    login(email: string, password: string) {
        return this.client.auth.signInWithPassword({ email, password });
    }

    logout() {
        return this.client.auth.signOut();
    }

    async getUser() {
        const { data } = await this.client.auth.getUser();
        return data.user;
    }

    async getSession() {
        const { data } = await this.client.auth.getSession();
        return data.session;
    }

    // --- Apartments ---
    async getApartments(): Promise<Apartment[]> {
        const { data, error } = await this.client.from('apartments').select('*');
        if (error) throw error;
        return data ?? [];
    }

    async upsertApartments(apartments: Apartment[]) {
        const { error } = await this.client.from('apartments').upsert(apartments, { onConflict: 'apt_number' });
        if (error) throw error;
    }

    async updateApartment(aptNumber: string, patch: Partial<Apartment>): Promise<Apartment> {
        const { data, error } = await this.client
            .from('apartments')
            .update({ ...patch, updated_at: new Date().toISOString() })
            .eq('apt_number', aptNumber)
            .select();
        if (error) throw error;
        return data![0];
    }

    togglePaymentStatus(aptNumber: string, hasPaid: boolean) {
        return this.updateApartment(aptNumber, { has_paid: hasPaid });
    }

    // --- Finance ---
    async getTransactions(): Promise<Transaction[]> {
        const { data, error } = await this.client
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    }

    async addTransaction(transaction: Transaction): Promise<Transaction> {
        const { data, error } = await this.client.from('transactions').insert([transaction]).select();
        if (error) throw error;
        return data![0];
    }

    async uploadReceipt(file: File): Promise<string> {
        const path = `${Date.now()}_${file.name}`;
        const { error } = await this.client.storage.from('receipts').upload(path, file);
        if (error) throw error;
        const { data } = this.client.storage.from('receipts').getPublicUrl(path);
        return data.publicUrl;
    }

    // --- Settings ---
    async getSettings(): Promise<AppSettings> {
        const { data, error } = await this.client.from('app_settings').select('*').eq('id', true).maybeSingle();
        if (error || !data) return DEFAULT_SETTINGS;
        return data;
    }

    async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
        const { data, error } = await this.client
            .from('app_settings')
            .upsert({ id: true, ...patch }, { onConflict: 'id' })
            .select();
        if (error) throw error;
        return data![0];
    }
}
