import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

export interface Cliente {
  id: number;
  user_id?: number;
  nombre: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipo: 'registrado' | 'invitado';
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface FiltrosClientes {
  tipo?: string;
  user_id?: number;
  buscar?: string;
  page?: number;
  per_page?: number;
}

export interface PaginacionInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ClientesResponse {
  success: boolean;
  data?: {
    clientes: Cliente[];
    pagination: PaginacionInfo;
  };
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  
  constructor(private http: HttpClient) {}
  
  getClientes(filtros: FiltrosClientes = {}): Observable<ClientesResponse> {
    let params = new HttpParams();
    
    // Filtro por tipo
    if (filtros.tipo && filtros.tipo !== 'todos') {
      params = params.set('tipo', filtros.tipo);
    }
    
    // Filtro por user_id
    if (filtros.user_id) {
      params = params.set('user_id', filtros.user_id.toString());
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
    
    return this.http.get<ClientesResponse>(`${envs.API_URL}/admin/clientes`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener clientes:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as ClientesResponse);
      })
    );
  }
}