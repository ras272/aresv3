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
            // Header con logo de ARES (placeholder por ahora)
            new Paragraph({
              children: [
                new TextRun({
                  text: "🏥 ARES PARAGUAY",
                  font: "Calibri",
                  size: 28,
                  bold: true,
                  color: "2B5797", // Azul corporativo
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Sistema de Trazabilidad para Entregas Médicas",
                  font: "Calibri",
                  size: 18,
                  italics: true,
                  color: "666666",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 360 },
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
                ...(remision.contacto
                  ? [
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Contacto:",
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
                                  new TextRun({ text: remision.contacto }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ]
                  : []),
                ...(remision.telefono
                  ? [
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Teléfono:",
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
                                  new TextRun({ text: remision.telefono }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ]
                  : []),
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
}
