import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, PersonResponseDto, UpdateProfileRequest } from '../services/auth.service';

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
  serverErrors: Record<string, string> = {};
  profileLoading = true;
  userFullName = '';

  constructor(private fb: FormBuilder, private auth: AuthService) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadProfile();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      nationalId: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.minLength(8), Validators.maxLength(255)]],
      mobileNumber: ['', [Validators.pattern(/^(010|011|012|015)\d{8}$/)]],
      address: ['', [Validators.maxLength(255)]]
    });
  }

  private loadProfile(): void {
    this.profileLoading = true;
    this.auth.getProfile().subscribe({
      next: (profile: PersonResponseDto) => {
        this.userFullName = `${profile.firstName} ${profile.lastName}`;
        this.form.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          nationalId: profile.nationalId,
          mobileNumber: profile.mobileNumber || '',
          address: profile.address || ''
        });
        this.profileLoading = false;
      },
      error: (err) => {
        this.profileLoading = false;
        this.error = 'Failed to load profile data';
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const payload: UpdateProfileRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword || undefined,
      mobileNumber: formValue.mobileNumber || undefined,
      address: formValue.address || undefined
    };

    this.loading = true;
    this.error = null;
    this.serverErrors = {};

    this.auth.updateProfile(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res?.message || 'Profile updated successfully';
        this.form.get('currentPassword')?.reset();
        this.form.get('newPassword')?.reset();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error && typeof err.error === 'object') {
          const fe = err.error.fieldErrors || err.error.fieldError || null;
          if (fe && typeof fe === 'object') {
            this.serverErrors = fe;
            return;
          }
          this.error = err.error.message || err.error.statusMsg || 'Update failed';
          return;
        }
        this.error = err?.message || 'Update failed';
      }
    });
  }
}
