"use client"

import { useState, useEffect } from "react"
import styles from "./admin-courses.module.css"
import CourseCard from "./CourseCard"

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newCourse, setNewCourse] = useState({
    name: "",
    courseNum: "",
    instructor: "",
    prerequisite: "none",
    enrollment_maximum: 30,
    enrollment_actual: 0,
    category: "CMPS",
    status: "pending",
    crn: Math.floor(10000 + Math.random() * 90000),
  })

  useEffect(() => {
    // Load courses
    loadCourses()

    // Add event listener for add course button
    const addCourseButton = document.querySelector(".add-course")
    if (addCourseButton) {
      addCourseButton.addEventListener("click", handleAddCourseClick)
    }

    // Set up event listeners for search and filter
    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
      searchInput.addEventListener("input", handleSearchInput)
      // Initialize with any existing value
      if (searchInput.value) {
        setSearchTerm(searchInput.value.toLowerCase().trim())
      }
    }

    const categorySelect = document.getElementById("courseCategory")
    if (categorySelect) {
      categorySelect.addEventListener("change", handleCategoryChange)
      // Initialize with current selected value
      if (categorySelect.value) {
        setCategoryFilter(categorySelect.value)
      }
    }

    return () => {
      // Clean up event listeners
      if (addCourseButton) {
        addCourseButton.removeEventListener("click", handleAddCourseClick)
      }
      if (searchInput) {
        searchInput.removeEventListener("input", handleSearchInput)
      }
      if (categorySelect) {
        categorySelect.removeEventListener("change", handleCategoryChange)
      }
    }
  }, [])

  // Apply filters whenever search term, category filter, or courses change
  useEffect(() => {
    filterCourses()
  }, [searchTerm, categoryFilter, courses])

  const handleAddCourseClick = () => {
    setIsEditMode(false)
    setNewCourse({
      name: "",
      courseNum: "",
      instructor: "",
      prerequisite: "none",
      enrollment_maximum: 30,
      enrollment_actual: 0,
      category: "CMPS",
      status: "pending",
      crn: Math.floor(10000 + Math.random() * 90000),
    })
    setShowAddForm(true)
  }

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value.toLowerCase().trim())
  }

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value)
  }

  async function loadCourses() {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/courses")
      
      if (!response.ok) {
        throw new Error("Failed to fetch courses")
      }
      
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      console.error("Error loading courses:", error)
      setError("Failed to load courses. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    if (!courses || courses.length === 0) {
      setFilteredCourses([]);
      return;
    }
    
    const filtered = courses.filter(course => {
      // Make everything lowercase for case-insensitive search
      const searchTermLower = searchTerm.toLowerCase();
      
      // Safe property access with fallbacks to empty strings
      const courseName = (course.name || "").toLowerCase();
      const courseNum = course.courseNum !== undefined ? course.courseNum.toString() : "";
      const courseCategory = (course.category || "").toLowerCase();
      const courseInstructor = (course.instructor || "").toLowerCase();
      
      // Match by course name
      const nameMatch = courseName.includes(searchTermLower);
      
      // Match by course number
      const numMatch = courseNum.includes(searchTermLower);
      
      // Match by course code (e.g., "CMPS 350")
      const codeMatch = `${courseCategory} ${courseNum}`.includes(searchTermLower);
      
      // Match by instructor name
      const instructorMatch = courseInstructor.includes(searchTermLower);
      
      // Handle category filtering
      const categoryMatch = categoryFilter === "all" || course.category === categoryFilter;
      
      // Return true if any of the search conditions match AND the category matches
      return (nameMatch || numMatch || codeMatch || instructorMatch) && categoryMatch;
    });
    
    setFilteredCourses(filtered);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // For number fields, convert the value to a number
    const processedValue = ["courseNum", "enrollment_maximum", "enrollment_actual", "crn"].includes(name) 
      ? Number(value) 
      : value
      
    setNewCourse({
      ...newCourse,
      [name]: processedValue,
    })
  }

  const handleEditCourse = (course, isValidCourse = false) => {
    setIsEditMode(true)
    setNewCourse({...course, isValidCourse})
    setShowAddForm(true)
  }

  const handleSubmitCourse = async (e) => {
    e.preventDefault()
    
    try {
      if (isEditMode) {
        // Update existing course
        const response = await fetch(`/api/courses/${newCourse.crn}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCourse),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update course")
        }

        setShowAddForm(false)
        await loadCourses()
        alert("Course updated successfully!")
      } else {
        // Add new course - ensure numeric fields are numbers
        const courseToAdd = {
          ...newCourse,
          courseNum: Number(newCourse.courseNum),
          enrollment_maximum: Number(newCourse.enrollment_maximum),
          enrollment_actual: Number(newCourse.enrollment_actual),
          crn: Number(newCourse.crn)
        }
        
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(courseToAdd),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add course")
        }

        // Reset form and hide it
        setNewCourse({
          name: "",
          courseNum: "",
          instructor: "",
          prerequisite: "none",
          enrollment_maximum: 30,
          enrollment_actual: 0,
          category: "CMPS",
          status: "pending",
          crn: Math.floor(10000 + Math.random() * 90000),
        })
        setShowAddForm(false)

        // Reload courses
        await loadCourses()
        alert("Course added successfully!")
      }
    } catch (error) {
      console.error("Error processing course:", error)
      alert(`Error: ${error.message || "Failed to process course"}`)
    }
  }

  const validateCourse = async (course, status) => {
    try {
      const updatedCourse = { ...course, status }

      const response = await fetch(`/api/courses/${course.crn}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCourse),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update course status")
      }

      // Reload courses
      await loadCourses()
      alert(`Course status updated to ${status}!`)
    } catch (error) {
      console.error("Error updating course status:", error)
      alert(`Error: ${error.message || "Failed to update course status"}`)
    }
  }

  async function deleteCourse(course) {
    // Ask for confirmation before deleting
    if (!confirm(`Are you sure you want to delete "${course.name}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/courses/${course.crn}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete course")
      }

      // Reload courses
      await loadCourses();
      alert("Course deleted successfully!");
    } catch (error) {
      console.error("Error deleting course:", error);
      alert(`Error: ${error.message || "Failed to delete course"}`);
    }
  }

  // Filter courses by status
  const pendingCourses = filteredCourses.filter((course) => course.status === "pending")
  const validCourses = filteredCourses.filter((course) => course.status === "valid")
  const invalidCourses = filteredCourses.filter((course) => course.status === "invalid")

  if (loading) {
    return (
      <section className="banner">
        <h1>Loading courses...</h1>
      </section>
    )
  }

  if (error) {
    return (
      <section className="banner" style={{ color: "red" }}>
        <h1>Error: {error}</h1>
        <button onClick={loadCourses}>Retry</button>
      </section>
    )
  }

  return (
    <>
      <section className="banner">
        <h1 className="title">Welcome Admin</h1>
        <h2>Creating & Validating Courses</h2>
      </section>

      <div className="course-box">
        <h2>Pending Courses</h2>
        <div className={styles.coursesGrid}>
          {pendingCourses.length === 0 ? (
            <p className={styles.noCourses}>No pending courses found</p>
          ) : (
            pendingCourses.map((course) => (
              <CourseCard
                key={course.crn}
                course={course}
                onEdit={handleEditCourse}
                onValidate={() => validateCourse(course, "valid")}
                onInvalidate={() => validateCourse(course, "invalid")}
                // onDelete={() => deleteCourse(course)}
              />
            ))
          )}
        </div>
      </div>

      <div className="course-box">
        <h2>Valid Courses</h2>
        <div className={styles.coursesGrid}>
          {validCourses.length === 0 ? (
            <p className={styles.noCourses}>No valid courses found</p>
          ) : (
            validCourses.map((course) => (
              <CourseCard
                key={course.crn}
                course={course}
                onEdit={(course) => handleEditCourse(course, true)}
                onDelete={() => deleteCourse(course)}
              />
            ))
          )}
        </div>
      </div>

      <div className="course-box">
        <h2>Invalid Courses</h2>
        <div className={styles.coursesGrid}>
          {invalidCourses.length === 0 ? (
            <p className={styles.noCourses}>No invalid courses found</p>
          ) : (
            invalidCourses.map((course) => (
              <CourseCard
                key={course.crn}
                course={course}
                onDelete={() => deleteCourse(course)}
              />
            ))
          )}
        </div>
      </div>

      {showAddForm && (
        <div className={styles.formContainer}>
          <div className={styles.formBox}>
          <h3>
              {isEditMode ? 
                (newCourse.isValidCourse ? "Edit Instructor Name" : "Edit Course") : 
                "Add New Course"
              }
            </h3>
            <form onSubmit={handleSubmitCourse}>
              <div className={styles.formBoxContainer}>
              <label>
                  Name:
                  <input 
                    type="text" 
                    name="name" 
                    value={newCourse.name} 
                    onChange={handleInputChange} 
                    readOnly={newCourse.isValidCourse}  
                    required 
                  />
                </label>
                <label>
                  Course Number:
                  <input
                    type="number"
                    name="courseNum"
                    value={newCourse.courseNum}
                    onChange={handleInputChange}
                    readOnly={newCourse.isValidCourse}  
                    required
                  />
                </label>
                <label>
                  Instructor:
                  <input
                    type="text"
                    name="instructor"
                    value={newCourse.instructor}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Prerequisite:
                  <input
                    type="text"
                    name="prerequisite"
                    value={newCourse.prerequisite}
                    onChange={handleInputChange}
                    readOnly={newCourse.isValidCourse}  
                    placeholder="none"
                  />
                </label>
                <label>
                  Max Enrollment:
                  <input
                    type="number"
                    name="enrollment_maximum"
                    value={newCourse.enrollment_maximum}
                    onChange={handleInputChange}
                    readOnly={newCourse.isValidCourse}  
                    required
                  />
                </label>
                <label>
                  Category:
                  <select 
                    name="category" 
                    value={newCourse.category} 
                    onChange={handleInputChange}
                    disabled={newCourse.isValidCourse}  
                  >
                    <option value="CMPS">Computer Science</option>
                    <option value="CMPE">Computer Engineering</option>
                    <option value="MATH">Mathematics</option>
                    <option value="GENG">General Engineering</option>
                  </select>
                </label>
                {/* {isEditMode && (
                  <label>
                    Status:
                    <select 
                      name="status" 
                      value={newCourse.status} 
                      onChange={handleInputChange}
                      disabled={newCourse.isValidCourse}
                      
                    >
                      <option value="pending">Pending</option>
                      <option value="valid">Valid</option>
                      <option value="invalid">Invalid</option>
                    </select>
                  </label> */}
                {/* )} */}
                {/* <label>
                  CRN:
                  <input
                    type="number"
                    name="crn"
                    value={newCourse.crn}
                    onChange={handleInputChange}
                    readOnly={isEditMode}
                    required
                  />
                </label> */}
              </div>
              <div className={styles.formButtons}>
                <button type="submit">
                  {isEditMode ? "Update" : "Save"}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificant Work 2025. All rights reserved
      </footer>
    </>
  )
}