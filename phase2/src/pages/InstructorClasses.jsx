import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import '../styles/Common.css';
import '../styles/Instructor.css';

const InstructorClasses = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    loadInstructorClasses(user.username);
    
    // Check for admin updates when page gets focus
    const handleFocus = () => {
      loadInstructorClasses(user.username);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);

  const loadInstructorClasses = async (instructorName) => {
    try {
      setIsLoading(true);
      
      // Load courses data - first try localStorage
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
          
          // Store for future use
          localStorage.setItem('courseData', JSON.stringify(coursesData));
          localStorage.setItem('courses', JSON.stringify(coursesData));
        }
      }
      
      // Load enrollment data - always from localStorage first
      let enrollmentsData = [];
      const localEnrollments = localStorage.getItem('enrollment');
      
      if (localEnrollments) {
        console.log("Loading enrollments from localStorage");
        enrollmentsData = JSON.parse(localEnrollments);
      } else {
        try {
          console.log("No enrollments in localStorage, loading from file");
          const studentsResponse = await fetch("/data/enrollment.json");
          enrollmentsData = await studentsResponse.json();
          
          // Store data in localStorage for next time
          localStorage.setItem('enrollment', JSON.stringify(enrollmentsData));
        } catch (err) {
          console.warn("Could not load enrollment data, using empty array:", err);
        }
      }
      
      // Find courses taught by the instructor
      const instructorCourses = coursesData.filter(course => course.instructor === instructorName);
      
      // Process each course to add enrollment info
      const processedCourses = instructorCourses.map(course => {
        // Convert course number to integer for correct comparison
        const courseNum = parseInt(course.courseNum, 10);
        const courseCRN = parseInt(course.crn, 10);
        
        // Find students enrolled in the course using CRN (primary) or courseNum (fallback)
        const enrolledStudents = enrollmentsData.filter(enrollment => {
          // Try to match by CRN first
          if (enrollment.crn) {
            return parseInt(enrollment.crn, 10) === courseCRN && 
                  enrollment.instructor === instructorName;
          }
          // Fall back to courseNum if CRN not available
          return parseInt(enrollment.courseNum, 10) === courseNum && 
                enrollment.instructor === instructorName;
        });
        
        // Return course with enrollment count
        return {
          ...course,
          enrolledStudentCount: enrolledStudents.length,
          canGrade: course.status === 'valid'
        };
      });
      
      setClasses(processedCourses);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading courses:", error);
      setIsLoading(false);
    }
  };

  const handleViewGrades = (course) => {
    // Store course info for grading page
    localStorage.setItem('selectedCourse', course.courseNum);
    localStorage.setItem('selectedCRN', course.crn);
    
    // Navigate to grading page
    navigate('/instructor/grading');
  };

  // Sidebar configuration
  const sidebarProps = {
    title: "CMPS 350",
    showSearch: true,
    searchPlaceholder: "Search Classes"
  };

  return (
    <MainLayout
      title={`Welcome ${currentUser?.username || ''}`}
      subtitle="My Classes"
      sidebarProps={sidebarProps}
    >
      <div className="course-box">
        <h2>Current Classes</h2>
        <div id="classes-container">
          {isLoading ? (
            <p id="loading-message">Loading classes...</p>
          ) : classes.length > 0 ? (
            classes.map((course, index) => {
              // Determine course status class
              const statusClass = course.status === 'valid' ? 'status-valid' : 
                                course.status === 'pending' ? 'status-pending' : 'status-invalid';
              
              return (
                <div 
                  key={index} 
                  className="class-card"
                  data-course-num={course.courseNum}
                  data-crn={course.crn}
                >
                  <h3>{course.name} ({course.category} {course.courseNum})</h3>
                  <p>Category: {course.category}</p>
                  <p>Status: <span className={statusClass}>{course.status}</span></p>
                  <p>CRN: {course.crn}</p>
                  <p>Enrollment: {course.enrolledStudentCount}/{course.enrollment_maximum}</p>
                  <p><strong>Students Enrolled: {course.enrolledStudentCount}</strong></p>
                  
                  {course.canGrade ? (
                    <button 
                      className="view-grades-btn"
                      onClick={() => handleViewGrades(course)}
                    >
                      View & Submit Grades
                    </button>
                  ) : (
                    <p className="grading-notice">⚠️ Grading unavailable until course is approved</p>
                  )}
                </div>
              );
            })
          ) : (
            <p>You currently have no assigned courses.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default InstructorClasses;