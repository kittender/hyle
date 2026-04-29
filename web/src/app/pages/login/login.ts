import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  submit(e: Event) {
    e.preventDefault();
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields.';
      return;
    }
    this.loading = true;
    setTimeout(() => {
      this.authService.mockLogin(this.email);
      this.loading = false;
      this.router.navigate(['/']);
    }, 800);
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
