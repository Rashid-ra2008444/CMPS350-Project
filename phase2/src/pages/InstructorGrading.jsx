import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import '../styles/Common.css';
import '../styles/Instructor.css';

const InstructorGrading = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grades, setGrades] = useState({});
  const [successMessage, setSuccessMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current user
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    if (user.status !== 'instructor') {
      navigate('/login');
      return;
    }

    setCurrentUser(user);

    // Get the selected course number and CRN
    const courseNum = parseInt(localStorage.getItem('selectedCourse'), 10);
    const courseCRN = parseInt(localStorage.getItem('selectedCRN'), 10);
    
    if (!courseNum && !courseCRN) {
      // Redirect to instructor classes page if no course selected
      navigate('/instructor/classes');
      return;
    }
    
    loadCourseForGrading(user.username, courseNum, courseCRN);
    
    // Check for admin updates when page gets focus
    const handleFocus = () => {
      loadCourseForGrading(user.username, courseNum, courseCRN);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);

  const loadCourseForGrading = async (instructorName, courseNum, courseCRN) => {
    try {
      setIsLoading(true);
      
      // Load courses data from localStorage first
      let coursesData = [];
      const adminCoursesStorage = localStorage.getItem('courseData');
      
      if (adminCoursesStorage) {
        coursesData = JSON.parse(adminCoursesStorage);
        console.log(`Loaded ${coursesData.length} courses from 'courseData' in localStorage`);
      } else {
        const coursesStorage = localStorage.getItem('courses');
        if (coursesStorage) {
          coursesData = JSON.parse(coursesStorage);
          console.log(`Loaded ${coursesData.length} courses from 'courses' in localStorage`);
        } else {
          // Fall back to file if not in localStorage
          console.log("No courses in localStorage, loading from file");
          const coursesResponse = await fetch("/data/courses.json");
          coursesData = await coursesResponse.json();
        }
      }
      
      // Find the selected course - first try by CRN, then by courseNum
      let course = null;
      
      if (courseCRN) {
        course = coursesData.find(c => 
          parseInt(c.crn, 10) === courseCRN && c.instructor === instructorName
        );
        console.log(`Searching for course with CRN ${courseCRN}`);
      }
      
      // If no course found by CRN, try by courseNum (backward compatibility)
      if (!course && courseNum) {
        course = coursesData.find(c => 
          parseInt(c.courseNum, 10) === courseNum && c.instructor === instructorName
        );
        console.log(`Searching for course with courseNum ${courseNum}`);
      }
      
      if (!course) {
        setIsLoading(false);
        return;
      }
      
      setSelectedCourse(course);
      
      // Load enrollment data - always from localStorage first
      let enrollmentData = [];
      const localEnrollments = localStorage.getItem('enrollment');
      
      if (localEnrollments) {
        console.log("Loading enrollments from localStorage");
        enrollmentData = JSON.parse(localEnrollments);
      } else {
        try {
          console.log("No enrollments in localStorage, loading from file");
          const studentsResponse = await fetch("/data/enrollment.json");
          enrollmentData = await studentsResponse.json();
          
          // Store data in localStorage for next time
          localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
        } catch (err) {
          console.warn("Could not load enrollment data, using empty array:", err);
        }
      }
      
      // Find students enrolled in the course using CRN (primary) or courseNum (fallback)
      const students = enrollmentData.filter(enrollment => {
        // Try to match by CRN first
        if (enrollment.crn && courseCRN) {
          return parseInt(enrollment.crn, 10) === courseCRN && 
                enrollment.instructor === instructorName;
        }
        // Fall back to courseNum if CRN not available
        return parseInt(enrollment.courseNum, 10) === parseInt(course.courseNum, 10) && 
              enrollment.instructor === instructorName;
      });
      
      console.log(`Found ${students.length} students enrolled in this course`);
      
      // Initialize grades state with existing grades
      const initialGrades = {};
      students.forEach(student => {
        if (student.grade) {
          initialGrades[student.studentId] = getNumericEquivalent(student.grade);
        }
      });
      
      setEnrolledStudents(students);
      setGrades(initialGrades);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading course:", error);
      setIsLoading(false);
    }
  };

  // Helper function to convert letter grade to numeric value for display in input field
  const getNumericEquivalent = (letterGrade) => {
    if (!letterGrade) return '';
    
    const upperGrade = letterGrade.toString().toUpperCase();
    
    switch (upperGrade) {
      case 'A': return 90;
      case 'B+': return 85;
      case 'B': return 80;
      case 'C+': return 75;
      case 'C': return 70;
      case 'D+': return 65;
      case 'D': return 60;
      case 'F': return 0;
      default: return '';
    }
  };

  const handleGradeChange = (studentId, value) => {
    setGrades({
      ...grades,
      [studentId]: value
    });
  };

  const handleSubmitGrades = async (e) => {
    e.preventDefault();
    
    try {
      // Get enrollment data from localStorage
      let allEnrollments = [];
      const storedEnrollments = localStorage.getItem('enrollment');
      
      if (storedEnrollments) {
        allEnrollments = JSON.parse(storedEnrollments);
        console.log("Loaded current enrollments from localStorage");
      } else {
        console.warn("No enrollments found in localStorage");
        return;
      }
      
      // Update student grades
      let updatedEnrollments = allEnrollments.map(enrollment => {
        // Check if this enrollment matches our course
        // First try matching by CRN (preferred)
        const matchesByCRN = enrollment.crn && 
                            selectedCourse && 
                            parseInt(enrollment.crn, 10) === parseInt(selectedCourse.crn, 10);
        
        // Fallback to courseNum for backward compatibility
        const matchesByCourseNum = enrollment.courseNum && 
                                  selectedCourse && 
                                  parseInt(enrollment.courseNum, 10) === parseInt(selectedCourse.courseNum, 10);
        
        // Only update if the enrollment matches our course AND the student is in our list AND has a grade
        if ((matchesByCRN || matchesByCourseNum) && 
            enrollment.studentId in grades && 
            grades[enrollment.studentId] !== '') {
          
          // Get the numeric grade
          const numericGrade = parseInt(grades[enrollment.studentId], 10);
          let letterGrade;
          
          // Convert numeric grade to letter grade
          if (numericGrade >= 90) {
            letterGrade = "A";
          } else if (numericGrade >= 85) {
            letterGrade = "B+";
          } else if (numericGrade >= 80) {
            letterGrade = "B";
          } else if (numericGrade >= 75) {
            letterGrade = "C+";
          } else if (numericGrade >= 70) {
            letterGrade = "C";
          } else if (numericGrade >= 65) {
            letterGrade = "D+";
          } else if (numericGrade >= 60) {
            letterGrade = "D";
          } else {
            letterGrade = "F";
          }
          
          console.log(`Updating grade for student ${enrollment.studentName} in course ${selectedCourse.name} to ${letterGrade}`);
          
          // Create updated enrollment copy
          // Make sure to include CRN in the updated enrollment
          return { 
            ...enrollment, 
            grade: letterGrade,
            crn: enrollment.crn || selectedCourse.crn // Ensure CRN is preserved or added
          };
        }
        
        return enrollment;
      });
      
      // Save updated data to localStorage
      localStorage.setItem('enrollment', JSON.stringify(updatedEnrollments));
      console.log("Saved updated enrollments to localStorage");
      
      // Show success message
      setSuccessMessage(true);
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(false);
      }, 3000);
      
      alert("Grades saved successfully. Students can now see their grades in Learning Path.");
    } catch (error) {
      console.error("Error submitting grades:", error);
      alert("Error submitting grades. Please try again.");
    }
  };

  const handleBackToClasses = () => {
    navigate('/instructor/classes');
  };

  // Sidebar configuration
  const sidebarProps = {
    title: "CMPS 350",
    buttons: [
      { label: "← Back to Classes", path: "/instructor/classes" }
    ]
  };

  return (
    <MainLayout
      title={`Course Grading - ${currentUser?.username || ''}`}
      subtitle={`Course ID: ${selectedCourse ? `${selectedCourse.category}${selectedCourse.courseNum}` : 'Loading...'}`}
      sidebarProps={sidebarProps}
    >
      <div className="course-box">
        <h2>Course Details</h2>
        {isLoading ? (
          <p>Loading course details...</p>
        ) : selectedCourse ? (
          <div id="course-details" className="course-details">
            <p>Name: {selectedCourse.name}</p>
            <p>Category: {selectedCourse.category}</p>
            <p>Status: 
              <span className={`status-pill status-${selectedCourse.status}`}>
                {selectedCourse.status === 'valid' ? 'Approved' : 
                selectedCourse.status === 'pending' ? 'Pending Approval' : 
                'Invalid'}
              </span>
            </p>
            <p>CRN: {selectedCourse.crn}</p>
            <p>Enrollment: {enrolledStudents.length}/{selectedCourse.enrollment_maximum}</p>
          </div>
        ) : (
          <p>Course not found or you do not have permission to grade this course.</p>
        )}
      </div>

      <div className="course-box">
        <h2>Student Grades</h2>
        {isLoading ? (
          <p id="loading-message">Loading student data...</p>
        ) : selectedCourse && selectedCourse.status === 'valid' ? (
          enrolledStudents.length > 0 ? (
            <div id="student-list" className="student-list">
              <h3>Students & Grades</h3>
              <form id="grades-form" onSubmit={handleSubmitGrades}>
                {enrolledStudents.map((student, index) => (
                  <div key={index} className="student-item">
                    <span>{student.studentName} ({student.studentId})</span>
                    <input 
                      type="number" 
                      className="grade-input" 
                      name={`grade-${student.studentId}`} 
                      min="0" 
                      max="100" 
                      required
                      placeholder="Grade (0-100)"
                      value={grades[student.studentId] || ''}
                      onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                    />
                  </div>
                ))}
                
                <button type="submit" className="submit-btn">Submit Grades</button>
                {successMessage && (
                  <p className="success-message" id="success-message">
                    Grades submitted successfully!
                  </p>
                )}
              </form>
            </div>
          ) : (
            <p>No students enrolled in this course.</p>
          )
        ) : (
          <div className="error-message">
            <p>⚠️ You can only submit grades for approved courses.</p>
            <p>Current status: 
              <span className={`status-pill status-${selectedCourse?.status || 'unknown'}`}>
                {selectedCourse?.status || 'Unknown'}
              </span>
            </p>
            <p>Please contact an administrator to approve this course.</p>
            
            {enrolledStudents.length > 0 && (
              <div>
                <h3>Enrolled Students ({enrolledStudents.length})</h3>
                <div className="student-list-readonly">
                  {enrolledStudents.map((student, index) => (
                    <div key={index} className="student-item-readonly">
                      <span>{student.studentName} ({student.studentId})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default InstructorGrading;