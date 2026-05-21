import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
      <div style="text-align: center;">
        <h2>Completing authentication...</h2>
        <p>Please wait while we complete your login.</p>
      </div>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.authService.handleCallback(token);
        // Redirect to profile after short delay
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 500);
      } else {
        // No token, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }
}
