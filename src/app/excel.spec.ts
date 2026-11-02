import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildWorkbook } from './excel';

describe('Exportación de pagos', () => {
  it('genera un XLSX con datos bancarios como texto e importes numéricos', () => {
    const archive = unzipSync(buildWorkbook([
      ['RUC', 'Beneficiario', 'CCI', 'Monto'],
      ['20607845123', 'El Chinito & Cía', '00219100123456789012', 23154.98]
    ]));
    const sheet = strFromU8(archive['xl/worksheets/sheet1.xml']);
    expect(sheet).toContain('00219100123456789012');
    expect(sheet).toContain('El Chinito &amp; Cía');
    expect(sheet).toContain('<v>23154.98</v>');
    expect(archive['xl/workbook.xml']).toBeDefined();
  });
});
