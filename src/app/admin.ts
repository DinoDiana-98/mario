import { Component, computed, inject, signal } from '@angular/core';
import { buildWorkbook } from './excel';
import { Courier, DataStore, Merchant, Payout, Ticket } from './data.store';

type AdminSection = 'summary' | 'couriers' | 'merchants' | 'support' | 'finance' | 'team';
type Role = 'owner' | 'support' | 'courier' | 'merchant' | 'finance';
@Component({ selector: 'app-admin', standalone: true, templateUrl: './admin.html' })
export class AdminComponent {
  readonly store = inject(DataStore);
  readonly section = signal<AdminSection>('summary');
  readonly role = signal<Role>('owner');
  readonly courierTab = signal<'review' | 'active'>('review');
  readonly merchantTab = signal<'review' | 'active'>('review');
  readonly ticketTab = signal<'all' | 'Nuevo' | 'En curso' | 'Resuelto'>('all');
  readonly selectedCourier = signal<string | null>(null);
  readonly selectedMerchant = signal<string | null>(null);
  readonly selectedTicket = signal<string | null>(null);
  readonly flash = signal('');
  readonly nav: { id: AdminSection; label: string; icon: string; roles: Role[] }[] = [
    { id: 'summary', label: 'Resumen', icon: '▦', roles: ['owner'] },
    { id: 'couriers', label: 'Repartidores', icon: '◇', roles: ['owner','courier'] },
    { id: 'merchants', label: 'Restaurantes', icon: '▤', roles: ['owner','merchant'] },
    { id: 'support', label: 'Soporte', icon: '◎', roles: ['owner','support'] },
    { id: 'finance', label: 'Finanzas', icon: '▣', roles: ['owner','finance'] },
    { id: 'team', label: 'Equipo y roles', icon: '♙', roles: ['owner'] }
  ];
  readonly visibleNav = computed(() => this.nav.filter(n => n.roles.includes(this.role())));
  readonly reviewCouriers = computed(() => this.store.couriers().filter(c => c.status === 'review'));
  readonly reviewMerchants = computed(() => this.store.merchants().filter(m => m.status === 'review'));
  readonly pendingPayments = computed(() => this.store.payouts().filter(p => p.status === 'Programado'));
  readonly filteredTickets = computed(() => this.store.tickets().filter(t => this.ticketTab() === 'all' || t.status === this.ticketTab()));
  readonly courier = computed(() => this.store.couriers().find(c => c.id === this.selectedCourier()) || null);
  readonly merchant = computed(() => this.store.merchants().find(m => m.id === this.selectedMerchant()) || null);
  readonly ticket = computed(() => this.store.tickets().find(t => t.id === this.selectedTicket()) || null);
  readonly activeOrders = computed(() => this.store.orders().filter(o => !['delivered', 'rejected'].includes(o.status)).length);
  readonly onlineCouriers = computed(() => this.store.couriers().filter(c => c.status === 'active' && c.online).length);
  readonly pendingTotal = computed(() => this.pendingPayments().reduce((sum, p) => sum + p.net, 0));
  readonly totalSales = computed(() => this.store.branches().reduce((sum, b) => sum + b.sales, 0));
  readonly unassigned = computed(() => this.store.orders().filter(o => o.courier === 'Por asignar' && !['delivered', 'rejected'].includes(o.status)).length);
  readonly staff = [
    { name: 'Carlos Mendoza', role: 'Super administrador', area: 'Todos los módulos' },
    { name: 'Lucía Paredes', role: 'Líder de soporte', area: 'Soporte' },
    { name: 'Renzo Cabrera', role: 'Aprobador de repartidores', area: 'Repartidores' },
    { name: 'Sofía Ugarte', role: 'Aprobadora de restaurantes', area: 'Restaurantes' },
    { name: 'Andrés Villanueva', role: 'Finanzas', area: 'Finanzas' }
  ];
  readonly roleLabels: Record<Role, string> = { owner: 'Yo · Super administrador', support: 'Lucía · Soporte', courier: 'Renzo · Repartidores', merchant: 'Sofía · Restaurantes', finance: 'Andrés · Finanzas' };
  readonly roles: Role[] = ['owner', 'support', 'courier', 'merchant', 'finance'];

