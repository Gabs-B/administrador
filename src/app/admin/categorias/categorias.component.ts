import { Component, OnInit } from '@angular/core';
import { CategoriasService, Categoria, FiltrosCategorias } from '../../services/categorias.service';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {

  // Estados principales
  categorias: Categoria[] = [];
  categoriasPadre: Categoria[] = []; // Para el selector de padre
  cargando = false;
  error: string = '';

preventCloseOnBackdrop = false;

  // Formulario
  mostrarFormulario = false;
  categoriaEditando: Categoria | null = null;
  formulario = {
    nombre: '',
    categoria_slug: '',
    estado: 'activo',
    parent_id: null as number | null
  };
  errores: any = {};
  enviando = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';

  // Manejo de imagen
  imagenSeleccionada: File | null = null;
  previewImagen: string | null = null;
  eliminarImagenExistente = false;

  // Subcategorías en el formulario
  subcategoriasEditables: Categoria[] = [];
  subcategoriaModificada: { [key: number]: boolean } = {};

  subcategoriaFormulario = {
  nombre: '',
  categoria_slug: '',
  estado: 'activo'
  };
  editandoSubcategoria: Categoria | null = null;
  mostrarFormSubcategoria = false;


  // Filtros
  filtros: FiltrosCategorias = {
    estado: 'todos',
    buscar: ''
  };

  // Confirmaciones
  mostrarConfirmacion = false;
  categoriaAccion: Categoria | null = null;
  accionConfirmacion: 'eliminar' | 'activar' = 'eliminar';
  mensajeConfirmacion = '';
  procesandoAccion = false;

  
  constructor(private categoriasService: CategoriasService) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarCategoriasPadre();
  }

  // =================== MÉTODOS DE CARGA ===================

  cargarCategorias(): void {
    this.cargando = true;
    this.error = '';

    this.categoriasService.getCategorias(this.filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categorias = response.data;
        } else {
          this.error = response.message || 'Error al cargar categorías';
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.error = 'Error de conexión al cargar categorías';
        this.cargando = false;
      }
    });
  }

  cargarCategoriasPadre(): void {
    this.categoriasService.getCategoriasPadre().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categoriasPadre = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar categorías padre:', error);
      }
    });
  }

  // =================== MÉTODOS DE FILTRADO ===================

  aplicarFiltros(): void {
    this.cargarCategorias();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos',
      buscar: ''
    };
    this.cargarCategorias();
  }

  // =================== MÉTODOS DE MANEJO DE IMAGEN ===================

  onImagenSeleccionada(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(archivo.type)) {
        this.errores.imagen = 'Solo se permiten archivos JPG, PNG y WebP';
        return;
      }

      if (archivo.size > 2 * 1024 * 1024) {
        this.errores.imagen = 'La imagen no debe superar los 2MB';
        return;
      }

      this.imagenSeleccionada = archivo;
      this.errores.imagen = null;
      this.eliminarImagenExistente = false;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImagen = e.target?.result as string;
      };
      reader.readAsDataURL(archivo);
    }
  }

  eliminarImagen(): void {
    this.imagenSeleccionada = null;
    this.previewImagen = null;
    this.eliminarImagenExistente = true;
    this.errores.imagen = null;

    const input = document.getElementById('imagen') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  cancelarImagen(): void {
    this.imagenSeleccionada = null;
    this.previewImagen = null;
    this.eliminarImagenExistente = false;
    this.errores.imagen = null;

    const input = document.getElementById('imagen') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  // =================== MÉTODOS DE FORMULARIO ===================

  private setBodyScroll(open: boolean): void {
    if (open) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  mostrarFormularioCrear(): void {
    this.setBodyScroll(true);
    this.categoriaEditando = null;
    this.formulario = {
      categoria_slug: '', 
      nombre: '',
      estado: 'activo',
      parent_id: null
    };
    this.errores = {};
    this.mensaje = '';
    this.imagenSeleccionada = null;
    this.previewImagen = null;
    this.eliminarImagenExistente = false;
    this.subcategoriasEditables = [];
    this.subcategoriaModificada = {};
    this.mostrarFormulario = true;
  }
  mostrarFormularioEditar(categoria: Categoria): void {
    this.categoriaEditando = categoria;
    this.formulario = {
      nombre: categoria.nombre,
      categoria_slug: categoria.categoria_slug,
      estado: categoria.estado,
      parent_id: null // Siempre null porque solo editamos padres
    };
    this.errores = {};
    this.mensaje = '';
    this.imagenSeleccionada = null;
    this.previewImagen = categoria.imagen_url || null;
    this.eliminarImagenExistente = false;
    this.subcategoriaModificada = {};
    
    // Cargar subcategorías
    if (categoria.id) {
      this.cargarSubcategorias(categoria.id);
    }
    
    this.mostrarFormulario = true;
  }
  agregarSubcategoria(): void {
  this.editandoSubcategoria = null;
  this.subcategoriaFormulario = {
    nombre: '',
    categoria_slug: '',
    estado: 'activo'
  };
  this.mostrarFormSubcategoria = true;
  }

  editarSubcategoria(subcategoria: Categoria): void {
    this.editandoSubcategoria = subcategoria;
    this.subcategoriaFormulario = {
      nombre: subcategoria.nombre,
      categoria_slug: subcategoria.categoria_slug,
      estado: subcategoria.estado
    };
    this.mostrarFormSubcategoria = true;
  }

  guardarSubcategoria(): void {
    if (!this.subcategoriaFormulario.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    // Validación del slug
    if (!this.subcategoriaFormulario.categoria_slug.trim()) {
      alert('El slug es requerido');
      return;
    }

    if (!this.categoriaEditando?.id) {
      alert('Error: No hay categoría padre seleccionada');
      return;
    }

    const datos = {
      nombre: this.subcategoriaFormulario.nombre.trim(),
      categoria_slug: this.subcategoriaFormulario.categoria_slug.trim(),
      estado: this.subcategoriaFormulario.estado,
      parent_id: this.categoriaEditando.id
    };

    const operacion = this.editandoSubcategoria
      ? this.categoriasService.actualizarCategoria(this.editandoSubcategoria.id, datos)
      : this.categoriasService.crearCategoria(datos);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          this.mensaje = this.editandoSubcategoria 
            ? 'Subcategoría actualizada exitosamente'
            : 'Subcategoría creada exitosamente';
          this.tipoMensaje = 'success';
          
          // Recargar subcategorías
          if (this.categoriaEditando?.id) {
            this.cargarSubcategorias(this.categoriaEditando.id);
          }
          this.cargarCategorias();
          this.cerrarFormSubcategoria();
          
          setTimeout(() => {
            this.mensaje = '';
          }, 3000);
        } else {
          // Mostrar errores de validación
          if (response.errors) {
            const errores = Object.values(response.errors).flat();
            alert(errores.join('\n'));
          } else {
            alert(response.message || 'Error al guardar');
          }
        }
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Error de conexión');
      }
    });
  }

  cerrarFormSubcategoria(): void {
    this.mostrarFormSubcategoria = false;
    this.editandoSubcategoria = null;
    this.subcategoriaFormulario = {
      nombre: '',
      categoria_slug: '',
      estado: 'activo'
    };
    this.preventCloseOnBackdrop = true; 
  }

  cargarSubcategorias(categoriaId: number): void {
      this.categoriasService.getCategoria(categoriaId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Cargar TODAS las subcategorías, no solo las activas
            this.subcategoriasEditables = response.data.subcategorias || [];
          }
        },
        error: (error) => {
          console.error('Error al cargar subcategorías:', error);
        }
      });
  }

  cerrarFormulario(): void {
      this.setBodyScroll(false);
    if (this.preventCloseOnBackdrop) {
      this.preventCloseOnBackdrop = false;
      return;
    }
    
    this.mostrarFormulario = false;
    this.categoriaEditando = null;
    this.formulario = {
      nombre: '',
      categoria_slug: '',
      estado: 'activo',
      parent_id: null
    };
    this.errores = {};
    this.mensaje = '';
    this.imagenSeleccionada = null;
    this.previewImagen = null;
    this.eliminarImagenExistente = false;
    this.subcategoriasEditables = [];
    this.subcategoriaModificada = {};
    
    // Restaurar el scroll del body
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  guardar(): void {
      if (this.enviando) return;

      this.errores = {};
      this.mensaje = '';

      // Validación básica
      if (!this.formulario.nombre.trim()) {
        this.errores.nombre = 'El nombre es requerido';
        return;
      }

      if (this.formulario.nombre.length > 150) {
        this.errores.nombre = 'El nombre no puede exceder 150 caracteres';
        return;
      }
      if (!this.formulario.categoria_slug.trim()) {
        this.errores.nombre = 'El slug es requerido';
        return;
      }
      this.enviando = true;

      const datosCategoria = {
        nombre: this.formulario.nombre.trim(),
        categoria_slug: this.formulario.categoria_slug,
        estado: this.formulario.estado,
        parent_id: this.formulario.parent_id
      };

      const operacion = this.categoriaEditando 
        ? this.categoriasService.actualizarCategoria(
            this.categoriaEditando.id, 
            datosCategoria, 
            this.imagenSeleccionada || undefined, 
            this.eliminarImagenExistente
          )
        : this.categoriasService.crearCategoria(datosCategoria, this.imagenSeleccionada || undefined);

      operacion.subscribe({
        next: (response) => {
          if (response.success) {
            this.mensaje = this.categoriaEditando 
              ? 'Categoría actualizada exitosamente'
              : 'Categoría creada exitosamente';
            this.tipoMensaje = 'success';
            
            // Recargar listas
            this.cargarCategorias();
            this.cargarCategoriasPadre();
            
            // SI ES CREACIÓN NUEVA Y response.data existe, abrir el modo edición
            if (!this.categoriaEditando && response.data) {
              const categoriaCreada = response.data; // Guardamos la referencia
              setTimeout(() => {
                this.mensaje = 'Ahora puedes agregar subcategorías';
                this.tipoMensaje = 'success';
                this.mostrarFormularioEditar(categoriaCreada);
              }, 1500);
            } else {
              // SI ES EDICIÓN, cerrar después de un delay
              setTimeout(() => {
                this.cerrarFormulario();
              }, 1500);
            }
          } else {
            this.mensaje = response.message || 'Error al guardar la categoría';
            this.tipoMensaje = 'error';
            
            if (response.errors) {
              this.errores = response.errors;
            }
          }
          this.enviando = false;
        },
        error: (error) => {
          console.error('Error al guardar categoría:', error);
          this.mensaje = 'Error de conexión al guardar la categoría';
          this.tipoMensaje = 'error';
          this.enviando = false;
        }
      });
  }

  // =================== MÉTODOS DE SUBCATEGORÍAS ===================

cambiarEstadoSubcategoria(subcategoria: Categoria, nuevoEstado: 'activo' | 'inactivo'): void {
  this.subcategoriaModificada[subcategoria.id] = true;
  
  // También podemos usar toggleEstado para subcategorías
  this.categoriasService.toggleEstado(subcategoria.id).subscribe({
    next: (response) => {
      if (response.success) {
        // Actualizar en el array local
        const index = this.subcategoriasEditables.findIndex(s => s.id === subcategoria.id);
        if (index !== -1) {
          // Validar y asignar el nuevo estado
          const estadoFinal = (response.nuevo_estado === 'activo' || response.nuevo_estado === 'inactivo') 
            ? response.nuevo_estado 
            : nuevoEstado;
          this.subcategoriasEditables[index].estado = estadoFinal;
        }
        
        // Mostrar mensaje temporal
        const mensajeAnterior = this.mensaje;
        const tipoAnterior = this.tipoMensaje;
        
        this.mensaje = `Subcategoría "${subcategoria.nombre}" ${response.nuevo_estado === 'activo' ? 'activada' : 'desactivada'} exitosamente`;
        this.tipoMensaje = 'success';
        
        setTimeout(() => {
          this.mensaje = mensajeAnterior;
          this.tipoMensaje = tipoAnterior;
          this.subcategoriaModificada[subcategoria.id] = false;
        }, 2000);
        
        // Recargar la lista principal
        this.cargarCategorias();
      } else {
        alert(response.message || 'Error al cambiar estado');
        this.subcategoriaModificada[subcategoria.id] = false;
      }
    },
    error: (error) => {
      console.error('Error al cambiar estado:', error);
      alert('Error de conexión');
      this.subcategoriaModificada[subcategoria.id] = false;
    }
  });
}


  cerrarTodosLosModales(): void {
  if (this.mostrarFormulario) {
    this.cerrarFormulario();
  }
  if (this.mostrarFormSubcategoria) {
    this.cerrarFormSubcategoria();
  }
  if (this.mostrarConfirmacion) {
    this.cerrarConfirmacion();
  }
  }

  // =================== MÉTODOS DE ACCIONES ===================

confirmarEliminar(categoria: Categoria): void {
  console.log('Abriendo modal de eliminación para:', categoria.nombre);
  
  // Cerrar inmediatamente otros modales
  this.cerrarTodosLosModales();
  
  // Pequeño delay para asegurar el cierre de otros modales
  setTimeout(() => {
    this.categoriaAccion = categoria;
    this.accionConfirmacion = 'eliminar';
    this.mensajeConfirmacion = `¿Estás seguro de que deseas desactivar la categoría "${categoria.nombre}"?`;
    this.mostrarConfirmacion = true;
    this.setBodyScroll(true);
    
    console.log('Modal de confirmación abierto:', this.mostrarConfirmacion);
  }, 100);
}



confirmarActivar(categoria: Categoria): void {
  console.log('Abriendo modal de activación para:', categoria.nombre);
  
  // Cerrar inmediatamente otros modales
  this.cerrarTodosLosModales();
  
  // Pequeño delay para asegurar el cierre de otros modales
  setTimeout(() => {
    this.categoriaAccion = categoria;
    this.accionConfirmacion = 'activar';
    this.mensajeConfirmacion = `¿Deseas activar la categoría "${categoria.nombre}"?`;
    this.mostrarConfirmacion = true;
    this.setBodyScroll(true);
    
    console.log('Modal de confirmación abierto:', this.mostrarConfirmacion);
  }, 100);
}



cerrarConfirmacion(): void {
  console.log('🔒 Cerrando modal de confirmación');
  
  // Resetear TODOS los estados relacionados
  this.procesandoAccion = false;
  this.mostrarConfirmacion = false;
  this.categoriaAccion = null;
  
  // Restaurar scroll del body
  this.setBodyScroll(false);
  
  console.log('✅ Modal de confirmación cerrado');
}

  onModalBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay-formulario')) {
      this.cerrarFormulario();
    }
  }

  onModalConfirmacionBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay-confirmacion') && !this.procesandoAccion) {
      this.cerrarConfirmacion();
    }
  }

