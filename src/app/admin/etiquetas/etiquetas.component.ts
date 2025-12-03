import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { EtiquetaService, Etiqueta, EtiquetasPaginadas, CrearEtiquetaData, ActualizarEtiquetaData } from '../../services/etiqueta.service';

@Component({
  selector: 'app-etiquetas',
  templateUrl: './etiquetas.component.html',
  styleUrls: ['./etiquetas.component.css']
})
export class EtiquetasComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  cargando: boolean = false;
  error: string | null = null;
  enviando: boolean = false;
  procesandoAccion: boolean = false;

  etiquetas: Etiqueta[] = [];
  etiquetaEditando: Etiqueta | null = null;

  accionConfirmacion: 'toggle' = 'toggle';
  mensajeConfirmacion: string = '';
  etiquetaSeleccionada: Etiqueta | null = null;
    
  filtros = {
    estado: 'todos',
    buscar: '',
    per_page: 20,
    page: 1
  };

  formulario = {
    nombre: '',
    etiqueta_slug: '',
    estado: 'activo' as 'activo' | 'inactivo',
    imagen: null as File | null
  };

  mostrarFormulario: boolean = false;
  mostrarConfirmacion: boolean = false;
  mostrarFormSubcategoria: boolean = false;

  mensaje: string = '';
  tipoMensaje: 'success' | 'danger' = 'success';
  errores: any = {};

  previewImagen: string | null = null;

  constructor(private etiquetaService: EtiquetaService) {}

  ngOnInit(): void {
    this.cargarEtiquetas();
  }

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

  aplicarFiltros(): void {
    this.filtros.page = 1;
    this.cargarEtiquetas();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos',
      buscar: '',
      per_page: 20,
      page: 1
    };
    this.cargarEtiquetas();
  }

  mostrarFormularioCrear(): void {
    this.resetFormulario();
    this.mostrarFormulario = true;
  }

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

  cerrarFormulario(): void {
    if (!this.enviando) {
      this.mostrarFormulario = false;
      this.resetFormulario();
    }
  }

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

  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        this.errores.imagen = 'Formato de imagen no válido. Use JPG, PNG o WebP.';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errores.imagen = 'La imagen no debe superar los 5MB.';
        return;
      }

      this.formulario.imagen = file;
      this.errores.imagen = '';

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  tieneImagenParaMostrar(): boolean {
    return !!this.previewImagen;
  }

  eliminarImagen(): void {
    this.formulario.imagen = null;
    this.previewImagen = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  guardar(): void {
    this.enviando = true;
    this.mensaje = '';
    this.errores = {}; // ✅ Limpiar errores previos

    if (!this.formulario.nombre.trim()) {
      this.errores.nombre = 'El nombre es requerido';
      this.enviando = false;
      return;
    }

    if (!this.formulario.etiqueta_slug.trim()) {
      this.errores.etiqueta_slug = 'El slug es requerido';
      this.enviando = false;
      return;
    }

    if (this.etiquetaEditando) {
      this.actualizarEtiqueta();
    } else {
      this.crearEtiqueta();
    }
  }

  private procesarErrores(response: any): void {
    if (response.errors) {
      Object.keys(response.errors).forEach(key => {
        const mensajes = response.errors[key];
        this.errores[key] = Array.isArray(mensajes) ? mensajes[0] : mensajes;
      });
    }
    
    // Mostrar mensaje general si existe
    if (response.message) {
      this.mensaje = response.message;
      this.tipoMensaje = 'danger';
    }
  }

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
          // ✅ Procesar errores de validación
          this.procesarErrores(response);
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
          // ✅ Procesar errores de validación
          this.procesarErrores(response);
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

  confirmarToggleEstado(etiqueta: Etiqueta): void {
    this.etiquetaSeleccionada = etiqueta;
    this.accionConfirmacion = 'toggle';
    const nuevoEstado = etiqueta.estado === 'activo' ? 'inactivo' : 'activo';
    this.mensajeConfirmacion = `¿Estás seguro de que deseas cambiar el estado del blog "${etiqueta.nombre}" a ${nuevoEstado}?`;
    this.mostrarConfirmacion = true;
  }
    ejecutarAccion(): void {
    if (!this.etiquetaSeleccionada) return;
    this.procesandoAccion = true;
    this.toggleEstadoEtiqueta();
  }
    private toggleEstadoEtiqueta(): void {
    if (!this.etiquetaSeleccionada) return;

    this.etiquetaService.toggleEstado(this.etiquetaSeleccionada.id).subscribe({
      next: (response) => {
        this.procesandoAccion = false;
        if (response.success) {
          this.cerrarConfirmacion();
          this.cargarEtiquetas();
        } else {
          this.mensaje = response.message || 'Error al cambiar estado del blog';
          this.tipoMensaje = 'danger';
        }
      },
      error: (error) => {
        this.procesandoAccion = false;
        this.mensaje = 'Error de conexión al cambiar estado del blog';
        this.tipoMensaje = 'danger';
        console.error('Error:', error);
      }
    });
  }


  cerrarConfirmacion(): void {
    if (!this.procesandoAccion) {
      this.mostrarConfirmacion = false;
      this.etiquetaSeleccionada = null;
    }
  }

  onModalBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.cerrarFormulario();
    }
  }

  onModalConfirmacionBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay-confirmacion')) {
      this.cerrarConfirmacion();
    }
  }

  getTitulo(): string {
    return this.etiquetaEditando ? 'Editar Etiqueta' : 'Nueva Etiqueta';
  }

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