  viewAs(role: Role): void { this.role.set(role); if (!this.visibleNav().some(n => n.id === this.section())) this.section.set(this.visibleNav()[0].id); this.closeDetails(); this.scrollTop(); }
  navigate(id: AdminSection): void { if (!this.visibleNav().some(n => n.id === id)) return; this.section.set(id); this.closeDetails(); this.scrollTop(); }
  closeDetails(): void { this.selectedCourier.set(null); this.selectedMerchant.set(null); this.selectedTicket.set(null); }
  setCourierStatus(c: Courier, status: Courier['status']): void { this.store.update(s => { const x = s.couriers.find(v => v.id === c.id); if (x) x.status = status; }); this.selectedCourier.set(null); this.flash.set(`Solicitud de ${c.name} actualizada en el prototipo.`); }
  setMerchantStatus(m: Merchant, status: Merchant['status']): void { this.store.update(s => { const x = s.merchants.find(v => v.id === m.id); if (x) x.status = status; }); this.selectedMerchant.set(null); this.flash.set(`Solicitud de ${m.name} actualizada en el prototipo.`); }
  assignTicket(t: Ticket): void { this.store.update(s => { const x = s.tickets.find(v => v.id === t.id); if (x) { x.assignee = 'Lucía Paredes'; x.status = 'En curso'; } }); }
  solveTicket(t: Ticket): void { this.store.update(s => { const x = s.tickets.find(v => v.id === t.id); if (x) x.status = 'Resuelto'; }); this.selectedTicket.set(null); }
  merchantName(id: string): string { return this.store.merchants().find(m => m.id === id)?.name || 'Negocio'; }
  generateInvoice(p: Payout): void {
    if (p.status !== 'Programado' || p.invoice) return;
    const serial = String(this.store.payouts().filter(x => x.invoice).length + 43).padStart(6,'0');
    this.store.update(s => { const x = s.payouts.find(v => v.id === p.id); if (x) x.invoice = `F001-${serial}`; });
    this.flash.set('Factura de demostración registrada. La emisión real requiere integración de facturación.');
  }
  registerPayment(p: Payout): void {
    if (!p.invoice || p.status !== 'Programado') return;
    this.store.update(s => { const x = s.payouts.find(v => v.id === p.id); if (x) x.status = 'Pagado'; });
    this.flash.set('Pago marcado como realizado en el prototipo. No se transfirió dinero.');
  }
  exportExcel(): void {
    const pending = this.pendingPayments().filter(p => !!p.invoice);
    if (!pending.length) { this.flash.set('Primero registra las facturas de los pagos programados.'); return; }
    const rows: (string | number)[][] = [['RUC beneficiario', 'Beneficiario', 'Banco', 'CCI', 'Monto', 'Moneda', 'Referencia', 'Factura'], ...pending.map(p => { const m = this.store.merchants().find(x => x.id === p.merchantId)!; return [m.ruc, m.name, m.bank, m.cci, p.net, 'PEN', p.id, p.invoice || '']; })];
    const zipped = buildWorkbook(rows);
    const blob = new Blob([new Uint8Array(zipped).buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mandadito-pagos-para-revision.xlsx'; a.click(); URL.revokeObjectURL(url);
    this.flash.set('Excel de preparación descargado. Verifica la plantilla oficial de Telecrédito BCP antes de importarlo.');
  }
  retryAssignment(): void { const n = this.store.autoAssign(); this.flash.set(n ? `${n} pedido(s) asignado(s) en el prototipo.` : 'No hay pedidos pendientes o repartidores conectados.'); }
  private scrollTop(): void { window.scrollTo({ top: 0, behavior: 'instant' }); }
}
