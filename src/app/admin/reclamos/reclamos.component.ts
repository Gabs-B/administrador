import { Component, OnInit } from '@angular/core';
import { ReclamosService, Reclamacion, FiltrosReclamos, EstadisticasReclamos, PaginacionInfo } from '../../services/reclamos.service';

@Component({
  selector: 'app-reclamos',
  templateUrl: './reclamos.component.html',
  styleUrls: ['./reclamos.component.css']
})
export class ReclamosComponent implements OnInit {

  // Estados principales
  reclamos: Reclamacion[] = [];
  cargando = false;
  error: string = '';
  estadisticas: EstadisticasReclamos | null = null;
  paginacion: PaginacionInfo | null = null;

  // Estados para modal/detalles
  reclamoSeleccionado: Reclamacion | null = null;
  mostrandoDetalle = false;
  actualizandoEstado = false;

  // Filtros
  filtros: FiltrosReclamos = {
    estado: 'todos',
    tipo_reclamo: 'todos',
    fecha_desde: '',
    fecha_hasta: '',
    buscar: '',
    page: 1,
    per_page: 20
  };

  // Opciones para los selectores
  estadosOptions = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'resuelto', label: 'Resuelto' }
  ];

  tiposReclamoOptions = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'reclamo', label: 'Reclamo' },
    { value: 'queja', label: 'Queja' }
  ];

  constructor(private reclamosService: ReclamosService) {}

  ngOnInit(): void {
    this.cargarReclamos();
  }

  // =================== MÉTODOS DE CARGA ===================

  cargarReclamos(): void {
    this.cargando = true;
    this.error = '';

    this.reclamosService.getReclamos(this.filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reclamos = response.data.data || [];
          this.estadisticas = response.estadisticas || null;
          
          this.paginacion = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            per_page: response.data.per_page,
            total: response.data.total,
            from: response.data.from,
            to: response.data.to
          };
        } else {
          this.error = response.message || 'Error al cargar reclamos';
          this.reclamos = [];
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error de conexión al servidor';
        this.reclamos = [];
        this.cargando = false;
        console.error('Error al cargar reclamos:', err);
      }
    });
  }

  // =================== MÉTODOS DE FILTROS ===================

  aplicarFiltros(): void {
    this.filtros.page = 1; // Resetear a la primera página
    this.cargarReclamos();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos',
      tipo_reclamo: 'todos',
      fecha_desde: '',
      fecha_hasta: '',
      buscar: '',
      page: 1,
      per_page: 20
    };
    this.cargarReclamos();
  }

  // =================== MÉTODOS DE PAGINACIÓN ===================

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && this.paginacion && pagina <= this.paginacion.last_page) {
      this.filtros.page = pagina;
      this.cargarReclamos();
    }
  }

  getPaginasVisibles(): number[] {
    if (!this.paginacion) return [];
    
    const current = this.paginacion.current_page;
    const last = this.paginacion.last_page;
    const paginas: number[] = [];
    
    if (last <= 7) {
      for (let i = 1; i <= last; i++) {
        paginas.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          paginas.push(i);
        }
        paginas.push(-1);
        paginas.push(last);
      } else if (current >= last - 3) {
        paginas.push(1);
        paginas.push(-1);
        for (let i = last - 4; i <= last; i++) {
          paginas.push(i);
        }
      } else {
        paginas.push(1);
        paginas.push(-1);
        for (let i = current - 1; i <= current + 1; i++) {
          paginas.push(i);
        }
        paginas.push(-1);
        paginas.push(last);
      }
    }
    
    return paginas;
  }

  // =================== MÉTODOS DE DETALLE ===================

  verDetalle(reclamo: Reclamacion): void {
    this.reclamoSeleccionado = reclamo;
    this.mostrandoDetalle = true;
  }

  cerrarDetalle(): void {
    this.reclamoSeleccionado = null;
    this.mostrandoDetalle = false;
  }

  // =================== MÉTODOS DE ACTUALIZACIÓN ===================

  // Método corregido en el componente
