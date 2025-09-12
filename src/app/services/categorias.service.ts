import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

// Interfaces para categorías
export interface Categoria {
  id: number;
  nombre: string;
  estado: 'activo' | 'inactivo';
  imagen?: string;
  imagen_url?: string;
  productos_count?: number;
  created_at: string;
  updated_at: string;
}

export interface FiltrosCategorias {
  estado?: string;
  buscar?: string;
}

export interface CategoriasResponse {
  success: boolean;
  data?: Categoria[];
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de categorías
   */
  getCategorias(filtros: FiltrosCategorias = {}): Observable<CategoriasResponse> {
    let params = new HttpParams();

    if (filtros.estado && filtros.estado !== 'todos') {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.buscar) {
      params = params.set('buscar', filtros.buscar);
    }

    return this.http.get<CategoriasResponse>(`${envs.API_URL}/admin/categorias`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as CategoriasResponse);
      })
    );
  }

  /**
   * Obtener una categoría específica
   */
  getCategoria(id: number): Observable<{ success: boolean; data?: Categoria; message?: string; }> {
    return this.http.get<{ success: boolean; data?: Categoria; message?: string; }>(`${envs.API_URL}/admin/categorias/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener categoría:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Crear nueva categoría (con soporte para imagen)
   */
  crearCategoria(categoria: { nombre: string; estado?: string }, imagen?: File): Observable<{ success: boolean; data?: Categoria; message?: string; errors?: any; }> {
    const formData = new FormData();
    formData.append('nombre', categoria.nombre);
    formData.append('estado', categoria.estado || 'activo');
    
    if (imagen) {
      formData.append('imagen', imagen);
    }

    return this.http.post<{ success: boolean; data?: Categoria; message?: string; errors?: any; }>(`${envs.API_URL}/admin/categorias`, formData).pipe(
      catchError(error => {
        console.error('Error al crear categoría:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Actualizar categoría existente (con soporte para imagen)
   */
  actualizarCategoria(
    id: number, 
    categoria: { nombre?: string; estado?: string }, 
    imagen?: File, 
    eliminarImagen: boolean = false
  ): Observable<{ success: boolean; data?: Categoria; message?: string; errors?: any; }> {
    const formData = new FormData();
    
    if (categoria.nombre !== undefined) {
      formData.append('nombre', categoria.nombre);
    }
    if (categoria.estado !== undefined) {
      formData.append('estado', categoria.estado);
    }
    if (imagen) {
      formData.append('imagen', imagen);
    }
    if (eliminarImagen) {
      formData.append('eliminar_imagen', '1');
    }
    
    // Para Laravel, necesitamos especificar el método PUT
    formData.append('_method', 'PUT');

    return this.http.post<{ success: boolean; data?: Categoria; message?: string; errors?: any; }>(`${envs.API_URL}/admin/categorias/${id}`, formData).pipe(
      catchError(error => {
        console.error('Error al actualizar categoría:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Desactivar categoría
   */
  eliminarCategoria(id: number): Observable<{ success: boolean; data?: Categoria; message?: string; }> {
    return this.http.delete<{ success: boolean; data?: Categoria; message?: string; }>(`${envs.API_URL}/admin/categorias/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar categoría:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Activar categoría
   */
  activarCategoria(id: number): Observable<{ success: boolean; data?: Categoria; message?: string; }> {
    return this.http.put<{ success: boolean; data?: Categoria; message?: string; }>(`${envs.API_URL}/admin/categorias/${id}/activar`, {}).pipe(
      catchError(error => {
        console.error('Error al activar categoría:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }
}