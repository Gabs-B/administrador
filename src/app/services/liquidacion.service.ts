import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { envs } from '../config/envs';

// Interfaces para Liquidaciones
export interface Liquidacion {
  id: number;
  producto_id: number;
  imagen: string;
  imagen_url: string;
  orden: number;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  producto: {
    id: number;
    nombre: string;
    precio: number;
  };
}

export interface LiquidacionResponse {
  success: boolean;
  data?: Liquidacion[];
  message?: string;
  errors?: any;
}

export interface LiquidacionItemResponse {
  success: boolean;
  data?: Liquidacion;
  message?: string;
  errors?: any;
}

// Interface para productos disponibles
export interface ProductoDisponible {
  id: number;
  nombre: string;
  precio: number;
  estado: string;
  stock: number;
}

export interface ProductosResponse {
  success: boolean;
  data?: {
    productos: ProductoDisponible[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LiquidacionService {

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de liquidaciones
   */
  getLiquidaciones(): Observable<LiquidacionResponse> {
    return this.http.get<LiquidacionResponse>(`${envs.API_URL}/admin/liquidacion`).pipe(
      catchError(error => {
        console.error('Error al obtener liquidaciones:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as LiquidacionResponse);
      })
    );
  }

  /**
   * Obtener una liquidación específica
   */
  getLiquidacion(id: number): Observable<LiquidacionItemResponse> {
    return this.http.get<LiquidacionItemResponse>(`${envs.API_URL}/admin/liquidacion/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener liquidación:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as LiquidacionItemResponse);
      })
    );
  }

  /**
   * Crear nueva liquidación
   */
  crearLiquidacion(formData: FormData): Observable<LiquidacionItemResponse> {
    return this.http.post<LiquidacionItemResponse>(`${envs.API_URL}/admin/liquidacion`, formData).pipe(
      catchError(error => {
        console.error('Error al crear liquidación:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        } as LiquidacionItemResponse);
      })
    );
  }

  /**
   * Actualizar liquidación
   */
  actualizarLiquidacion(id: number, formData: FormData): Observable<LiquidacionItemResponse> {
    formData.append('_method', 'PUT');
    
    return this.http.post<LiquidacionItemResponse>(`${envs.API_URL}/admin/liquidacion/${id}`, formData).pipe(
      catchError(error => {
        console.error('Error al actualizar liquidación:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        } as LiquidacionItemResponse);
      })
    );
  }

  /**
   * Eliminar liquidación
   */
  eliminarLiquidacion(id: number): Observable<{ success: boolean; message?: string; }> {
    return this.http.delete<{ success: boolean; message?: string; }>(`${envs.API_URL}/admin/liquidacion/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar liquidación:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Obtener productos disponibles para liquidaciones
   * Igual que en CarruselService, usa la misma estructura de respuesta
   */
  getProductos(): Observable<ProductosResponse> {
    let params = new HttpParams();
    params = params.set('estado', 'activo');
    params = params.set('per_page', '1000'); // Obtener todos los productos activos
    
    return this.http.get<ProductosResponse>(`${envs.API_URL}/admin/productos`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener productos:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as ProductosResponse);
      })
    );
  }

  /**
   * Obtener el siguiente número de orden disponible
   */
  getSiguienteOrden(): Observable<{ success: boolean; orden?: number; message?: string; }> {
    return this.http.get<{ success: boolean; orden?: number; message?: string; }>(`${envs.API_URL}/admin/liquidacion/siguiente-orden`).pipe(
      catchError(error => {
        console.error('Error al obtener siguiente orden:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(precio);
  }
}