import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public Resident View
  {
    path: '',
    loadComponent: () => import('./pages/resident-view/resident.component').then(m => m.ResidentComponent)
  },

  // Admin Login
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin-login/login.component').then(m => m.LoginComponent)
  },

  // Protected Admin Portal
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'residents',
        loadComponent: () => import('./pages/admin-dashboard/manage-residents.component').then(m => m.ManageResidentsComponent)
      },
      {
        path: 'finance',
        loadComponent: () => import('./pages/admin-dashboard/manage-finance.component').then(m => m.ManageFinanceComponent)
      },
      { path: '', redirectTo: 'residents', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];