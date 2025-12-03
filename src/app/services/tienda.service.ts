import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

export interface Tienda {
  id: number;
  nombre: string;
}

export interface TiendasResponse {
  success: boolean;
  data?: Tienda[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TiendasService {

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de tiendas
   */
  getTiendas(): Observable<TiendasResponse> {
    return this.http.get<TiendasResponse>(`${envs.API_URL}/admin/tiendas`).pipe(
      catchError(error => {
        console.error('Error al obtener tiendas:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as TiendasResponse);
      })
    );
  }

  /**
   * Obtener tienda específica
   */
  getTienda(id: number): Observable<{ success: boolean; data?: Tienda; message?: string; }> {
    return this.http.get<{ success: boolean; data?: Tienda; message?: string; }>(`${envs.API_URL}/admin/tiendas/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener tienda:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        }); 
      })
    );
  }
}