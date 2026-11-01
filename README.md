# Mandadito — paneles de operación

Prototipo en Angular 22 con componentes independientes para recepción, negocio y administración. La interfaz se adapta a escritorio, tableta y teléfono.

## Ejecutar

```bash
npm ci
npm start
```

`npm run build` genera la versión estática en `dist/`. `npm test -- --watch=false` ejecuta las pruebas del exportador.

## Estructura

- `src/app/reception.*`: pedidos y disponibilidad del local.
- `src/app/business.*`: métricas, sucursales, carta, liquidaciones y ajustes del negocio.
- `src/app/admin.*`: resumen, aprobaciones, soporte, finanzas y equipo.
- `src/app/data.store.ts`: datos de ejemplo, señales de Angular y persistencia local.
- `src/app/excel.ts`: creación de un archivo XLSX de preparación de pagos.
- `src/styles.css`: diseño adaptable y estilos compartidos.

Los datos se guardan en `localStorage` del navegador. La asignación de repartidores, la emisión de facturas y el registro de pagos son simulaciones. El Excel de preparación no afirma cumplir con una plantilla oficial de Telecrédito BCP; hay que validar el formato bancario antes de usarlo. Para uso real faltan API, base de datos, autenticación, permisos del servidor, facturación electrónica e integración bancaria.
