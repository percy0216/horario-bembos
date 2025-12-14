// src/types/index.ts

export type Role = 'produccion' | 'servicio-tienda' | 'servicio-modulo-tienda' | 'servicio-modulo-open';

export type ContractType = 'full-time' | 'part-time';

// ESTA ERA LA INTERFAZ QUE FALTABA EXPORTAR
export interface TimeRange {
  start: string; // Ej: "08:00"
  end: string;   // Ej: "23:59"
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  contractType: ContractType;
  
  // Actualizado: Ahora usamos un mapa de días con rangos de hora
  // Si un día no está en este objeto, significa que es DESCANSO FIJO
  availability: { [day: string]: TimeRange }; 
}

export interface ShiftSlot {
  id: string;
  name: string; 
  startTime: string;   
  endTime: string;     
  isHighTraffic: boolean; 
  requiredStaffByRole: {
    [key in Role]?: number; 
  }
}

export interface DailySchedule {
  day: string; 
  assignments: {
    slotId: string;
    employeeIds: string[]; 
  }[];
}