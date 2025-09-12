import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

// Interfaces para carrusel
export interface ItemCarrusel {
  id: number;
  imagen: string;
  imagen_url: string;
  producto_id?: number | null; // Campo agregado para la relación
  producto_nombre?: string; 
  producto_precio?: number; 
  producto_estado?: string;
  producto_stock?: number; // Campo adicional para mostrar stock
  orden: number;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: String; 
  
  producto?: {
    id: number;
    nombre: string;
    precio: number;
    estado: string;
    stock: number;
    imagen_url?: string;
  };
}

export interface FiltrosCarrusel {
  estado?: string;
  con_producto?: boolean; // Filtro para mostrar solo items con productos
  sin_producto?: boolean; // Filtro para mostrar solo items sin productos
}

export interface CarruselResponse {
  success: boolean;
  data?: ItemCarrusel[];
  message?: string;
  errors?: any;
}

export interface ReordenarItem {
  id: number;
  orden: number;
}

// Interface para productos disponibles (para el selector)
export interface ProductoParaCarrusel {
  id: number;
  nombre: string;
  precio: number;
  estado: string;
  stock: number;
  imagen_url?: string;
}

export interface ProductosDisponiblesResponse {
  success: boolean;
  data?: ProductoParaCarrusel[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarruselService {

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de imágenes del carrusel
   */
  getCarrusel(filtros: FiltrosCarrusel = {}): Observable<CarruselResponse> {
    let params = new HttpParams();

    // Agregar filtros como parámetros de consulta
    if (filtros.estado && filtros.estado !== 'todos') {
      params = params.set('estado', filtros.estado);
    }
    
    if (filtros.con_producto !== undefined) {
      params = params.set('con_producto', filtros.con_producto.toString());
    }
    
    if (filtros.sin_producto !== undefined) {
      params = params.set('sin_producto', filtros.sin_producto.toString());
    }

    return this.http.get<CarruselResponse>(`${envs.API_URL}/admin/carrusel`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener carrusel:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as CarruselResponse);
      })
    );
  }

  /**
   * Obtener productos disponibles para asociar al carrusel
   */
  getProductosDisponibles(): Observable<ProductosDisponiblesResponse> {
    return this.http.get<ProductosDisponiblesResponse>(`${envs.API_URL}/admin/productos/disponibles-carrusel`).pipe(
      catchError(error => {
        console.error('Error al obtener productos disponibles:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as ProductosDisponiblesResponse);
      })
    );
  }

  /**
   * Obtener una imagen específica del carrusel
   */
  getItemCarrusel(id: number): Observable<{ success: boolean; data?: ItemCarrusel; message?: string; }> {
    return this.http.get<{ success: boolean; data?: ItemCarrusel; message?: string; }>(`${envs.API_URL}/admin/carrusel/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener item del carrusel:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Crear nueva imagen del carrusel
   */
  crearCarrusel(formData: FormData): Observable<{ success: boolean; data?: ItemCarrusel; message?: string; errors?: any; }> {
    return this.http.post<{ success: boolean; data?: ItemCarrusel; message?: string; errors?: any; }>(`${envs.API_URL}/admin/carrusel`, formData).pipe(
      catchError(error => {
        console.error('Error al crear item del carrusel:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Actualizar imagen del carrusel
   */
  actualizarCarrusel(id: number, formData: FormData): Observable<{ success: boolean; data?: ItemCarrusel; message?: string; errors?: any; }> {
    // Agregar _method para method spoofing
    formData.append('_method', 'PUT');
    
    // Usar POST en lugar de PUT para FormData
    return this.http.post<{ success: boolean; data?: ItemCarrusel; message?: string; errors?: any; }>(`${envs.API_URL}/admin/carrusel/${id}`, formData).pipe(
      catchError(error => {
        console.error('Error al actualizar item del carrusel:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Eliminar imagen del carrusel
   */
  eliminarCarrusel(id: number): Observable<{ success: boolean; message?: string; }> {
    return this.http.delete<{ success: boolean; message?: string; }>(`${envs.API_URL}/admin/carrusel/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar item del carrusel:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Cambiar estado de imagen del carrusel
   */
  cambiarEstadoCarrusel(id: number): Observable<{ success: boolean; data?: ItemCarrusel; message?: string; }> {
    return this.http.put<{ success: boolean; data?: ItemCarrusel; message?: string; }>(`${envs.API_URL}/admin/carrusel/${id}/estado`, {}).pipe(
      catchError(error => {
        console.error('Error al cambiar estado:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Reordenar carrusel completo
   */
  reordenarCarrusel(items: ReordenarItem[]): Observable<{ success: boolean; data?: ItemCarrusel[]; message?: string; }> {
    return this.http.put<{ success: boolean; data?: ItemCarrusel[]; message?: string; }>(`${envs.API_URL}/admin/carrusel/reordenar`, { items }).pipe(
      catchError(error => {
        console.error('Error al reordenar carrusel:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Desvincular producto del carrusel
   */
  desvincularProducto(id: number): Observable<{ success: boolean; data?: ItemCarrusel; message?: string; }> {
    return this.http.put<{ success: boolean; data?: ItemCarrusel; message?: string; }>(`${envs.API_URL}/admin/carrusel/${id}/desvincular-producto`, {}).pipe(
      catchError(error => {
        console.error('Error al desvincular producto:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }
}