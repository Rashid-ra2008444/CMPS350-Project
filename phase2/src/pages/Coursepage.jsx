import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import CourseCard from '../components/common/CourseCard';
import '../styles/Common.css';

const Coursepage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [validCourses, setValidCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    if (user.status !== 'student') {
      navigate('/login');
      return;
    }

    setCurrentUser(user);
    loadAllCourses(user);
  }, [navigate]);

  const loadAllCourses = async (user) => {
    try {
      setIsLoading(true);
      
      // Load courses data
      let coursesData = [];
      const adminCoursesStorage = localStorage.getItem('courseData');
      
      if (adminCoursesStorage) {
        coursesData = JSON.parse(adminCoursesStorage);
        console.log(`Loaded ${coursesData.length} courses from 'courseData' in localStorage`);
      } else {
        const registrationCoursesStorage = localStorage.getItem('courses');
        if (registrationCoursesStorage) {
          coursesData = JSON.parse(registrationCoursesStorage);
          console.log(`Loaded ${coursesData.length} courses from 'courses' in localStorage`);
        } else {
          console.log("No courses in localStorage, loading from file");
          const coursesResponse = await fetch("/data/courses.json");
          coursesData = await coursesResponse.json();
          console.log(`Loaded ${coursesData.length} courses from data file`);
        }
      }

      // Load enrollment data
      let enrollmentData = [];
      const localEnrollments = localStorage.getItem('enrollment');

      if (localEnrollments) {
        enrollmentData = JSON.parse(localEnrollments);
        console.log(`Found ${enrollmentData.length} enrollment records in localStorage`);
      } else {
        try {
          console.log("No enrollment data in localStorage, loading from file");
          const studentsResponse = await fetch("/data/enrollment.json");
          enrollmentData = await studentsResponse.json();
          console.log(`Loaded ${enrollmentData.length} enrollment records from file`);

          // Store data in localStorage for next time
          localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
        } catch (err) {
          console.warn("Could not load enrollment data, using empty array:", err);
          enrollmentData = [];
        }
      }

      // Find student enrollments
      console.log(`Looking for enrollments for student: '${user.username}'`);
      const studentCourses = enrollmentData.filter(enrollment => {
        const match = enrollment.studentName && 
                    enrollment.studentName.toLowerCase() === user.username.toLowerCase();
        if (match) {
          console.log(`Found enrollment for course ${enrollment.courseNum} ${enrollment.crn ? `(CRN: ${enrollment.crn})` : ''}`);
        }
        return match;
      });
      
      console.log(`Found ${studentCourses.length} enrollments for this student`);
      
      // Process student courses
      const pendingList = [];
      const validList = [];
      
      studentCourses.forEach(enrollment => {
        console.log(`Checking enrollment for course ${enrollment.courseNum} with status: ${enrollment.courseStatus || 'unknown'}`);
        
        // Try to find course by CRN first (preferred)
        let course = null;
        
        if (enrollment.crn) {
          course = coursesData.find(c => parseInt(c.crn, 10) === parseInt(enrollment.crn, 10));
          if (course) {
            console.log(`Found course by CRN ${enrollment.crn}`);
          }
        }
        
        // If not found by CRN, fallback to courseNum (backward compatibility)
        if (!course) {
          course = coursesData.find(c => parseInt(c.courseNum, 10) === parseInt(enrollment.courseNum, 10));
          if (course) {
            console.log(`Found course by courseNum ${enrollment.courseNum}`);
            
            // Update enrollment with CRN if missing
            if (!enrollment.crn && course.crn) {
              enrollment.crn = course.crn;
              console.log(`Updated enrollment with CRN ${course.crn}`);
            }
          }
        }
        
        if (course) {
          console.log(`Found course ${course.courseNum} with status: ${course.status}`);
          
          // Add enrollment info to course object
          const courseWithInfo = {
            ...course,
            grade: enrollment.grade,
            instructor: enrollment.instructor || course.instructor,
            crn: course.crn || enrollment.crn
          };
          
          console.log(`Course ${course.courseNum} instructor set to:`, courseWithInfo.instructor);
          
          // Check if course is pending or valid
          const isPending = enrollment.courseStatus === 'pending' || course.status === 'pending';
          const isValid = course.status === 'valid';
          const hasGrade = enrollment.grade !== null && enrollment.grade !== undefined;
          
          if (isPending) {
            console.log(`Course ${course.courseNum} is pending, adding to pending list`);
            pendingList.push(courseWithInfo);
          } 
          // Only add to valid courses if it has no grade yet
          else if (isValid && !hasGrade) {
            console.log(`Course ${course.courseNum} is valid and has no grade, adding to valid list`);
            validList.push(courseWithInfo);
          } 
          else if (hasGrade) {
            console.log(`Course ${course.courseNum} has grade ${enrollment.grade}, skipping (completed course)`);
          }
          else {
            console.log(`Course ${course.courseNum} is neither pending nor valid (status: ${course.status}), skipping`);
          }
        } else {
          console.log(`Could not find course data for course ${enrollment.courseNum}`);
        }
      });

      setPendingCourses(pendingList);
      setValidCourses(validList);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading courses:", error);
      console.error("Stack trace:", error.stack);
      setIsLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  // Filter pending courses
  const filteredPendingCourses = pendingCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm) || 
                          course.category.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter valid courses
  const filteredValidCourses = validCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm) || 
                          course.category.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sidebar configuration
  const sidebarProps = {
    title: "Qatar University",
    buttons: [
      { label: "Study plan", path: "/learning-path" },
      { label: "Register Courses", path: "/registration" }
    ],
    logoImage: "/img/stevq.png"
  };

  return (
    <MainLayout
      title={`Welcome ${currentUser?.username || ''}`}
      sidebarProps={sidebarProps}
    >
      <div className="course-box">
        <div className="search-bar">
          <h2>Courses</h2>
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Course Name" 
            value={searchTerm}
            onChange={handleSearch}
          />
          <select 
            id="subjectSelect"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="All">All</option>
            <option value="MATH">MATH</option>
            <option value="CMPS">CMPS</option>
            <option value="CMPE">CMPE</option>
            <option value="GENG">GENG</option>
          </select>
        </div>
      </div>

      <div className="course-box">
        <h2>Current Courses</h2>
        <div id="validCourses">
          {isLoading ? (
            <p>Loading courses...</p>
          ) : filteredValidCourses.length > 0 ? (
            filteredValidCourses.map((course, index) => (
              <CourseCard 
                key={`valid-${course.crn || course.courseNum}-${index}`}
                course={course}
              />
            ))
          ) : (
            <p>You have no approved courses.</p>
          )}
        </div>
      </div>

      <div className="course-box">
        <h2>Pending Courses</h2>
        <div id="pendingCourses">
          {isLoading ? (
            <p>Loading courses...</p>
          ) : filteredPendingCourses.length > 0 ? (
            filteredPendingCourses.map((course, index) => (
              <CourseCard 
                key={`pending-${course.crn || course.courseNum}-${index}`}
                course={course}
              />
            ))
          ) : (
            <p>You have no pending courses.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Coursepage;