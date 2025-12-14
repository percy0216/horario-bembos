export type Role = 'produccion' | 'servicio-tienda' | 'servicio-modulo-tienda' | 'servicio-modulo-open';

export type ContractType = 'full-time' | 'part-time'; // Añadimos esto para gestionar las horas

export interface Employee {
  id: string;
  name: string;
  role: Role;
  contractType: ContractType; // Nuevo: Para diferenciar las horas
  // Horas que el empleado puede trabajar CADA DÍA (ej: 9:00 - 17:45)
  // Lo manejaremos dentro del algoritmo usando el ContractType.
  availableDays: string[]; 
  // Las horas máximas semanales serán calculadas automáticamente.
}

// Un "Slot" es un bloque de horario, ej: "Turno Mañana" o "Hora Punta"
export interface ShiftSlot {
  id: string;
  name: string; 
  startTime: string;   // Ej: "09:00"
  endTime: string;     // Ej: "12:00"
  isHighTraffic: boolean; 
  // NUEVO: Requerimientos por rol para este slot (ej: 1 Cajero, 2 Cocineros)
  requiredStaffByRole: {
    [key in Role]?: number; // Usamos la interfaz Role aquí
  }
}

// Así se verá el horario final generado
export interface DailySchedule {
  day: string; // "Lunes"
  assignments: {
    slotId: string;
    employeeIds: string[]; // IDs de los empleados asignados aquí
  }[];
}