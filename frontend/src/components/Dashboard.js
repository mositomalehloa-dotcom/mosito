import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode'; // Fixed: Named import
import LecturerDashboard from './LecturerDashboard';
import StudentDashboard from './StudentDashboard';
import PrlDashboard from './PrlDashboard';
import PlDashboard from './PlDashboard';

const Dashboard = () => {
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setRole(decoded.role);
      } catch (err) {
        console.error('Token decoding failed:', err);
      }
    }
  }, []);

  switch (role) {
    case 'lecturer':
      return <LecturerDashboard />;
    case 'student':
      return <StudentDashboard/>;
    case 'prl':
      return <PrlDashboard/>;
    case 'pl':
      return <PlDashboard/>;
    default:
      return (
        <Container className="mt-5">
          <h2>Welcome to the Dashboard</h2>
          <p>Please log in to view your dashboard.</p>
        </Container>
      );
  }
};

export default Dashboard;