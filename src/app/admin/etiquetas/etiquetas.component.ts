import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { EtiquetaService, Etiqueta, EtiquetasPaginadas, CrearEtiquetaData, ActualizarEtiquetaData } from '../../services/etiqueta.service';

@Component({
  selector: 'app-etiquetas',
  templateUrl: './etiquetas.component.html',
  styleUrls: ['./etiquetas.component.css']
})
export class EtiquetasComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Estados
  cargando: boolean = false;
  error: string | null = null;
  enviando: boolean = false;
  procesandoAccion: boolean = false;

  // Datos
  etiquetas: Etiqueta[] = [];
  etiquetaEditando: Etiqueta | null = null;

  // Filtros
  filtros = {
    estado: 'todos',
    buscar: '',
    per_page: 20,
    page: 1
  };

  // Formularios
  formulario = {
    nombre: '',
    etiqueta_slug: '',
    estado: 'activo' as 'activo' | 'inactivo',
    imagen: null as File | null
  };

  // Modales
  mostrarFormulario: boolean = false;
  mostrarConfirmacion: boolean = false;
  mostrarFormSubcategoria: boolean = false;

  // Confirmación
  accionConfirmacion: 'eliminar' | 'activar' = 'eliminar';
  mensajeConfirmacion: string = '';
  etiquetaSeleccionada: Etiqueta | null = null;

  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'danger' = 'success';
  errores: any = {};

  // Preview imagen
  previewImagen: string | null = null;

  constructor(private etiquetaService: EtiquetaService) {}

  ngOnInit(): void {
    this.cargarEtiquetas();
  }

  /**
   * Cargar lista de etiquetas
   */
  cargarEtiquetas(): void {
    this.cargando = true;
    this.error = null;

    this.etiquetaService.listarEtiquetas(this.filtros).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success && response.data) {
          const data = response.data as EtiquetasPaginadas;
          this.etiquetas = data.etiquetas;
        } else {
          this.error = response.message || 'Error al cargar etiquetas';
        }
      },
      error: (error) => {
        this.cargando = false;
        this.error = 'Error de conexión al cargar etiquetas';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros(): void {
    this.filtros.page = 1;
    this.cargarEtiquetas();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos',
      buscar: '',
      per_page: 20,
      page: 1
    };
    this.cargarEtiquetas();
  }

  /**
   * Mostrar formulario para crear etiqueta
   */
  mostrarFormularioCrear(): void {
    this.resetFormulario();
    this.mostrarFormulario = true;
  }

  /**
   * Mostrar formulario para editar etiqueta
   */
  mostrarFormularioEditar(etiqueta: Etiqueta): void {
    this.etiquetaEditando = etiqueta;
    this.formulario = {
      nombre: etiqueta.nombre,
      etiqueta_slug: etiqueta.etiqueta_slug,
      estado: etiqueta.estado,
      imagen: null
    };
    
    if (etiqueta.imagen_url) {
      this.previewImagen = etiqueta.imagen_url;
    }
    
    this.mostrarFormulario = true;
  }

  /**
   * Cerrar formulario
   */
  cerrarFormulario(): void {
    if (!this.enviando) {
      this.mostrarFormulario = false;
      this.resetFormulario();
    }
  }

  /**
   * Resetear formulario
   */
  resetFormulario(): void {
    this.formulario = {
      nombre: '',
      etiqueta_slug: '',
      estado: 'activo',
      imagen: null
    };
    this.etiquetaEditando = null;
    this.previewImagen = null;
    this.errores = {};
    this.mensaje = '';
    this.tipoMensaje = 'success';
  }

  /**
   * Manejar selección de imagen
   */
  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        this.errores.imagen = 'Formato de imagen no válido. Use JPG, PNG o WebP.';
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        this.errores.imagen = 'La imagen no debe superar los 5MB.';
        return;
      }

      this.formulario.imagen = file;
      this.errores.imagen = '';

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Verificar si hay imagen para mostrar
   */
  tieneImagenParaMostrar(): boolean {
    return !!this.previewImagen;
  }

  /**
   * Eliminar imagen seleccionada
   */
  eliminarImagen(): void {
    this.formulario.imagen = null;
    this.previewImagen = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Guardar etiqueta (crear o actualizar)
   */
  guardar(): void {
    this.enviando = true;
    this.mensaje = '';
    this.errores = {};

    if (!this.formulario.nombre.trim()) {
      this.errores.nombre = 'El nombre es requerido';
      this.enviando = false;
      return;
    }

    if (this.etiquetaEditando) {
      this.actualizarEtiqueta();
    } else {
      this.crearEtiqueta();
    }
  }

  /**
   * Crear nueva etiqueta
   */
  private crearEtiqueta(): void {
    if (!this.formulario.imagen) {
      this.errores.imagen = 'La imagen es requerida';
      this.enviando = false;
      return;
    }

    const crearData: CrearEtiquetaData = {
      nombre: this.formulario.nombre,
      etiqueta_slug: this.formulario.etiqueta_slug,
      estado: this.formulario.estado,
      imagen: this.formulario.imagen
    };

    this.etiquetaService.crearEtiqueta(crearData).subscribe({
      next: (response) => {
        this.enviando = false;
        if (response.success) {
          this.mensaje = 'Etiqueta creada exitosamente';
          this.tipoMensaje = 'success';
          setTimeout(() => {
            this.cerrarFormulario();
            this.cargarEtiquetas();
          }, 1500);
        } else {
          this.mensaje = response.message || 'Error al crear etiqueta';
          this.tipoMensaje = 'danger';
        }
      },
      error: (error) => {
        this.enviando = false;
        this.mensaje = 'Error de conexión al crear etiqueta';
        this.tipoMensaje = 'danger';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Actualizar etiqueta existente
   */
  private actualizarEtiqueta(): void {
    if (!this.etiquetaEditando) return;

    const actualizarData: ActualizarEtiquetaData = {
      nombre: this.formulario.nombre,
      etiqueta_slug: this.formulario.etiqueta_slug,
      estado: this.formulario.estado
    };

    if (this.formulario.imagen) {
      actualizarData.imagen = this.formulario.imagen;
    }

    this.etiquetaService.actualizarEtiqueta(this.etiquetaEditando.id, actualizarData).subscribe({
      next: (response) => {
        this.enviando = false;
        if (response.success) {
          this.mensaje = 'Etiqueta actualizada exitosamente';
          this.tipoMensaje = 'success';
          setTimeout(() => {
            this.cerrarFormulario();
            this.cargarEtiquetas();
          }, 1500);
        } else {
          this.mensaje = response.message || 'Error al actualizar etiqueta';
          this.tipoMensaje = 'danger';
        }
      },
      error: (error) => {
        this.enviando = false;
        this.mensaje = 'Error de conexión al actualizar etiqueta';
        this.tipoMensaje = 'danger';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Confirmar eliminación de etiqueta
   */
  confirmarEliminar(etiqueta: Etiqueta): void {
    this.etiquetaSeleccionada = etiqueta;
    this.accionConfirmacion = 'eliminar';
    this.mensajeConfirmacion = `¿Estás seguro de que deseas desactivar la etiqueta "${etiqueta.nombre}"?`;
    this.mostrarConfirmacion = true;
  }

  /**
   * Confirmar activación de etiqueta
   */
  confirmarActivar(etiqueta: Etiqueta): void {
    this.etiquetaSeleccionada = etiqueta;
    this.accionConfirmacion = 'activar';
    this.mensajeConfirmacion = `¿Estás seguro de que deseas activar la etiqueta "${etiqueta.nombre}"?`;
    this.mostrarConfirmacion = true;
  }

  /**
   * Ejecutar acción de confirmación
   */
  ejecutarAccion(): void {
    if (!this.etiquetaSeleccionada) return;

    this.procesandoAccion = true;

    if (this.accionConfirmacion === 'eliminar') {
      this.eliminarEtiqueta();
    } else {
      this.activarEtiqueta();
    }
  }

  /**
   * Eliminar/Desactivar etiqueta
   */
  private eliminarEtiqueta(): void {
    if (!this.etiquetaSeleccionada) return;

    this.etiquetaService.eliminarEtiqueta(this.etiquetaSeleccionada.id).subscribe({
      next: (response) => {
        this.procesandoAccion = false;
        if (response.success) {
          this.cerrarConfirmacion();
          this.cargarEtiquetas();
        } else {
          this.mensaje = response.message || 'Error al desactivar etiqueta';
          this.tipoMensaje = 'danger';
        }
      },
      error: (error) => {
        this.procesandoAccion = false;
        this.mensaje = 'Error de conexión al desactivar etiqueta';
        this.tipoMensaje = 'danger';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Activar etiqueta
   */
  private activarEtiqueta(): void {
    if (!this.etiquetaSeleccionada) return;

    this.etiquetaService.activarEtiqueta(this.etiquetaSeleccionada.id).subscribe({
      next: (response) => {
        this.procesandoAccion = false;
        if (response.success) {
          this.cerrarConfirmacion();
          this.cargarEtiquetas();
        } else {
          this.mensaje = response.message || 'Error al activar etiqueta';
          this.tipoMensaje = 'danger';
        }
      },
      error: (error) => {
        this.procesandoAccion = false;
        this.mensaje = 'Error de conexión al activar etiqueta';
        this.tipoMensaje = 'danger';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Cerrar modal de confirmación
   */
  cerrarConfirmacion(): void {
    if (!this.procesandoAccion) {
      this.mostrarConfirmacion = false;
      this.etiquetaSeleccionada = null;
    }
  }

  /**
   * Manejar clic en backdrop del modal
   */
  onModalBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.cerrarFormulario();
    }
  }

  /**
   * Manejar clic en backdrop del modal de confirmación
   */
  onModalConfirmacionBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay-confirmacion')) {
      this.cerrarConfirmacion();
    }
  }

  /**
   * Obtener título del formulario
   */
  getTitulo(): string {
    return this.etiquetaEditando ? 'Editar Etiqueta' : 'Nueva Etiqueta';
  }

  /**
   * Obtener texto del botón guardar
   */
  getTextoBotonGuardar(): string {
    if (this.enviando) {
      return this.etiquetaEditando ? 'Actualizando...' : 'Creando...';
    }
    return this.etiquetaEditando ? 'Actualizar Etiqueta' : 'Crear Etiqueta';
  }

    generarSlug(): void {
    if (this.formulario.nombre) {
      this.formulario.etiqueta_slug = this.formulario.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
  }
}