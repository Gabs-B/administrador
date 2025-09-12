import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      let headers: any = {  
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // Solo agregar Content-Type si no es FormData
      if (!(req.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const authReq = req.clone({
        setHeaders: headers
      });
      
      return next.handle(authReq);
    }

    // Si no hay token, solo agregar headers básicos (excepto para FormData)
    let headers: any = {
      'Accept': 'application/json'
    };

    if (!(req.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const basicReq = req.clone({
      setHeaders: headers
    });

    return next.handle(basicReq);
  }
}