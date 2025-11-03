import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, ProfilePayload } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      nationalId: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      password: ['', [Validators.minLength(8), Validators.maxLength(255)]],
      mobileNumber: ['', []],
      address: ['', [Validators.maxLength(255)]]
    });

    this.auth.getProfile().subscribe({
      next: (profile: ProfilePayload) => {
        this.form.patchValue(profile || {});
      },
      error: () => { }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: ProfilePayload = this.form.value;
    this.loading = true;
    this.error = null;

    this.auth.updateProfile(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res?.message || 'Profile updated';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message;
      }
    });
  }
}
