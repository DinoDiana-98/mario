import { Component, inject } from '@angular/core';
import { DataStore, AppState } from './data.store';
import { ReceptionComponent } from './reception';
import { BusinessComponent } from './business';
import { AdminComponent } from './admin';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReceptionComponent, BusinessComponent, AdminComponent],
  template: `
    <div class="app-shell">
      <div class="workspace-bar" aria-label="Cambiar vista del prototipo">
        <span class="workspace-label">MANDADITO <span class="workspace-demo">Prototipo</span></span>
        <nav class="workspace-tabs" aria-label="Paneles">
          <button type="button" [class.active]="store.state().activePanel === 'reception'" [attr.aria-current]="store.state().activePanel === 'reception' ? 'page' : null" (click)="switchTo('reception')">Recepción</button>
          <button type="button" [class.active]="store.state().activePanel === 'business'" [attr.aria-current]="store.state().activePanel === 'business' ? 'page' : null" (click)="switchTo('business')">Negocio</button>
          <button type="button" [class.active]="store.state().activePanel === 'admin'" [attr.aria-current]="store.state().activePanel === 'admin' ? 'page' : null" (click)="switchTo('admin')">Administración</button>
        </nav>
      </div>
      @switch (store.state().activePanel) {
        @case ('reception') { <app-reception /> }
        @case ('business') { <app-business /> }
        @case ('admin') { <app-admin /> }
      }
    </div>
  `
})
export class App {
  readonly store = inject(DataStore);
  switchTo(panel: AppState['activePanel']): void { this.store.setPanel(panel); window.scrollTo({ top: 0, behavior: 'instant' }); }
}
