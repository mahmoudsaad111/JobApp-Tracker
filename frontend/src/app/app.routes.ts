import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ─── Auth (public) ────────────────────────────────────────────────────────
  {
    path: 'auth',
    // guestGuard is applied per page below: the email-confirmation and password-reset
    // links must also work for a person who is already signed in.
    loadComponent: () =>
      import('./features/auth/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/forgotPassword/forgotPassword.component')
            .then(m => m.ForgotPasswordComponent),
      },
      {
        path: 'resetPassword',
        loadComponent: () =>
          import('./features/auth/resetPassword/resetPassword.component')
            .then(m => m.ResetPasswordComponent),
      },
      {
        path: 'verifyEmail',
        loadComponent: () =>
          import('./features/auth/verifyEmail/VerifyEmail.component').then(m => m.VerifyEmailComponent)
      },
    ]
  },

  // ─── App shell (protected) ────────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./features/applications/list/applications-list.component').then(m => m.ApplicationsListComponent)
      },
      {
        path: 'applications/new',
        loadComponent: () =>
          import('./features/applications/form/application-form.component').then(m => m.ApplicationFormComponent)
      },
      {
        path: 'applications/:id/edit',
        loadComponent: () =>
          import('./features/applications/form/application-form.component').then(m => m.ApplicationFormComponent)
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import('./features/applications/detail/application-detail.component').then(m => m.ApplicationDetailComponent)
      },
      {
        path: 'interviews',
        loadComponent: () =>
          import('./features/interviews/interviews.component').then(m => m.InterviewsComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      // ─── Notes ────────────────────────────────────────────────────────────
      {
        path: 'notes',
        loadComponent: () =>
          import('./features/notes/notes.component').then(m => m.NotesComponent)
      },
     {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/document.component').then(m => m.DocumentsComponent)
      },
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];