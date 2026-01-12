import { Component, OnInit } from '@angular/core';
import { CarruselService, ItemCarrusel, FiltrosCarrusel } from '../../services/carrusel.service';
import { ProductosService, Producto } from '../../services/productos.service';

@Component({
  selector: 'app-carrusel',
  templateUrl: './carrusel.component.html',
  styleUrls: ['./carrusel.component.css']
})
export class CarruselComponent implements OnInit {

  // Estados principales
  carrusel: ItemCarrusel[] = [];
  cargando = false;
  error: string = '';

  // Productos para selector  
  productos: Producto[] = [];
  cargandoProductos = false;

  // Formulario
  mostrarFormulario = false;  
  itemEditando: ItemCarrusel | null = null;
  formulario = {
    imagen: null as File | null,
    imagen_mobile: null as File | null,
    producto_id: null as number | null,
    orden: null as number | null,
    estado: 'activo'
  };
  errores: any = {};
  enviando = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';
  imagenPreview: string | null = null;
  imagenMobilePreview: string | null = null;

  // Filtros
  filtros: FiltrosCarrusel = {
    estado: 'todos'
  };

  // Confirmaciones
  mostrarConfirmacion = false;
  itemAccion: ItemCarrusel | null = null;
  accionConfirmacion: 'eliminar' | 'cambiarEstado' = 'eliminar';
  mensajeConfirmacion = '';
  procesandoAccion = false;

  // Reordenamiento
  modoReordenar = false;
  carruselTemporal: ItemCarrusel[] = [];
  reordenandoGuardado = false;

  constructor(
    private carruselService: CarruselService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarCarrusel();
    this.cargarProductosActivos();
  }

  // =================== MÉTODOS DE CARGA ===================

