import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  fieldErrors: any = {};

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.fieldErrors = {};

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success) {
          console.log('Login exitoso:', response);
          // Redirigir al dashboard
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.handleError(response);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en login:', error);
        this.errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
      }
    });
  }

  private handleError(response: any): void {
    if (response.errors) {
      // Errores de validación específicos por campo
      this.fieldErrors = response.errors;
    } else {
      // Error general
      this.errorMessage = response.message || 'Error desconocido';
    }
  }

  hasError(fieldName: string, errorType: string): boolean {
    return this.loginForm.get(fieldName)?.hasError(errorType) && 
           (this.loginForm.get(fieldName)?.dirty || this.submitted) || false;
  }

  isFieldInvalid(fieldName: string): boolean {
    // Validación del formulario O errores del servidor
    const formInvalid = (this.loginForm.get(fieldName)?.invalid && 
                        (this.loginForm.get(fieldName)?.dirty || this.submitted)) || false;
    
    const serverError = this.fieldErrors[fieldName] && this.fieldErrors[fieldName].length > 0;
    
    return formInvalid || serverError;
  }

  hasServerError(fieldName: string): boolean {
    return this.fieldErrors[fieldName] && this.fieldErrors[fieldName].length > 0;
  }

  getServerErrors(fieldName: string): string[] {
    return this.fieldErrors[fieldName] || [];
  }
}