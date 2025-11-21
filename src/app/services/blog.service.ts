import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { envs } from '../config/envs';

export interface Blog {
  id: number;
  titulo: string;
  blog_slug: string;
  meta_title?: string;
  meta_description?: string;
  portada?: string;
  portada_url?: string;
  resumen?: string;
  contenido_flexible?: any;
  estado: 'activo' | 'inactivo';
  creado_en?: string;
}

export interface BlogsPaginados {
  blogs: Blog[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BlogResponse {
  success: boolean;
  data?: Blog | Blog[];
  message?: string;
  error?: string;
  errors?: any;
}

export interface CrearBlogData {
  titulo: string;
  blog_slug: string;
  meta_title?: string;
  meta_description?: string;
  resumen?: string;
  contenido_flexible?: any;
  portada: File;
}

export interface ActualizarBlogData {
  titulo?: string;
  blog_slug?: string;
  meta_title?: string;
  meta_description?: string;
  resumen?: string;
  contenido_flexible?: any;
  portada?: File;
  eliminar_portada?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  private apiUrl = `${envs.API_URL}/admin/blogs`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener lista de blogs
   */
  listarBlogs(params: {
    estado?: string;
    buscar?: string;
    per_page?: number;
    page?: number;
  } = {}): Observable<BlogResponse> {
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

    return this.http.get<BlogResponse>(this.apiUrl, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Error al obtener blogs:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as BlogResponse);
      })
    );
  }

  /**
   * Crear nuevo blog
   */
  crearBlog(blogData: CrearBlogData): Observable<BlogResponse> {
    const formData = new FormData();
    formData.append('titulo', blogData.titulo);
    formData.append('blog_slug', blogData.blog_slug);
       
    if (blogData.meta_title) {
      formData.append('meta_title', blogData.meta_title);
    }

    if (blogData.meta_description) {
      formData.append('meta_description', blogData.meta_description);
    }

    if (blogData.resumen) {
      formData.append('resumen', blogData.resumen);
    }

    if (blogData.contenido_flexible) {
      formData.append('contenido_flexible', JSON.stringify(blogData.contenido_flexible));
    }
    
    formData.append('portada', blogData.portada);

    return this.http.post<BlogResponse>(this.apiUrl, formData).pipe(
      catchError(error => {
        console.error('Error al crear blog:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        } as BlogResponse);
      })
    );
  }

  /**
   * Obtener blog por ID
   */
  obtenerBlog(id: number): Observable<BlogResponse> {
    return this.http.get<BlogResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener blog:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as BlogResponse);
      })
    );
  }

  /**
   * Actualizar blog existente
   */
  actualizarBlog(id: number, blogData: ActualizarBlogData): Observable<BlogResponse> {
    const formData = new FormData();
    
    if (blogData.titulo) {
      formData.append('titulo', blogData.titulo);
    }

    if (blogData.blog_slug) {
      formData.append('blog_slug', blogData.blog_slug);
    }
    
    if (blogData.meta_title) {
      formData.append('meta_title', blogData.meta_title);
    }

    if (blogData.meta_description) {
      formData.append('meta_description', blogData.meta_description);
    }

    if (blogData.resumen) {
      formData.append('resumen', blogData.resumen);
    }

    if (blogData.contenido_flexible) {
      formData.append('contenido_flexible', JSON.stringify(blogData.contenido_flexible));
    }
    
    if (blogData.portada) {
      formData.append('portada', blogData.portada, blogData.portada.name);
    }
    
    if (blogData.eliminar_portada !== undefined) {
      formData.append('eliminar_portada', blogData.eliminar_portada.toString());
    }

    formData.append('_method', 'PUT');

    return this.http.post<BlogResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      catchError(error => {
        console.error('Error al actualizar blog:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión',
          errors: error.error?.errors
        } as BlogResponse);
      })
    );
  }

  /**
   * Toggle estado del blog (activo/inactivo)
   */
  toggleEstado(id: number): Observable<BlogResponse> {
    return this.http.put<BlogResponse>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      catchError(error => {
        console.error('Error al cambiar estado del blog:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        } as BlogResponse);
      })
    );
  }

  /**
   * Obtener blogs activos
   */
  obtenerBlogsActivos(): Observable<BlogResponse> {
    return this.listarBlogs({ estado: 'activo', per_page: 100 });
  }
}