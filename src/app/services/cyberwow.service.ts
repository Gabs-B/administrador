import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { envs } from '../config/envs';

// Interfaces para CyberWow
export interface CyberWowBanner {
  id: number;
  titulo: string;
  imagen: string;
  imagen_url: string;
  categoria_id?: number | null;
  producto_id?: number | null;
  orden: number;
  estado: 'activo' | 'inactivo';
  tipo?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  categoria?: {
    id: number;
    nombre: string;
  };
  
  producto?: {
    id: number;
    nombre: string;
    precio: number;
  };
  
  tiendas?: {
    id: number;
    nombre: string;
  }[];
}

export interface DatosAuxiliares {
  categorias: Array<{ id: number; nombre: string; }>;
  tiendas: Array<{ id: number; nombre: string; }>;
  productos: Array<{ id: number; nombre: string; precio: number; }>;
  espacios_disponibles: {
    categoria: boolean;
    tiendas: boolean;
    productos: number;
  };
}

export interface CyberWowResponse {
  success: boolean;
  data?: CyberWowBanner[];
  message?: string;
  errors?: any;
}

export interface DatosAuxiliaresResponse {
  success: boolean;
  data?: DatosAuxiliares;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CyberwowService {

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de banners de CyberWow
   */
  getBanners(): Observable<CyberWowResponse> {
    return this.http.get<CyberWowResponse>(`${envs.API_URL}/admin/cyberwow`).pipe(
      catchError(error => {
        console.error('Error al obtener banners:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as CyberWowResponse);
      })
    );
  }

  /**
   * Obtener datos auxiliares (categorías, tiendas, productos, espacios disponibles)
   */
  getDatosAuxiliares(): Observable<DatosAuxiliaresResponse> {
    return this.http.get<DatosAuxiliaresResponse>(`${envs.API_URL}/admin/cyberwow/datos-auxiliares`).pipe(
      catchError(error => {
        console.error('Error al obtener datos auxiliares:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as DatosAuxiliaresResponse);
      })
    );
  }

  /**
   * Crear banner de categoría
   */
  crearBannerCategoria(formData: FormData): Observable<{ success: boolean; data?: CyberWowBanner; message?: string; errors?: any; }> {
    return this.http.post<{ success: boolean; data?: CyberWowBanner; message?: string; errors?: any; }>(`${envs.API_URL}/admin/cyberwow/banners/categoria`, formData).pipe(
      catchError(error => {
        console.error('Error al crear banner de categoría:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Crear banner de tiendas
   */
  crearBannerTiendas(formData: FormData): Observable<{ success: boolean; data?: CyberWowBanner; message?: string; errors?: any; }> {
    return this.http.post<{ success: boolean; data?: CyberWowBanner; message?: string; errors?: any; }>(`${envs.API_URL}/admin/cyberwow/banners/tiendas`, formData).pipe(
      catchError(error => {
        console.error('Error al crear banner de tiendas:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Crear banner de producto
   */
  crearBannerProducto(formData: FormData): Observable<{ success: boolean; data?: CyberWowBanner; message?: string; errors?: any; }> {
    return this.http.post<{ success: boolean; data?: CyberWowBanner; message?: string; errors?: any; }>(`${envs.API_URL}/admin/cyberwow/banners/producto`, formData).pipe(
      catchError(error => {
        console.error('Error al crear banner de producto:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Actualizar banner
   */
  actualizarBanner(id: number, formData: FormData): Observable<{ success: boolean; data?: CyberWowBanner; message?: string; errors?: any; }> {
    formData.append('_method', 'PUT');
    
    return this.http.post<{ success: boolean; data?: CyberWowBanner; message?: string; errors?: any; }>(`${envs.API_URL}/admin/cyberwow/banners/${id}`, formData).pipe(
      catchError(error => {
        console.error('Error al actualizar banner:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Eliminar/desactivar banner
   */
  eliminarBanner(id: number): Observable<{ success: boolean; message?: string; }> {
    return this.http.delete<{ success: boolean; message?: string; }>(`${envs.API_URL}/admin/cyberwow/banners/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar banner:', error);
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