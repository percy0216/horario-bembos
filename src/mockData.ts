// src/mockData.ts
import type { Employee, ShiftSlot } from './types/index';

//const ALL_DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export const MOCK_EMPLOYEES: Employee[] = [];

export const SHIFT_SLOTS: ShiftSlot[] = [
  // ----------------------------------------------------
  // Apertura: 1 persona por punto de venta (Req. 6)
  // Los horarios de apertura varían por rol (Req. 5)
  // ----------------------------------------------------
  { 
    id: 's1-prod', name: 'Apertura Prod', startTime: '09:30', endTime: '12:00', isHighTraffic: false, 
    requiredStaffByRole: { 'produccion': 1 }
  },
  { 
    id: 's1-serv', name: 'Apertura Serv', startTime: '09:00', endTime: '12:00', isHighTraffic: false, 
    requiredStaffByRole: { 'servicio-tienda': 1, 'servicio-modulo-tienda': 1, 'servicio-modulo-open': 1 }
  },
  
  // ----------------------------------------------------
  // Almuerzo/Punta: 2 a 3 trabajadores por punto (Req. 7)
  // ----------------------------------------------------
  { 
    id: 's2-punta', name: 'Almuerzo (PUNTA)', startTime: '12:00', endTime: '15:30', isHighTraffic: true, 
    requiredStaffByRole: { 
        'produccion': 3, 
        'servicio-tienda': 3, 
        'servicio-modulo-tienda': 2, 
        'servicio-modulo-open': 2 
    } 
  },
  
  // ----------------------------------------------------
  // Tarde: 1 a 2 trabajadores (Req. 8)
  // ----------------------------------------------------
  { 
    id: 's3-tarde', name: 'Tarde', startTime: '15:30', endTime: '19:00', isHighTraffic: false, 
    requiredStaffByRole: { 
        'produccion': 2, 
        'servicio-tienda': 2, 
        'servicio-modulo-tienda': 1, 
        'servicio-modulo-open': 1
    } 
  },
  
  // ----------------------------------------------------
  // Cierre: Requerimientos complejos por día y rol (Req. 9)
  // Nota: Estos turnos deberán ser ajustados por día en la lógica (ej. producción de 3 a 2)
  // ----------------------------------------------------
  { 
    id: 's4-cierre', name: 'Cierre', startTime: '19:00', endTime: '23:30', isHighTraffic: false, 
    requiredStaffByRole: { 
        'produccion': 3, // Base: Se reduce a 2 Lunes-Miercoles en la lógica
        'servicio-tienda': 2,
        'servicio-modulo-tienda': 2, // Base: Se reduce a 1 Lunes-Viernes en la lógica
        'servicio-modulo-open': 3 
    } 
  },
];