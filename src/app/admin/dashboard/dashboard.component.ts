// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error = '';

  // Datos para los gráficos
  productosChartData: any[] = [];
  pedidosChartData: any[] = [];
  clientesChartData: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.stats = response.data;
          this.prepareChartData();
        } else {
          this.error = response.message || 'Error al cargar estadísticas';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error de conexión';
        console.error('Error:', error);
      }
    });
  }

  private prepareChartData(): void {
    if (!this.stats) return;

    // Datos para gráfico de productos
    this.productosChartData = [
      { name: 'Activos', value: this.stats.productos.activos, fill: '#10b981' },
      { name: 'Sin Stock', value: this.stats.productos.sin_stock, fill: '#f59e0b' },
      { name: 'Otros', value: this.stats.productos.total - this.stats.productos.activos - this.stats.productos.sin_stock, fill: '#6b7280' }
    ];

    // Datos para gráfico de pedidos
    this.pedidosChartData = [
      { name: 'Pendientes', value: this.stats.pedidos.pendientes, fill: '#f59e0b' },
      { name: 'Pagados', value: this.stats.pedidos.pagados, fill: '#10b981' },
      { name: 'Enviados', value: this.stats.pedidos.enviados, fill: '#3b82f6' }
    ];

    // Datos para gráfico de clientes
    this.clientesChartData = [
      { name: 'Registrados', value: this.stats.clientes.registrados, fill: '#8b5cf6' },
      { name: 'Invitados', value: this.stats.clientes.invitados, fill: '#06b6d4' }
    ];
  }

  refreshStats(): void {
    this.loadStats();
  }
}