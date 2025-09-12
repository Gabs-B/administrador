import { Component, OnInit } from '@angular/core';
import { ClientesService, Cliente, FiltrosClientes } from '../../services/clientes.service';

interface PaginacionInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
  styleUrls: ['./cliente.component.css']
})
export class ClienteComponent implements OnInit {

  // Estados principales
  clientes: Cliente[] = [];
  cargando = false;
  error: string = '';
  totalClientes: number = 0;
  paginacion: PaginacionInfo | null = null;

  // Filtros
  filtros: FiltrosClientes = {
    tipo: 'todos',
    buscar: '',
    page: 1,
    per_page: 10
  };

  constructor(private clientesService: ClientesService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  // =================== MÉTODOS DE CARGA ===================

  cargarClientes(): void {
    this.cargando = true;
    this.error = '';

    this.clientesService.getClientes(this.filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.clientes = response.data.clientes || [];
          this.paginacion = response.data.pagination || null;
          this.totalClientes = this.paginacion?.total || 0;
        } else {
          this.error = response.message || 'Error al cargar clientes';
          this.clientes = [];
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error de conexión al servidor';
        this.clientes = [];
        this.cargando = false;
        console.error('Error al cargar clientes:', err);
      }
    });
  }

  // =================== MÉTODOS DE FILTROS ===================

  aplicarFiltros(): void {
    this.filtros.page = 1; // Resetear a la primera página
    this.cargarClientes();
  }

  limpiarFiltros(): void {
    this.filtros = {
      tipo: 'todos',
      buscar: '',
      page: 1,
      per_page: 20
    };
    this.cargarClientes();
  }

  // =================== MÉTODOS DE PAGINACIÓN ===================

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && this.paginacion && pagina <= this.paginacion.last_page) {
      this.filtros.page = pagina;
      this.cargarClientes();
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
        // Mostrar las primeras 5 páginas
        for (let i = 1; i <= 5; i++) {
          paginas.push(i);
        }
        paginas.push(-1); // Indicador de separación
        paginas.push(last);
      } else if (current >= last - 3) {
        // Mostrar las últimas 5 páginas
        paginas.push(1);
        paginas.push(-1); // Indicador de separación
        for (let i = last - 4; i <= last; i++) {
          paginas.push(i);
        }
      } else {
        // Mostrar páginas alrededor de la actual
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

  getTipoClase(tipo: string): string {
    switch (tipo) {
      case 'registrado':
        return 'tipo-registrado';
      case 'invitado':
        return 'tipo-invitado';
      default:
        return 'tipo-default';
    }
  }
}