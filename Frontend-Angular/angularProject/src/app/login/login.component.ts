import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface LoginPayload {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  serverErrors: Record<string, string> = {};
  showPassword = false;
  loaded = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // protect route if already authenticated
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/home');
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false]
    });

    // small timeout to trigger entrance animation
    if (isPlatformBrowser(this.platformId) && typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        setTimeout(() => (this.loaded = true), 35);
      });
    } else {
      // Server-side or no RAF available: set loaded true so SSR output is visible
      this.loaded = true;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  socialLogin(provider: string) {
    // placeholder for actual social login flow
    console.log('Social login:', provider);
    // In a real app, call the backend or use auth SDK
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.serverErrors = {};

    const payload: LoginPayload = {
      email: this.form.value.email,
      password: this.form.value.password
    };

    this.auth.login(payload).subscribe({
      next: (res) => {
        this.loading = false;
        // navigate to home on success
        this.router.navigateByUrl('/home');
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error && typeof err.error === 'object') {
          const fe = err.error.fieldErrors || err.error.fieldError || null;
          if (fe && typeof fe === 'object') {
            this.serverErrors = fe;
            return;
          }
          this.error = err.error.message || err.error.statusMsg || err.message || 'Login failed';
          return;
        }
        this.error = err?.message || 'Login failed';
      }
    });
  }
}
