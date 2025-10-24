import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

// Interfaces actualizadas para múltiples imágenes
export interface ProductoImagen {
  id: number;
  producto_id: number;
  imagen: string;
  imagen_url: string;
  orden: number;
  es_principal: boolean;
  alt_text: string;
  created_at: string;
  updated_at: string;
}

export interface Producto {
  id: number;
  nombre: string;
  sku?: string;
  descripcion: string;
  categoria_id?: number;
  tienda_id?: number;          
  proveedor_id?: number;
  precio: number;
  precio_despues?: number;
  descuento?: number;          
  beneficios?: string;        
  modo_uso?: string;
  ingredientes?: string;
  vida_util?: string;              
  faq_quienes_toman?: string;
  faq_por_que_elegir?: string;
  faq_tiempo_uso?: string;
  faq_efectos_secundarios?: string;
  faq_consumo_alcohol?: string;         
  stock: number;
  es_pack: boolean;
  etiqueta_id?: number;   
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
  
  // Campos actualizados para múltiples imágenes
  imagenes?: ProductoImagen[];
  imagen_principal_url?: string;  // Campo que viene del backend
  total_imagenes?: number;
  imagen_principal?: ProductoImagen; // Objeto completo de la imagen principal
  
  categoria?: {
    id: number;
    nombre: string;
    estado: string;
    imagen?: string;
    imagen_url?: string;
  };
  tienda?: {                  
    id: number;
    nombre: string;
  };
  etiqueta?: {
    id: number;
    nombre: string;
    estado: string;
    imagen: string;
  };
}

export interface ProductosPaginados {
  productos: Producto[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ProductosResponse {
  success: boolean;
  data?: ProductosPaginados;
  message?: string;
  errors?: any;
}

export interface FiltrosProductos {
  estado?: string;
  categoria_id?: number;
  sin_stock?: boolean;
  buscar?: string;
  per_page?: number;
  page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de productos con filtros y paginación
   */
  getProductos(filtros: FiltrosProductos = {}): Observable<ProductosResponse> {
    let params = new HttpParams();

    if (filtros.estado && filtros.estado !== 'todos') {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.categoria_id) {
      params = params.set('categoria_id', filtros.categoria_id.toString());
    }
    if (filtros.sin_stock !== undefined) {
      params = params.set('sin_stock', filtros.sin_stock.toString());
    }
    if (filtros.buscar) {
      params = params.set('buscar', filtros.buscar);
    }
    if (filtros.per_page) {
      params = params.set('per_page', filtros.per_page.toString());
    }
    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }

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
   * Obtener un producto específico
   */
  getProducto(id: number): Observable<{ success: boolean; data?: Producto; message?: string; }> {
    return this.http.get<{ success: boolean; data?: Producto; message?: string; }>(`${envs.API_URL}/admin/productos/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener producto:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Crear nuevo producto - ACTUALIZADO para múltiples imágenes
   */
  crearProducto(formData: FormData): Observable<{ success: boolean; data?: Producto; message?: string; errors?: any; }> {
    return this.http.post<{ success: boolean; data?: Producto; message?: string; errors?: any; }>(`${envs.API_URL}/admin/productos`, formData).pipe(
      catchError(error => {
        console.error('Error al crear producto:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Actualizar producto existente
   */

  /**
   * Actualizar producto existente - ENVIAR COMO JSON
   */
actualizarProducto(id: number, datos: any): Observable<{ success: boolean; data?: Producto; message?: string; errors?: any; }> {
  // Eliminar completamente la conversión a FormData
  return this.http.put<{ success: boolean; data?: Producto; message?: string; errors?: any; }>(
    `${envs.API_URL}/admin/productos/${id}`, 
    datos, // Enviar directamente el objeto
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ).pipe(
    catchError(error => {
      console.error('Error al actualizar producto:', error);
      return of({
        success: false,
        message: error.error?.message || 'Error de conexión',
        errors: error.error?.errors
      });
    })
  );
}

  /**
   * Desactivar producto
   */
  eliminarProducto(id: number): Observable<{ success: boolean; data?: Producto; message?: string; }> {
    return this.http.delete<{ success: boolean; data?: Producto; message?: string; }>(`${envs.API_URL}/admin/productos/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar producto:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Activar producto
   */
  activarProducto(id: number): Observable<{ success: boolean; data?: Producto; message?: string; }> {
    return this.http.put<{ success: boolean; data?: Producto; message?: string; }>(`${envs.API_URL}/admin/productos/${id}/activar`, {}).pipe(
      catchError(error => {
        console.error('Error al activar producto:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  // ========== NUEVOS MÉTODOS PARA GESTIÓN DE IMÁGENES ==========

  /**
   * Agregar imágenes a un producto existente
   */
  agregarImagenesProducto(productoId: number, formData: FormData): Observable<{ success: boolean; data?: any; message?: string; errors?: any; }> {
    return this.http.post<{ success: boolean; data?: any; message?: string; errors?: any; }>(`${envs.API_URL}/admin/productos/${productoId}/imagenes`, formData).pipe(
      catchError(error => {
        console.error('Error al agregar imágenes:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }

  /**
   * Eliminar imagen específica de un producto
   */
  eliminarImagenProducto(productoId: number, imagenId: number): Observable<{ success: boolean; message?: string; }> {
    return this.http.delete<{ success: boolean; message?: string; }>(`${envs.API_URL}/admin/productos/${productoId}/imagenes/${imagenId}`).pipe(
      catchError(error => {
        console.error('Error al eliminar imagen:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Reordenar imágenes de un producto
   */
  reordenarImagenesProducto(productoId: number, ordenes: { [key: number]: number }): Observable<{ success: boolean; message?: string; }> {
    return this.http.put<{ success: boolean; message?: string; }>(`${envs.API_URL}/admin/productos/${productoId}/imagenes/reordenar`, { ordenes }).pipe(
      catchError(error => {
        console.error('Error al reordenar imágenes:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Cambiar imagen principal de un producto
   */
  cambiarImagenPrincipal(productoId: number, imagenId: number): Observable<{ success: boolean; data?: ProductoImagen; message?: string; }> {
    return this.http.put<{ success: boolean; data?: ProductoImagen; message?: string; }>(`${envs.API_URL}/admin/productos/${productoId}/imagenes/${imagenId}/principal`, {}).pipe(
      catchError(error => {
        console.error('Error al cambiar imagen principal:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Actualizar información de una imagen
   */
  actualizarImagenProducto(productoId: number, imagenId: number, datos: { alt_text?: string }): Observable<{ success: boolean; data?: ProductoImagen; message?: string; errors?: any; }> {
    return this.http.put<{ success: boolean; data?: ProductoImagen; message?: string; errors?: any; }>(`${envs.API_URL}/admin/productos/${productoId}/imagenes/${imagenId}`, datos).pipe(
      catchError(error => {
        console.error('Error al actualizar imagen:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        });
      })
    );
  }
    getImagenUrl(producto: Producto): string {
      if (producto.imagen_principal_url) {
        return producto.imagen_principal_url;
      }
      if (producto.imagen_principal) {
        // Si viene relativo, lo concatenamos
        return `${envs.API_URL}/${producto.imagen_principal}`;
      }
      return '/assets/images/no-image.png';
    }
}