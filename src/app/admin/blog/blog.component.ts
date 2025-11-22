import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { BlogService, Blog, CrearBlogData, ActualizarBlogData, BlogResponse } from '../../services/blog.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {
  @ViewChild('fileInputPortada') fileInputPortada!: ElementRef;
  @ViewChild('fileInputPortadaSec') fileInputPortadaSec!: ElementRef;
  @ViewChild('fileInputPortadaTer') fileInputPortadaTer!: ElementRef;
  @ViewChild('fileInputPortadaCuart') fileInputPortadaCuart!: ElementRef;

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
    portada: null as File | null,
    portada_sec: null as File | null,
    portada_ter: null as File | null,
    portada_cuart: null as File | null
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

  // Preview imágenes
  previewPortada: string | null = null;
  previewPortadaSec: string | null = null;
  previewPortadaTer: string | null = null;
  previewPortadaCuart: string | null = null;

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.cargarBlogs();
  }

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

  aplicarFiltros(): void {
    this.filtros.page = 1;
    this.cargarBlogs();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos',
      buscar: '',
      per_page: 20,
      page: 1
    };
    this.cargarBlogs();
  }

  mostrarFormularioCrear(): void {
    this.resetFormulario();
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(blog: Blog): void {
    this.blogEditando = blog;
    this.formulario = {
      titulo: blog.titulo,
      blog_slug: blog.blog_slug,
      meta_title: blog.meta_title || '',
      meta_description: blog.meta_description || '',
      contenido_flexible: blog.contenido_flexible ? JSON.stringify(blog.contenido_flexible, null, 2) : '',
      portada: null,
      portada_sec: null,
      portada_ter: null,
      portada_cuart: null
    };
    
    // Cargar previews de imágenes existentes
    if (blog.portada_url) {
      this.previewPortada = blog.portada_url;
    }
    if (blog.portada_sec_url) {
      this.previewPortadaSec = blog.portada_sec_url;
    }
    if (blog.portada_ter_url) {
      this.previewPortadaTer = blog.portada_ter_url;
    }
    if (blog.portada_cuart_url) {
      this.previewPortadaCuart = blog.portada_cuart_url;
    }
    
    this.errorJson = '';
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
      titulo: '',
      blog_slug: '',
      meta_title: '',
      meta_description: '',
      contenido_flexible: '',
      portada: null,
      portada_sec: null,
      portada_ter: null,
      portada_cuart: null
    };
    this.blogEditando = null;
    this.previewPortada = null;
    this.previewPortadaSec = null;
    this.previewPortadaTer = null;
    this.previewPortadaCuart = null;
    this.errores = {};
    this.mensaje = '';
    this.tipoMensaje = 'success';
  }

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
      return true;
    }
    
    try {
      JSON.parse(this.formulario.contenido_flexible);
      return true;
    } catch (e) {
      this.errorJson = 'El JSON ingresado no es válido. Verifica la sintaxis.';
      return false;
    }
  }

  onImagenSeleccionada(event: any, tipo: 'portada' | 'portada_sec' | 'portada_ter' | 'portada_cuart'): void {
    const file = event.target.files[0];
    if (file) {
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        this.errores[tipo] = 'Formato de imagen no válido. Use JPG, PNG o WebP.';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errores[tipo] = 'La imagen no debe superar los 5MB.';
        return;
      }

      this.formulario[tipo] = file;
      this.errores[tipo] = '';

      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (tipo === 'portada') this.previewPortada = e.target.result;
        else if (tipo === 'portada_sec') this.previewPortadaSec = e.target.result;
        else if (tipo === 'portada_ter') this.previewPortadaTer = e.target.result;
        else if (tipo === 'portada_cuart') this.previewPortadaCuart = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarImagen(tipo: 'portada' | 'portada_sec' | 'portada_ter' | 'portada_cuart'): void {
    this.formulario[tipo] = null;
    
    if (tipo === 'portada') {
      this.previewPortada = null;
      if (this.fileInputPortada) this.fileInputPortada.nativeElement.value = '';
    } else if (tipo === 'portada_sec') {
      this.previewPortadaSec = null;
      if (this.fileInputPortadaSec) this.fileInputPortadaSec.nativeElement.value = '';
    } else if (tipo === 'portada_ter') {
      this.previewPortadaTer = null;
      if (this.fileInputPortadaTer) this.fileInputPortadaTer.nativeElement.value = '';
    } else if (tipo === 'portada_cuart') {
      this.previewPortadaCuart = null;
      if (this.fileInputPortadaCuart) this.fileInputPortadaCuart.nativeElement.value = '';
    }
  }

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

  private crearBlog(): void {
    if (!this.formulario.portada) {
      this.errores.portada = 'La imagen de portada principal es requerida';
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

    if (this.formulario.portada_sec) {
      crearData.portada_sec = this.formulario.portada_sec;
    }
    if (this.formulario.portada_ter) {
      crearData.portada_ter = this.formulario.portada_ter;
    }
    if (this.formulario.portada_cuart) {
      crearData.portada_cuart = this.formulario.portada_cuart;
    }

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
    if (this.formulario.portada_sec) {
      actualizarData.portada_sec = this.formulario.portada_sec;
    }
    if (this.formulario.portada_ter) {
      actualizarData.portada_ter = this.formulario.portada_ter;
    }
    if (this.formulario.portada_cuart) {
      actualizarData.portada_cuart = this.formulario.portada_cuart;
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

  confirmarToggleEstado(blog: Blog): void {
    this.blogSeleccionado = blog;
    this.accionConfirmacion = 'toggle';
    const nuevoEstado = blog.estado === 'activo' ? 'inactivo' : 'activo';
    this.mensajeConfirmacion = `¿Estás seguro de que deseas cambiar el estado del blog "${blog.titulo}" a ${nuevoEstado}?`;
    this.mostrarConfirmacion = true;
  }

  ejecutarAccion(): void {
    if (!this.blogSeleccionado) return;
    this.procesandoAccion = true;
    this.toggleEstadoBlog();
  }

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

  cerrarConfirmacion(): void {
    if (!this.procesandoAccion) {
      this.mostrarConfirmacion = false;
      this.blogSeleccionado = null;
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
    return this.blogEditando ? 'Editar Blog' : 'Nuevo Blog';
  }

  getTextoBotonGuardar(): string {
    if (this.enviando) {
      return this.blogEditando ? 'Actualizando...' : 'Creando...';
    }
    return this.blogEditando ? 'Actualizar Blog' : 'Crear Blog';
  }

  truncarTexto(texto: string | undefined, limite: number): string {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }
}