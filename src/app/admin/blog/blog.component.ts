import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { BlogService, Blog, CrearBlogData, ActualizarBlogData, BlogResponse } from '../../services/blog.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Estados
  cargando: boolean = false;
  error: string | null = null;
  enviando: boolean = false;
  procesandoAccion: boolean = false;

  // Datos
  blogs: Blog[] = [];
  blogEditando: Blog | null = null;

  // Filtros
  filtros = {
    estado: 'todos',
    buscar: '',
    per_page: 20,
    page: 1
  };

  // Formularios
  formulario = {
    titulo: '',
    blog_slug: '',
    meta_title: '',
    meta_description: '',
    contenido_flexible: '',
    portada: null as File | null
  };
  errorJson: string = '';

  // Modales
  mostrarFormulario: boolean = false;
  mostrarConfirmacion: boolean = false;

  // Confirmación
  accionConfirmacion: 'toggle' = 'toggle';
  mensajeConfirmacion: string = '';
  blogSeleccionado: Blog | null = null;

  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'danger' = 'success';
  errores: any = {};

  // Preview imagen
  previewImagen: string | null = null;

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.cargarBlogs();
  }

  /**
   * Cargar lista de blogs
   */
  cargarBlogs(): void {
    this.cargando = true;
    this.error = null;

    this.blogService.listarBlogs(this.filtros).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success && response.data) {
          this.blogs = Array.isArray(response.data) ? response.data : [response.data];
        } else {
          this.error = response.message || 'Error al cargar blogs';
        }
      },
      error: (error) => {
        this.cargando = false;
        this.error = 'Error de conexión al cargar blogs';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros(): void {
    this.filtros.page = 1;
    this.cargarBlogs();
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
    this.cargarBlogs();
  }

  /**
   * Mostrar formulario para crear blog
   */
  mostrarFormularioCrear(): void {
    this.resetFormulario();
    this.mostrarFormulario = true;
  }

  /**
   * Mostrar formulario para editar blog
   */
  mostrarFormularioEditar(blog: Blog): void {
    this.blogEditando = blog;
    this.formulario = {
      titulo: blog.titulo,
      blog_slug: blog.blog_slug,
      meta_title: blog.meta_title || '',
      meta_description: blog.meta_description || '',
      contenido_flexible: blog.contenido_flexible ? JSON.stringify(blog.contenido_flexible, null, 2) : '',
      portada: null
    };
    
    if (blog.portada_url) {
      this.previewImagen = blog.portada_url;
    }
    
    this.errorJson = '';
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
      titulo: '',
      blog_slug: '',
      meta_title: '',
      meta_description: '',
      contenido_flexible: '',
      portada: null
    };
    this.blogEditando = null;
    this.previewImagen = null;
    this.errores = {};
    this.mensaje = '';
    this.tipoMensaje = 'success';
  }

  /**
   * Generar slug automáticamente
   */
  generarSlug(): void {
    if (this.formulario.titulo) {
      this.formulario.blog_slug = this.formulario.titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
  }
  validarJson(): boolean {
    this.errorJson = '';
    
    if (!this.formulario.contenido_flexible || this.formulario.contenido_flexible.trim() === '') {
      return true; // Es opcional, vacío es válido
    }
    
    try {
      JSON.parse(this.formulario.contenido_flexible);
      return true;
    } catch (e) {
      this.errorJson = 'El JSON ingresado no es válido. Verifica la sintaxis.';
      return false;
    }
  }
  /**
   * Manejar selección de imagen
   */
  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        this.errores.portada = 'Formato de imagen no válido. Use JPG, PNG o WebP.';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errores.portada = 'La imagen no debe superar los 5MB.';
        return;
      }

      this.formulario.portada = file;
      this.errores.portada = '';

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
    this.formulario.portada = null;
    this.previewImagen = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Guardar blog (crear o actualizar)
   */
  guardar(): void {
    this.enviando = true;
    this.mensaje = '';
    this.errores = {};

    if (!this.formulario.titulo.trim()) {
      this.errores.titulo = 'El título es requerido';
      this.enviando = false;
      return;
    }

    if (!this.formulario.blog_slug.trim()) {
      this.errores.blog_slug = 'El slug es requerido';
      this.enviando = false;
      return;
    }

    // Validar JSON
    if (!this.validarJson()) {
      this.enviando = false;
      return;
    }

    if (this.blogEditando) {
      this.actualizarBlog();
    } else {
      this.crearBlog();
    }
  }
  /**
   * Crear nuevo blog
   */
  private crearBlog(): void {
    if (!this.formulario.portada) {
      this.errores.portada = 'La imagen de portada es requerida';
      this.enviando = false;
      return;
    }

    let contenidoFlexible = null;
    if (this.formulario.contenido_flexible && this.formulario.contenido_flexible.trim() !== '') {
      try {
        contenidoFlexible = JSON.parse(this.formulario.contenido_flexible);
      } catch (e) {
        contenidoFlexible = null;
      }
    }

    const crearData: CrearBlogData = {
      titulo: this.formulario.titulo,
      blog_slug: this.formulario.blog_slug,
      meta_title: this.formulario.meta_title,
      meta_description: this.formulario.meta_description,
      contenido_flexible: contenidoFlexible,
      portada: this.formulario.portada
    };

    this.blogService.crearBlog(crearData).subscribe({
      next: (response) => {
        this.enviando = false;
        if (response.success) {
          this.mensaje = 'Blog creado exitosamente';
          this.tipoMensaje = 'success';
          setTimeout(() => {
            this.cerrarFormulario();
            this.cargarBlogs();
          }, 1500);
        } else {
          this.mensaje = response.message || 'Error al crear blog';
          this.tipoMensaje = 'danger';
          if (response.errors) {
            this.errores = response.errors;
          }
        }
      },
      error: (error) => {
        this.enviando = false;
        this.mensaje = 'Error de conexión al crear blog';
        this.tipoMensaje = 'danger';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Actualizar blog existente
   */
  private actualizarBlog(): void {
  if (!this.blogEditando) return;

  let contenidoFlexible = null;
  if (this.formulario.contenido_flexible && this.formulario.contenido_flexible.trim() !== '') {
    try {
      contenidoFlexible = JSON.parse(this.formulario.contenido_flexible);
    } catch (e) {
      contenidoFlexible = null;
    }
  }

  const actualizarData: ActualizarBlogData = {
    titulo: this.formulario.titulo,
    blog_slug: this.formulario.blog_slug,
    meta_title: this.formulario.meta_title,
    meta_description: this.formulario.meta_description,
    contenido_flexible: contenidoFlexible
  };

    if (this.formulario.portada) {
      actualizarData.portada = this.formulario.portada;
    }

    this.blogService.actualizarBlog(this.blogEditando.id, actualizarData).subscribe({
      next: (response) => {
        this.enviando = false;
        if (response.success) {
          this.mensaje = 'Blog actualizado exitosamente';
          this.tipoMensaje = 'success';
          setTimeout(() => {
            this.cerrarFormulario();
            this.cargarBlogs();
          }, 1500);
        } else {
          this.mensaje = response.message || 'Error al actualizar blog';
          this.tipoMensaje = 'danger';
          if (response.errors) {
            this.errores = response.errors;
          }
        }
      },
      error: (error) => {
        this.enviando = false;
        this.mensaje = 'Error de conexión al actualizar blog';
        this.tipoMensaje = 'danger';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Confirmar cambio de estado
   */
  confirmarToggleEstado(blog: Blog): void {
    this.blogSeleccionado = blog;
    this.accionConfirmacion = 'toggle';
    const nuevoEstado = blog.estado === 'activo' ? 'inactivo' : 'activo';
    this.mensajeConfirmacion = `¿Estás seguro de que deseas cambiar el estado del blog "${blog.titulo}" a ${nuevoEstado}?`;
    this.mostrarConfirmacion = true;
  }

  /**
   * Ejecutar acción de confirmación
   */
  ejecutarAccion(): void {
    if (!this.blogSeleccionado) return;

    this.procesandoAccion = true;
    this.toggleEstadoBlog();
  }

  /**
   * Toggle estado del blog
   */
  private toggleEstadoBlog(): void {
    if (!this.blogSeleccionado) return;

    this.blogService.toggleEstado(this.blogSeleccionado.id).subscribe({
      next: (response) => {
        this.procesandoAccion = false;
        if (response.success) {
          this.cerrarConfirmacion();
          this.cargarBlogs();
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

  /**
   * Cerrar modal de confirmación
   */
  cerrarConfirmacion(): void {
    if (!this.procesandoAccion) {
      this.mostrarConfirmacion = false;
      this.blogSeleccionado = null;
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
    return this.blogEditando ? 'Editar Blog' : 'Nuevo Blog';
  }

  /**
   * Obtener texto del botón guardar
   */
  getTextoBotonGuardar(): string {
    if (this.enviando) {
      return this.blogEditando ? 'Actualizando...' : 'Creando...';
    }
    return this.blogEditando ? 'Actualizar Blog' : 'Crear Blog';
  }

  /**
   * Truncar texto
   */
  truncarTexto(texto: string | undefined, limite: number): string {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }
}