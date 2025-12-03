import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

export interface Etiqueta {
  id: number;
  nombre: string;
  etiqueta_slug: string;
  estado: 'activo' | 'inactivo';
  imagen?: string;
  imagen_url?: string;
  productos_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EtiquetasPaginadas {
  etiquetas: Etiqueta[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface EtiquetaResponse {
  success: boolean;
  data?: Etiqueta | EtiquetasPaginadas;
  message?: string;
  error?: string;
  errors?: { [key: string]: string[] }; 
}

export interface CrearEtiquetaData {
  nombre: string;
  etiqueta_slug: string;
  estado?: 'activo' | 'inactivo';
  imagen: File;
}

export interface ActualizarEtiquetaData {
  nombre?: string;
  etiqueta_slug?: string;
  estado?: 'activo' | 'inactivo';
  imagen?: File;
  eliminar_imagen?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EtiquetaService {

  private apiUrl = `${envs.API_URL}/admin/etiquetas`;

  constructor(private http: HttpClient) { }

  listarEtiquetas(params: {
    estado?: string;
    buscar?: string;
    per_page?: number;
    page?: number;
  } = {}): Observable<EtiquetaResponse> {
    let httpParams = new HttpParams();

    if (params.estado && params.estado !== 'todos') {
      httpParams = httpParams.set('estado', params.estado);
    }

    if (params.buscar) {
      httpParams = httpParams.set('buscar', params.buscar);
    }

    if (params.per_page) {
      httpParams = httpParams.set('per_page', params.per_page.toString());
    }

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    return this.http.get<EtiquetaResponse>(this.apiUrl, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Error al obtener etiquetas:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        } as EtiquetaResponse);
      })
    );
  }

  crearEtiqueta(etiquetaData: CrearEtiquetaData): Observable<EtiquetaResponse> {
    const formData = new FormData();
    formData.append('nombre', etiquetaData.nombre);
    formData.append('etiqueta_slug', etiquetaData.etiqueta_slug);

    if (etiquetaData.estado) {
      formData.append('estado', etiquetaData.estado);
    }
    
    formData.append('imagen', etiquetaData.imagen);

    return this.http.post<EtiquetaResponse>(this.apiUrl, formData).pipe(
      catchError(error => {
        console.error('Error al crear etiqueta:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors 
        } as EtiquetaResponse);
      })
    );
  }

  obtenerEtiqueta(id: number): Observable<EtiquetaResponse> {
    return this.http.get<EtiquetaResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener etiqueta:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        } as EtiquetaResponse);
      })
    );
  }

  actualizarEtiqueta(id: number, etiquetaData: ActualizarEtiquetaData): Observable<EtiquetaResponse> {
    const formData = new FormData();
    
    if (etiquetaData.nombre) {
      formData.append('nombre', etiquetaData.nombre);
    }
    if (etiquetaData.etiqueta_slug) {
      formData.append('etiqueta_slug', etiquetaData.etiqueta_slug);
    }
    if (etiquetaData.estado) {
      formData.append('estado', etiquetaData.estado);
    }
    
    if (etiquetaData.imagen) {
      formData.append('imagen', etiquetaData.imagen, etiquetaData.imagen.name);
    }
    
    if (etiquetaData.eliminar_imagen !== undefined) {
      formData.append('eliminar_imagen', etiquetaData.eliminar_imagen.toString());
    }

    formData.append('_method', 'PUT');

    return this.http.post<EtiquetaResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      catchError(error => {
        console.error('Error al actualizar etiqueta:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors 
        } as EtiquetaResponse);
      })
    );
  }

  toggleEstado(id: number): Observable<EtiquetaResponse> {
    return this.http.put<EtiquetaResponse>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      catchError(error => {
        console.error('Error al cambiar estado del blog:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as EtiquetaResponse);
      })
    );
  }

  obtenerEtiquetasActivas(): Observable<EtiquetaResponse> {
    return this.listarEtiquetas({ estado: 'activo', per_page: 100 });
  }
}