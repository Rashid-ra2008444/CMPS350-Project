import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import CourseCard from '../components/common/CourseCard';
import '../styles/Common.css';

const Registration = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof localStorage === 'undefined') {
      console.error("localStorage is not available.");
      return;
    }

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

  const handleRegister = (course) => {
    if (window.confirm(`Are you sure you want to register for ${course.name}?`)) {
      // Simulate registration logic
      alert(`You have successfully registered for ${course.name}.`);
    }
  };

  const loadAllCourses = async (user) => {
    try {
      setIsLoading(true);

      let coursesData = [];
      const localCourses = localStorage.getItem('courseData');

      if (localCourses) {
        coursesData = JSON.parse(localCourses);
        console.log("Using courses data from localStorage (includes admin additions)");
      } else {
        console.log("No courses in localStorage, loading from file");
        const coursesResponse = await fetch(`${process.env.PUBLIC_URL}/data/courses.json`);
        coursesData = await coursesResponse.json();
      }

      let enrollmentData = JSON.parse(localStorage.getItem("enrollment"));

      if (!enrollmentData) {
        const enrollmentResponse = await fetch(`${process.env.PUBLIC_URL}/data/enrollment.json`);
        enrollmentData = await enrollmentResponse.json();
        localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
      }

      const currentUserName = user.username;
      console.log("Current user:", currentUserName);

      const userEnrollments = enrollmentData.filter(e =>
        e.studentName && e.studentName.toLowerCase() === currentUserName.toLowerCase()
      );

      console.log("User enrollments found:", userEnrollments.length);

      const enrolledCRNs = new Set();
      const enrolledCourseNums = new Set();

      userEnrollments.forEach(enrollment => {
        if (enrollment.crn) {
          enrolledCRNs.add(parseInt(enrollment.crn, 10));
        }
        enrolledCourseNums.add(parseInt(enrollment.courseNum, 10));
      });

      console.log("Already enrolled CRNs:", [...enrolledCRNs]);
      console.log("Already enrolled course numbers:", [...enrolledCourseNums]);

      const availableCourses = coursesData.filter(course => {
        const courseNum = parseInt(course.courseNum, 10);
        const courseCRN = parseInt(course.crn, 10);
        const isPending = course.status === "pending";

        const isAlreadyEnrolled = enrolledCRNs.has(courseCRN) || enrolledCourseNums.has(courseNum);

        if (isAlreadyEnrolled) {
          console.log(`Course ${courseNum} (CRN: ${courseCRN}) already enrolled, skipping`);
        }

        return isPending && !isAlreadyEnrolled;
      });

      console.log("Available pending courses for registration:", availableCourses.length);

      const coursesWithPrereqStatus = availableCourses.map(course => {
        const prereqStatus = getPrerequisiteStatus(course, userEnrollments, coursesData);

        const enrolledStudents = enrollmentData.filter(enrollment => {
          if (enrollment.crn && course.crn) {
            return parseInt(enrollment.crn, 10) === parseInt(course.crn, 10) &&
              enrollment.instructor === course.instructor;
          }
          return parseInt(enrollment.courseNum, 10) === parseInt(course.courseNum, 10) &&
            enrollment.instructor === course.instructor;
        });

        return {
          ...course,
          prereqStatus,
          enrolledStudents: enrolledStudents.length,
          isFull: enrolledStudents.length >= course.enrollment_maximum
        };
      });

      setAllCourses(coursesWithPrereqStatus);
      setFilteredCourses(coursesWithPrereqStatus);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading courses:", error);
      alert("Failed to load courses. Please try again later.");
      setIsLoading(false);
    }
  };

  const getPrerequisiteStatus = (course, userEnrollments, allCourses) => {
    if (course.prerequisite === "none" || course.prerequisite === "None") {
      return 'met';
    }

    const prereqCourse = allCourses.find(c => c.name === course.prerequisite);
    if (!prereqCourse) {
      return 'unknown';
    }

    let prereqEnrollment = null;

    if (prereqCourse.crn) {
      prereqEnrollment = userEnrollments.find(e =>
        e.crn && parseInt(e.crn, 10) === parseInt(prereqCourse.crn, 10)
      );
    }

    if (!prereqEnrollment) {
      prereqEnrollment = userEnrollments.find(e =>
        parseInt(e.courseNum, 10) === parseInt(prereqCourse.courseNum, 10)
      );
    }

    if (!prereqEnrollment) {
      return 'not-enrolled';
    }

    if (!prereqEnrollment.grade) {
      return 'in-progress';
    }

    if (prereqEnrollment.grade === 'F') {
      return 'failed';
    }

    return 'met';
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
    filterCourses(event.target.value.toLowerCase(), selectedCategory);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    filterCourses(searchTerm, event.target.value);
  };

  const filterCourses = (term, category) => {
    let filtered = allCourses;

    if (term) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term) ||
        course.crn.toString().includes(term) ||
        course.courseNum.toString().includes(term)
      );
    }

    if (category !== 'All') {
      filtered = filtered.filter(course => course.category === category);
    }

    setFilteredCourses(filtered);
  };

  const sidebarProps = {
    title: "Qatar University",
    buttons: [
      { label: "Courses", path: "/coursepage" },
      { label: "Study plan", path: "/learning-path" }
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
        <h2>Register a Course</h2>
        <div id="pendingCourses">
          {isLoading ? (
            <p>Loading courses...</p>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course, index) => {
              const isRegistrationDisabled =
                course.isFull || course.prereqStatus !== 'met';

              const additionalInfo = (
                <>
                  {course.isFull && <p className="full-warning">⚠️ Course is full</p>}
                  {course.prereqStatus !== 'met' && <p className="prereq-warning">⚠️ Prerequisite not completed</p>}
                  <p className="pending-notice">ℹ️ This course is pending approval</p>
                </>
              );

              const actions = [
                {
                  label: "Register",
                  className: "Register",
                  onClick: () => handleRegister(course),
                  disabled: isRegistrationDisabled
                }
              ];

              return (
                <CourseCard
                  key={`pending-${course.crn || course.courseNum}-${index}`}
                  course={course}
                  actions={actions}
                  showEnrollment={true}
                  additionalInfo={additionalInfo}
                />
              );
            })
          ) : (
            <p>No pending courses available for registration.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Registration;