// src/App.tsx
import React from 'react';
import { MOCK_EMPLOYEES, SHIFT_SLOTS } from './mockData';
import type { Employee, ShiftSlot } from './types';
import Scheduler from './Scheduler';

// Componente para mostrar empleados (lo crearemos después)
const EmployeeList: React.FC<{ employees: Employee[] }> = ({ employees }) => {
  return (
    <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>👥 Empleados Disponibles ({employees.length})</h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {employees.map(emp => (
          <li key={emp.id} style={{ borderBottom: '1px dotted #ccc', padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>{emp.name}</div>
            <div style={{ fontSize: '0.9em', color: '#666', textAlign: 'right' }}>
              <span style={{ backgroundColor: '#e0f7fa', padding: '2px 5px', borderRadius: '3px', marginRight: '5px' }}>{emp.role}</span>
              <small>Max {emp.maxHoursPerWeek}h/sem</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Componente para mostrar turnos (lo crearemos después)
const ShiftSlotList: React.FC<{ slots: ShiftSlot[] }> = ({ slots }) => {
  return (
    <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>🕒 Turnos y Requerimientos</h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {slots.map(slot => (
          <li key={slot.id} style={{ borderBottom: '1px dotted #ccc', padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{slot.name}</strong>
              <span style={{ color: '#333', fontSize: '0.9em' }}>{slot.startTime} - {slot.endTime}</span>
            </div>
            <div style={{ marginTop: '5px', color: slot.isHighTraffic ? '#d9534f' : '#007bff' }}>
              👉 Necesitas: **{slot.requiredStaff} personas**
              {slot.isHighTraffic && <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>🚨 HORA PUNTA</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};


// Componente principal de la aplicación
const App: React.FC = () => {
  // Aquí usaremos los datos simulados por ahora
  const employees = MOCK_EMPLOYEES;
  const shiftSlots = SHIFT_SLOTS;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>🗓️ Generador de Horarios Bembos Huánuco</h1>
      <p>Configuración y Demanda del personal.</p>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Lado izquierdo: Datos de entrada */}
        <div style={{ flex: 1 }}>
          <EmployeeList employees={employees} />
          <ShiftSlotList slots={shiftSlots} />
        </div>

        {/* Lado derecho: El horario generado */}
        <div style={{ flex: 2, padding: '10px', border: '2px solid #0056b3', borderRadius: '8px', background: '#f8f8ff', color: "black" }}>
          <h2>Tabla de Horario Semanal</h2>
          <p>Pulsa 'Generar' para aplicar la lógica de optimización.</p>
          
          {/* Aquí irá el componente Scheduler */}
          <Scheduler slots={shiftSlots} employees={employees} />
        </div>
      </div>
    </div>
  );
};

export default App;