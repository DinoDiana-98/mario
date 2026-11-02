import { Injectable, computed, signal } from '@angular/core';

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'delivered' | 'rejected';
export interface OrderItem { name: string; quantity: number; price: number; detail?: string }
export interface Order { id: string; customer: string; status: OrderStatus; items: OrderItem[]; total: number; payment: string; courier: string; note: string; createdAt: number; deadlineAt: number; prepMinutes?: number; deliveryStage?: 'to-store' | 'at-store' | 'on-route' }
export interface Branch { id: string; name: string; address: string; open: boolean; sales: number; orders: number }
export interface Product { id: string; name: string; category: string; price: number; available: boolean }
export interface Courier { id: string; name: string; city: string; status: 'review' | 'active' | 'rejected'; online: boolean; dni: string; vehicle: string; documents: { label: string; status: string }[] }
export interface Merchant { id: string; name: string; ruc: string; status: 'review' | 'active' | 'rejected'; cci: string; bank: string; amount: number }
export interface Ticket { id: string; subject: string; from: string; priority: 'Alta' | 'Media' | 'Baja'; status: 'Nuevo' | 'En curso' | 'Resuelto'; assignee: string; date: string }
export interface Payout { id: string; merchantId: string; period: string; sales: number; fee: number; net: number; status: 'En curso' | 'Programado' | 'Pagado'; invoice: string | null; paymentDate: string }
export interface Assignment { order: string; courier: string; at: number }
export interface AppState {
  activePanel: 'reception' | 'business' | 'admin';
  businessName: string; businessRuc: string; email: string; cci: string; bank: string;
  storeOpen: boolean; emailNotifications: boolean; inAppNotifications: boolean;
  orders: Order[]; branches: Branch[]; products: Product[]; couriers: Courier[];
  merchants: Merchant[]; tickets: Ticket[]; payouts: Payout[]; assignments: Assignment[];
}

const now = Date.now();
const initial: AppState = {
  activePanel: 'reception', businessName: 'Sanguchería El Chinito', businessRuc: '20607845123',
  email: 'administracion@elchinito.pe', cci: '00219100123456789012', bank: 'BCP',
  storeOpen: true, emailNotifications: true, inAppNotifications: true,
  orders: [
    { id: '4821', customer: 'Valeria Montesinos', status: 'new', items: [{ name: 'Combo Chicharrón Clásico', quantity: 2, price: 28.50, detail: 'Chicha morada 500 ml · Ají de cocona' }, { name: 'Extra de camote frito', quantity: 1, price: 5 }], total: 62, payment: 'Yape', courier: 'Luis P.', note: 'Camote y zarza criolla aparte, por favor.', createdAt: now, deadlineAt: now + 4 * 60000, deliveryStage: 'to-store' },
    { id: '4824', customer: 'Sebastián Quiroga', status: 'new', items: [{ name: 'Sánguche de Pavo al Horno', quantity: 1, price: 24.90 }, { name: 'Chicha Morada Natural', quantity: 1, price: 12 }], total: 36.90, payment: 'Visa', courier: 'Marco A. R.', note: '', createdAt: now, deadlineAt: now + 5 * 60000, deliveryStage: 'to-store' },
    { id: '4819', customer: 'Camila Vega', status: 'cooking', items: [{ name: 'Combo Asado de Res', quantity: 1, price: 34.90 }], total: 34.90, payment: 'Yape', courier: 'Carlos R.', note: 'Sin cebolla.', createdAt: now - 12 * 60000, deadlineAt: now, prepMinutes: 20, deliveryStage: 'at-store' },
    { id: '4817', customer: 'Diego Alva', status: 'ready', items: [{ name: 'Sánguche Clásico', quantity: 2, price: 21.50 }], total: 43, payment: 'Plin', courier: 'Kevin R.', note: '', createdAt: now - 27 * 60000, deadlineAt: now, prepMinutes: 15, deliveryStage: 'at-store' }
  ],
  branches: [
    { id: 'B1', name: 'Sede El Golf', address: 'Av. Larco 842, Víctor Larco', open: true, sales: 1890, orders: 39 },
    { id: 'B2', name: 'Sede Centro Histórico', address: 'Jr. Pizarro 518, Centro', open: true, sales: 1450, orders: 29 },
    { id: 'B3', name: 'Sede Mall Plaza', address: 'Av. América Oeste 750', open: true, sales: 940, orders: 18 }
  ],
  products: [
    { id: 'P1', name: 'Combo Chicharrón Clásico', category: 'Combos', price: 28.50, available: true },
    { id: 'P2', name: 'Sánguche de Pavo al Horno', category: 'Sánguches', price: 24.90, available: true },
    { id: 'P3', name: 'Sánguche de Asado de Res', category: 'Sánguches', price: 21.50, available: true },
    { id: 'P4', name: 'Chicha Morada Natural 1 L', category: 'Bebidas', price: 14, available: true },
    { id: 'P5', name: 'Limonada de la casa', category: 'Bebidas', price: 11, available: false }
  ],
  couriers: [
    { id: 'R1', name: 'Ana Cecilia Torres', city: 'Trujillo', status: 'review', online: false, dni: '•••• 4178', vehicle: 'Moto', documents: [{ label: 'DNI', status: 'Recibido' }, { label: 'Licencia de conducir', status: 'Recibida' }, { label: 'SOAT', status: 'Por validar' }] },
    { id: 'R2', name: 'Luis Paredes', city: 'Trujillo', status: 'active', online: true, dni: '•••• 7842', vehicle: 'Moto', documents: [{ label: 'DNI', status: 'Validado' }, { label: 'Licencia de conducir', status: 'Validada' }, { label: 'SOAT', status: 'Validado' }] },
    { id: 'R3', name: 'Carlos Rojas', city: 'Trujillo', status: 'active', online: true, dni: '•••• 5821', vehicle: 'Bicicleta', documents: [{ label: 'DNI', status: 'Validado' }] },
    { id: 'R4', name: 'Kevin Ríos', city: 'Trujillo', status: 'active', online: false, dni: '•••• 1190', vehicle: 'Moto', documents: [{ label: 'DNI', status: 'Validado' }] }
  ],
  merchants: [
    { id: 'M1', name: 'Sanguchería El Chinito', ruc: '20607845123', status: 'active', bank: 'BCP', cci: '00219100123456789012', amount: 23154.98 },
    { id: 'M2', name: 'Pizzería Don Vito', ruc: '20604189217', status: 'active', bank: 'BCP', cci: '00219100456789012345', amount: 10420.60 },
    { id: 'M3', name: 'Café Micaela', ruc: '20608912748', status: 'review', bank: 'Interbank', cci: '00312300987654321098', amount: 0 }
  ],
  tickets: [
    { id: 'S-104', subject: 'Consulta sobre una liquidación', from: 'El Chinito', priority: 'Media', status: 'Nuevo', assignee: '', date: 'Hoy, 09:30' },
    { id: 'S-103', subject: 'Cambio de cuenta bancaria', from: 'Pizzería Don Vito', priority: 'Alta', status: 'Nuevo', assignee: '', date: 'Ayer, 16:10' },
    { id: 'S-102', subject: 'No aparece un producto', from: 'Café Micaela', priority: 'Baja', status: 'En curso', assignee: 'Lucía Paredes', date: 'Ayer, 11:25' }
  ],
  payouts: [
    { id: 'L-044', merchantId: 'M1', period: '26 oct – 01 nov', sales: 11584.21, fee: 2870.64, net: 8713.57, status: 'En curso', invoice: null, paymentDate: '04 nov' },
    { id: 'L-043', merchantId: 'M1', period: '19 – 25 oct', sales: 30714.89, fee: 7559.91, net: 23154.98, status: 'Programado', invoice: null, paymentDate: '04 nov' },
    { id: 'L-042', merchantId: 'M1', period: '12 – 18 oct', sales: 30450.18, fee: 7605.24, net: 22844.94, status: 'Pagado', invoice: 'F001-000042', paymentDate: '28 oct' },
    { id: 'L-043-V', merchantId: 'M2', period: '19 – 25 oct', sales: 13942.50, fee: 3521.90, net: 10420.60, status: 'Programado', invoice: null, paymentDate: '04 nov' }
  ], assignments: []
};

