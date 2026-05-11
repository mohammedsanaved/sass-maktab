import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { NewStudent } from './pages/NewStudent';
import { EditStudent } from './pages/EditStudent';
import { StudentProfile } from './pages/StudentProfile';
import { Teachers } from './pages/Teachers';
import { Payments } from './pages/Payments';
import { Settings } from './pages/Settings';
import { ManageTimeSlots } from './pages/settings/ManageTimeSlots';
import { ManageClasses } from './pages/settings/ManageClasses';
import { ManageTeachers } from './pages/settings/ManageTeachers';
import { Login } from './pages/Login';

// Protected Route Wrapper
const ProtectedRoute = () => {
  // Simple auth check for demo
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/new" element={<NewStudent />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/students/:id/edit" element={<EditStudent />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/timeslots" element={<ManageTimeSlots />} />
          <Route path="/settings/classes" element={<ManageClasses />} />
          <Route path="/settings/teachers" element={<ManageTeachers />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;