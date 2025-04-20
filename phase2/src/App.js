import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Coursepage from './pages/Coursepage';
import Registration from './pages/Registration';
import LearningPath from './pages/LearningPath';
import CreateCourse from './pages/CreateCourse';
import InstructorClasses from './pages/InstructorClasses';
import InstructorGrading from './pages/InstructorGrading';
import './index.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.status)) {
      if (currentUser.status === 'student') {
        return <Navigate to="/coursepage" />;
      } else if (currentUser.status === 'instructor') {
        return <Navigate to="/instructor/classes" />;
      } else if (currentUser.status === 'admin') {
        return <Navigate to="/admin/courses" />;
      }
    }

    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
      <Route
        path="/coursepage"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Coursepage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Registration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning-path"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <LearningPath />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreateCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/classes"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/grading"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorGrading />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;