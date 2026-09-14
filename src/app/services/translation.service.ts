import { Injectable, computed, signal } from '@angular/core';

export type Lang = 'en' | 'ar';

const STRINGS: Record<Lang, Record<string, string>> = {
    en: {
        appTitle: '🏢 Building Maintenance Tracker',
        maintenanceFee: 'Maintenance fee: {fee} LE per apartment',
        whatsappGroup: '💬 WhatsApp Group',
        managerLogin: 'Manager Login',
        buildingBoxBalance: 'Building Box Balance',
        paymentProgress: 'Payment Progress',
        paidOf: '{paid} / {total} paid',
        ownerOccupied: 'Owner-occupied',
        rented: 'Rented',
        noInfo: 'No info',
        gate: 'Gate',
        paid: 'Paid',
        floorGround: 'Ground',
        floor1st: '1st',
        floor2nd: '2nd',
        floor3rd: '3rd',
        floorRoof: 'Roof',
        loadingLayout: 'Loading building layout…',
        transactionsTitle: 'Building Box — Income & Expenses',
        transactionsSubtitle: 'Every collected fee and expense is public for full transparency.',
        date: 'Date',
        title: 'Title',
        apartment: 'Apt #',
        type: 'Type',
        amount: 'Amount',
        image: 'Image',
        income: 'Income',
        expense: 'Expense',
        noTransactionsYet: 'No transactions recorded yet.',
        languageButton: 'العربية',
    },
    ar: {
        appTitle: '🏢 متابعة صيانة المبنى',
        maintenanceFee: 'رسوم الصيانة: {fee} جنيه لكل شقة',
        whatsappGroup: '💬 جروب الواتساب',
        managerLogin: 'دخول المسؤول',
        buildingBoxBalance: 'رصيد صندوق المبنى',
        paymentProgress: 'نسبة السداد',
        paidOf: '{paid} من {total} تم السداد',
        ownerOccupied: 'يسكنها المالك',
        rented: 'مؤجرة',
        noInfo: 'لا توجد بيانات',
        gate: 'البوابة',
        paid: 'تم الدفع',
        floorGround: 'الأرضي',
        floor1st: 'الأول',
        floor2nd: 'الثاني',
        floor3rd: 'الثالث',
        floorRoof: 'السطح',
        loadingLayout: 'جارٍ تحميل مخطط المبنى…',
        transactionsTitle: 'صندوق المبنى — الإيرادات والمصروفات',
        transactionsSubtitle: 'كل رسوم محصلة أو مصروف معروض للجميع بكل شفافية.',
        date: 'التاريخ',
        title: 'البيان',
        apartment: 'رقم الشقة',
        type: 'النوع',
        amount: 'المبلغ',
        image: 'الصورة',
        income: 'إيراد',
        expense: 'مصروف',
        noTransactionsYet: 'لا توجد معاملات مسجلة بعد.',
        languageButton: 'English',
    },
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
    lang = signal<Lang>(this.readInitialLang());
    dir = computed<'rtl' | 'ltr'>(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));

    t(key: string, params?: Record<string, string | number>): string {
        let text = STRINGS[this.lang()][key] ?? key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(`{${k}}`, String(v));
            }
        }
        return text;
    }

    toggle() {
        const next: Lang = this.lang() === 'en' ? 'ar' : 'en';
        this.lang.set(next);
        try {
            localStorage.setItem('lang', next);
        } catch {
            // SSR or storage unavailable — language just won't persist.
        }
    }

    private readInitialLang(): Lang {
        try {
            return (localStorage.getItem('lang') as Lang) || 'en';
        } catch {
            return 'en';
        }
    }
}
