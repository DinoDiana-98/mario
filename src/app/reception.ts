import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { DataStore, Order, OrderStatus } from './data.store';

@Component({ selector: 'app-reception', standalone: true, templateUrl: './reception.html' })
export class ReceptionComponent {
  readonly store = inject(DataStore);
  readonly tab = signal<OrderStatus>('new');
  readonly selectedId = signal<string | null>(null);
  readonly mobileDetail = signal(false);
  readonly prep = signal(0);
  readonly stockOpen = signal(false);
  readonly menuOpen = signal(false);
  readonly view = signal<'orders' | 'history'>('orders');
  readonly rejectOpen = signal(false);
  readonly rejectReason = signal('');
  readonly tabs: { id: OrderStatus; label: string }[] = [{ id: 'new', label: 'Nuevos' }, { id: 'cooking', label: 'En cocina' }, { id: 'ready', label: 'Listos' }];
  readonly filtered = computed(() => this.store.orders().filter(o => o.status === this.tab()));
  readonly selected = computed(() => this.filtered().find(o => o.id === this.selectedId()) ?? this.filtered()[0] ?? null);
  readonly history = computed(() => this.store.orders().filter(o => o.status === 'delivered' || o.status === 'rejected').sort((a, b) => b.createdAt - a.createdAt));
  readonly prepOptions = [10, 15, 20, 25, 30, 40];
  readonly emptyCopy: Record<string, string> = { new: 'Cuando llegue un pedido, aparecerá aquí.', cooking: 'Los pedidos aceptados pasarán a esta lista.', ready: 'Los pedidos preparados aparecerán aquí.' };

  count(status: OrderStatus): number { return this.store.orders().filter(o => o.status === status).length; }
  itemCount(order: Order): number { return order.items.reduce((sum, item) => sum + item.quantity, 0); }
  setTab(status: OrderStatus): void { this.tab.set(status); this.selectedId.set(null); this.mobileDetail.set(false); this.prep.set(0); this.scrollTop(); }
  showOrders(): void { this.view.set('orders'); this.menuOpen.set(false); this.scrollTop(); }
  showHistory(): void { this.view.set('history'); this.menuOpen.set(false); this.mobileDetail.set(false); this.scrollTop(); }
  openStock(): void { this.menuOpen.set(false); this.stockOpen.set(true); }
  @HostListener('document:keydown.escape') closeMenu(): void { this.menuOpen.set(false); }
  select(order: Order): void { this.selectedId.set(order.id); this.prep.set(order.prepMinutes || 0); this.mobileDetail.set(true); this.scrollTop(); }
  back(): void { this.mobileDetail.set(false); this.scrollTop(); }
  remaining(order: Order): string { this.store.clock(); const seconds = Math.max(0, Math.ceil((order.deadlineAt - Date.now()) / 1000)); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  age(order: Order): number { this.store.clock(); return Math.max(1, Math.floor((Date.now() - order.createdAt) / 60000)); }
  accept(order: Order): void { if (!this.prep()) return; this.store.changeOrder(order.id, { status: 'cooking', prepMinutes: this.prep() }); this.tab.set('cooking'); this.selectedId.set(order.id); this.prep.set(0); this.scrollTop(); }
  ready(order: Order): void { this.store.changeOrder(order.id, { status: 'ready', deliveryStage: 'at-store' }); this.tab.set('ready'); this.selectedId.set(order.id); this.scrollTop(); }
  advance(order: Order): void { if (order.deliveryStage === 'at-store') this.store.changeOrder(order.id, { deliveryStage: 'on-route' }); else { this.store.changeOrder(order.id, { status: 'delivered' }); this.mobileDetail.set(false); } }
  reject(order: Order): void { if (!this.rejectReason()) return; this.store.changeOrder(order.id, { status: 'rejected', note: `Rechazado: ${this.rejectReason()}` }); this.rejectOpen.set(false); this.rejectReason.set(''); this.mobileDetail.set(false); }
  simulate(): void { const id = this.store.addOrder(); this.view.set('orders'); this.tab.set('new'); this.selectedId.set(id); this.mobileDetail.set(false); this.scrollTop(); }
  toggleStock(id: string): void { this.store.update(s => { const p = s.products.find(x => x.id === id); if (p) p.available = !p.available; }); }
  toggleStore(): void { this.store.update(s => { s.storeOpen = !s.storeOpen; }); }
  private scrollTop(): void { window.scrollTo({ top: 0, behavior: 'instant' }); }
}
