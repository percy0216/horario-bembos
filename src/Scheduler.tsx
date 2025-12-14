// src/Scheduler.tsx
import React, { useState } from 'react';
import type { Employee, ShiftSlot, DailySchedule, Role } from './types';
import { generateSchedule } from './logic'; 

interface SchedulerProps {
  slots: ShiftSlot[];
  employees: Employee[];
}

const DAYS_OF_WEEK = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const ROLES: Role[] = ['produccion', 'servicio-tienda', 'servicio-modulo-tienda', 'servicio-modulo-open'];

// ----------------------------------------------------------------------
// HELPERS DE TIEMPO
// ----------------------------------------------------------------------

// Restar tiempo: Para calcular a qué hora DEBE entrar alguien para salir al cierre (Cálculo Inverso)
const subtractTime = (endTime: string, subHours: number, subMinutes: number) => {
    const [h, m] = endTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setHours(date.getHours() - subHours);
    date.setMinutes(date.getMinutes() - subMinutes);
    
    const newH = date.getHours().toString().padStart(2, '0');
    const newM = date.getMinutes().toString().padStart(2, '0');
    return `${newH}:${newM}`;
};

// Sumar tiempo: Para calcular a qué hora sale alguien que entra en apertura (Cálculo Normal)
const addTime = (startTime: string, addHours: number, addMinutes: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setHours(date.getHours() + addHours);
    date.setMinutes(date.getMinutes() + addMinutes);
    
    const newH = date.getHours().toString().padStart(2, '0');
    const newM = date.getMinutes().toString().padStart(2, '0');
    return `${newH}:${newM}`;
};

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------

const Scheduler: React.FC<SchedulerProps> = ({ slots, employees }) => {
  const [schedule, setSchedule] = useState<DailySchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    // Llamamos a la lógica (asegúrate de haber actualizado logic.ts con la prioridad de cierre también)
    const generated = generateSchedule(DAYS_OF_WEEK, slots, employees); 
    setSchedule(generated);
    setLoading(false);
  };

  // Función para renderizar cada celda (Día/Empleado)
  const renderCell = (day: string, emp: Employee) => {
    const daySchedule = schedule.find(s => s.day === day);
    
    // Si no existe el día en el horario generado
    if (!daySchedule) return <td colSpan={3} style={{ border: '1px solid black', backgroundColor: '#e0e0e0' }}>-</td>;

    // Buscamos si el empleado tiene turno hoy
    const assignment = daySchedule.assignments.find(a => a.employeeIds.includes(emp.id));
    
    // CASO 1: DESCANSO (No asignado)
    if (!assignment) {
        return (
             <td colSpan={3} style={{ border: '1px solid black', backgroundColor: '#ffe0b2', color: '#d32f2f', fontWeight: 'bold', textAlign: 'center' }}>
                D
             </td>
        );
    }

    // Buscamos detalles del turno asignado
    const slot = slots.find(s => s.id === assignment.slotId);
    if (!slot) return null;

    // CASO 2: ASIGNADO (Calculamos Entrada y Salida Exacta)
    const isClosing = slot.name.toLowerCase().includes('cierre');
    const isFullTime = emp.contractType === 'full-time';

    let startTime = "";
    let endTime = "";
    // String fijo de horas según contrato
    let hoursStr = isFullTime ? "08:45" : "03:50"; 

    if (isClosing) {
        // --- LÓGICA DE CIERRE (Cálculo Inverso) ---
        // La hora fija es la SALIDA (ej: 23:30)
        endTime = slot.endTime; 
        
        // Calculamos la entrada restando las horas del contrato
        if (isFullTime) {
            startTime = subtractTime(endTime, 8, 45); // Ej: 23:30 - 8h45 = 14:45
        } else {
            startTime = subtractTime(endTime, 3, 50); // Ej: 23:30 - 3h50 = 19:40
        }
    } else {
        // --- LÓGICA NORMAL (Apertura/Tarde) ---
        // La hora fija es la ENTRADA (ej: 09:00)
        startTime = slot.startTime; 

        // Calculamos la salida sumando las horas del contrato
        if (isFullTime) {
            endTime = addTime(startTime, 8, 45);
        } else {
            endTime = addTime(startTime, 3, 50);
        }
    }

    return (
        <>
          <td style={{ border: '1px solid black', backgroundColor: 'white', textAlign: 'center' }}>{startTime}</td>
          <td style={{ border: '1px solid black', backgroundColor: 'white', textAlign: 'center' }}>{endTime}</td>
          <td style={{ border: '1px solid black', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>{hoursStr}</td>
        </>
    );
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
            onClick={handleGenerate} 
            disabled={loading}
            style={{ 
                padding: '12px 25px', fontSize: '16px', backgroundColor: '#d32f2f', color: 'white', 
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
        >
            {loading ? 'Generando...' : 'CALCULAR HORARIO'}
        </button>
      </div>

      {ROLES.map((role) => {
        const roleEmployees = employees.filter(e => e.role === role);
        // Si no hay empleados de este rol, saltamos la tabla
        if (roleEmployees.length === 0) return null;

        return (
          <div key={role} style={{ marginBottom: '40px', overflowX: 'auto', border: '1px solid #999' }}>
            {/* Título del Área (Negro con letras blancas) */}
            <div style={{ backgroundColor: 'black', color: 'white', padding: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {role.replace(/-/g, ' ')}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid black' }}>
              <thead>
                {/* Fila 1: Días (Amarillo Bembos) */}
                <tr style={{ backgroundColor: '#ffeb3b' }}>
                  <th style={{ border: '1px solid black', padding: '5px', minWidth: '150px' }} rowSpan={2}>NOMBRE</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} colSpan={3} style={{ border: '1px solid black', padding: '5px', textTransform: 'uppercase' }}>
                      {day}
                    </th>
                  ))}
                </tr>
                {/* Fila 2: Sub-columnas (Entrada | Salida | Horas) */}
                <tr style={{ backgroundColor: '#fff9c4' }}>
                  {DAYS_OF_WEEK.map(day => (
                    <React.Fragment key={day + '-sub'}>
                      <th style={{ border: '1px solid black', width: '35px', textAlign: 'center' }}>E</th>
                      <th style={{ border: '1px solid black', width: '35px', textAlign: 'center' }}>S</th>
                      <th style={{ border: '1px solid black', width: '35px', textAlign: 'center' }}>Hrs</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roleEmployees.map(emp => (
                  <tr key={emp.id} style={{ backgroundColor: '#e0f2f1' }}>
                    <td style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold', textAlign: 'left' }}>
                      {emp.name} <span style={{ fontSize: '9px', color: '#666' }}>({emp.contractType === 'full-time' ? 'FT' : 'PT'})</span>
                    </td>
                    {DAYS_OF_WEEK.map(day => (
                        <React.Fragment key={day}>
                            {renderCell(day, emp)}
                        </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default Scheduler;