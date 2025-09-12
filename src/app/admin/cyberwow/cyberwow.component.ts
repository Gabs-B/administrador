import { Component, OnInit } from '@angular/core';
import { CyberwowService, CyberWowBanner, DatosAuxiliares } from '../../services/cyberwow.service';

interface FormularioBanner {
  titulo: string;
  imagen: File | null;
  categoria_id?: number | null;
  producto_id?: number | null;
  tiendas?: number[];
  estado: 'activo' | 'inactivo';
}

@Component({
  selector: 'app-cyberwow',
  templateUrl: './cyberwow.component.html',
  styleUrls: ['./cyberwow.component.css']
})
export class CyberwowComponent implements OnInit {
  // Estado principal
  banners: CyberWowBanner[] = [];
  cargando = false;
  error: string | null = null;

  // Datos auxiliares
  datosAuxiliares: DatosAuxiliares | null = null;
  cargandoDatos = false;

  // Modal de formulario
  mostrarFormulario = false;
  tipoFormulario: 'categoria' | 'tiendas' | 'producto' = 'categoria';
  bannerEditando: CyberWowBanner | null = null;
  
  // Formulario
  formulario: FormularioBanner = {
    titulo: '',
    imagen: null,
    estado: 'activo'
  };

  // Estados del formulario
  enviando = false;
  errores: any = {};
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';
  imagenPreview: string | null = null;

  // Modal de confirmación
  mostrarConfirmacion = false;
  bannerParaEliminar: CyberWowBanner | null = null;
  procesandoEliminacion = false;

  constructor(private cyberwowService: CyberwowService) {}

  ngOnInit(): void {
    this.cargarBanners();
    this.cargarDatosAuxiliares();
  }

  // =============== MÉTODOS DE CARGA ===============

