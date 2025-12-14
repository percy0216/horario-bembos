// src/EmployeeForm.tsx
import React, { useState } from 'react';
import type { Employee, Role, ContractType, TimeRange } from './types';

interface EmployeeFormProps {
  onAddEmployee: (emp: Employee) => void;
}

const ALL_DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const ROLES: Role[] = ['produccion', 'servicio-tienda', 'servicio-modulo-tienda', 'servicio-modulo-open'];

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onAddEmployee }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('produccion');
  const [contractType, setContractType] = useState<ContractType>('full-time');
  
  const [availability, setAvailability] = useState<{ [day: string]: TimeRange }>({
    'lunes': { start: '00:00', end: '23:59' },
    'martes': { start: '00:00', end: '23:59' },
    'miercoles': { start: '00:00', end: '23:59' },
    'jueves': { start: '00:00', end: '23:59' },
    'viernes': { start: '00:00', end: '23:59' },
    'sabado': { start: '00:00', end: '23:59' },
    'domingo': { start: '00:00', end: '23:59' },
  });

  const toggleDay = (day: string) => {
    const newAvail = { ...availability };
    if (newAvail[day]) delete newAvail[day];
    else newAvail[day] = { start: '00:00', end: '23:59' };
    setAvailability(newAvail);
  };

  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddEmployee({ id: crypto.randomUUID(), name, role, contractType, availability });
    setName('');
    const resetAvail: any = {};
    ALL_DAYS.forEach(d => resetAvail[d] = { start: '00:00', end: '23:59' });
    setAvailability(resetAvail);
  };

  // Estilos inline para inputs bonitos
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' };
  const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#444' };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, color: '#D32F2F' }}>➕ Nuevo Trabajador</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div>
          <label style={labelStyle}>Nombre:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="Ej: Juan Perez" />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
             <div>
                <label style={labelStyle}>Puesto:</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={inputStyle}>
                    {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase().replace(/-/g, ' ')}</option>)}
                </select>
             </div>
             <div>
                <label style={labelStyle}>Contrato:</label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value as ContractType)} style={inputStyle}>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                </select>
             </div>
        </div>

        <div>
          <label style={labelStyle}>Disponibilidad (Toca para desactivar):</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ALL_DAYS.map(day => {
              const isAvailable = !!availability[day];
              return (
                <div key={day} style={{ 
                    border: isAvailable ? '1px solid #4CAF50' : '1px solid #ddd',
                    backgroundColor: isAvailable ? '#F1F8E9' : '#fafafa',
                    borderRadius: '8px', padding: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' 
                }}>
                  <button 
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                        backgroundColor: isAvailable ? '#4CAF50' : '#ccc',
                        color: 'white', border: 'none', borderRadius: '20px', padding: '5px 12px',
                        cursor: 'pointer', fontWeight: 'bold', minWidth: '90px', textTransform: 'capitalize'
                    }}
                  >
                    {day} {isAvailable ? '✓' : '✗'}
                  </button>

                  {isAvailable && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, justifyContent: 'flex-end' }}>
                        <input type="time" value={availability[day].start} onChange={(e) => handleTimeChange(day, 'start', e.target.value)} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '2px' }} />
                        <span>-</span>
                        <input type="time" value={availability[day].end} onChange={(e) => handleTimeChange(day, 'end', e.target.value)} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '2px' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button type="submit" style={{ 
            backgroundColor: '#1976D2', color: 'white', padding: '12px', border: 'none', 
            borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' 
        }}>
          Guardar Trabajador
        </button>
      </form>
    </div>
  );
};

export default EmployeeForm;