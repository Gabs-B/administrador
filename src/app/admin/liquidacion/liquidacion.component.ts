import { Component, OnInit } from '@angular/core';
import { LiquidacionService, Liquidacion, ProductoDisponible } from '../../services/liquidacion.service';

interface FormularioLiquidacion {
  producto_id: number | null;
  imagen: File | null;
  orden: number | null; // ← AGREGAR ESTA LÍNEA
}

@Component({
  selector: 'app-liquidacion',
  templateUrl: './liquidacion.component.html',
  styleUrls: ['./liquidacion.component.css']
})
export class LiquidacionComponent implements OnInit {
  // Constante para límite máximo
  readonly MAX_LIQUIDACIONES = 6;

  // Estado principal
  liquidaciones: Liquidacion[] = [];
  productos: ProductoDisponible[] = [];
  cargando = false;
  cargandoProductos = false;
  error: string | null = null;

  // Modal de formulario
  mostrarFormulario = false;
  liquidacionEditando: Liquidacion | null = null;
  
  // Formulario
  formulario: FormularioLiquidacion = {
    producto_id: null,
    imagen: null,
    orden: null // ← AGREGAR ESTA LÍNEA
  };

  // Estados del formulario
  enviando = false;
  errores: any = {};
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';
  imagenPreview: string | null = null;

  // Modal de confirmación
  mostrarConfirmacion = false;
  liquidacionParaEliminar: Liquidacion | null = null;
  procesandoEliminacion = false;

  constructor(private liquidacionService: LiquidacionService) {
    // Inicializar arrays para evitar errores de filter
    this.liquidaciones = [];
    this.productos = [];
  }

  ngOnInit(): void {
    this.cargarLiquidaciones();
    this.cargarProductos();
  }

  // =============== MÉTODOS DE CARGA ===============

  cargarLiquidaciones(): void {
    this.cargando = true;
    this.error = null;

    this.liquidacionService.getLiquidaciones().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Ordenar por orden ascendente
          this.liquidaciones = response.data.sort((a, b) => a.orden - b.orden);
        } else {
          this.error = response.message || 'Error al cargar liquidaciones';
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error de conexión';
        this.cargando = false;
      }
    });
  }

  cargarProductos(): void {
    this.cargandoProductos = true;

    this.liquidacionService.getProductos().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Acceder a los productos correctamente según la estructura de respuesta
          this.productos = response.data.productos;
        }
        this.cargandoProductos = false;
      },
      error: () => {
        this.cargandoProductos = false;
      }
    });
  }

  // =============== MÉTODOS DE FORMULARIO ===============

  mostrarFormularioCrear(): void {
    // Verificar límite antes de mostrar formulario
    if (this.liquidaciones.length >= this.MAX_LIQUIDACIONES) {
      this.mostrarMensaje(`Solo se permiten máximo ${this.MAX_LIQUIDACIONES} liquidaciones`, 'error');
      return;
    }

    this.liquidacionEditando = null;
    this.limpiarFormulario();
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(liquidacion: Liquidacion): void {
    this.liquidacionEditando = liquidacion;
    this.limpiarFormulario();
    
    this.formulario.producto_id = liquidacion.producto_id;
    this.formulario.orden = liquidacion.orden; // ← AGREGAR ESTA LÍNEA
    this.imagenPreview = liquidacion.imagen_url; // Mostrar imagen actual
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.limpiarMensajes();
  }

  limpiarFormulario(): void {
    this.formulario = {
      producto_id: null,
      imagen: null,
      orden: null // ← AGREGAR ESTA LÍNEA
    };
    this.imagenPreview = null;
    this.errores = {};
  }

  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.formulario.imagen = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarImagenPreview(): void {
    this.formulario.imagen = null;
    
    if (this.liquidacionEditando) {
      this.imagenPreview = null; // Esto indica que se quiere eliminar la imagen actual
    } else {
      this.imagenPreview = null;
    }
    
    // Limpiar input file
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  guardar(): void {
    if (this.enviando) return;

    if (!this.validarFormulario()) {
      return;
    }

    this.enviando = true;
    this.limpiarMensajes();

    const formData = new FormData();
    
    if (this.formulario.producto_id) {
      formData.append('producto_id', this.formulario.producto_id.toString());
    }

    // ← AGREGAR ORDEN AL FORMDATA
    if (this.formulario.orden) {
      formData.append('orden', this.formulario.orden.toString());
    }

    // Solo agregar imagen si hay una nueva imagen seleccionada
    if (this.formulario.imagen) {
      formData.append('imagen', this.formulario.imagen);
    }

    // Si es edición y no hay nueva imagen, pero se eliminó el preview, 
    // significa que quiere eliminar la imagen actual
    if (this.liquidacionEditando && !this.formulario.imagen && !this.imagenPreview) {
      formData.append('eliminar_imagen', '1');
    }

    const operacion = this.liquidacionEditando ? 
      this.liquidacionService.actualizarLiquidacion(this.liquidacionEditando.id, formData) :
      this.liquidacionService.crearLiquidacion(formData);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje(
            this.liquidacionEditando ? 'Liquidación actualizada exitosamente' : 'Liquidación creada exitosamente', 
            'success'
          );
          
          setTimeout(() => {
            this.cerrarFormulario();
            this.cargarLiquidaciones();
          }, 1500);
        } else {
          this.errores = response.errors || {};
          this.mostrarMensaje(response.message || 'Error al guardar', 'error');
        }
        this.enviando = false;
      },
      error: () => {
        this.mostrarMensaje('Error de conexión', 'error');
        this.enviando = false;
      }
    });
  }

  validarFormulario(): boolean {
    this.errores = {};

    if (!this.formulario.producto_id) {
      this.errores.producto_id = 'Debes seleccionar un producto';
    }

    // ← AGREGAR VALIDACIÓN DE ORDEN
    if (!this.formulario.orden) {
      this.errores.orden = 'Debes seleccionar un orden';
    }

    if (!this.liquidacionEditando && !this.formulario.imagen) {
      this.errores.imagen = 'La imagen es obligatoria';
    }

    return Object.keys(this.errores).length === 0;
  }

  // =============== MÉTODOS DE ELIMINACIÓN ===============

  confirmarEliminar(liquidacion: Liquidacion): void {
    this.liquidacionParaEliminar = liquidacion;
    this.mostrarConfirmacion = true;
  }

  cerrarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.liquidacionParaEliminar = null;
  }

  ejecutarEliminacion(): void {
    if (!this.liquidacionParaEliminar || this.procesandoEliminacion) return;

    this.procesandoEliminacion = true;

    this.liquidacionService.eliminarLiquidacion(this.liquidacionParaEliminar.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Liquidación eliminada exitosamente', 'success');
          this.cargarLiquidaciones();
        } else {
          this.mostrarMensaje(response.message || 'Error al eliminar liquidación', 'error');
        }
        this.procesandoEliminacion = false;
        this.cerrarConfirmacion();
      },
      error: () => {
        this.mostrarMensaje('Error de conexión', 'error');
        this.procesandoEliminacion = false;
        this.cerrarConfirmacion();
      }
    });
  }

  // =============== MÉTODOS AUXILIARES ===============

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    
    setTimeout(() => {
      this.limpiarMensajes();
    }, 5000);
  }

  limpiarMensajes(): void {
    this.mensaje = '';
    this.errores = {};
  }

  getTitulo(): string {
    return this.liquidacionEditando ? 'Editar Liquidación' : 'Nueva Liquidación';
  }

  getTextoBotonGuardar(): string {
    if (this.enviando) {
      return this.liquidacionEditando ? 'Actualizando...' : 'Creando...';
    }
    return this.liquidacionEditando ? 'Actualizar' : 'Crear Liquidación';
  }

  formatearPrecio(precio: number): string {
    return this.liquidacionService.formatearPrecio(precio);
  }

  // Verificar si un producto ya tiene liquidación
  productoTieneLiquidacion(productoId: number): boolean {
    return this.liquidaciones.some(liq => liq.producto_id === productoId && 
      (!this.liquidacionEditando || liq.id !== this.liquidacionEditando.id));
  }

  // Obtener productos disponibles para crear liquidación
  getProductosDisponibles(): ProductoDisponible[] {
    if (this.liquidacionEditando) {
      // Si estamos editando, incluimos el producto actual
      return this.productos;
    }
    
    // Si estamos creando, excluimos productos que ya tienen liquidación
    return this.productos.filter(producto => 
      !this.productoTieneLiquidacion(producto.id)
    );
  }

  // Verificar si se puede crear nueva liquidación
  puedeCrearNueva(): boolean {
    return this.liquidaciones.length < this.MAX_LIQUIDACIONES;
  }

  // Obtener mensaje de límite
  getMensajeLimite(): string {
    return `Máximo ${this.MAX_LIQUIDACIONES} liquidaciones permitidas`;
  }

  // Obtener opciones de orden disponibles
  getOpcionesOrden(): number[] {
    const opciones: number[] = [];
    for (let i = 1; i <= this.MAX_LIQUIDACIONES; i++) {
      opciones.push(i);
    }
    return opciones;
  }
}