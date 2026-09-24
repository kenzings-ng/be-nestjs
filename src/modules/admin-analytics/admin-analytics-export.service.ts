import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { DashboardOverview } from './admin-analytics.mapper';

@Injectable()
export class AdminAnalyticsExportService {
  async exportDashboardExcel(stats: DashboardOverview): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.columns = [
      { header: 'Metric', key: 'label', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Format', key: 'format', width: 15 },
    ];
    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    
    for (const kpi of stats.kpis) {
      overviewSheet.addRow({ label: kpi.label, value: kpi.value, format: kpi.format });
    }

    const ordersSheet = workbook.addWorksheet('Recent Orders');
    ordersSheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Date', key: 'date', width: 25 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    ordersSheet.getRow(1).font = { bold: true };
    ordersSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    for (const order of stats.recentOrders) {
      ordersSheet.addRow({
        id: order.id,
        customer: order.customer,
        date: new Date(order.date).toLocaleString(),
        total: order.total,
        status: order.status,
      });
    }

    const productsSheet = workbook.addWorksheet('Top Products');
    productsSheet.columns = [
      { header: 'Product Name', key: 'name', width: 40 },
      { header: 'Sold', key: 'sold', width: 15 },
      { header: 'Revenue', key: 'revenue', width: 15 },
    ];
    productsSheet.getRow(1).font = { bold: true };
    productsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    for (const product of stats.topProducts) {
      productsSheet.addRow(product);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async exportDashboardPdf(stats: DashboardOverview): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new (PDFDocument as any)();
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      doc.fontSize(20).text('Admin Dashboard Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated Date: ${new Date().toLocaleString()}`);
      doc.moveDown();

      doc.fontSize(16).text('Summary Statistics');
      doc.moveDown(0.5);
      for (const kpi of stats.kpis) {
        doc.fontSize(12).text(`${kpi.label}: ${kpi.value} (${kpi.format})`);
      }
      doc.moveDown();

      doc.fontSize(16).text('Recent Orders');
      doc.moveDown(0.5);
      for (const order of stats.recentOrders) {
        doc.fontSize(12).text(`Order ${order.id} - ${order.customer} - ${order.total} - ${order.status}`);
      }

      doc.end();
    });
  }
}
