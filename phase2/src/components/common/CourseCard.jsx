import React from 'react';
import '../../styles/Common.css';

const CourseCard = ({ 
  course, 
  actions = [], 
  showStatus = true,
  showPrerequisite = true,
  showEnrollment = true,
  additionalInfo = null
}) => {
  return (
    <div 
      className={`class-card ${course.status ? `status-${course.status}` : ''}`}
      data-course-num={course.courseNum}
      data-crn={course.crn}
    >
      <h3>{course.name}</h3>
      <p>Instructor: {course.instructor}</p>
      <p>Course Number: {course.category} {course.courseNum}</p>
      <p>CRN: {course.crn}</p>
      <p>Category: {course.category}</p>
      
      {showPrerequisite && <p>Prerequisite: {course.prerequisite}</p>}
      
      {showStatus && (
        <p>Status: 
          <span className={`status-pill status-${course.status}`}>
            {course.status === 'valid' ? 'Approved' : 
             course.status === 'pending' ? 'Pending Approval' : 
             'Invalid'}
          </span>
        </p>
      )}
      
      {showEnrollment && course.enrollment_maximum && (
        <p>Enrollment: {course.enrollment_actual}/{course.enrollment_maximum}</p>
      )}
      
      {additionalInfo && additionalInfo}
      
      {actions.length > 0 && (
        <div className="button-container">
          {actions.map((action, index) => (
            <button 
              key={index}
              className={action.className}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCard;