import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProductosService, Producto, ProductoImagen } from '../../../services/productos.service';
import { CategoriasService, Categoria } from '../../../services/categorias.service';
import { TiendasService, Tienda } from '../../../services/tienda.service';

@Component({
  selector: 'app-producto-form',
  templateUrl: './producto-form.component.html',
  styleUrls: ['./producto-form.component.css']
})
export class ProductoFormComponent implements OnInit {
  @Input() producto: Producto | null = null;
  @Input() mostrar: boolean = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<Producto>();

  // Datos del formulario
  formulario = {
    nombre: '',
    sku: '',
    descripcion: '',
    categoria_id: null as number | null,
    tienda_id: null as number | null,
    precio: 0,
    descuento: 0,
    beneficios: '',
    modo_uso: '',
    detalle: '',
    stock: 0,
    estado: 'activo' as 'activo' | 'inactivo'
  };

  // Estados del componente
  enviando = false;
  errores: any = {};
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' = 'success';

  // Datos auxiliares
  categorias: Categoria[] = [];
  tiendas: Tienda[] = [];
  cargandoCategorias = false;
  cargandoTiendas = false;

  // ========== GESTIÓN DE IMÁGENES MÚLTIPLES ==========
  imagenesSeleccionadas: File[] = [];
  previsualizacionImagenes: string[] = [];
  imagenPrincipalIndex: number = 0;
  imagenesExistentes: ProductoImagen[] = [];
  imagenesAEliminar: number[] = [];

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private tiendasService: TiendasService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarTiendas();
  }

  ngOnChanges(): void {
    if (this.mostrar) {
      this.resetFormulario();
      if (this.producto) {
        this.cargarDatosProducto();
      }
    }
  }

  /**
   * Cargar categorías disponibles
   */
  cargarCategorias(): void {
    this.cargandoCategorias = true;
    this.categoriasService.getCategorias({ estado: 'activo' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categorias = response.data;
        } else {
          console.error('Error al cargar categorías:', response.message);
        }
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      },
      complete: () => {
        this.cargandoCategorias = false;
      }
    });
  }

  /**
   * Cargar tiendas disponibles
   */
  cargarTiendas(): void {
    this.cargandoTiendas = true;
    this.tiendasService.getTiendas().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiendas = response.data;
        } else {
          console.error('Error al cargar tiendas:', response.message);
        }
      },
      error: (error) => {
        console.error('Error al cargar tiendas:', error);
      },
      complete: () => {
        this.cargandoTiendas = false;
      }
    });
  }

  /**
   * Cargar datos del producto para edición
   */
  cargarDatosProducto(): void {
    if (this.producto) {
      this.formulario = {
        nombre: this.producto.nombre || '',
        sku: this.producto.sku || '',
        descripcion: this.producto.descripcion || '',
        categoria_id: this.producto.categoria_id || null,
        tienda_id: this.producto.tienda_id || null,
        precio: this.producto.precio || 0,
        descuento: this.producto.descuento || 0,
        beneficios: this.producto.beneficios || '',
        modo_uso: this.producto.modo_uso || '',
        detalle: this.producto.detalle || '',
        stock: this.producto.stock || 0,
        estado: this.producto.estado || 'activo'
      };

      // Cargar imágenes existentes
    this.imagenesExistentes = this.producto.imagenes ? [...this.producto.imagenes] : [];
      
      // Limpiar arrays de nuevas imágenes
      this.imagenesSeleccionadas = [];
      this.previsualizacionImagenes = [];
      this.imagenPrincipalIndex = 0;
      this.imagenesAEliminar = [];
    }
  }

  /**
   * Reset del formulario
   */
  resetFormulario(): void {
    this.formulario = {
      nombre: '',
      sku: '',
      descripcion: '',
      detalle: '',
      modo_uso: '',
      beneficios: '',
      categoria_id: null,
      tienda_id: null,
      precio: 0,
      descuento: 0,
      stock: 0,
      estado: 'activo'
    };
    
    this.errores = {};
    this.mensaje = '';
    
    // Reset imágenes
    this.imagenesSeleccionadas = [];
    this.previsualizacionImagenes = [];
    this.imagenPrincipalIndex = 0;
    this.imagenesExistentes = [];
    this.imagenesAEliminar = [];
  }

  // ========== GESTIÓN DE IMÁGENES ==========

  /**
   * Manejar selección de múltiples archivos
   */
  onArchivosSeleccionados(event: any): void {
    const archivos = Array.from(event.target.files) as File[];
    
    if (archivos.length === 0) return;

    // Validar cantidad total (existentes + nuevas)
    const totalImagenes = this.imagenesExistentes.length - this.imagenesAEliminar.length + archivos.length;
    if (totalImagenes > 14) {
      this.mostrarMensaje('No puedes tener más de 10 imágenes por producto', 'error');
      return;
    }

    // Validar cada archivo
    for (const archivo of archivos) {
      if (!archivo.type.startsWith('image/')) {
        this.mostrarMensaje(`${archivo.name} no es una imagen válida`, 'error');
        return;
      }

    if (archivo.size > 5120 * 1024) {  
      this.mostrarMensaje(`${archivo.name} supera los 5MB permitidos`, 'error');
      return;
    }
    }

    // Agregar archivos y crear previsualizaciones
    this.imagenesSeleccionadas.push(...archivos);
    
    // Crear previsualizaciones para los nuevos archivos
    archivos.forEach(archivo => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizacionImagenes.push(e.target.result);
      };
      reader.readAsDataURL(archivo);
    });

    // Si es la primera imagen y no hay imágenes existentes, marcarla como principal
    if (this.imagenesExistentes.length === 0 && this.imagenPrincipalIndex === 0) {
      this.imagenPrincipalIndex = 0;
    }
  }

  /**
   * Eliminar imagen nueva seleccionada
   */
  eliminarImagenSeleccionada(index: number): void {
    this.imagenesSeleccionadas.splice(index, 1);
    this.previsualizacionImagenes.splice(index, 1);

    // Ajustar índice de imagen principal si es necesario
    if (this.imagenPrincipalIndex > index) {
      this.imagenPrincipalIndex--;
    } else if (this.imagenPrincipalIndex === index) {
      this.imagenPrincipalIndex = 0;
    }

    // Reset del input file
    const fileInput = document.getElementById('imagenes') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Marcar imagen existente para eliminar
   */
  marcarEliminarImagenExistente(imagenId: number): void {
    if (!this.imagenesAEliminar.includes(imagenId)) {
      this.imagenesAEliminar.push(imagenId);
    }
  }

  /**
   * Cancelar eliminación de imagen existente
   */
  cancelarEliminarImagenExistente(imagenId: number): void {
    const index = this.imagenesAEliminar.indexOf(imagenId);
    if (index > -1) {
      this.imagenesAEliminar.splice(index, 1);
    }
  }

  /**
   * Establecer imagen principal (nuevas imágenes)
   */
  establecerImagenPrincipal(index: number): void {
    this.imagenPrincipalIndex = index;
  }

  /**
   * Obtener total de imágenes activas
   */
  getTotalImagenesActivas(): number {
    const existentesActivas = this.imagenesExistentes.filter(img => !this.imagenesAEliminar.includes(img.id)).length;
    return existentesActivas + this.imagenesSeleccionadas.length;
  }

  /**
   * Verificar si una imagen existente está marcada para eliminar
   */
  estaMarcadaParaEliminar(imagenId: number): boolean {
    return this.imagenesAEliminar.includes(imagenId);
  }

  // ========== VALIDACIÓN Y GUARDADO ==========

  /**
   * Validar formulario
   */
  validarFormulario(): boolean {
    this.errores = {};

    if (!this.formulario.nombre.trim()) {
      this.errores.nombre = 'El nombre es requerido';
    }

    if (!this.formulario.descripcion.trim()) {
      this.errores.descripcion = 'La descripción es requerida';
    }

    if (this.formulario.precio < 0) {
      this.errores.precio = 'El precio no puede ser negativo';
    }

    if (this.formulario.stock < 0) {
      this.errores.stock = 'El stock no puede ser negativo';
    }

    if (this.formulario.descuento < 0 || this.formulario.descuento > 100) {
      this.errores.descuento = 'El descuento debe estar entre 0 y 100';
    }

    return Object.keys(this.errores).length === 0;
  }

  /**
   * Guardar producto (crear o editar)
   */
  guardar(): void {
  if (!this.validarFormulario()) {
    this.mostrarMensaje('Por favor corrige los errores en el formulario', 'error');
    return;
  }

  this.enviando = true;
  this.errores = {};

  if (this.producto) {
    // EDICIÓN: Actualizar datos básicos primero, luego manejar imágenes
    this.actualizarProductoExistente();
  } else {
    // CREACIÓN: Crear con imágenes incluidas
    this.crearProductoNuevo();
  }
}
private crearProductoNuevo(): void {
  const formData = new FormData();
  
  // Datos básicos del producto
  formData.append('nombre', this.formulario.nombre);
  formData.append('descripcion', this.formulario.descripcion);
  formData.append('precio', this.formulario.precio.toString());
  formData.append('descuento', this.formulario.descuento.toString());
  formData.append('stock', this.formulario.stock.toString());
  formData.append('estado', this.formulario.estado);

  // Campos opcionales
  if (this.formulario.sku) {
    formData.append('sku', this.formulario.sku);
  }
  if (this.formulario.categoria_id) {
    formData.append('categoria_id', this.formulario.categoria_id.toString());
  }
  if (this.formulario.tienda_id) {
    formData.append('tienda_id', this.formulario.tienda_id.toString());
  }
  if (this.formulario.beneficios) {
    formData.append('beneficios', this.formulario.beneficios);
  }
  if (this.formulario.modo_uso) {
    formData.append('modo_uso', this.formulario.modo_uso);
  }
  if (this.formulario.detalle) {
    formData.append('detalle', this.formulario.detalle);
  }

  // Agregar imágenes nuevas
  this.imagenesSeleccionadas.forEach((archivo, index) => {
    formData.append(`imagenes[${index}]`, archivo);
  });

  // Especificar cuál imagen nueva será la principal (si hay imágenes nuevas)
  if (this.imagenesSeleccionadas.length > 0) {
    formData.append('imagen_principal_index', this.imagenPrincipalIndex.toString());
  }

  this.productosService.crearProducto(formData).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.mostrarMensaje('Producto creado correctamente', 'success');
        this.guardado.emit(response.data);
        setTimeout(() => this.cerrarModal(), 1500);
      } else {
        this.mostrarMensaje(response.message || 'Error al crear producto', 'error');
        this.errores = response.errors || {};
      }
    },
    error: (error) => {
      console.error('Error:', error);
      this.mostrarMensaje('Error de conexión con el servidor', 'error');
    },
    complete: () => {
      this.enviando = false;
    }
  });
}
private actualizarProductoExistente(): void {
  // Preparar datos básicos sin imágenes
  const datosBasicos: any = {
    nombre: this.formulario.nombre,
    descripcion: this.formulario.descripcion,
    precio: this.formulario.precio,
    descuento: this.formulario.descuento,
    stock: this.formulario.stock,
    estado: this.formulario.estado
  };

  // Campos opcionales
  if (this.formulario.sku) {
    datosBasicos.sku = this.formulario.sku;
  }
  if (this.formulario.categoria_id) {
    datosBasicos.categoria_id = this.formulario.categoria_id;
  }
  if (this.formulario.tienda_id) {
    datosBasicos.tienda_id = this.formulario.tienda_id;
  }
  if (this.formulario.beneficios) {
    datosBasicos.beneficios = this.formulario.beneficios;
  }
  if (this.formulario.modo_uso) {
    datosBasicos.modo_uso = this.formulario.modo_uso;
  }
  if (this.formulario.detalle) {
    datosBasicos.detalle = this.formulario.detalle;
  }

  // Crear FormData solo con datos básicos
  const formData = new FormData();
  Object.keys(datosBasicos).forEach(key => {
    formData.append(key, datosBasicos[key]);
  });

  this.productosService.actualizarProducto(this.producto!.id, formData).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.mostrarMensaje('Producto actualizado correctamente', 'success');
        
        // Procesar cambios en imágenes
        this.procesarCambiosImagenes(response.data);
      } else {
        this.mostrarMensaje(response.message || 'Error al actualizar producto', 'error');
        this.errores = response.errors || {};
        this.enviando = false;
      }
    },
    error: (error) => {
      console.error('Error:', error);
      this.mostrarMensaje('Error de conexión con el servidor', 'error');
      this.enviando = false;
    }
  });
}
private procesarCambiosImagenes(producto: Producto): void {
  let operacionesPendientes = 0;
  let operacionesCompletadas = 0;
  let erroresOperaciones = 0;

  // Función para finalizar
  const finalizarOperaciones = () => {
    if (operacionesCompletadas + erroresOperaciones === operacionesPendientes) {
      if (erroresOperaciones > 0) {
        this.mostrarMensaje(
          `Producto actualizado, pero hubo ${erroresOperaciones} error(es) con las imágenes`, 
          'error'
        );
      }
      
      // Recargar el producto actualizado
      this.productosService.getProducto(producto.id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.guardado.emit(response.data);
          } else {
            this.guardado.emit(producto);
          }
          setTimeout(() => this.cerrarModal(), 1500);
        },
        error: () => {
          this.guardado.emit(producto);
          setTimeout(() => this.cerrarModal(), 1500);
        },
        complete: () => {
          this.enviando = false;
        }
      });
    }
  };

  // 1. Eliminar imágenes marcadas
  if (this.imagenesAEliminar.length > 0) {
    operacionesPendientes += this.imagenesAEliminar.length;
    
    this.imagenesAEliminar.forEach(imagenId => {
      this.productosService.eliminarImagenProducto(producto.id, imagenId).subscribe({
        next: (response) => {
          if (!response.success) {
            erroresOperaciones++;
          }
          operacionesCompletadas++;
        },
        error: () => {
          erroresOperaciones++;
          operacionesCompletadas++;
        },
        complete: () => {
          finalizarOperaciones();
        }
      });
    });
  }

  // 2. Agregar nuevas imágenes
  if (this.imagenesSeleccionadas.length > 0) {
    operacionesPendientes++;
    
    const formDataImagenes = new FormData();
    
    // Agregar todas las imágenes nuevas
    this.imagenesSeleccionadas.forEach((archivo, index) => {
      formDataImagenes.append(`imagenes[${index}]`, archivo);
    });
    
    // Solo establecer imagen principal si no hay imágenes existentes activas
    const imagenesExistentesActivas = this.imagenesExistentes.filter(img => 
      !this.imagenesAEliminar.includes(img.id)
    );
    
    if (imagenesExistentesActivas.length === 0) {
      formDataImagenes.append('imagen_principal_index', this.imagenPrincipalIndex.toString());
    }

    this.productosService.agregarImagenesProducto(producto.id, formDataImagenes).subscribe({
      next: (response) => {
        if (!response.success) {
          erroresOperaciones++;
        }
        operacionesCompletadas++;
      },
      error: () => {
        erroresOperaciones++;
        operacionesCompletadas++;
      },
      complete: () => {
        finalizarOperaciones();
      }
    });
  }

  // Si no hay operaciones de imágenes pendientes, finalizar inmediatamente
  if (operacionesPendientes === 0) {
    this.guardado.emit(producto);
    setTimeout(() => this.cerrarModal(), 1500);
    this.enviando = false;
  }
}

  /**
   * Eliminar imágenes marcadas para eliminación
   */
  eliminarImagenesSeleccionadas(producto: Producto): void {
    if (this.imagenesAEliminar.length === 0) {
      this.guardado.emit(producto);
      setTimeout(() => this.cerrarModal(), 1500);
      return;
    }

    let eliminadas = 0;
    let errores = 0;

    this.imagenesAEliminar.forEach(imagenId => {
      this.productosService.eliminarImagenProducto(producto.id, imagenId).subscribe({
        next: (response) => {
          if (response.success) {
            eliminadas++;
          } else {
            errores++;
          }
        },
        error: () => {
          errores++;
        },
        complete: () => {
          // Cuando se hayan procesado todas las eliminaciones
          if (eliminadas + errores === this.imagenesAEliminar.length) {
            if (errores > 0) {
              this.mostrarMensaje(`Producto guardado, pero ${errores} imágenes no se pudieron eliminar`, 'error');
            }
            this.guardado.emit(producto);
            setTimeout(() => this.cerrarModal(), 1500);
          }
        }
      });
    });
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.resetFormulario();
    this.cerrar.emit();
  }

  /**
   * Mostrar mensaje
   */
  mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  /**
   * Obtener título del modal
   */
  getTitulo(): string {
    return this.producto ? 'Editar Producto' : 'Nuevo Producto';
  }

  /**
   * Obtener texto del botón guardar
   */
  getTextoBotonGuardar(): string {
    if (this.enviando) {
      return this.producto ? 'Actualizando...' : 'Creando...';
    }
    return this.producto ? 'Actualizar' : 'Crear';
  }
  /**
 * Establecer imagen existente como principal
 */
