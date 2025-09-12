import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { envs } from '../config/envs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    admin: {
      id: number;
      email: string;
      tipo: string;
    };
    token: string;
    expires_in_hours: number;
  };
  errors?: any;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario desde localStorage si existe
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  /**
   * Login de administrador
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<LoginResponse>(
      `${envs.API_URL}/admin/login`,
      credentials,
      { headers }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          // Guardar datos en localStorage
          localStorage.setItem('admin_token', response.data.token);
          localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
          
          // Actualizar el subject
          this.currentUserSubject.next(response.data.admin);
        }
        return response;
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors || null
        } as LoginResponse);
      })
    );
  }

  /**
   * Logout
   */
  logout(): Observable<any> {
    const token = this.getToken();
    
    if (!token) {
      this.clearSession();
      return of({ success: true });
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${envs.API_URL}/admin/logout`, {}, { headers }).pipe(
      map(response => {
        this.clearSession();
        return response;
      }),
      catchError(error => {
        this.clearSession();
        return of({ success: true });
      })
    );
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Obtener token
   */
  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Limpiar sesión
   */
  private clearSession(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    this.currentUserSubject.next(null);
  }

  /**
   * Verificar si el usuario es admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && user.tipo === 'admin';
  }
}