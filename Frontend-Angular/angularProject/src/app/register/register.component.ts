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

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      nationalId: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      mobileNumber: ['', []],
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

  this.auth.register(this.form.value).subscribe({
    next: (res) => {
      this.loading = false;
      this.success = res.message || 'Registration successful';
      setTimeout(() => this.router.navigate(['/login']), 1000);
    },
    error: (err) => {
      this.loading = false;
      this.error = err.message; // unified error message
    }
  });
}

}
