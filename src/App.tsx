// src/App.tsx
import React, { useState, useEffect } from 'react';
import { SHIFT_SLOTS } from './mockData'; 
import  type { Employee, Role } from './types';
import Scheduler from './Scheduler'; 
import EmployeeForm from './EmployeeForm'; 

const STORAGE_KEY = 'bembos_employees_v1';
const ROLES: Role[] = ['produccion', 'servicio-tienda', 'servicio-modulo-tienda', 'servicio-modulo-open'];

// --- ESTILOS CSS INYECTADOS (Nuevo Layout) ---
const styles = `
  :root {
    --bembos-red: #D32F2F;
    --bembos-blue: #1976D2;
    --bembos-yellow: #FFEB3B;
    --bembos-dark: #212121;
    --bg-light: #F4F6F8;
    --card-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  body {
    background-color: var(--bg-light);
    margin: 0;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .app-container {
    max-width: 1600px; /* Más ancho para que quepa todo */
    margin: 0 auto;
    padding: 20px;
  }

  /* --- LAYOUT SUPERIOR (Formulario + Lista) --- */
  .top-dashboard {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 30px;
  }

  @media (min-width: 900px) {
    .top-dashboard {
      flex-direction: row;
      align-items: flex-start;
    }
    .section-form {
      flex: 1;
      max-width: 500px; /* El formulario no necesita ser gigante */
    }
    .section-list {
      flex: 1;
      min-width: 0; /* Evita desbordamiento */
    }
  }

  /* --- LAYOUT INFERIOR (Horario) --- */
  .section-scheduler {
    width: 100%;
  }

  /* Tarjetas Generales */
  .card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--card-shadow);
    height: 100%; /* Para que formulario y lista tengan misma altura si es posible */
  }

  /* Estilos de la Lista Agrupada */
  .group-header {
    background-color: #eee;
    padding: 8px 12px;
    border-radius: 6px;
    margin-top: 15px;
    margin-bottom: 8px;
    font-weight: bold;
    color: #444;
    text-transform: uppercase;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .emp-list { list-style: none; padding: 0; margin: 0; }
  .emp-item { 
    display: flex; justify-content: space-between; align-items: center; 
    padding: 8px 10px; border-bottom: 1px solid #f0f0f0; 
    transition: background 0.2s;
  }
  .emp-item:hover { background-color: #fafafa; }
  
  .badge { padding: 3px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: bold; }
  .badge-ft { background-color: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; }
  .badge-pt { background-color: #FFF3E0; color: #EF6C00; border: 1px solid #FFE0B2; }

  h1, h2, h3 { margin-top: 0; }
  button { cursor: pointer; }
`;

// --- COMPONENTE LISTA AGRUPADA POR ÁREAS ---
const EmployeeList: React.FC<{ employees: Employee[], onDelete: (id: string) => void }> = ({ employees, onDelete }) => {
  return (
    <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
      <h3 style={{ borderBottom: '2px solid var(--bembos-blue)', paddingBottom: '10px', color: 'var(--bembos-dark)', position: 'sticky', top: 0, background: 'white', zIndex: 10, margin: 0 }}>
        👥 Personal ({employees.length})
      </h3>
      
      {employees.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No hay trabajadores registrados.</p>
      ) : (
        <div>
          {/* Iteramos por los roles para crear grupos separados */}
          {ROLES.map(role => {
            const group = employees.filter(e => e.role === role);
            if (group.length === 0) return null; // Si no hay nadie en este rol, no mostramos la sección

            return (
              <div key={role}>
                <div className="group-header">
                  <span>{role.replace(/-/g, ' ')}</span>
                  <span style={{ backgroundColor: '#ccc', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7em', color: 'white' }}>
                    {group.length}
                  </span>
                </div>
                <ul className="emp-list">
                  {group.map(emp => (
                    <li key={emp.id} className="emp-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{emp.name}</span>
                        <span className={`badge ${emp.contractType === 'full-time' ? 'badge-ft' : 'badge-pt'}`}>
                          {emp.contractType === 'full-time' ? 'FT' : 'PT'}
                        </span>
                      </div>
                      <button 
                        onClick={() => onDelete(emp.id)} 
                        style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', opacity: 0.6 }} 
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE APP PRINCIPAL ---
const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) { return []; }
  });
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }, [employees]);

  const handleAddEmployee = (newEmp: Employee) => setEmployees([...employees, newEmp]);
  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('¿Eliminar trabajador?')) setEmployees(employees.filter(e => e.id !== id));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        
        {/* CABECERA */}
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--bembos-red)', fontSize: '2.2rem', marginBottom: '5px' }}>
            🍔 Generador de Horarios Bembos
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Sede: Huánuco</p>
          {/* Información extra */}
            <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#FFF3E0', borderRadius: '8px', fontSize: '0.85em', color: '#E65100', border: '1px solid #FFE0B2' }}>
              <strong>💡 Tips:</strong> Marca todos los días (Lun-Dom) para que el sistema optimice los descansos automáticamente. <br />
              Si dejas <strong>todos los días marcados</strong>, el sistema elegirá automáticamente el mejor día de descanso para equilibrar el equipo <br />
              Si <strong>desmarcas un día</strong> (ej. Martes), ese será su descanso obligatorio fijo. <br />
              Si defines horas específicas (ej. Lunes desde las 12:00), el sistema respetará esa restricción. <br />
            </div>
        </header>
        
        {/* SECCIÓN SUPERIOR: FORMULARIO Y LISTA (Lado a Lado) */}
        <div className="top-dashboard">
          
          <div className="section-form">
            <EmployeeForm onAddEmployee={handleAddEmployee} />
            
            {/* Nota Informativa Movida debajo del form */}
            
          </div>

          <div className="section-list">
            <EmployeeList employees={employees} onDelete={handleDeleteEmployee} />
          </div>

        </div>

        {/* SECCIÓN INFERIOR: HORARIO (Ancho Completo) */}
        <div className="section-scheduler">
          <div className="card" style={{ borderTop: '5px solid var(--bembos-red)' }}>
            <Scheduler slots={SHIFT_SLOTS} employees={employees} />
          </div>
        </div>

      </div>
    </>
  );
};

export default App;