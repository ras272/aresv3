import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, TabStopType, TabStopPosition } from 'docx';

interface ReporteData {
  fecha: string;
  cliente: string;
  numeroReporte: string;
  descripcionProblema: string;
  formularioAsistencia: string;
  trabajoRealizado: string;
  costo: string;
  ingeniero: string;
}

export class WordReporteService {
  static async generarDocumentoWord(data: ReporteData): Promise<Blob> {
    // Formatear la fecha en español
    const fechaFormateada = this.formatearFecha(data.fecha);
    
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "normal",
            name: "Normal",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: "Calibri",
              size: 22, // 11pt
            },
            paragraph: {
              spacing: {
                after: 120, // 6pt after
              },
            },
          },
          {
            id: "titulo",
            name: "Titulo",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: "Calibri",
              size: 22,
              bold: true,
            },
            paragraph: {
              spacing: {
                after: 240, // 12pt after
              },
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: [
            // Lugar y Fecha
            new Paragraph({
              children: [
                new TextRun({
                  text: `Lugar y Fecha : ${fechaFormateada}`,
                  font: "Calibri",
                  size: 22,
                }),
              ],
              spacing: { after: 120 },
            }),

            // Cliente
            new Paragraph({
              children: [
                new TextRun({
                  text: `Cliente`,
                  font: "Calibri",
                  size: 22,
                }),
                new TextRun({
                  text: `\t\t: ${data.cliente}`,
                  font: "Calibri",
                  size: 22,
                }),
              ],
              spacing: { after: 120 },
              tabStops: [
                {
                  type: TabStopType.LEFT,
                  position: 1440, // 1 inch
                },
              ],
            }),

            // Nro. Rep.
            new Paragraph({
              children: [
                new TextRun({
                  text: `Nro. Rep.`,
                  font: "Calibri",
                  size: 22,
                }),
                new TextRun({
                  text: `\t\t: ${data.numeroReporte}`,
                  font: "Calibri",
                  size: 22,
                }),
              ],
              spacing: { after: 120 },
              tabStops: [
                {
                  type: TabStopType.LEFT,
                  position: 1440,
                },
              ],
            }),

            // Reporte
            new Paragraph({
              children: [
                new TextRun({
                  text: `Reporte`,
                  font: "Calibri",
                  size: 22,
                }),
                new TextRun({
                  text: `\t\t: ${data.descripcionProblema}`,
                  font: "Calibri",
                  size: 22,
                }),
              ],
              spacing: { after: 240 },
              tabStops: [
                {
                  type: TabStopType.LEFT,
                  position: 1440,
                },
              ],
            }),

            // Formulario de Asistencia
            new Paragraph({
              children: [
                new TextRun({
                  text: `Formulario de Asistencia Nº : ${data.formularioAsistencia}`,
                  font: "Calibri",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { after: 240 },
            }),

            // Trabajo Realizado
            new Paragraph({
              children: [
                new TextRun({
                  text: "Trabajo Realizado:",
                  font: "Calibri",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { after: 240 },
            }),

            // Descripción del trabajo (párrafo justificado)
            new Paragraph({
              children: [
                new TextRun({
                  text: data.trabajoRealizado,
                  font: "Calibri",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { 
                after: 480, // Más espacio después del párrafo
                line: 276, // Interlineado 1.15
              },
            }),

            // Costo del Servicio
            new Paragraph({
              children: [
                new TextRun({
                  text: `COSTO DEL SERVICIO: ${data.costo} – IVA INCLUIDO`,
                  font: "Calibri",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { after: 120 },
            }),

            // Costo Total
            new Paragraph({
              children: [
                new TextRun({
                  text: `COSTO TOTAL: ${data.costo} – IVA INCLUIDO`,
                  font: "Calibri",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { after: 960 }, // Mucho espacio antes de la firma
            }),

            // Línea para la firma
            new Paragraph({
              children: [
                new TextRun({
                  text: "________________",
                  font: "Calibri",
                  size: 22,
                }),
              ],
              spacing: { after: 120 },
            }),

            // Firma del ingeniero
            new Paragraph({
              children: [
                new TextRun({
                  text: data.ingeniero,
                  font: "Calibri",
                  size: 22,
                }),
              ],
            }),
          ],
        },
      ],
    });

    // Generar el blob del documento Word
    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  }

  private static formatearFecha(fechaISO: string): string {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const fecha = new Date(fechaISO);
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    return `Asunción, ${dia.toString().padStart(2, '0')} de ${mes} del ${año}`;
  }

  static generarNumeroReporte(equipoNombre: string, fecha: string): string {
    const fechaObj = new Date(fecha);
    const año = fechaObj.getFullYear();
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    
    // Generar número secuencial basado en la fecha
    const secuencial = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos
    
    // Usar el nombre real del equipo
    return `${secuencial} ${equipoNombre}`;
  }

  static generarNumeroFormulario(): string {
    // Generar número de formulario aleatorio de 3 dígitos
    return Math.floor(Math.random() * 900 + 100).toString();
  }
} 