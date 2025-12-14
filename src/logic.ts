// src/logic.ts
import type { Employee, ShiftSlot, DailySchedule, Role } from './types';

// Días permitidos para descansar (Lunes a Viernes)
const REST_CANDIDATES = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

// Prioridad: Domingo primero
const PRIORITY_DAYS = ['domingo', 'sabado', 'viernes', 'lunes', 'martes', 'miercoles', 'jueves'];

// Duraciones
const PT_DURATION_MS = (3 * 60 + 50) * 60 * 1000; 
const FT_DURATION_MS = (8 * 60 + 45) * 60 * 1000; 
// Márgenes amplios para permitir 6 días de trabajo
const FULL_TIME_MAX_WEEK_MS = 54 * 60 * 60 * 1000; 
const PART_TIME_MAX_WEEK_MS = 25 * 60 * 60 * 1000; 

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const generateSchedule = (
  daysOfWeek: string[], 
  slots: ShiftSlot[],
  employees: Employee[]
): DailySchedule[] => {
  
  const schedule: DailySchedule[] = daysOfWeek.map(day => ({
    day: day,
    assignments: [] 
  }));

  const timeWorkedMs: { [employeeId: string]: number } = {};
  const closingShiftsCount: { [employeeId: string]: number } = {}; 
  const forcedRestDays: { [employeeId: string]: string[] } = {};
  const daysAssignedCount: { [employeeId: string]: number } = {};

  employees.forEach(emp => {
    timeWorkedMs[emp.id] = 0;
    closingShiftsCount[emp.id] = 0;
    daysAssignedCount[emp.id] = 0;
    forcedRestDays[emp.id] = [];
  });

  // ---------------------------------------------------------
  // 0. PRE-ASIGNACIÓN DE 1 DÍA DE DESCANSO (Aleatorio)
  // ---------------------------------------------------------
  const employeesByRole: { [key in Role]?: Employee[] } = {};
  employees.forEach(emp => {
    if (!employeesByRole[emp.role]) employeesByRole[emp.role] = [];
    employeesByRole[emp.role]!.push(emp);
  });

  Object.keys(employeesByRole).forEach((roleKey) => {
    // Mezclamos para que los días de descanso cambien en cada click
    const group = shuffleArray([...employeesByRole[roleKey as Role]!]);
    const restCounts: { [day: string]: number } = {};
    REST_CANDIDATES.forEach(d => restCounts[d] = 0);

    group.forEach(emp => {
        // Solo 1 día de descanso forzado
        const daysNeeded = 1; 

        for (let i = 0; i < daysNeeded; i++) {
            const availableDays = REST_CANDIDATES
                .filter(d => !forcedRestDays[emp.id].includes(d))
                .filter(d => restCounts[d] < 2); // Máximo 2 descansando el mismo día

            if (availableDays.length > 0) {
                availableDays.sort((a, b) => restCounts[a] - restCounts[b]);
                const bestDay = availableDays[0]; 
                forcedRestDays[emp.id].push(bestDay);
                restCounts[bestDay]++;
            } else {
                // Fallback si todo está lleno
                const fallbackDay = REST_CANDIDATES.sort((a, b) => restCounts[a] - restCounts[b])[0];
                forcedRestDays[emp.id].push(fallbackDay);
                restCounts[fallbackDay]++;
            }
        }
    });
  });

  // ---------------------------------------------------------
  // 1. ORDENAMIENTO DE SLOTS
  // ---------------------------------------------------------
  const orderedSlots = [...slots].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    const isAperturaA = nameA.includes('apertura');
    const isAperturaB = nameB.includes('apertura');
    const isCierreA = nameA.includes('cierre');
    const isCierreB = nameB.includes('cierre');

    if (isAperturaA && !isAperturaB) return -1;
    if (!isAperturaA && isAperturaB) return 1;
    if (isCierreA && !isCierreB) return -1;
    if (!isCierreA && isCierreB) return 1;
    
    return (b.isHighTraffic ? 1 : 0) - (a.isHighTraffic ? 1 : 0);
  });
  
  // ---------------------------------------------------------
  // 2. BUCLE PRINCIPAL
  // ---------------------------------------------------------
  PRIORITY_DAYS.forEach(day => {
    const dailySchedule = schedule.find(s => s.day === day)!;
    const assignedToday = new Set<string>();

    orderedSlots.forEach(slot => {
      const isClosingShift = slot.name.toLowerCase().includes('cierre');
      
      // CORRECCIÓN DEL ERROR DE TYPESCRIPT: Usar Partial
      const currentRequiredStaff: Partial<{ [key in Role]: number }> = {};
      
      for (const role in slot.requiredStaffByRole) {
        const roleKey = role as Role; 
        let required = slot.requiredStaffByRole[roleKey] || 0;

        if (slot.name.includes('Cierre') && roleKey === 'produccion' && ['lunes', 'martes', 'miercoles'].includes(day)) {
            required = 2;
        }
        if (slot.name.includes('Cierre') && roleKey === 'servicio-modulo-tienda') {
            required = ['sabado', 'domingo'].includes(day) ? 2 : 1;
        }
        currentRequiredStaff[roleKey] = required;
      }

      const assignedEmployeeIds: string[] = [];

      for (const role of Object.keys(currentRequiredStaff) as Role[]) {
        const required = currentRequiredStaff[role];
        if (!required || required === 0) continue;

        let eligibleCandidates = employees
          .filter(emp => emp.role === role) 
          .filter(emp => emp.availableDays.includes(day)) 
          .filter(emp => !forcedRestDays[emp.id].includes(day))
          .filter(emp => !assignedToday.has(emp.id)) 
          .filter(emp => !assignedEmployeeIds.includes(emp.id))
          .filter(emp => {
             if (isClosingShift) return closingShiftsCount[emp.id] < 3;
             return true; 
          })
          .filter(emp => {
             const maxMs = emp.contractType === 'full-time' ? FULL_TIME_MAX_WEEK_MS : PART_TIME_MAX_WEEK_MS;
             const shiftDuration = emp.contractType === 'full-time' ? FT_DURATION_MS : PT_DURATION_MS;
             return timeWorkedMs[emp.id] + shiftDuration <= maxMs; 
          });

        // -----------------------------------------------------------------------
        // PRIORIDAD: HAMBRIENTOS PRIMERO
        // -----------------------------------------------------------------------
        
        // 1. Mezclamos primero (Aleatoriedad)
        eligibleCandidates = shuffleArray(eligibleCandidates);

        // 2. Ordenamos por necesidad (Justicia para llegar a 6 días)
        eligibleCandidates.sort((a, b) => {
            // Prioridad absoluta: Quien tenga MENOS días trabajados va primero
            const diffDays = daysAssignedCount[a.id] - daysAssignedCount[b.id];
            if (diffDays !== 0) return diffDays; // Ascendente

            // Si tienen los mismos días, y es cierre, el que tenga menos cierres
            if (isClosingShift) {
                return closingShiftsCount[a.id] - closingShiftsCount[b.id];
            }
            return 0;
        });
          
        for (let i = 0; i < required; i++) {
          const candidate = eligibleCandidates.shift();
          
          if (candidate) {
            assignedEmployeeIds.push(candidate.id);
            assignedToday.add(candidate.id);
            daysAssignedCount[candidate.id]++; 

            const durationToAdd = candidate.contractType === 'full-time' ? FT_DURATION_MS : PT_DURATION_MS;
            timeWorkedMs[candidate.id] += durationToAdd;
            
            if (isClosingShift) {
                closingShiftsCount[candidate.id] += 1;
            }
          } 
        }
      }

      dailySchedule.assignments.push({
        slotId: slot.id,
        employeeIds: assignedEmployeeIds
      });
    });
  });

  return schedule;
};