establecerImagenExistentePrincipal(imagenId: number): void {
  if (!this.producto) return;
  
  this.enviando = true;
  
  this.productosService.cambiarImagenPrincipal(this.producto.id, imagenId).subscribe({
    next: (response) => {
      if (response.success) {
        // Actualizar el estado local
        this.imagenesExistentes.forEach(img => {
          img.es_principal = img.id === imagenId;
        });
        this.mostrarMensaje('Imagen principal actualizada', 'success');
      } else {
        this.mostrarMensaje(response.message || 'Error al cambiar imagen principal', 'error');
      }
    },
    error: (error) => {
      console.error('Error:', error);
      this.mostrarMensaje('Error de conexión', 'error');
    },
    complete: () => {
      this.enviando = false;
    }
  });
}
puedeEstablecerComoPrincipal(): boolean {
  // Solo si no hay imágenes existentes o todas están marcadas para eliminar
  const imagenesExistentesActivas = this.imagenesExistentes.filter(img => 
    !this.imagenesAEliminar.includes(img.id)
  );
  
  return imagenesExistentesActivas.length === 0;
}
getImagenPrincipalActual(): any {
  // Buscar en existentes primero
  const imagenExistentePrincipal = this.imagenesExistentes.find(img => 
    img.es_principal && !this.imagenesAEliminar.includes(img.id)
  );
  
  if (imagenExistentePrincipal) {
    return { tipo: 'existente', imagen: imagenExistentePrincipal };
  }
  
  // Si no hay existentes activas, buscar en nuevas
  if (this.imagenesSeleccionadas.length > 0 && this.puedeEstablecerComoPrincipal()) {
    return { 
      tipo: 'nueva', 
      imagen: this.imagenesSeleccionadas[this.imagenPrincipalIndex],
      index: this.imagenPrincipalIndex 
    };
  }
  
  return null;
}
tieneImagenPrincipalExistente(): boolean {
    return this.imagenesExistentes.some(img => 
      img.es_principal && !this.imagenesAEliminar.includes(img.id)
    );
  }
}