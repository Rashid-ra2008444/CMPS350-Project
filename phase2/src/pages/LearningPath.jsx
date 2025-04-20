import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Common.css';
import '../styles/LearningPath.css';

const LearningPath = () => {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [inProgressCourses, setInProgressCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Authenticate user
      const currentUser = validateUserSession();
      if (!currentUser) return;
      
      // Load all required data
      await fetchAllData();
      
      // Set up the learning path for current student
      setupLearningPath(currentUser);
    } catch (error) {
      console.error('Initialization error:', error);
      alert('Error loading data. Please try again.');
    }
  };

  const validateUserSession = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'student') {
      navigate('/login');
      return null;
    }
    
    return currentUser;
  };

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      // Load courses data - try all possible localStorage sources
      let loadedCourses = false;
      let coursesData = [];
      
      // First try courseData (admin data)
      const adminCoursesStorage = localStorage.getItem('courseData');
      if (adminCoursesStorage) {
        coursesData = JSON.parse(adminCoursesStorage);
        console.log(`Loaded ${coursesData.length} courses from 'courseData' in localStorage`);
        loadedCourses = true;
      } 
      // Then try courses (registration system data)
      else {
        const registrationCoursesStorage = localStorage.getItem('courses');
        if (registrationCoursesStorage) {
          coursesData = JSON.parse(registrationCoursesStorage);
          console.log(`Loaded ${coursesData.length} courses from 'courses' in localStorage`);
          loadedCourses = true;
        }
      }
      
      // If no courses found in localStorage, load from file
      if (!loadedCourses) {
        const coursesResponse = await fetch('/data/courses.json');
        coursesData = await coursesResponse.json();
        console.log(`Loaded ${coursesData.length} courses from data file`);
      }
      
      setCourses(coursesData);
      
      // Priority to data stored in localStorage for enrollments
      const storedEnrollments = localStorage.getItem('enrollment');
      let enrollmentsData = [];
      
      if (storedEnrollments) {
        // Use data from localStorage
        enrollmentsData = JSON.parse(storedEnrollments);
        console.log(`Loaded ${enrollmentsData.length} enrollment records from localStorage`);
      } else {
        // Only if no data in localStorage, use the original file
        const enrollmentResponse = await fetch('/data/enrollment.json');
        enrollmentsData = await enrollmentResponse.json();
        console.log(`Loaded ${enrollmentsData.length} enrollment records from file`);
        
        // Store data in localStorage for next time
        localStorage.setItem('enrollment', JSON.stringify(enrollmentsData));
      }
      
      setEnrollments(enrollmentsData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const setupLearningPath = (user) => {
    const { username, password } = user;
    const studentId = password.toString();
    
    // Store current student info
    setCurrentStudent({ name: username, id: studentId });
    
    // Find student enrollments
    const studentEnrollments = enrollments.filter(
      enrollment => enrollment.studentName === username
    );
    
    console.log(`Found ${studentEnrollments.length} enrollments for student ${username}`);
    
    if (studentEnrollments.length === 0) {
      return;
    }
    
    // Process and display all course categories
    processCourseCategories(studentEnrollments);
  };

  const processCourseCategories = (studentEnrollments) => {
    // Count for different course types
    let completedList = [];
    let inProgressList = [];
    let pendingList = [];
    
    // Process enrolled courses (completed, in-progress, and pending)
    studentEnrollments.forEach(enrollment => {
      // Convert courseNum to integer for correct comparison
      enrollment.courseNum = parseInt(enrollment.courseNum, 10);
      
      // Find course info
      const course = courses.find(c => parseInt(c.courseNum, 10) === enrollment.courseNum);
      
      if (!course) {
        console.warn(`Course ${enrollment.courseNum} not found in courses data`);
        return;
      }
      
      console.log(`Processing enrollment for course ${course.courseNum} with status: ${course.status}`);
      console.log(`Enrollment courseStatus: ${enrollment.courseStatus || 'not set'}, has grade: ${!!enrollment.grade}`);
      
      // Check course status and grade
      if (enrollment.grade) {
        // Completed course (has a grade)
        completedList.push({
          ...course,
          ...enrollment
        });
      } 
      // Check both enrollment.courseStatus and course.status for pending
      else if (enrollment.courseStatus === 'pending' || course.status === 'pending') {
        // Pending course
        pendingList.push({
          ...course,
          ...enrollment
        });
      } 
      else {
        // In-progress course (not pending and no grade)
        inProgressList.push({
          ...course,
          ...enrollment
        });
      }
    });
    
    console.log(`Processed ${completedList.length} completed courses, ${inProgressList.length} in-progress courses, and ${pendingList.length} pending courses`);
    
    setCompletedCourses(completedList);
    setInProgressCourses(inProgressList);
    setPendingCourses(pendingList);
  };

  const getGradeClass = (grade) => {
    if (!grade) return '';
    
    // Convert grade to uppercase to handle case differences
    const upperGrade = grade.toString().toUpperCase();
    
    if (upperGrade === 'A') {
      return 'grade-a';
    } else if (upperGrade === 'B+' || upperGrade === 'B') {
      return 'grade-b';
    } else if (upperGrade === 'C+' || upperGrade === 'C') {
      return 'grade-c';
    } else if (upperGrade === 'D+' || upperGrade === 'D') {
      return 'grade-d';
    } else if (upperGrade === 'F') {
      return 'grade-f';
    } else {
      return '';
    }
  };

  const handleCoursePage = () => {
    navigate('/coursepage');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="banner2"></div>
      <div className="header">
        <div>
          <h1>Learning Path</h1>
          <p>Track your academic progress</p>
        </div>
        <div className="student-info">
          <h3 id="student-name">{currentStudent?.name || 'Loading...'}</h3>
          <p id="student-id">Student ID: {currentStudent?.id || 'Loading...'}</p>
        </div>
        <div>
          <button className="coursesBUT" onClick={handleCoursePage}>Course Page</button>
          <button className="lougBUT" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <h2>Completed Courses</h2>
      <table className="courses-table" id="completed-courses">
        <thead>
          <tr>
            <th>Course Number</th>
            <th>Course Name</th>
            <th>Grade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {completedCourses.length > 0 ? (
            completedCourses.map((course, index) => (
              <tr key={`completed-${index}`}>
                <td>{course.category} {course.courseNum}</td>
                <td>{course.name}</td>
                <td className={getGradeClass(course.grade)}>{course.grade}</td>
                <td><span className="status-pill status-completed">Completed</span></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="no-courses">No courses in this category</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>In-Progress Courses</h2>
      <table className="courses-table" id="in-progress-courses">
        <thead>
          <tr>
            <th>Course Number</th>
            <th>Course Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inProgressCourses.length > 0 ? (
            inProgressCourses.map((course, index) => (
              <tr key={`in-progress-${index}`}>
                <td>{course.category} {course.courseNum}</td>
                <td>{course.name}</td>
                <td><span className="status-pill status-in-progress">In Progress</span></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="no-courses">No courses in this category</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>Pending Courses</h2>
      <table className="courses-table" id="pending-courses">
        <thead>
          <tr>
            <th>Course Number</th>
            <th>Course Name</th>
            <th>Start Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pendingCourses.length > 0 ? (
            pendingCourses.map((course, index) => {
              // Use current date for enrollment date if not available
              const enrollmentDate = course.enrollmentDate || new Date().toLocaleDateString();
              
              return (
                <tr key={`pending-${index}`} className="pending-row">
                  <td>{course.category} {course.courseNum}</td>
                  <td>{course.name}</td>
                  <td>{enrollmentDate}</td>
                  <td><span className="status-pill status-pending">Pending Approval</span></td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" className="no-courses">No courses in this category</td>
            </tr>
          )}
        </tbody>
      </table>
      
      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificant Work
        2025. All rights reserved
      </footer>
      
      {/* Walking dog animation */}
      <div className="walking-dog">
        <img
          src="https://th.bing.com/th/id/R.d3ced9489ad92112ec192b9b0a157abb?rik=xS4EjY43yu7E5Q&riu=http%3A%2F%2F24.media.tumblr.com%2F25ec1da1ceb3d8c59ff61abda466e66d%2Ftumblr_ms7532YHD61sfs2qco1_500.gif&ehk=HXsgue0NnAnJ%2FFqo9x0PQo1zFBZD6czkgM4kaC78jkU%3D&risl=&pid=ImgRaw&r=0"
          alt="Walking dog animation"
        />
      </div>
    </div>
  );
};

export default LearningPath;