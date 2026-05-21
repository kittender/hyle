import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  loginWithGitHub() {
    this.loading = true;
    this.authService.loginWithGitHub();
    // Note: page will redirect to GitHub OAuth
  }

  mockLogin() {
    this.loading = true;
    setTimeout(() => {
      this.authService.mockLogin('demo@example.com');
      this.loading = false;
      this.router.navigate(['/profile']);
    }, 500);
  }
}
