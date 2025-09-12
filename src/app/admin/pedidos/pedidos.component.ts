import { Component, OnInit } from '@angular/core';
import { PedidosService, Pedido, FiltrosPedidos, EstadisticasPedidos, Producto } from '../../services/pedidos.service';
import { ProductosService } from '../../services/productos.service';
import { envs } from '../../config/envs';



interface PaginacionInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit {
backendUrl = envs.backendUrl; 
  

  // Estados principales
  productos: Producto[] = [];
  pedidos: Pedido[] = [];
  cargando = false;
  error: string = '';
  totalPedidos: number = 0;
  paginacion: PaginacionInfo | null = null;
  
  // Estados específicos para pedidos
  cargandoEstado = false;
  pedidoEditando: number | null = null;
  estadisticas: EstadisticasPedidos | null = null;
  cargandoEstadisticas = false;
  // Modal
   mostrarModal = false;
  pedidoSeleccionado: number | null = null;
  pedidoDetalle: Pedido | null = null;
  cargandoDetalle = false;
  errorDetalle: string = '';
  nuevoEstado: string = '';


  // Filtros
  filtros: FiltrosPedidos = {
    estado: 'todos',
    buscar: '',
    fecha_desde: '',
    fecha_hasta: '',
    monto_min: undefined,
    monto_max: undefined,
    page: 1,
    per_page: 15
  };

