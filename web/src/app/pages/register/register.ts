import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
})
export class RegisterComponent {
  name = '';
  username = '';
  email = '';
  password = '';
  confirm = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  submit(e: Event) {
    e.preventDefault();
    this.error = '';
    if (!this.name || !this.username || !this.email || !this.password) {
      this.error = 'Please fill in all fields.';
      return;
    }
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match.';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }
    this.loading = true;
    setTimeout(() => {
      this.authService.login({ name: this.name, username: this.username, email: this.email, avatar: null });
      this.loading = false;
      this.router.navigate(['/']);
    }, 900);
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