ejecutarAccion(): void {
  if (!this.categoriaAccion || this.procesandoAccion) return;

  console.log('Ejecutando toggle para categoría:', this.categoriaAccion.nombre);
  this.procesandoAccion = true;

  // Usar el método unificado toggleEstado
  this.categoriasService.toggleEstado(this.categoriaAccion.id).subscribe({
    next: (response) => {
      console.log('Respuesta recibida:', response);
      
      if (response.success) {
        const accion = response.nuevo_estado === 'activo' ? 'activada' : 'desactivada';
        console.log(`✅ Categoría ${accion} exitosamente`);
        
        // Recargar datos
        this.cargarCategorias();
        this.cargarCategoriasPadre();
        
        // Cerrar modal después de un pequeño delay
        setTimeout(() => {
          this.cerrarConfirmacion();
        }, 500);
        
      } else {
        console.error('❌ Error en respuesta:', response.message);
        alert(response.message || 'Error al procesar la acción');
        this.procesandoAccion = false;
      }
    },
    error: (error) => {
      console.error('❌ Error al ejecutar acción:', error);
      alert('Error de conexión al procesar la acción');
      this.procesandoAccion = false;
    }
  });
}

  // =================== MÉTODOS AUXILIARES ===================

  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'activo':
        return 'badge-success'; 
      case 'inactivo':
        return 'badge-danger'; 
      default:
        return 'bg-secondary text-white';
    }
  }

  getTitulo(): string {
    return this.categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría';
  }

  getTextoBotonGuardar(): string {
    if (this.enviando) {
      return this.categoriaEditando ? 'Actualizando...' : 'Creando...';
    }
    return this.categoriaEditando ? 'Actualizar' : 'Crear';
  }

  tieneImagenActual(): boolean {
    return !!(this.categoriaEditando?.imagen_url && !this.eliminarImagenExistente);
  }

  tieneImagenParaMostrar(): boolean {
    return !!(this.previewImagen || (this.categoriaEditando?.imagen_url && !this.eliminarImagenExistente));
  }

  esCategoriaPadre(): boolean {
    return !this.formulario.parent_id;
  }

  tieneSubcategorias(): boolean {
    return this.categoriaEditando !== null && this.subcategoriasEditables.length > 0;
  }

  getNombreCategoriaPadre(): string | null {
    if (!this.formulario.parent_id) return null;
    const padre = this.categoriasPadre.find(c => c.id === this.formulario.parent_id);
    return padre ? padre.nombre : null;
  }

  generarSlug(): void {
    if (this.formulario.nombre) {
      this.formulario.categoria_slug = this.formulario.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
  }
  generarSlugSubcategoria(): void {
  if (this.subcategoriaFormulario.nombre) {
    this.subcategoriaFormulario.categoria_slug = this.subcategoriaFormulario.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
confirmarToggleEstado(categoria: Categoria): void {
  console.log('Abriendo modal de toggle para:', categoria.nombre);
  
  // Cerrar inmediatamente otros modales
  this.cerrarTodosLosModales();
  
  // Pequeño delay para asegurar el cierre de otros modales
  setTimeout(() => {
    this.categoriaAccion = categoria;
    
    // Determinar la acción basándose en el estado actual
    if (categoria.estado === 'activo') {
      this.accionConfirmacion = 'eliminar'; // Desactivar
      this.mensajeConfirmacion = `¿Estás seguro de que deseas desactivar la categoría "${categoria.nombre}"?`;
    } else {
      this.accionConfirmacion = 'activar';
      this.mensajeConfirmacion = `¿Deseas activar la categoría "${categoria.nombre}"?`;
    }
    
    this.mostrarConfirmacion = true;
    this.setBodyScroll(true);
    
    console.log('Modal de confirmación abierto:', this.mostrarConfirmacion);
  }, 100);
}
}