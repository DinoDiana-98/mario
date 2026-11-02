import { Component, computed, inject, signal } from '@angular/core';
import { DataStore, Product, Payout } from './data.store';

type Section = 'metrics' | 'branches' | 'menu' | 'payouts' | 'settings';
@Component({ selector: 'app-business', standalone: true, templateUrl: './business.html' })
export class BusinessComponent {
  readonly store = inject(DataStore);
  readonly section = signal<Section>('metrics');
  readonly nav: { id: Section; label: string; short: string; icon: string }[] = [
    { id: 'metrics', label: 'Ventas y métricas', short: 'Métricas', icon: '▦' },
    { id: 'branches', label: 'Mis sucursales', short: 'Sucursales', icon: '▤' },
    { id: 'menu', label: 'Carta y adicionales', short: 'Carta', icon: '≡' },
    { id: 'payouts', label: 'Liquidaciones', short: 'Pagos', icon: '▣' },
    { id: 'settings', label: 'Configuración', short: 'Ajustes', icon: '⚙' }
  ];
  readonly branchId = signal('all');
  readonly period = signal<'Hoy' | 'Semana' | 'Mes'>('Hoy');
  readonly productSearch = signal('');
  readonly category = signal('all');
  readonly selectedPayoutId = signal<string | null>(null);
  readonly productEditor = signal(false);
  readonly editorName = signal('');
  readonly editorCategory = signal('Combos');
  readonly editorPrice = signal(0);
  readonly settingsMessage = signal('');
  readonly filteredBranches = computed(() => this.branchId() === 'all' ? this.store.branches() : this.store.branches().filter(b => b.id === this.branchId()));
  readonly sales = computed(() => this.filteredBranches().reduce((sum, b) => sum + b.sales, 0));
  readonly orders = computed(() => this.filteredBranches().reduce((sum, b) => sum + b.orders, 0));
  readonly filteredProducts = computed(() => this.store.products().filter(p => (this.category() === 'all' || p.category === this.category()) && p.name.toLocaleLowerCase('es').includes(this.productSearch().toLocaleLowerCase('es'))));
  readonly categories = computed(() => [...new Set(this.store.products().map(p => p.category))]);
  readonly payouts = computed(() => this.store.payouts().filter(p => p.merchantId === 'M1'));
  readonly selectedPayout = computed(() => this.payouts().find(p => p.id === this.selectedPayoutId()) || null);
  readonly nextPayout = computed(() => this.payouts().find(p => p.status === 'Programado'));

  setSection(id: Section): void { this.section.set(id); window.scrollTo({ top: 0, behavior: 'instant' }); }
  toggleBranch(id: string): void { this.store.update(s => { const b = s.branches.find(x => x.id === id); if (b) b.open = !b.open; }); }
  toggleProduct(id: string): void { this.store.update(s => { const p = s.products.find(x => x.id === id); if (p) p.available = !p.available; }); }
  saveProduct(): void {
    if (!this.editorName().trim() || this.editorPrice() <= 0) return;
    this.store.update(s => { s.products.unshift({ id: `P${Date.now()}`, name: this.editorName().trim(), category: this.editorCategory(), price: this.editorPrice(), available: true }); });
    this.editorName.set(''); this.editorPrice.set(0); this.productEditor.set(false);
  }
  updateSettings(field: 'businessName' | 'businessRuc' | 'email' | 'cci', value: string): void { this.store.update(s => { s[field] = value.trim(); }); this.settingsMessage.set('Cambios guardados en este navegador.'); }
  toggleNotification(field: 'emailNotifications' | 'inAppNotifications'): void { this.store.update(s => { s[field] = !s[field]; }); }
  exportSales(): void {
    const rows = [['Semana', 'Estado', 'Ventas', 'Comisiones', 'Neto', 'Factura', 'Fecha de pago'], ...this.payouts().map(p => [p.period, p.status, p.sales, p.fee, p.net, p.invoice || '', p.paymentDate])];
    const csv = '\ufeff' + rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'mandadito-relacion-ventas.csv'; a.click(); URL.revokeObjectURL(url);
  }
  money(value: number): string { return this.store.money(value); }
  statusClass(p: Payout): string { return p.status === 'Pagado' ? 'green' : p.status === 'Programado' ? 'amber' : 'neutral'; }
  trackProduct(_index: number, product: Product): string { return product.id; }
}
