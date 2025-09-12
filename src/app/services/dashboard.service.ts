import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

export interface DashboardStats {
  productos: {
    total: number;
    activos: number;
    sin_stock: number;
  };
  categorias: {
    total: number;
    activas: number;
  };
  clientes: {
    total: number;
    registrados: number;
    invitados: number;
  };
  pedidos: {
    total: number;
    pendientes: number;
    pagados: number;
    enviados: number;
  };
  ventas: {
    total: number;
    hoy: number;
    mes: number;
  };
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardStats;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) {}

  /**
   * Obtener estadísticas del dashboard
   */
  getStats(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${envs.API_URL}/admin/dashboard`).pipe(
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as DashboardResponse);
      })
    );
  }
}