// src/logic.ts
import type { Employee, ShiftSlot, DailySchedule, Role } from './types';

const REST_CANDIDATES = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const PRIORITY_DAYS = ['domingo', 'sabado', 'viernes', 'lunes', 'martes', 'miercoles', 'jueves'];

const WEEKLY_TARGET_FT = 52.5 * 60 * 60 * 1000; 
const WEEKLY_TARGET_PT = 23 * 60 * 60 * 1000; 

const timeToMins = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

export function getEmployeeDailyDuration(emp: Employee): number {
    const availableCount = Object.keys(emp.availability).length;
    const workingDays = availableCount >= 7 ? 6 : availableCount;
    if (workingDays === 0) return 0;
    const weeklyTarget = emp.contractType === 'full-time' ? WEEKLY_TARGET_FT : WEEKLY_TARGET_PT;
    return weeklyTarget / workingDays;
}

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
  
  const schedule: DailySchedule[] = daysOfWeek.map(day => ({ day, assignments: [] }));

  const timeWorkedMs: { [id: string]: number } = {};
  const closingShiftsCount: { [id: string]: number } = {}; 
  const forcedRestDays: { [id: string]: string[] } = {};
  const daysAssignedCount: { [id: string]: number } = {};

  employees.forEach(emp => {
    timeWorkedMs[emp.id] = 0;
    closingShiftsCount[emp.id] = 0;
    daysAssignedCount[emp.id] = 0;
    forcedRestDays[emp.id] = [];
  });

  // ---------------------------------------------------------
  // 0. PRE-ASIGNACIÓN DE DESCANSOS (¡Ahora con más aleatoriedad!)
  // ---------------------------------------------------------
  const employeesByRole: { [key in Role]?: Employee[] } = {};
  employees.forEach(emp => {
    if (!employeesByRole[emp.role]) employeesByRole[emp.role] = [];
    employeesByRole[emp.role]!.push(emp);
  });

  Object.keys(employeesByRole).forEach((roleKey) => {
    const group = shuffleArray([...employeesByRole[roleKey as Role]!]);
    const restCounts: { [day: string]: number } = {};
    REST_CANDIDATES.forEach(d => restCounts[d] = 0);

    group.forEach(emp => {
        if (Object.keys(emp.availability).length === 7) {
            const daysNeeded = 1; 
            for (let i = 0; i < daysNeeded; i++) {
                // Buscamos días posibles
                let availableDays = REST_CANDIDATES
                    .filter(d => !forcedRestDays[emp.id].includes(d))
                    .filter(d => restCounts[d] < 2); 

                if (availableDays.length > 0) {
                    // CAMBIO CLAVE: Barajamos los días disponibles antes de ordenar por ocupación.
                    // Esto rompe el empate: si Lunes y Martes están vacíos, elige uno al azar.
                    availableDays = shuffleArray(availableDays);
                    
                    availableDays.sort((a, b) => restCounts[a] - restCounts[b]);
                    
                    const bestDay = availableDays[0]; 
                    forcedRestDays[emp.id].push(bestDay);
                    restCounts[bestDay]++;
                } else {
                    // Fallback con aleatoriedad también
                    let fallbackDays = REST_CANDIDATES.filter(d => !forcedRestDays[emp.id].includes(d));
                    fallbackDays = shuffleArray(fallbackDays);
                    fallbackDays.sort((a, b) => restCounts[a] - restCounts[b]);
                    
                    const fallback = fallbackDays[0];
                    forcedRestDays[emp.id].push(fallback);
                    restCounts[fallback]++;
                }
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
      const currentRequiredStaff: Partial<{ [key in Role]: number }> = {};
      
      for (const role in slot.requiredStaffByRole) {
        const roleKey = role as Role; 
        let required = slot.requiredStaffByRole[roleKey] || 0;

        // --- CORRECCIÓN DE REGLAS DE CIERRE ---
        // Producción: Lunes a Viernes son 2.
        if (slot.name.includes('Cierre') && roleKey === 'produccion') {
            if (['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].includes(day)) {
                required = 2;
            }
        }
        
        // Modulo Tienda: Sabado y Domingo son 2, el resto 1.
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
          .filter(emp => !!emp.availability[day]) 
          .filter(emp => {
             const empRange = emp.availability[day];
             if (!empRange) return false;
             return timeToMins(slot.startTime) >= timeToMins(empRange.start);
          })
          .filter(emp => !forcedRestDays[emp.id].includes(day))
          .filter(emp => !assignedToday.has(emp.id)) 
          .filter(emp => !assignedEmployeeIds.includes(emp.id))
          .filter(emp => {
             if (isClosingShift) return closingShiftsCount[emp.id] < 3;
             return true; 
          })
          .filter(emp => {
             const shiftDuration = getEmployeeDailyDuration(emp);
             const maxMs = (emp.contractType === 'full-time' ? WEEKLY_TARGET_FT : WEEKLY_TARGET_PT) + (60*60*1000); 
             return timeWorkedMs[emp.id] + shiftDuration <= maxMs; 
          });

        eligibleCandidates = shuffleArray(eligibleCandidates);
        
        eligibleCandidates.sort((a, b) => {
            const diffDays = daysAssignedCount[a.id] - daysAssignedCount[b.id];
            if (diffDays !== 0) return diffDays; 
            if (isClosingShift) return closingShiftsCount[a.id] - closingShiftsCount[b.id];
            return 0;
        });
          
        for (let i = 0; i < required; i++) {
          const candidate = eligibleCandidates.shift();
          if (candidate) {
            assignedEmployeeIds.push(candidate.id);
            assignedToday.add(candidate.id);
            daysAssignedCount[candidate.id]++; 
            const durationToAdd = getEmployeeDailyDuration(candidate);
            timeWorkedMs[candidate.id] += durationToAdd;
            if (isClosingShift) closingShiftsCount[candidate.id] += 1;
          } 
        }
      }

      dailySchedule.assignments.push({ slotId: slot.id, employeeIds: assignedEmployeeIds });
    });
  });

  return schedule;
};