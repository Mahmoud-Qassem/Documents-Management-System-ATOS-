import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // If already authenticated and token not expired, redirect to home
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/home');
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.serverErrors = {};

    this.auth.login(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigateByUrl('/home');
      },
      error: (err: any) => {
        this.loading = false;
        // err may be HttpErrorResponse
        if (err?.error && typeof err.error === 'object') {
          // handle field errors if provided as { fieldErrors: { email: 'msg' } }
          const fe = err.error.fieldErrors || err.error.fieldError || null;
          if (fe && typeof fe === 'object') {
            this.serverErrors = fe;
            return;
          }
          // fallback to general message
          this.error = err.error.message || err.error.statusMsg || err.message || 'Login failed';
          return;
        }
        this.error = err?.message || 'Login failed';
      }
    });
  }
}