@Injectable({ providedIn: 'root' })
export class DataStore {
  private readonly key = 'mandadito-angular-v2';
  readonly state = signal<AppState>(this.restore());
  readonly orders = computed(() => this.state().orders);
  readonly branches = computed(() => this.state().branches);
  readonly couriers = computed(() => this.state().couriers);
  readonly merchants = computed(() => this.state().merchants);
  readonly tickets = computed(() => this.state().tickets);
  readonly payouts = computed(() => this.state().payouts);
  readonly products = computed(() => this.state().products);
  readonly clock = signal(Date.now());

  constructor() {
    window.setInterval(() => this.clock.set(Date.now()), 1000);
    window.setInterval(() => this.autoAssign(), 15000);
    this.autoAssign();
  }

  private restore(): AppState {
    try {
      const saved = JSON.parse(localStorage.getItem(this.key) || 'null');
      if (saved?.version === 1 && Array.isArray(saved.state?.orders)) return saved.state as AppState;
    } catch { /* Use the demo seed when browser storage is unavailable. */ }
    return structuredClone(initial);
  }

  update(mutator: (draft: AppState) => void): void {
    this.state.update(current => {
      const next = structuredClone(current);
      mutator(next);
      try { localStorage.setItem(this.key, JSON.stringify({ version: 1, state: next })); } catch { /* Demo remains usable without storage. */ }
      return next;
    });
  }

  setPanel(panel: AppState['activePanel']): void { this.update(s => { s.activePanel = panel; }); }
  changeOrder(id: string, patch: Partial<Order>): void { this.update(s => { const o = s.orders.find(x => x.id === id); if (o) Object.assign(o, patch); }); }
  addOrder(): string {
    const id = String(Math.max(...this.orders().map(o => Number(o.id)), 4824) + 1);
    this.update(s => { s.orders.unshift({ id, customer: 'Luciana Zevallos', status: 'new', items: [{ name: 'Combo Chicharrón Clásico', quantity: 1, price: 28.50 }], total: 28.50, payment: 'Yape', courier: 'Por asignar', note: 'Enviar servilletas adicionales.', createdAt: Date.now(), deadlineAt: Date.now() + 4 * 60000, deliveryStage: 'to-store' }); });
    this.autoAssign();
    return id;
  }
  autoAssign(): number {
    const pending = this.orders().filter(o => o.courier === 'Por asignar' && !['delivered', 'rejected'].includes(o.status));
    const online = this.couriers().filter(c => c.status === 'active' && c.online && c.city === 'Trujillo');
    if (!pending.length || !online.length) return 0;
    this.update(s => {
      const loads = new Map(online.map(c => [c.id, s.orders.filter(o => o.courier === this.shortName(c.name) && !['delivered', 'rejected'].includes(o.status)).length]));
      for (const order of s.orders.filter(o => o.courier === 'Por asignar' && !['delivered', 'rejected'].includes(o.status))) {
        const courier = [...online].sort((a, b) => (loads.get(a.id) || 0) - (loads.get(b.id) || 0))[0];
        order.courier = this.shortName(courier.name);
        loads.set(courier.id, (loads.get(courier.id) || 0) + 1);
        s.assignments.unshift({ order: order.id, courier: order.courier, at: Date.now() });
      }
      s.assignments = s.assignments.slice(0, 15);
    });
    return pending.length;
  }
  private shortName(name: string): string { const p = name.split(' '); return `${p[0]} ${p.at(-1)?.[0]}.`; }
  money(value: number): string { return 'S/ ' + value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
}
