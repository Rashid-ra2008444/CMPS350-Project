import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import CourseCard from '../components/common/CourseCard';
import '../styles/Common.css';

const CreateCourse = () => {
  const [courseData, setCourseData] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    courseNum: '',
    instructor: '',
    prerequisite: 'none',
    enrollment_maximum: 30,
    enrollment_actual: 0,
    category: 'CMPS',
    status: 'pending'
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Authenticate admin user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.status !== 'admin') {
      // Redirect to login if not an admin
      navigate('/login');
      return;
    }

    initializeApp();
  }, [navigate]);

  const initializeApp = async () => {
    try {
      const data = await loadCourseData();
      setCourseData(data);
      setFilteredCourses(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing app:", error);
      setIsLoading(false);
    }
  };

  const loadCourseData = async () => {
    const storedData = localStorage.getItem('courseData');
    if (storedData) {
      return JSON.parse(storedData);
    } else {
      try {
        const response = await fetch("/data/courses.json");
        const courses = await response.json();
        // Save to BOTH storage locations for consistency
        saveCourseData(courses);
        return courses;
      } catch (error) {
        console.error("Error fetching courses data:", error);
        return [];
      }
    }
  };

  const saveCourseData = (courses) => {
    // Save to courseData (admin primary source)
    localStorage.setItem('courseData', JSON.stringify(courses));
    
    // Also save to courses (student registration system)
    localStorage.setItem('courses', JSON.stringify(courses));
    
    console.log(`Saved ${courses.length} courses to both 'courseData' and 'courses' in localStorage`);
    
    // Update enrollment status to match course statuses
    updateEnrollmentStatusFlags(courses);
  };

  const updateEnrollmentStatusFlags = (courses) => {
    let enrollmentData = [];
    const localEnrollments = localStorage.getItem('enrollment');
    
    if (localEnrollments) {
      enrollmentData = JSON.parse(localEnrollments);
      console.log(`Found ${enrollmentData.length} enrollment records in localStorage`);
      
      // Map through enrollments and update course status
      const updatedEnrollments = enrollmentData.map(enrollment => {
        // Try to match by CRN first (this is the primary identifier)
        let matchingCourse = null;
        
        if (enrollment.crn) {
          // Convert CRN to integers for correct comparison
          const enrollmentCourseCrn = parseInt(enrollment.crn, 10);
          
          // Find matching course by CRN
          matchingCourse = courses.find(course => 
            parseInt(course.crn, 10) === enrollmentCourseCrn);
        }
        
        // Only if no match by CRN, try to match by courseNum AND instructor (both needed for uniqueness)
        if (!matchingCourse && enrollment.courseNum && enrollment.instructor) {
          const enrollmentCourseNum = parseInt(enrollment.courseNum, 10);
          
          // Find matching course by courseNum AND instructor to ensure we only match the right section
          matchingCourse = courses.find(course => 
            parseInt(course.courseNum, 10) === enrollmentCourseNum && 
            course.instructor === enrollment.instructor);
            
          // If we found a match by courseNum+instructor, update the CRN in the enrollment record
          if (matchingCourse) {
            enrollment.crn = matchingCourse.crn;
            console.log(`Updated enrollment CRN for courseNum ${enrollmentCourseNum} with instructor ${enrollment.instructor} to ${matchingCourse.crn}`);
          }
        }
        
        if (matchingCourse) {
          console.log(`Updating enrollment status for course ${matchingCourse.crn} to ${matchingCourse.status}`);
          
          // Return updated enrollment with course status
          return {
            ...enrollment,
            courseStatus: matchingCourse.status 
          };
        }
        return enrollment;
      });
      
      // Save updated enrollments
      localStorage.setItem('enrollment', JSON.stringify(updatedEnrollments));
      console.log(`Updated and saved ${updatedEnrollments.length} enrollment records`);
    } else {
      console.log("No enrollment data found in localStorage");
    }
  };

  const generateRandomCRN = () => {
    return Math.floor(10000 + Math.random() * 90000); 
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
    const filtered = courseData.filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(term) ||
                          course.instructor.toLowerCase().includes(term);
      const matchesCategory = category === 'all' || course.category === category;
      return matchesSearch && matchesCategory;
    });
    
    setFilteredCourses(filtered);
  };

  const handleAddCourse = () => {
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setNewCourse({
      name: '',
      courseNum: '',
      instructor: '',
      prerequisite: 'none',
      enrollment_maximum: 30,
      enrollment_actual: 0,
      category: 'CMPS',
      status: 'pending'
    });
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setNewCourse({
      ...newCourse,
      [id]: value
    });
  };

  const handleFormSubmit = () => {
    // Form validation
    if (!newCourse.name || !newCourse.courseNum || !newCourse.instructor) {
      alert("Please fill in all required fields.");
      return;
    }
    
    // Generate a unique CRN
    let isExistCrn = true;
    let newCrn = 0;
    
    while (isExistCrn) {
      // Generate a random CRN
      newCrn = generateRandomCRN();
      
      // Check if CRN already exists
      isExistCrn = courseData.some(course => parseInt(course.crn, 10) === newCrn);
      
      if (isExistCrn) {
        console.log(`CRN ${newCrn} already exists, generating a new one...`);
      } else {
        console.log(`Generated new CRN: ${newCrn}`);
        break;
      }
    }
    
    // Create new course object
    const courseToAdd = {
      ...newCourse,
      crn: newCrn,
      enrollment_maximum: parseInt(newCourse.enrollment_maximum, 10),
      courseNum: parseInt(newCourse.courseNum, 10)
    };
    
    // Add course to data
    const updatedCourses = [...courseData, courseToAdd];
    
    // Save to localStorage
    saveCourseData(updatedCourses);
    
    // Update state
    setCourseData(updatedCourses);
    setFilteredCourses(updatedCourses);
    
    // Close form
    setShowForm(false);
    
    // Reset new course data
    setNewCourse({
      name: '',
      courseNum: '',
      instructor: '',
      prerequisite: 'none',
      enrollment_maximum: 30,
      enrollment_actual: 0,
      category: 'CMPS',
      status: 'pending'
    });
    
    // Confirmation
    alert(`Course "${courseToAdd.name}" added successfully!`);
  };

  const handleEditCourse = (course) => {
    // Create a new course object with the updated data
    // This would open a form similar to the add course form but pre-filled with the course data
    // For now, we'll implement this as a stub function
    console.log("Edit course:", course);
    alert("Edit functionality would open a form to edit the course.");
  };

  const handleValidateCourse = (course) => {
    if (window.confirm(`Do you want to validate the course "${course.name}"?`)) {
      updateCourseStatus(course.crn, "valid");
    }
  };

  const handleInvalidateCourse = (course) => {
    if (window.confirm(`Do you want to invalidate the course "${course.name}"?`)) {
      updateCourseStatus(course.crn, "invalid");
    }
  };

  const handleDeleteCourse = (course) => {
    if (window.confirm(`Are you sure you want to delete "${course.name}"? This cannot be undone.`)) {
      // Filter out the course to delete
      const updatedCourses = courseData.filter(c => 
        !(parseInt(c.crn, 10) === parseInt(course.crn, 10)));
      
      // Save changes to localStorage
      saveCourseData(updatedCourses);
      
      // Update state
      setCourseData(updatedCourses);
      setFilteredCourses(updatedCourses);
      
      // Confirmation
      alert(`Course "${course.name}" deleted successfully!`);
    }
  };

  const updateCourseStatus = (courseCrn, status) => {
    // Find course using CRN
    const updatedCourses = courseData.map(c => {
      if (parseInt(c.crn, 10) === parseInt(courseCrn, 10)) {
        return { ...c, status };
      }
      return c;
    });
    
    // Save to localStorage (updates both keys and enrollment status)
    saveCourseData(updatedCourses);
    
    // Update state
    setCourseData(updatedCourses);
    setFilteredCourses(updatedCourses);
    
    // Confirmation
    alert(`Course status updated to ${status}.`);
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all course data? This will reload data from the original JSON file.")) {
      // Clear both course storage locations
      localStorage.removeItem('courseData');
      localStorage.removeItem('courses');
      
      // Also reset enrollment data
      if (window.confirm("Do you also want to reset enrollment data? This will clear all student registrations.")) {
        localStorage.removeItem('enrollment');
      }
      
      // Reload fresh data
      loadFreshData();
    }
  };

  const loadFreshData = async () => {
    try {
      // Load courses from file
      const response = await fetch("/data/courses.json");
      const courses = await response.json();
      
      // Save to localStorage
      saveCourseData(courses);
      
      // If enrollment was reset, load that too
      if (!localStorage.getItem('enrollment')) {
        const enrollmentResponse = await fetch("/data/enrollment.json");
        const enrollmentData = await enrollmentResponse.json();
        
        localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
        console.log("Reset enrollment data from file");
      }
      
      // Update state
      setCourseData(courses);
      setFilteredCourses(courses);
      
      // Confirmation
      alert("Data has been reset successfully!");
    } catch (error) {
      console.error("Error loading fresh data:", error);
      alert("Error loading fresh data. Please try again.");
    }
  };

  // Filter courses by status
  const pendingCourses = filteredCourses.filter(course => course.status === 'pending');
  const validCourses = filteredCourses.filter(course => course.status === 'valid');
  const invalidCourses = filteredCourses.filter(course => course.status === 'invalid');

  // Sidebar configuration
  const sidebarProps = {
    title: "CMPS 350",
    showSearch: true,
    searchPlaceholder: "Course Name",
    buttons: [
      { label: "Reset Data", path: "#", onClick: handleResetData }
    ]
  };

  return (
    <MainLayout
      title="Welcome Admin"
      subtitle="Creating & Validation Courses"
      sidebarProps={sidebarProps}
    >
      <div className="course-box">
        <div className="search-bar">
          <h2>Filter Courses</h2>
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Search by name or instructor" 
            value={searchTerm}
            onChange={handleSearch}
          />
          <select 
            id="courseCategory"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="all">All Category</option>
            <option value="CMPS">Computer Science</option>
            <option value="CMPE">Computer Engineering</option>
            <option value="MATH">Mathematics</option>
            <option value="GENG">General Engineering</option>
          </select>
          <button className="add-course" onClick={handleAddCourse}>Add Course</button>
          </div>
        
      </div>
      </MainLayout>
      );
    };

    export default CreateCourse;