  cargarBanners(): void {
    this.cargando = true;
    this.error = null;

    this.cyberwowService.getBanners().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.banners = response.data;
        } else {
          this.error = response.message || 'Error al cargar banners';
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error de conexión';
        this.cargando = false;
      }
    });
  }

  cargarDatosAuxiliares(): void {
    this.cargandoDatos = true;

    this.cyberwowService.getDatosAuxiliares().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.datosAuxiliares = response.data;
        }
        this.cargandoDatos = false;
      },
      error: () => {
        this.cargandoDatos = false;
      }
    });
  }

  // =============== MÉTODOS DE FORMULARIO ===============

  mostrarFormularioCrear(tipo: 'categoria' | 'tiendas' | 'producto'): void {
    // Verificar espacios disponibles
    if (!this.datosAuxiliares) {
      this.mostrarMensaje('Cargando datos...', 'error');
      return;
    }

    const espacios = this.datosAuxiliares.espacios_disponibles;

    if (tipo === 'categoria' && !espacios.categoria) {
      this.mostrarMensaje('Ya existe un banner de categoría activo. Desactívalo primero.', 'error');
      return;
    }

    if (tipo === 'tiendas' && !espacios.tiendas) {
      this.mostrarMensaje('Ya existe un banner de tiendas activo. Desactívalo primero.', 'error');
      return;
    }

    if (tipo === 'producto' && espacios.productos <= 0) {
      this.mostrarMensaje('Ya existen 4 banners de productos activos. Desactiva uno primero.', 'error');
      return;
    }

    this.tipoFormulario = tipo;
    this.bannerEditando = null;
    this.limpiarFormulario();
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(banner: CyberWowBanner): void {
    this.bannerEditando = banner;
    this.limpiarFormulario();
    
    // Determinar tipo de banner
    if (banner.categoria_id) {
      this.tipoFormulario = 'categoria';
      this.formulario.categoria_id = banner.categoria_id;
    } else if (banner.tiendas && banner.tiendas.length > 0) {
      this.tipoFormulario = 'tiendas';
      this.formulario.tiendas = banner.tiendas.map(t => t.id);
    } else if (banner.producto_id) {
      this.tipoFormulario = 'producto';
      this.formulario.producto_id = banner.producto_id;
    }

    this.formulario.titulo = banner.titulo;
    this.formulario.estado = banner.estado;
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.limpiarMensajes();
  }

  limpiarFormulario(): void {
    this.formulario = {
      titulo: '',
      imagen: null,
      estado: 'activo'
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
    this.imagenPreview = null;
    
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
    formData.append('titulo', this.formulario.titulo);
    formData.append('estado', this.formulario.estado);

    if (this.formulario.imagen) {
      formData.append('imagen', this.formulario.imagen);
    }

    // Agregar campos específicos según el tipo
    switch (this.tipoFormulario) {
      case 'categoria':
        if (this.formulario.categoria_id) {
          formData.append('categoria_id', this.formulario.categoria_id.toString());
        }
        break;
      case 'producto':
        if (this.formulario.producto_id) {
          formData.append('producto_id', this.formulario.producto_id.toString());
        }
        break;
      case 'tiendas':
        if (this.formulario.tiendas && this.formulario.tiendas.length > 0) {
          this.formulario.tiendas.forEach((tiendaId, index) => {
            formData.append(`tiendas[${index}]`, tiendaId.toString());
          });
        }
        break;
    }

    const operacion = this.bannerEditando ? 
      this.cyberwowService.actualizarBanner(this.bannerEditando.id, formData) :
      this.obtenerMetodoCreacion(formData);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje(
            this.bannerEditando ? 'Banner actualizado exitosamente' : 'Banner creado exitosamente', 
            'success'
          );
          
          setTimeout(() => {
            this.cerrarFormulario();
            this.cargarBanners();
            this.cargarDatosAuxiliares(); // Recargar espacios disponibles
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

  private obtenerMetodoCreacion(formData: FormData) {
    switch (this.tipoFormulario) {
      case 'categoria':
        return this.cyberwowService.crearBannerCategoria(formData);
      case 'tiendas':
        return this.cyberwowService.crearBannerTiendas(formData);
      case 'producto':
        return this.cyberwowService.crearBannerProducto(formData);
      default:
        throw new Error('Tipo de formulario no válido');
    }
  }

  validarFormulario(): boolean {
    this.errores = {};

    if (!this.formulario.titulo.trim()) {
      this.errores.titulo = 'El título es obligatorio';
    }

    if (!this.bannerEditando && !this.formulario.imagen) {
      this.errores.imagen = 'La imagen es obligatoria';
    }

    switch (this.tipoFormulario) {
      case 'categoria':
        if (!this.formulario.categoria_id) {
          this.errores.categoria_id = 'Debes seleccionar una categoría';
        }
        break;
      case 'producto':
        if (!this.formulario.producto_id) {
          this.errores.producto_id = 'Debes seleccionar un producto';
        }
        break;
      case 'tiendas':
        if (!this.formulario.tiendas || this.formulario.tiendas.length === 0) {
          this.errores.tiendas = 'Debes seleccionar al menos una tienda';
        }
        break;
    }

    return Object.keys(this.errores).length === 0;
  }

  // =============== MÉTODOS DE ELIMINACIÓN ===============

  confirmarEliminar(banner: CyberWowBanner): void {
    this.bannerParaEliminar = banner;
    this.mostrarConfirmacion = true;
  }

  cerrarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.bannerParaEliminar = null;
  }

  ejecutarEliminacion(): void {
    if (!this.bannerParaEliminar || this.procesandoEliminacion) return;

    this.procesandoEliminacion = true;

    this.cyberwowService.eliminarBanner(this.bannerParaEliminar.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Banner desactivado exitosamente', 'success');
          this.cargarBanners();
          this.cargarDatosAuxiliares();
        } else {
          this.mostrarMensaje(response.message || 'Error al desactivar banner', 'error');
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
    const accion = this.bannerEditando ? 'Editar' : 'Crear';
    const tipo = this.tipoFormulario === 'categoria' ? 'Categoría' : 
                 this.tipoFormulario === 'tiendas' ? 'Tiendas' : 'Producto';
    return `${accion} Banner de ${tipo}`;
  }

  getTextoBotonGuardar(): string {
    if (this.enviando) {
      return this.bannerEditando ? 'Actualizando...' : 'Creando...';
    }
    return this.bannerEditando ? 'Actualizar' : 'Crear Banner';
  }

  getTipoBanner(banner: CyberWowBanner): string {
    if (banner.categoria_id) return 'Categoría';
    if (banner.tiendas && banner.tiendas.length > 0) return 'Tiendas';
    if (banner.producto_id) return 'Producto';
    return 'General';
  }

  getEstadoClase(estado: string): string {
    return `estado-${estado}`;
  }

  formatearPrecio(precio: number): string {
    return this.cyberwowService.formatearPrecio(precio);
  }

  onTiendaChange(tiendaId: number, event: any): void {
    if (!this.formulario.tiendas) {
      this.formulario.tiendas = [];
    }

    if (event.target.checked) {
      if (!this.formulario.tiendas.includes(tiendaId)) {
        this.formulario.tiendas.push(tiendaId);
      }
    } else {
      this.formulario.tiendas = this.formulario.tiendas.filter(id => id !== tiendaId);
    }
  }

  isTiendaSeleccionada(tiendaId: number): boolean {
    return this.formulario.tiendas?.includes(tiendaId) || false;
  }
}