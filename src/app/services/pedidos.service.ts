import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

export interface Cliente {
  id: number;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  tipo: 'registrado' | 'invitado';
}

export interface Producto {
  id: number;
  nombre: string;
  sku: string;
  imagen_principal?: string;
}

export interface ItemPedido {
  id: number;
  producto: Producto;
  cantidad: number;
  precio_venta: number;
  subtotal: number;
}

export interface Pago {
  id: number;
  monto: number;
  moneda: string;
  metodo_pago: string;
  estado_pago: 'pendiente' | 'aprobado' | 'rechazado';
  culqi_charge_id?: string;
  fecha_pago: string;
}

export interface Pedido {
  id: number;
  cliente: Cliente;
  total: number;
  direccion_envio: string;
  estado_pedido: 'pendiente' | 'pagado' | 'cancelado' | 'enviado';
  cantidad_items: number;
  fecha_pedido: string;
  ultima_actualizacion: string;
  tiene_pago_aprobado: boolean;
  metodos_pago: string[];
  items?: ItemPedido[];
  pagos?: Pago[];
}

export interface FiltrosPedidos {
  estado?: string;
  cliente_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  monto_min?: number;
  monto_max?: number;
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

export interface PedidosResponse {
  success: boolean;
  data?: Pedido[];
  pagination?: PaginacionInfo;
  message?: string;
  errors?: any;
}

export interface PedidoDetalleResponse {
  success: boolean;
  data?: Pedido;
  message?: string;
  error?: string;
}

export interface ActualizarEstadoResponse {
  success: boolean;
  data?: {
    id: number;
    estado_anterior: string;
    estado_actual: string;
    fecha_actualizacion: string;
  };
  message?: string;
  error?: string;
}

export interface EstadisticasPedidos {
  total_pedidos: number;
  pendientes: number;
  pagados: number;
  enviados: number;
  cancelados: number;
  monto_total: number;
  monto_promedio: number;
  clientes_unicos: number;
}

export interface VentasPorDia {
  fecha: string;
  cantidad_pedidos: number;
  total_ventas: number;
}

export interface EstadisticasResponse {
  success: boolean;
  data?: {
    resumen: EstadisticasPedidos;
    ventas_por_dia: VentasPorDia[];
    periodo: {
      fecha_inicio: string;
      fecha_fin: string;
    };
  };
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  
  constructor(private http: HttpClient) {}
  
  /**
   * Obtener lista de pedidos con filtros
   */
  getPedidos(filtros: FiltrosPedidos = {}): Observable<PedidosResponse> {
    let params = new HttpParams();
    
    // Filtros opcionales
    if (filtros.estado && filtros.estado !== 'todos') {
      params = params.set('estado', filtros.estado);
    }
    
    if (filtros.cliente_id) {
      params = params.set('cliente_id', filtros.cliente_id.toString());
    }
    
    if (filtros.fecha_desde) {
      params = params.set('fecha_desde', filtros.fecha_desde);
    }
    
    if (filtros.fecha_hasta) {
      params = params.set('fecha_hasta', filtros.fecha_hasta);
    }
    
    if (filtros.monto_min) {
      params = params.set('monto_min', filtros.monto_min.toString());
    }
    
    if (filtros.monto_max) {
      params = params.set('monto_max', filtros.monto_max.toString());
    }
    
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
    
    return this.http.get<PedidosResponse>(`${envs.API_URL}/admin/pedidos`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener pedidos:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as PedidosResponse);
      })
    );
  }
  
  /**
   * Obtener detalles de un pedido específico
   */
  getPedidoDetalle(id: number): Observable<PedidoDetalleResponse> {
    return this.http.get<PedidoDetalleResponse>(`${envs.API_URL}/admin/pedidos/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener pedido:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as PedidoDetalleResponse);
      })
    );
  }
  
  /**
   * Actualizar estado de un pedido
   */
  actualizarEstadoPedido(id: number, estado: string): Observable<ActualizarEstadoResponse> {
    const body = { estado_pedido: estado };
    
    return this.http.put<ActualizarEstadoResponse>(`${envs.API_URL}/admin/pedidos/${id}/estado`, body).pipe(
      catchError(error => {
        console.error('Error al actualizar estado:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as ActualizarEstadoResponse);
      })
    );
  }
  
  /**
   * Obtener estadísticas de pedidos
   */
  getEstadisticas(fechaInicio?: string, fechaFin?: string): Observable<EstadisticasResponse> {
    let params = new HttpParams();
    
    if (fechaInicio) {
      params = params.set('fecha_inicio', fechaInicio);
    }
    
    if (fechaFin) {
      params = params.set('fecha_fin', fechaFin);
    }
    
    return this.http.get<EstadisticasResponse>(`${envs.API_URL}/admin/pedidos/estadisticas`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as EstadisticasResponse);
      })
    );
  }
}