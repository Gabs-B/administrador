import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';

// Componentes
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductosComponent } from './productos/productos.component';
import { ProductoFormComponent } from './productos/producto-form/producto-form.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { ClienteComponent } from './cliente/cliente.component';
import { CarruselComponent } from './carrusel/carrusel.component';
import { CyberwowComponent } from './cyberwow/cyberwow.component';
import { LiquidacionComponent } from './liquidacion/liquidacion.component';
import { ReclamosComponent } from './reclamos/reclamos.component';
import { PedidosComponent } from './pedidos/pedidos.component';
import { EtiquetasComponent } from './etiquetas/etiquetas.component';


// Servicios
import { DashboardService } from '../services/dashboard.service';
import { ProductosService } from '../services/productos.service';
import { CategoriasService } from '../services/categorias.service';
import { ClientesService } from '../services/clientes.service';
import { CarruselService } from '../services/carrusel.service';
import { LiquidacionService} from '../services/liquidacion.service';
import { ReclamosService } from '../services/reclamos.service';
import { PedidosService } from '../services/pedidos.service';
import { EtiquetaService } from '../services/etiqueta.service';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    DashboardComponent,
    ProductosComponent,
    ProductoFormComponent,
    CategoriasComponent,
    ClienteComponent,
    CarruselComponent,
    CyberwowComponent,
    LiquidacionComponent,
    ReclamosComponent,
    PedidosComponent,
    EtiquetasComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    FormsModule, 
    AdminRoutingModule
  ],
  providers: [
    DashboardService,
    ProductosService,
    CategoriasService,
    ClientesService,
    CarruselService,
    LiquidacionService,
    ReclamosService,
    PedidosService
  ]
})
export class AdminModule { }