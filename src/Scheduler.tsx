// src/Scheduler.tsx
import React, { useState, useEffect } from 'react';
import type { Employee, ShiftSlot, DailySchedule, Role } from './types';
import { generateSchedule, getEmployeeDailyDuration } from './logic'; 

interface SchedulerProps { slots: ShiftSlot[]; employees: Employee[]; }

const DAYS_OF_WEEK = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const ROLES: Role[] = ['produccion', 'servicio-tienda', 'servicio-modulo-tienda', 'servicio-modulo-open'];

// Helpers (Se mantienen igual)
const msToTime = (duration: number) => {
    const totalMinutes = Math.round(duration / (1000 * 60));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return { h, m };
};
const subtractTime = (endTime: string, subHours: number, subMinutes: number) => {
    const [h, m] = endTime.split(':').map(Number);
    const date = new Date(); date.setHours(h, m, 0, 0); date.setHours(date.getHours() - subHours); date.setMinutes(date.getMinutes() - subMinutes);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
const addTime = (startTime: string, addHours: number, addMinutes: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date(); date.setHours(h, m, 0, 0); date.setHours(date.getHours() + addHours); date.setMinutes(date.getMinutes() + addMinutes);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const Scheduler: React.FC<SchedulerProps> = ({ slots, employees }) => {
  const [schedulesByRole, setSchedulesByRole] = useState<Record<string, DailySchedule[]>>({});
  const [generatingRole, setGeneratingRole] = useState<Role | null>(null);

  useEffect(() => {
    const initialState: Record<string, DailySchedule[]> = {};
    ROLES.forEach(role => initialState[role] = DAYS_OF_WEEK.map(day => ({ day, assignments: [] })));
    setSchedulesByRole(initialState);
  }, []);

  const handleGenerateRole = (targetRole: Role) => {
    setGeneratingRole(targetRole);
    const roleEmployees = employees.filter(e => e.role === targetRole);
    const roleSlots = slots.filter(s => (s.requiredStaffByRole[targetRole] || 0) > 0);
    const newSchedule = generateSchedule(DAYS_OF_WEEK, roleSlots, roleEmployees);
    setSchedulesByRole(prev => ({ ...prev, [targetRole]: newSchedule }));
    setTimeout(() => setGeneratingRole(null), 500);
  };

  // ESTILOS DE TABLA MEJORADOS
  const tableContainerStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: '0 0 8px 8px', border: '1px solid #ddd', borderTop: 'none' };
  const thStyle: React.CSSProperties = { padding: '10px', border: '1px solid #ddd', whiteSpace: 'nowrap', textAlign: 'center' };
  const stickyColStyle: React.CSSProperties = { position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#fff', borderRight: '2px solid #ddd' };

  const renderCell = (day: string, emp: Employee, roleSchedule: DailySchedule[]) => {
    const daySchedule = roleSchedule.find(s => s.day === day);
    if (!daySchedule) return <td colSpan={3} style={{ ...thStyle, backgroundColor: '#f0f0f0' }}>-</td>;
    
    const assignment = daySchedule.assignments.find(a => a.employeeIds.includes(emp.id));
    if (!assignment) return <td colSpan={3} style={{ ...thStyle, backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: 'bold' }}>D</td>;

    const slot = slots.find(s => s.id === assignment.slotId);
    if (!slot) return null;

    const isClosing = slot.name.toLowerCase().includes('cierre');
    const { h, m } = msToTime(getEmployeeDailyDuration(emp));
    const hoursStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    let start = isClosing ? subtractTime(slot.endTime, h, m) : slot.startTime;
    let end = isClosing ? slot.endTime : addTime(slot.startTime, h, m);

    return (
        <>
          <td style={{ ...thStyle, minWidth: '50px' }}>{start}</td>
          <td style={{ ...thStyle, minWidth: '50px' }}>{end}</td>
          <td style={{ ...thStyle, backgroundColor: '#F5F5F5', fontWeight: 'bold', fontSize: '0.85em' }}>{hoursStr}</td>
        </>
    );
  };

  return (
    <div>
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0 }}>📅 Tabla de Turnos Semanal</h2>
        <p style={{ color: '#666' }}>Genera horarios independientes por cada área.</p>
      </div>

      {ROLES.map((role) => {
        const roleEmployees = employees.filter(e => e.role === role);
        if (roleEmployees.length === 0) return null;
        const currentRoleSchedule = schedulesByRole[role] || DAYS_OF_WEEK.map(day => ({ day, assignments: [] }));

        return (
          <div key={role} style={{ marginBottom: '30px', margin: '0 20px 30px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
            {/* CABECERA NEGRA BEMBOS */}
            <div style={{ backgroundColor: '#212121', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px 8px 0 0' }}>
              <span style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{role.replace(/-/g, ' ')}</span>
              <button 
                onClick={() => handleGenerateRole(role)}
                disabled={generatingRole === role}
                style={{ 
                    backgroundColor: generatingRole === role ? '#555' : '#D32F2F', 
                    color: 'white', border: 'none', borderRadius: '4px', padding: '8px 20px', 
                    cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    transition: 'background 0.2s'
                }}
              >
                {generatingRole === role ? '⏳ ...' : '🔄 Generar'}
              </button>
            </div>

            <div style={tableContainerStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#FFEB3B', color: '#333' }}>
                    <th style={{ ...thStyle, ...stickyColStyle, minWidth: '140px', backgroundColor: '#FFEB3B' }} rowSpan={2}>COLABORADOR</th>
                    {DAYS_OF_WEEK.map(day => (
                        <th key={day} colSpan={3} style={{ ...thStyle, textTransform: 'uppercase', borderBottom: 'none' }}>{day}</th>
                    ))}
                    </tr>
                    <tr style={{ backgroundColor: '#FFF9C4' }}>
                    {DAYS_OF_WEEK.map(day => (
                        <React.Fragment key={day + '-sub'}>
                        <th style={{ ...thStyle, fontSize: '0.8em', width: '40px' }}>E</th>
                        <th style={{ ...thStyle, fontSize: '0.8em', width: '40px' }}>S</th>
                        <th style={{ ...thStyle, fontSize: '0.8em', width: '40px' }}>Hrs</th>
                        </React.Fragment>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {roleEmployees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ ...thStyle, ...stickyColStyle, textAlign: 'left', fontWeight: '600' }}>
                           {emp.name} 
                           <div style={{ fontSize: '0.75em', color: '#666', fontWeight: 'normal' }}>
                             {emp.contractType === 'full-time' ? 'Full Time' : 'Part Time'}
                           </div>
                        </td>
                        {DAYS_OF_WEEK.map(day => <React.Fragment key={day}>{renderCell(day, emp, currentRoleSchedule)}</React.Fragment>)}
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Scheduler;