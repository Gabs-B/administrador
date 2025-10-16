import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductosComponent } from './productos/productos.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { ClienteComponent } from './cliente/cliente.component';
import { CarruselComponent } from './carrusel/carrusel.component';
import { CyberwowComponent } from './cyberwow/cyberwow.component';
import { LiquidacionComponent } from './liquidacion/liquidacion.component';
import { ReclamosComponent } from './reclamos/reclamos.component'; 
import { PedidosComponent } from './pedidos/pedidos.component';
import { EtiquetasComponent } from './etiquetas/etiquetas.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'productos',
        component: ProductosComponent
      },
      {
        path: 'categorias',
        component: CategoriasComponent
      },
      {
        path: 'clientes',
        component: ClienteComponent
      },
      {
        path: 'carrusel',
        component: CarruselComponent
      },
      {
        path: 'cyberwow',
        component: CyberwowComponent
      },
      {
        path: 'liquidacion',
        component: LiquidacionComponent
      },
      {
        path: 'reclamos',
        component: ReclamosComponent
      },
      {
        path: 'pedidos',
        component: PedidosComponent
      },
      {
        path: 'etiquetas',
        component: EtiquetasComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }