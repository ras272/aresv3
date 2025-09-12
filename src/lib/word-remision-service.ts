import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
} from "docx";
import { Remision } from "@/types";

export class WordRemisionService {
  static async generarRemisionWord(remision: Remision): Promise<Blob> {
    // Formatear la fecha en español
    const fechaFormateada = this.formatearFecha(remision.fecha);

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
              size: 28,
              bold: true,
            },
            paragraph: {
              spacing: {
                after: 240, // 12pt after
              },
              alignment: AlignmentType.CENTER,
            },
          },
          {
            id: "empresa",
            name: "Empresa",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: "Calibri",
              size: 24,
              bold: true,
            },
            paragraph: {
              spacing: {
                after: 120,
              },
              alignment: AlignmentType.CENTER,
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
            // Header con logo real de ARES
            new Paragraph({
              children: [
                new ImageRun({
                  data: await this.cargarLogoAres(),
                  transformation: {
                    width: 120,
                    height: 60,
                  },
                  type: "png",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 180 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "ARES PARAGUAY",
                  font: "Calibri",
                  size: 24,
                  bold: true,
                  color: "2B5797", // Azul corporativo
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),

            // Título principal
            new Paragraph({
              children: [
                new TextRun({
                  text: "REMISIÓN DIGITAL",
                  font: "Calibri",
                  size: 32,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
            }),

            // Información básica de la remisión
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Número de Remisión:",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: remision.numeroRemision }),
                          ],
                        }),
                      ],
                      width: { size: 70, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Fecha:", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: fechaFormateada })],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Tipo de Remisión:",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: remision.tipoRemision }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                ...(remision.numeroFactura
                  ? [
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Número de Factura:",
                                    bold: true,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({ text: remision.numeroFactura }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ]
                  : []),
              ],
            }),

            // Espacio
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 240 },
            }),

            // Información del cliente
            new Paragraph({
              children: [
                new TextRun({
                  text: "INFORMACIÓN DEL CLIENTE",
                  font: "Calibri",
                  size: 24,
                  bold: true,
                }),
              ],
              spacing: { after: 120 },
            }),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Cliente:", bold: true }),
                          ],
                        }),
                      ],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: remision.cliente })],
                        }),
                      ],
                      width: { size: 70, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Dirección de Entrega:",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: remision.direccionEntrega }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),

                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Técnico Responsable:",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: remision.tecnicoResponsable }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Espacio
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 240 },
            }),

            // Productos
            new Paragraph({
              children: [
                new TextRun({
                  text: "PRODUCTOS ENTREGADOS",
                  font: "Calibri",
                  size: 24,
                  bold: true,
                }),
              ],
              spacing: { after: 120 },
            }),

            // Tabla de productos
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
              rows: [
                // Header
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Cant.", bold: true }),
                          ],
                        }),
                      ],
                      width: { size: 8, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Producto", bold: true }),
                          ],
                        }),
                      ],
                      width: { size: 32, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Marca/Modelo", bold: true }),
                          ],
                        }),
                      ],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Número de Serie",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Observaciones", bold: true }),
                          ],
                        }),
                      ],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                // Productos
                ...remision.productos.map(
                  (producto) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: producto.cantidadSolicitada.toString(),
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: producto.nombre }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: `${producto.marca} ${producto.modelo}`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: producto.numeroSerie || "-",
                                  font: "Consolas", // Fuente monospace para números de serie
                                  size: 20,
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: producto.observaciones || "-",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    })
                ),
              ],
            }),

            // Observaciones generales
            ...(remision.descripcionGeneral
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: "" })],
                    spacing: { after: 240 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "OBSERVACIONES GENERALES",
                        font: "Calibri",
                        size: 24,
                        bold: true,
                      }),
                    ],
                    spacing: { after: 120 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: remision.descripcionGeneral,
                        font: "Calibri",
                        size: 22,
                      }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 480 },
                  }),
                ]
              : []),

            // Espacio para firmas
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 960 },
            }),

            // Firmas
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "________________________" }),
                          ],
                          alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Firma del Técnico",
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({ text: remision.tecnicoResponsable }),
                          ],
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "________________________" }),
                          ],
                          alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Firma del Cliente",
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: remision.cliente })],
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
              ],
            }),

            // Footer simple
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 240 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Estado: ${
                    remision.estado
                  } | Generado el ${new Date().toLocaleDateString("es-PY")}`,
                  font: "Calibri",
                  size: 18,
                  italics: true,
                  color: "666666",
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    });

    // Generar el blob del documento Word
    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  }

  private static formatearFecha(fechaISO: string): string {
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const fecha = new Date(fechaISO);
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    return `Asunción, ${dia.toString().padStart(2, "0")} de ${mes} del ${año}`;
  }

  private static async cargarLogoAres(): Promise<Uint8Array> {
    try {
      // Usar fetch para cargar la imagen desde la carpeta public
      const response = await fetch('/isologo-ares.png');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.warn('No se pudo cargar el logo de ARES:', error);
      // Si falla, crear un pixel transparente como fallback
      // Esto evita que el documento falle completamente
      const fallbackImage = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // RGBA, no compression
        0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, // transparent pixel data
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // end
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND
        0x42, 0x60, 0x82
      ]);
      return fallbackImage;
    }
  }
}
