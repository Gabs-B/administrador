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
  cargando = false;
  error: string = '';

  // Formulario
  mostrarFormulario = false;
  categoriaEditando: Categoria | null = null;
  formulario = {
    nombre: '',
    estado: 'activo'
  };
  errores: any = {};
  enviando = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';

  // Manejo de imagen
  imagenSeleccionada: File | null = null;
  previewImagen: string | null = null;
  eliminarImagenExistente = false;

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
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(archivo.type)) {
        this.errores.imagen = 'Solo se permiten archivos JPG, PNG y WebP';
        return;
      }

      // Validar tamaño (2MB máximo)
      if (archivo.size > 2 * 1024 * 1024) {
        this.errores.imagen = 'La imagen no debe superar los 2MB';
        return;
      }

      this.imagenSeleccionada = archivo;
      this.errores.imagen = null;
      this.eliminarImagenExistente = false;

      // Generar preview
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

    // Limpiar el input file
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

    // Limpiar el input file
    const input = document.getElementById('imagen') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  // =================== MÉTODOS DE FORMULARIO ===================

  mostrarFormularioCrear(): void {
    this.categoriaEditando = null;
    this.formulario = {
      nombre: '',
      estado: 'activo'
    };
    this.errores = {};
    this.mensaje = '';
    this.imagenSeleccionada = null;
    this.previewImagen = null;
    this.eliminarImagenExistente = false;
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(categoria: Categoria): void {
    this.categoriaEditando = categoria;
    this.formulario = {
      nombre: categoria.nombre,
      estado: categoria.estado
    };
    this.errores = {};
    this.mensaje = '';
    this.imagenSeleccionada = null;
    this.previewImagen = categoria.imagen_url || null;
    this.eliminarImagenExistente = false;
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.categoriaEditando = null;
    this.formulario = {
      nombre: '',
      estado: 'activo'
    };
    this.errores = {};
    this.mensaje = '';
    this.imagenSeleccionada = null;
    this.previewImagen = null;
    this.eliminarImagenExistente = false;
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

    this.enviando = true;

    const datosCategoria = {
      nombre: this.formulario.nombre.trim(),
      estado: this.formulario.estado
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
          
          // Recargar la lista
          this.cargarCategorias();
          
          // Cerrar el formulario después de un breve delay
          setTimeout(() => {
            this.cerrarFormulario();
          }, 1500);
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

  // =================== MÉTODOS DE ACCIONES ===================

  confirmarEliminar(categoria: Categoria): void {
    this.categoriaAccion = categoria;
    this.accionConfirmacion = 'eliminar';
    this.mensajeConfirmacion = `¿Estás seguro de que deseas desactivar la categoría "${categoria.nombre}"?`;
    this.mostrarConfirmacion = true;
  }

  confirmarActivar(categoria: Categoria): void {
    this.categoriaAccion = categoria;
    this.accionConfirmacion = 'activar';
    this.mensajeConfirmacion = `¿Deseas activar la categoría "${categoria.nombre}"?`;
    this.mostrarConfirmacion = true;
  }

  cerrarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.categoriaAccion = null;
    this.procesandoAccion = false;
  }

  ejecutarAccion(): void {
    if (!this.categoriaAccion || this.procesandoAccion) return;

    this.procesandoAccion = true;

    const operacion = this.accionConfirmacion === 'eliminar'
      ? this.categoriasService.eliminarCategoria(this.categoriaAccion.id)
      : this.categoriasService.activarCategoria(this.categoriaAccion.id);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          const accion = this.accionConfirmacion === 'eliminar' ? 'desactivada' : 'activada';
          console.log(`Categoría ${accion} exitosamente`);
          this.cargarCategorias();
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

  // =================== MÉTODOS AUXILIARES ===================

  getEstadoClase(estado: string): string {
    return estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
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
}