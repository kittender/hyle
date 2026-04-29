import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordComponent {
  email = '';
  sent = false;
  loading = false;

  constructor(private router: Router) {}

  submit(e: Event) {
    e.preventDefault();
    if (!this.email) return;
    this.loading = true;
    setTimeout(() => {
      this.sent = true;
      this.loading = false;
    }, 700);
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
