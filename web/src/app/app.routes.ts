import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing';
import { SearchComponent } from './pages/search/search';
import { DetailComponent } from './pages/detail/detail';
import { DocsComponent } from './pages/docs/docs';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { ProfileComponent } from './pages/profile/profile';
import { EnterpriseComponent } from './pages/enterprise/enterprise';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'search', component: SearchComponent },
  { path: 'print/:author/:name', component: DetailComponent },
  { path: 'docs', component: DocsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'profile/public', component: ProfileComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'enterprise', component: EnterpriseComponent },
  { path: '**', redirectTo: '' },
];