// Método corregido - Cierra el modal después de actualizar
actualizarEstado(reclamo: Reclamacion, nuevoEstado: string): void {
  const estadoAnterior = reclamo.estado;
  
  if (estadoAnterior === nuevoEstado) return;

  this.actualizandoEstado = true;
  console.log('Actualizando estado de', reclamo.id, 'a', nuevoEstado);

  this.reclamosService.actualizarEstado(reclamo.id, nuevoEstado).subscribe({
    next: (response) => {
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        if (this.reclamoSeleccionado && this.reclamoSeleccionado.id === reclamo.id) {
          this.reclamoSeleccionado.estado = nuevoEstado as any;
        }

        this.actualizarEstadisticas();
        console.log('Estado actualizado correctamente');
        
        // CIERRA EL MODAL DESPUÉS DE ACTUALIZAR EXITOSAMENTE
        this.actualizandoEstado = false;
        setTimeout(() => {
          this.cerrarDetalle();
        }, 500); // Pequeño delay para que el usuario vea la actualización
        
      } else {
        reclamo.estado = estadoAnterior as any;
        if (this.reclamoSeleccionado && this.reclamoSeleccionado.id === reclamo.id) {
          this.reclamoSeleccionado.estado = estadoAnterior as any;
        }
        this.error = response.message || 'Error al actualizar estado';
        this.actualizandoEstado = false;
      }
    },
    error: (err) => {
      console.error('Error en petición:', err);
      
      reclamo.estado = estadoAnterior as any;
      if (this.reclamoSeleccionado && this.reclamoSeleccionado.id === reclamo.id) {
        this.reclamoSeleccionado.estado = estadoAnterior as any;
      }
      
      this.error = 'Error de conexión al actualizar estado';
      this.actualizandoEstado = false;
    }
  });
}

// Método auxiliar para actualizar solo las estadísticas
private actualizarEstadisticas(): void {
  this.reclamosService.getReclamos({ page: 1, per_page: 1 }).subscribe({
    next: (response) => {
      if (response.success && response.estadisticas) {
        this.estadisticas = response.estadisticas;
      }
    },
    error: (err) => {
      console.error('Error al actualizar estadísticas:', err);
    }
  });
}

  // =================== MÉTODOS DE UTILIDAD ===================

  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'estado-pendiente';
      case 'en_proceso':
        return 'estado-proceso';
      case 'resuelto':
        return 'estado-resuelto';
      default:
        return 'estado-default';
    }
  }

  getTipoClase(tipo: string): string {
    switch (tipo) {
      case 'reclamo':
        return 'tipo-reclamo';
      case 'queja':
        return 'tipo-queja';
      default:
        return 'tipo-default';
    }
  }

  formatearFecha(fecha: string): string {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }

  getNombreCompleto(reclamo: Reclamacion): string {
    return `${reclamo.nombres} ${reclamo.apellidos}`;
  }
  // Agregar estos métodos en tu componente
getPorcentajePendientes(): number {
  if (!this.estadisticas || this.estadisticas.total === 0) return 0;
  return Math.round((this.estadisticas.pendientes / this.estadisticas.total) * 100);
}

getPorcentajeEnProceso(): number {
  if (!this.estadisticas || this.estadisticas.total === 0) return 0;
  return Math.round((this.estadisticas.en_proceso / this.estadisticas.total) * 100);
}

getPorcentajeResueltas(): number {
  if (!this.estadisticas || this.estadisticas.total === 0) return 0;
  return Math.round((this.estadisticas.resueltas / this.estadisticas.total) * 100);
}

getPorcentajeReclamos(): number {
  if (!this.estadisticas || this.estadisticas.total === 0) return 0;
  return Math.round((this.estadisticas.reclamos / this.estadisticas.total) * 100);
}

getPorcentajeQuejas(): number {
  if (!this.estadisticas || this.estadisticas.total === 0) return 0;
  return Math.round((this.estadisticas.quejas / this.estadisticas.total) * 100);
}

getUltimaActualizacion(): string {
  return `Actualizado: ${new Date().toLocaleTimeString()}`;
}
}