  // Estados disponibles
  estadosDisponibles = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'pagado', etiqueta: 'Pagado' },
    { valor: 'enviado', etiqueta: 'Enviado' },
    { valor: 'cancelado', etiqueta: 'Cancelado' }
  ];

  constructor(private pedidosService: PedidosService,   private productosService: ProductosService
) {}

  ngOnInit(): void {
    this.cargarPedidos();
    this.cargarEstadisticas();
  }

  // =================== MÉTODOS DE CARGA ===================

  cargarPedidos(): void {
    this.cargando = true;
    this.error = '';

    this.pedidosService.getPedidos(this.filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pedidos = response.data || [];
          this.paginacion = response.pagination || null;
          this.totalPedidos = this.paginacion?.total || 0;
        } else {
          this.error = response.message || 'Error al cargar pedidos';
          this.pedidos = [];
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error de conexión al servidor';
        this.pedidos = [];
        this.cargando = false;
        console.error('Error al cargar pedidos:', err);
      }
    });
  }

  cargarEstadisticas(): void {
    this.cargandoEstadisticas = true;
    
    const fechaInicio = this.filtros.fecha_desde || undefined;
    const fechaFin = this.filtros.fecha_hasta || undefined;

    this.pedidosService.getEstadisticas(fechaInicio, fechaFin).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadisticas = response.data.resumen;
        }
        this.cargandoEstadisticas = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
        this.cargandoEstadisticas = false;
      }
    });
  }

  // =================== MÉTODOS DE FILTROS ===================

  aplicarFiltros(): void {
    this.filtros.page = 1; // Resetear a la primera página
    this.cargarPedidos();
    this.cargarEstadisticas();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos',
      buscar: '',
      fecha_desde: '',
      fecha_hasta: '',
      monto_min: undefined,
      monto_max: undefined,
      page: 1,
      per_page: 15
    };
    this.cargarPedidos();
    this.cargarEstadisticas();
  }

  // =================== MÉTODOS DE PAGINACIÓN ===================

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && this.paginacion && pagina <= this.paginacion.last_page) {
      this.filtros.page = pagina;
      this.cargarPedidos();
    }
  }

  getPaginasVisibles(): number[] {
    if (!this.paginacion) return [];
    
    const current = this.paginacion.current_page;
    const last = this.paginacion.last_page;
    const paginas: number[] = [];
    
    if (last <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= last; i++) {
        paginas.push(i);
      }
    } else {
      // Lógica para mostrar páginas relevantes
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          paginas.push(i);
        }
        paginas.push(-1); // Indicador de separación
        paginas.push(last);
      } else if (current >= last - 3) {
        paginas.push(1);
        paginas.push(-1); // Indicador de separación
        for (let i = last - 4; i <= last; i++) {
          paginas.push(i);
        }
      } else {
        paginas.push(1);
        paginas.push(-1); // Indicador de separación
        for (let i = current - 1; i <= current + 1; i++) {
          paginas.push(i);
        }
        paginas.push(-1); // Indicador de separación
        paginas.push(last);
      }
    }
    
    return paginas;
  }

  // =================== MÉTODOS DE UTILIDAD ===================

  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'estado-pendiente';
      case 'pagado':
        return 'estado-pagado';
      case 'enviado':
        return 'estado-enviado';
      case 'cancelado':
        return 'estado-cancelado';
      default:
        return 'estado-default';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'pagado':
        return 'Pagado';
      case 'enviado':
        return 'Enviado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(monto);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }


  estaEditandoEstado(pedidoId: number): boolean {
    return this.pedidoEditando === pedidoId && this.cargandoEstado;
  }

  verDetallePedido(pedidoId: number): void {
    this.pedidoSeleccionado = pedidoId;
    this.mostrarModal = true;
    this.cargarDetallePedido(pedidoId);
  }

  cargarDetallePedido(pedidoId: number): void {
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.pedidoDetalle = null;

    this.pedidosService.getPedidoDetalle(pedidoId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pedidoDetalle = response.data;
          this.nuevoEstado = response.data.estado_pedido;
        } else {
          this.errorDetalle = response.message || 'Error al cargar el detalle del pedido';
        }
        this.cargandoDetalle = false;
      },
      error: (err) => {
        this.errorDetalle = 'Error de conexión al servidor';
        this.cargandoDetalle = false;
        console.error('Error al cargar detalle del pedido:', err);
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.pedidoSeleccionado = null;
    this.pedidoDetalle = null;
    this.errorDetalle = '';
    this.nuevoEstado = '';
  }

  // =================== MÉTODOS DE ESTADOS DE PAGO ===================

  getPagoEstadoClase(estado: string): string {
    switch (estado) {
      case 'aprobado':
        return 'aprobado';
      case 'pendiente':
      case 'pendiente_yape':
        return 'pendiente';
      case 'fallido':
        return 'fallido';
      default:
        return 'pendiente';
    }
  }

  getPagoEstadoTexto(estado: string): string {
    switch (estado) {
      case 'aprobado':
        return 'Aprobado';
      case 'pendiente':
        return 'Pendiente';
      case 'pendiente_yape':
        return 'Pendiente (Yape)';
      case 'fallido':
        return 'Fallido';
      default:
        return estado;
    }
  }

  // =================== MÉTODOS DE CAMBIO DE ESTADO ===================

  getEstadosDisponibles(estadoActual: string): Array<{valor: string, etiqueta: string}> {
    // Definir las transiciones de estado permitidas
    const transicionesPermitidas: {[key: string]: Array<{valor: string, etiqueta: string}>} = {
      'pendiente': [
        { valor: 'pagado', etiqueta: 'Pagado' },
        { valor: 'cancelado', etiqueta: 'Cancelado' }
      ],
      'pagado': [
        { valor: 'enviado', etiqueta: 'Enviado' },
        { valor: 'cancelado', etiqueta: 'Cancelado' }
      ],
      'enviado': [
        // Los pedidos enviados generalmente no cambian de estado
      ],
      'cancelado': [
        // Los pedidos cancelados generalmente no cambian de estado
      ]
    };

    return transicionesPermitidas[estadoActual] || [];
  }

  actualizarEstadoPedidoModal(pedidoId: number, nuevoEstado: string): void {
    if (!this.pedidoDetalle) return;

    this.cargandoEstado = true;
    this.pedidoEditando = pedidoId;

    this.pedidosService.actualizarEstadoPedido(pedidoId, nuevoEstado).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar el estado en el detalle del modal
          if (this.pedidoDetalle) {
            this.pedidoDetalle.estado_pedido = nuevoEstado as any;
            this.pedidoDetalle.ultima_actualizacion = new Date().toISOString();
          }
          
          // Actualizar el pedido en la lista principal
          const pedido = this.pedidos.find(p => p.id === pedidoId);
          if (pedido) {
            pedido.estado_pedido = nuevoEstado as any;
            pedido.ultima_actualizacion = new Date().toISOString();
          }
          
          // Recargar estadísticas
          this.cargarEstadisticas();
          
          // Mostrar mensaje de éxito (opcional)
          console.log('Estado actualizado correctamente');
        } else {
          this.error = response.message || 'Error al actualizar el estado';
        }
        this.cargandoEstado = false;
        this.pedidoEditando = null;
      },
      error: (err) => {
        this.error = 'Error al actualizar el estado del pedido';
        this.cargandoEstado = false;
        this.pedidoEditando = null;
        console.error('Error al actualizar estado:', err);
      }
    });
  }

  // Actualizar el método existente para usar la nueva función
  actualizarEstadoPedido(pedidoId: number, nuevoEstado: string): void {
    // Si estamos en el modal, usar el método del modal
    if (this.mostrarModal && this.pedidoDetalle) {
      this.actualizarEstadoPedidoModal(pedidoId, nuevoEstado);
      return;
    }

    // Código existente para actualizar desde la tabla
    this.cargandoEstado = true;
    this.pedidoEditando = pedidoId;

    this.pedidosService.actualizarEstadoPedido(pedidoId, nuevoEstado).subscribe({
      next: (response) => {
        if (response.success) {
          const pedido = this.pedidos.find(p => p.id === pedidoId);
          if (pedido) {
            pedido.estado_pedido = nuevoEstado as any;
            pedido.ultima_actualizacion = new Date().toISOString();
          }
          this.cargarEstadisticas();
        } else {
          this.error = response.message || 'Error al actualizar el estado';
        }
        this.cargandoEstado = false;
        this.pedidoEditando = null;
      },
      error: (err) => {
        this.error = 'Error al actualizar el estado del pedido';
        this.cargandoEstado = false;
        this.pedidoEditando = null;
        console.error('Error al actualizar estado:', err);
      }
    });
  }

  // =================== MÉTODOS DE UTILIDAD ADICIONALES ===================

  puedeEditarEstado(pedido: Pedido): boolean {
    // Los pedidos cancelados y enviados generalmente no se pueden editar
    return !['cancelado'].includes(pedido.estado_pedido);
  }

  // Método para manejar clics fuera del modal (cerrar modal)
  onModalOverlayClick(event: Event): void {
    // Este método se llama desde el template con (click)="cerrarModal()"
    this.cerrarModal();
  }
handleImgError(event: Event): void {
  const img = event.target as HTMLImageElement;

  if (img && img.src !== window.location.origin + '/assets/images/no-image.png') {
    img.src = '/assets/images/no-image.png';
  }
}

getImagenProducto(producto: Producto): string {
  return producto?.imagen_principal
    ? `${this.backendUrl}/storage/${producto.imagen_principal}`
    : '/assets/images/no-image.png';
}

getEstadisticasArray() {
  if (!this.estadisticas) return [];
  
  return [
    {
      valor: this.estadisticas.total_pedidos,
      label: 'Total'
    },
    {
      valor: this.estadisticas.pendientes,
      label: 'Pendientes'
    },
    {
      valor: this.estadisticas.pagados,
      label: 'Pagados'
    },
    {
      valor: this.formatearMoneda(this.estadisticas.monto_total),
      label: 'Monto Total'
    }
  ];
}



}