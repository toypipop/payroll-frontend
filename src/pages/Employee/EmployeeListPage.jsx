import React, { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';

const EmployeeListPage = () => {
  /* --- 1. States --- */
  // Mock data for initial display
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Somsak Tech', position: 'Developer', department: 'IT', status: 'Active' },
    { id: 2, name: 'Jane Doe', position: 'HR Manager', department: 'HR', status: 'Inactive' },
  ]);

  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({ name: '', position: '', department: '' });
  
  // Track which employee is being edited (null = adding new)
  const [editingId, setEditingId] = useState(null);

  /* --- 2. Table Configuration --- */
  const columns = [
    { label: 'Employee Name', key: 'name' },
    { label: 'Position', key: 'position' },
    { label: 'Department', key: 'department' },
    { 
      label: 'Status', 
      key: 'status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge> 
    },
    // Inside EmployeeListPage.jsx columns definition
    {
      label: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* 1. Use 'ghost' variant for Edit */}
          <Button 
            variant="ghost" 
            onClick={() => handleEdit(row)}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            Edit
          </Button>

          {/* 2. Use 'danger' variant for Delete */}
          <Button 
            variant="danger" 
            onClick={() => handleDelete(row.id)}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  /* --- 3. CRUD Logic --- */

  // Prepare modal for editing
  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setFormData({ 
      name: employee.name, 
      position: employee.position, 
      department: employee.department 
    });
    setIsModalOpen(true);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Create or Update record
  const handleSubmit = () => {
    if (editingId) {
      // UPDATE: Map through array and replace matching ID
      setEmployees(employees.map(emp => 
        emp.id === editingId ? { ...emp, ...formData } : emp
      ));
    } else {
      // CREATE: Append new object to array
      const newEmp = { 
        id: Date.now(), 
        ...formData, 
        status: 'Active' 
      };
      setEmployees([...employees, newEmp]);
    }
    closeModal();
  };

  // Delete record
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  // Reset form and close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', position: '', department: '' });
  };

  /* --- 4. Render --- */
  return (
    <>
      <PageHeader 
        title="Employee Directory" 
        actionButton={
          <Button onClick={() => setIsModalOpen(true)} style={{ width: 'auto', padding: '10px 24px' }}>
            + Add Employee
          </Button>
        }
      />
      
      <Card style={{ padding: '0px' }}>
        <Table columns={columns} data={employees} />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editingId ? "Edit Employee" : "Add New Employee"}
        footer={
          <>
            <button onClick={closeModal} style={cancelBtnStyle}>Cancel</button>
            <Button onClick={handleSubmit} style={{ width: 'auto' }}>
              {editingId ? "Update Changes" : "Save Employee"}
            </Button>
          </>
        }
      >
        <InputField 
          label="Full Name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="e.g. Somsak Tech" 
        />
        <InputField 
          label="Position" 
          name="position" 
          value={formData.position} 
          onChange={handleChange} 
          placeholder="e.g. Software Engineer" 
        />
        <InputField 
          label="Department" 
          name="department" 
          value={formData.department} 
          onChange={handleChange} 
          placeholder="e.g. IT, HR" 
        />
      </Modal>
    </>
  );
};

// Internal styles
const actionBtnStyle = { 
  background: 'none', 
  border: 'none', 
  color: '#3b82f6', 
  cursor: 'pointer', 
  fontWeight: '600',
  fontSize: '13px'
};

const cancelBtnStyle = { 
  background: 'none', 
  border: 'none', 
  padding: '10px 20px', 
  cursor: 'pointer', 
  color: '#64748b', 
  fontWeight: '500' 
};

export default EmployeeListPage;