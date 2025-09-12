import { Component, OnInit } from '@angular/core';
import { ProductosService, Producto, FiltrosProductos } from '../../services/productos.service';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  cargando = false;
  error: string | null = null;
  
  // Filtros
  filtros: FiltrosProductos = {
    estado: 'todos',
    buscar: '',
    per_page: 10,
    page: 1
  };

  // Paginación
  paginaActual = 1;
  totalPaginas = 1;
  totalProductos = 0;
  productosPorPagina = 10;

  // Modal del formulario
  mostrarFormulario = false;
  productoEditando: Producto | null = null;

  // Confirmaciones
  mostrarConfirmacion = false;
  accionConfirmacion: 'eliminar' | 'activar' | null = null;
  productoConfirmacion: Producto | null = null;
  mensajeConfirmacion = '';
  procesandoAccion = false;

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  /**
   * Cargar productos desde el API
   */
  cargarProductos(): void {
    this.cargando = true;
    this.error = null;

    this.filtros.page = this.paginaActual;
    this.filtros.per_page = this.productosPorPagina;

    this.productosService.getProductos(this.filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.productos = response.data.productos;
          this.paginaActual = response.data.pagination.current_page;
          this.totalPaginas = response.data.pagination.last_page;
          this.totalProductos = response.data.pagination.total;
        } else {
          this.error = response.message || 'Error al cargar productos';
          this.productos = [];
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error de conexión con el servidor';
        this.productos = [];
      },
      complete: () => {
        this.cargando = false;
      }
    });
  }

  /**
   * Aplicar filtros de búsqueda
   */
  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarProductos();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos',
      buscar: '',
      per_page: this.productosPorPagina,
      page: 1
    };
    this.paginaActual = 1;
    this.cargarProductos();
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarProductos();
    }
  }
  getPaginasVisibles(): number[] {
  const paginas: number[] = [];
  const current = this.paginaActual;
  const last = this.totalPaginas;
  
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




  /**
   * Cambiar productos por página
   */
  cambiarProductosPorPagina(cantidad: number): void {
    this.productosPorPagina = cantidad;
    this.paginaActual = 1;
    this.cargarProductos();
  }

  // ============ FUNCIONES DEL FORMULARIO ============

  /**
   * Mostrar formulario para crear producto
   */
  mostrarFormularioCrear(): void {
    this.productoEditando = null;
    this.mostrarFormulario = true;
  }

  /**
   * Mostrar formulario para editar producto
   */
  mostrarFormularioEditar(producto: Producto): void {
    this.productoEditando = { ...producto }; // Crear copia
    this.mostrarFormulario = true;
  }

  /**
   * Cerrar formulario
   */
  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.productoEditando = null;
  }

  /**
   * Manejar producto guardado
   */
  onProductoGuardado(producto: Producto): void {
    // Si es edición, actualizar en la lista
    if (this.productoEditando) {
      const index = this.productos.findIndex(p => p.id === producto.id);
      if (index !== -1) {
        this.productos[index] = producto;
      }
    } else {
      // Si es creación, recargar la lista para mantener paginación
      this.cargarProductos();
    }
    
    this.cerrarFormulario();
  }

  // ============ FUNCIONES DE CONFIRMACIÓN ============

  /**
   * Mostrar confirmación para eliminar producto
   */
  confirmarEliminar(producto: Producto): void {
    this.productoConfirmacion = producto;
    this.accionConfirmacion = 'eliminar';
    this.mensajeConfirmacion = `¿Estás seguro de desactivar el producto "${producto.nombre}"?`;
    this.mostrarConfirmacion = true;
  }

  /**
   * Mostrar confirmación para activar producto
   */
  confirmarActivar(producto: Producto): void {
    this.productoConfirmacion = producto;
    this.accionConfirmacion = 'activar';
    this.mensajeConfirmacion = `¿Estás seguro de activar el producto "${producto.nombre}"?`;
    this.mostrarConfirmacion = true;
  }

  /**
   * Cerrar confirmación
   */
  cerrarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.accionConfirmacion = null;
    this.productoConfirmacion = null;
    this.mensajeConfirmacion = '';
    this.procesandoAccion = false;
  }

  /**
   * Ejecutar acción confirmada
   */
  ejecutarAccion(): void {
    if (!this.productoConfirmacion || !this.accionConfirmacion) {
      return;
    }

    this.procesandoAccion = true;

    const observable = this.accionConfirmacion === 'eliminar'
      ? this.productosService.eliminarProducto(this.productoConfirmacion.id)
      : this.productosService.activarProducto(this.productoConfirmacion.id);

    observable.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Actualizar producto en la lista
          const index = this.productos.findIndex(p => p.id === response.data!.id);
          if (index !== -1) {
            this.productos[index] = response.data;
          }
          this.cerrarConfirmacion();
        } else {
          console.error('Error en la acción:', response.message);
        }
      },
      error: (error) => {
        console.error('Error:', error);
      },
      complete: () => {
        this.procesandoAccion = false;
      }
    });
  }

  // ============ FUNCIONES DE UTILIDAD ============

  /**
   * Obtener clase CSS para el estado del producto
   */
  getEstadoClase(estado: string): string {
    return estado === 'activo' 
      ? 'estado-activo' 
      : 'estado-inactivo';
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