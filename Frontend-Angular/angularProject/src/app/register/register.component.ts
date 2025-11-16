import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  nationalId: string;
  password: string;
  mobileNumber?: string;
  address?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  serverErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      nationalId: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      mobileNumber: ['', [Validators.pattern(/^(010|011|012|015)\d{8}$/)]],
      address: ['', [Validators.maxLength(255)]]
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

  this.auth.register(this.form.value).subscribe({
    next: (res) => {
      this.loading = false;
      this.success = res.message || 'Registration successful';
      setTimeout(() => this.router.navigate(['/login']), 1000);
    },
    error: (err: any) => {
      this.loading = false;
      if (err?.error && typeof err.error === 'object') {
        const fe = err.error.fieldErrors || err.error.fieldError || null;
        if (fe && typeof fe === 'object') {
          this.serverErrors = fe;
          return;
        }
        this.error = err.error.message || err.error.statusMsg || err.message || 'Registration failed';
        return;
      }
      this.error = err?.message || 'Registration failed';
    }
  });
}

}
