import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

export interface Reclamacion {
  id: number;
  numero_reclamo: string;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;
  tipo_bien: string;
  descripcion_bien: string;
  monto_reclamado: number;
  fecha_incidente: string;
  tipo_reclamo: 'reclamo' | 'queja';
  detalle_reclamo: string;
  pedido_concreto: string;
  estado: 'pendiente' | 'en_proceso' | 'resuelto';
  created_at: string;
  updated_at: string;
}

export interface FiltrosReclamos {
  estado?: string;
  tipo_reclamo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  buscar?: string;
  page?: number;
  per_page?: number;
}

export interface PaginacionInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface EstadisticasReclamos {
  total: number;
  pendientes: number;
  en_proceso: number;
  resueltas: number;
  reclamos: number;
  quejas: number;
}

export interface ReclamosResponse {
  success: boolean;
  data?: {
    data: Reclamacion[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  estadisticas?: EstadisticasReclamos;
  message?: string;
  errors?: any;
}

export interface ReclamacionDetalleResponse {
  success: boolean;
  data?: Reclamacion;
  message?: string;
  errors?: any;
}

export interface ActualizarEstadoResponse {
  success: boolean;
  data?: Reclamacion;
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReclamosService {
  
  constructor(private http: HttpClient) {}
  
  getReclamos(filtros: FiltrosReclamos = {}): Observable<ReclamosResponse> {
    let params = new HttpParams();
    
    // Filtro por estado
    if (filtros.estado && filtros.estado !== 'todos') {
      params = params.set('estado', filtros.estado);
    }
    
    // Filtro por tipo de reclamo
    if (filtros.tipo_reclamo && filtros.tipo_reclamo !== 'todos') {
      params = params.set('tipo_reclamo', filtros.tipo_reclamo);
    }
    
    // Filtros de fecha
    if (filtros.fecha_desde) {
      params = params.set('fecha_desde', filtros.fecha_desde);
    }
    
    if (filtros.fecha_hasta) {
      params = params.set('fecha_hasta', filtros.fecha_hasta);
    }
    
    // Filtro de búsqueda
    if (filtros.buscar && filtros.buscar.trim()) {
      params = params.set('buscar', filtros.buscar.trim());
    }
    
    // Paginación
    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }
    
    if (filtros.per_page) {
      params = params.set('per_page', filtros.per_page.toString());
    }
    
    return this.http.get<ReclamosResponse>(`${envs.API_URL}/admin/reclamaciones`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener reclamos:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as ReclamosResponse);
      })
    );
  }

  getReclamacion(id: number): Observable<ReclamacionDetalleResponse> {
    return this.http.get<ReclamacionDetalleResponse>(`${envs.API_URL}/admin/reclamaciones/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener reclamación:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as ReclamacionDetalleResponse);
      })
    );
  }

  actualizarEstado(id: number, estado: string): Observable<ActualizarEstadoResponse> {
    return this.http.put<ActualizarEstadoResponse>(
      `${envs.API_URL}/admin/reclamaciones/${id}/estado`,
      { estado }
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar estado:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error al actualizar estado'
        } as ActualizarEstadoResponse);
      })
    );
  }
}