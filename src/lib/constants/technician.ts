// 🔧 Constantes del técnico principal
export const TECNICO_PRINCIPAL = {
  nombre: "Javier Lopez",
  titulo: "Ingeniero Principal",
  email: "javier.lopez@ares.com.py",
  telefono: "+595 21 123-4567",
  especialidades: [
    "Equipos Médicos",
    "Ultrasonido Estético",
    "Mantenimiento Preventivo",
    "Reparaciones Correctivas",
    "Instalaciones",
  ],
  disponibilidad: {
    lunes: { inicio: "08:00", fin: "17:00", disponible: true },
    martes: { inicio: "08:00", fin: "17:00", disponible: true },
    miercoles: { inicio: "08:00", fin: "17:00", disponible: true },
    jueves: { inicio: "08:00", fin: "17:00", disponible: true },
    viernes: { inicio: "08:00", fin: "17:00", disponible: true },
    sabado: { inicio: "08:00", fin: "12:00", disponible: false },
    domingo: { inicio: "08:00", fin: "12:00", disponible: false },
  },
} as const;

// Función helper para verificar si está disponible
export function esTecnicoDisponible(fecha: Date = new Date()): boolean {
  const dia = fecha.toLocaleDateString("es", { weekday: "long" }).toLowerCase();
  const hora = fecha.getHours();

  const disponibilidadDia =
    TECNICO_PRINCIPAL.disponibilidad[
      dia as keyof typeof TECNICO_PRINCIPAL.disponibilidad
    ];

  if (!disponibilidadDia?.disponible) return false;

  const horaInicio = parseInt(disponibilidadDia.inicio.split(":")[0]);
  const horaFin = parseInt(disponibilidadDia.fin.split(":")[0]);

  return hora >= horaInicio && hora < horaFin;
}

// Función para obtener próximo horario disponible
export function proximoHorarioDisponible(): Date {
  const ahora = new Date();
  let fecha = new Date(ahora);

  // Buscar el próximo día hábil
  while (!esTecnicoDisponible(fecha)) {
    fecha.setDate(fecha.getDate() + 1);
    fecha.setHours(8, 0, 0, 0); // Empezar a las 8 AM
  }

  return fecha;
}
