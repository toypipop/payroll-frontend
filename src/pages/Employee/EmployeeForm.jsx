import { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import Card from '../../components/common/Card';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

const EmployeeForm = () => {
  // Define state for form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    salary: '',
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Saving Employee Data:', formData);
    // TODO: Connect to Go Backend API
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '24px', color: '#1e293b' }}>Add New Employee</h2>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Personal Information Section */}
              <InputField 
                label="First Name"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <InputField 
                label="Last Name"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <InputField 
              label="Email Address"
              type="email"
              name="email"
              placeholder="employee@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <InputField 
                label="Position"
                name="position"
                placeholder="Software Engineer"
                value={formData.position}
                onChange={handleChange}
              />
              <InputField 
                label="Monthly Salary"
                type="number"
                name="salary"
                placeholder="0.00"
                value={formData.salary}
                onChange={handleChange}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" style={{ width: '200px' }}>
                Save Employee
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EmployeeForm;