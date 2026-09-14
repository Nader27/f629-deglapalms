import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div class="w-full max-w-sm bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
        <h1 class="text-2xl font-bold text-white mb-1">Manager Login</h1>
        <p class="text-slate-400 text-sm mb-6">Sign in to manage residents &amp; building finances.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-sm text-slate-300 mb-1">Email</label>
            <input type="email" formControlName="email"
              class="w-full rounded-lg bg-slate-900 border border-slate-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@example.com" />
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">Password</label>
            <input type="password" formControlName="password"
              class="w-full rounded-lg bg-slate-900 border border-slate-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••" />
          </div>

          @if (errorMessage()) {
            <p class="text-red-400 text-sm">{{ errorMessage() }}</p>
          }

          <button type="submit" [disabled]="form.invalid || loading()"
            class="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 transition">
            {{ loading() ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <a routerLink="/" class="block text-center text-slate-400 hover:text-slate-200 text-sm mt-6">
          ← Back to building view
        </a>
      </div>
    </div>
  `,
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    loading = signal(false);
    errorMessage = signal('');

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
    });

    async submit() {
        if (this.form.invalid) return;
        this.loading.set(true);
        this.errorMessage.set('');

        const { email, password } = this.form.getRawValue();
        const { error } = await this.supabase.login(email!, password!);

        this.loading.set(false);
        if (error) {
            this.errorMessage.set('Invalid email or password.');
            return;
        }
        this.router.navigate(['/admin/residents']);
    }
}