  cargarCarrusel(): void {
    this.cargando = true;
    this.error = '';

    this.carruselService.getCarrusel(this.filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.carrusel = response.data.sort((a, b) => a.orden - b.orden);
        } else {
          this.error = response.message || 'Error al cargar carrusel';
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar carrusel:', error);
        this.error = 'Error de conexión al cargar carrusel';
        this.cargando = false;
      }
    });
  }

  cargarProductosActivos(): void {
    this.cargandoProductos = true;
    this.productosService.getProductos({ estado: 'activo', per_page: 1000 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.productos = response.data.productos;
        }
        this.cargandoProductos = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.cargandoProductos = false;
      }
    });
  }

  // =================== MÉTODOS DE FILTRADO ===================

  aplicarFiltros(): void {
    this.cargarCarrusel();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos'
    };
    this.cargarCarrusel();
  }

  // =================== MÉTODOS DE FORMULARIO ===================

  mostrarFormularioCrear(): void {
    this.itemEditando = null;
    this.formulario = {
      imagen: null,
      imagen_mobile: null,
      producto_id: null,
      orden: null,
      estado: 'activo'
    };
    this.errores = {};
    this.mensaje = '';
    this.imagenPreview = null;
    this.imagenMobilePreview = null;
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(item: ItemCarrusel): void {
    this.itemEditando = item;
    
    // Obtener producto_id desde el objeto producto anidado
    let productoId = null;
    if (item.producto && item.producto.id) {
      productoId = item.producto.id;
    } else if (item.producto_id) {
      // Fallback por si acaso viene directo
      productoId = typeof item.producto_id === 'string' 
        ? parseInt(item.producto_id, 10) 
        : item.producto_id;
    }
    
    this.formulario = {
      imagen: null,
      imagen_mobile: null,
      producto_id: productoId,
      orden: item.orden,
      estado: item.estado
    };
    
    this.errores = {};
    this.mensaje = '';
    this.imagenPreview = item.imagen_url;
    this.imagenMobilePreview = item.imagen_mobile_url || null;
    this.mostrarFormulario = true;
    
    // Debug para verificar
    console.log('Item editando:', item);
    console.log('Producto ID en formulario:', this.formulario.producto_id);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.itemEditando = null;
    this.formulario = {
      imagen: null,
      imagen_mobile: null,
      producto_id: null,
      orden: null,
      estado: 'activo'
    };
    this.errores = {};
    this.mensaje = '';
    this.imagenPreview = null;
     this.imagenMobilePreview = null;
  }

  onImagenSeleccionada(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      this.formulario.imagen = archivo;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenPreview = e.target?.result as string;
      };
      reader.readAsDataURL(archivo);
    } else {
      this.formulario.imagen = null;
      if (!this.itemEditando) {
        this.imagenPreview = null;
      }
    }
  }

  eliminarImagenPreview(): void {
    this.formulario.imagen = null;
    
    if (this.itemEditando) {
      this.imagenPreview = null; // Esto indica que se quiere eliminar la imagen actual
    } else {
      this.imagenPreview = null;
    }
    
    // Reset del input file
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  guardar(): void {
    if (this.enviando) return;

    this.errores = {};
    this.mensaje = '';

    // Validación básica
    if (!this.itemEditando && !this.formulario.imagen) {
      this.errores.imagen = 'La imagen es requerida';
      return;
    }

    if (this.formulario.orden !== null && this.formulario.orden < 0) {
      this.errores.orden = 'El orden debe ser mayor o igual a 0';
      return;
    }

    this.enviando = true;

    // Crear FormData
    const formData = new FormData();
    
    if (this.formulario.imagen) {
      formData.append('imagen', this.formulario.imagen);
    }
    
    if (this.formulario.imagen_mobile) {
      formData.append('imagen_mobile', this.formulario.imagen_mobile);
    }
    
    // ← CORREGIDO: Siempre enviar producto_id en edición
    if (this.itemEditando) {
      // Si hay producto, enviar el ID, si no, enviar string vacío
      const productoId = this.formulario.producto_id;
      if (productoId && typeof productoId === 'number') {
        formData.append('producto_id', productoId.toString());
      } else {
        // Enviar vacío explícitamente para que el backend lo actualice a null
        formData.append('producto_id', '');
      }
    } else {
      // En creación, solo enviar si tiene valor
      const productoId = this.formulario.producto_id;
      if (productoId && typeof productoId === 'number') {
        formData.append('producto_id', productoId.toString());
      }
    }
    
    if (this.formulario.orden !== null) {
      formData.append('orden', this.formulario.orden.toString());
    }
    
    formData.append('estado', this.formulario.estado);

    if (this.itemEditando && !this.formulario.imagen && !this.imagenPreview) {
      formData.append('eliminar_imagen', '1');
    }

    if (this.itemEditando && !this.formulario.imagen_mobile && !this.imagenMobilePreview) {
      formData.append('eliminar_imagen_mobile', '1');
    }

    const operacion = this.itemEditando 
      ? this.carruselService.actualizarCarrusel(this.itemEditando.id, formData)
      : this.carruselService.crearCarrusel(formData);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          this.mensaje = this.itemEditando 
            ? 'Imagen actualizada exitosamente'
            : 'Imagen agregada exitosamente';
          this.tipoMensaje = 'success';
          
          this.cargarCarrusel();
          
          setTimeout(() => {
            this.cerrarFormulario();
          }, 1500);
        } else {
          this.mensaje = response.message || 'Error al guardar la imagen';
          this.tipoMensaje = 'error';
          
          if (response.errors) {
            this.errores = response.errors;
          }
        }
        this.enviando = false;
      },
      error: (error) => {
        console.error('Error al guardar imagen del carrusel:', error);
        
        if (error.error && error.error.errors) {
          this.errores = error.error.errors;
          this.mensaje = error.error.message || 'Error de validación';
        } else {
          this.mensaje = 'Error de conexión al guardar la imagen';
        }
        
        this.tipoMensaje = 'error';
        this.enviando = false;
      }
    });
  }

  // =================== MÉTODOS DE ACCIONES ===================

  confirmarEliminar(item: ItemCarrusel): void {
    this.itemAccion = item;
    this.accionConfirmacion = 'eliminar';
    this.mensajeConfirmacion = `¿Estás seguro de que deseas eliminar esta imagen del carrusel? Esta acción no se puede deshacer.`;
    this.mostrarConfirmacion = true;
  }

  confirmarCambiarEstado(item: ItemCarrusel): void {
    this.itemAccion = item;
    this.accionConfirmacion = 'cambiarEstado';
    const nuevoEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    this.mensajeConfirmacion = `¿Deseas cambiar el estado de esta imagen a "${nuevoEstado}"?`;
    this.mostrarConfirmacion = true;
  }

  cerrarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.itemAccion = null;
    this.procesandoAccion = false;
  }

  ejecutarAccion(): void {
    if (!this.itemAccion || this.procesandoAccion) return;

    this.procesandoAccion = true;

    const operacion = this.accionConfirmacion === 'eliminar'
      ? this.carruselService.eliminarCarrusel(this.itemAccion.id)
      : this.carruselService.cambiarEstadoCarrusel(this.itemAccion.id);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          const accion = this.accionConfirmacion === 'eliminar' ? 'eliminada' : 'actualizada';
          console.log(`Imagen ${accion} exitosamente`);
          this.cargarCarrusel();
          this.cerrarConfirmacion();
        } else {
          console.error('Error:', response.message);
          alert(response.message || 'Error al procesar la acción');
          this.procesandoAccion = false;
        }
      },
      error: (error) => {
        console.error('Error al ejecutar acción:', error);
        alert('Error de conexión al procesar la acción');
        this.procesandoAccion = false;
      }
    });
  }

  // =================== MÉTODOS DE REORDENAMIENTO ===================

  activarModoReordenar(): void {
    this.modoReordenar = true;
    this.carruselTemporal = [...this.carrusel];
  }

  cancelarReordenamiento(): void {
    this.modoReordenar = false;
    this.carruselTemporal = [];
  }

  moverArriba(index: number): void {
    if (index > 0) {
      const temp = this.carruselTemporal[index];
      this.carruselTemporal[index] = this.carruselTemporal[index - 1];
      this.carruselTemporal[index - 1] = temp;
    }
  }

  moverAbajo(index: number): void {
    if (index < this.carruselTemporal.length - 1) {
      const temp = this.carruselTemporal[index];
      this.carruselTemporal[index] = this.carruselTemporal[index + 1];
      this.carruselTemporal[index + 1] = temp;
    }
  }

  guardarReordenamiento(): void {
    if (this.reordenandoGuardado) return;

    // Crear array con los nuevos órdenes
    const items = this.carruselTemporal.map((item, index) => ({
      id: item.id,
      orden: index + 1
    }));

    this.reordenandoGuardado = true;

    this.carruselService.reordenarCarrusel(items).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Carrusel reordenado exitosamente');
          this.cargarCarrusel();
          this.modoReordenar = false;
          this.carruselTemporal = [];
        } else {
          console.error('Error:', response.message);
          alert(response.message || 'Error al reordenar');
        }
        this.reordenandoGuardado = false;
      },
      error: (error) => {
        console.error('Error al reordenar:', error);
        alert('Error de conexión al reordenar');
        this.reordenandoGuardado = false;
      }
    });
  }

  // =================== MÉTODOS AUXILIARES ===================

  getEstadoClase(estado: string): string {
    return estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
  }

  getTitulo(): string {
    return this.itemEditando ? 'Editar Imagen del Carrusel' : 'Nueva Imagen del Carrusel';
  }

  getTextoBotonGuardar(): string {
    if (this.enviando) {
      return this.itemEditando ? 'Actualizando...' : 'Guardando...';
    }
    return this.itemEditando ? 'Actualizar' : 'Guardar';
  }

  formatearTamanioArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getProductoNombre(productoId?: number): string {
    if (!productoId) return 'Sin producto';
    const producto = this.productos.find(p => p.id === productoId);
    return producto ? producto.nombre : `Producto #${productoId}`;
  }

  formatearPrecio(precio?: number): string {
    if (!precio) return '';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(precio);
  }
  onImagenMobileSeleccionada(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      this.formulario.imagen_mobile = archivo;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenMobilePreview = e.target?.result as string;
      };
      reader.readAsDataURL(archivo);
    } else {
      this.formulario.imagen_mobile = null;
      if (!this.itemEditando) {
        this.imagenMobilePreview = null;
      }
    }
  }

  eliminarImagenMobilePreview(): void {
    this.formulario.imagen_mobile = null;
    
    if (this.itemEditando) {
      this.imagenMobilePreview = null;
    } else {
      this.imagenMobilePreview = null;
    }
    
    // Reset del input file
    const fileInput = document.getElementById('imagen_mobile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}