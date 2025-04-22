"use client"

import { useState, useEffect } from "react"
import styles from "./admin-courses.module.css"
import CourseCard from "./CourseCard"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
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
      addCourseButton.addEventListener("click", () => {
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
      })
    }

    return () => {
      // Clean up event listener
      if (addCourseButton) {
        addCourseButton.removeEventListener("click", () => setShowAddForm(true))
      }
    }
  }, [])

  useEffect(() => {
    // Set up event listeners for search and filter
    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        setSearchTerm(e.target.value.toLowerCase().trim())
      })
    }

    const categorySelect = document.getElementById("courseCategory")
    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        setCategoryFilter(e.target.value)
      })
    }

    return () => {
      // Clean up event listeners
      if (searchInput) {
        searchInput.removeEventListener("input", (e) => {
          setSearchTerm(e.target.value.toLowerCase().trim())
        })
      }
      if (categorySelect) {
        categorySelect.removeEventListener("change", (e) => {
          setCategoryFilter(e.target.value)
        })
      }
    }
  }, [])

  // Apply filters whenever search term, category filter, or courses change
  useEffect(() => {
    filterCourses()
  }, [searchTerm, categoryFilter, courses])

  async function loadCourses() {
    try {
      const response = await fetch(`${BASE_URL}/api/courses`)
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      console.error("Error loading courses:", error)
    }
  }

  const filterCourses = () => {
    const filtered = courses.filter(course => {
      // Match by course name
      const nameMatch = course.name.toLowerCase().includes(searchTerm)
      
      // Match by course number
      const numMatch = course.courseNum.toString().includes(searchTerm)
      
      // Match by course code (e.g., "CMPS 350")
      const codeMatch = `${course.category} ${course.courseNum}`.toLowerCase().includes(searchTerm)
      
      // Match by instructor name
      const instructorMatch = course.instructor.toLowerCase().includes(searchTerm)
      
      // Handle category filtering
      const categoryMatch = categoryFilter === "all" || course.category === categoryFilter
      
      // Return true if any of the search conditions match AND the category matches
      return (nameMatch || numMatch || codeMatch || instructorMatch) && categoryMatch
    })
    
    setFilteredCourses(filtered)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewCourse({
      ...newCourse,
      [name]: value,
    })
  }

  const handleEditCourse = (course) => {
    setIsEditMode(true)
    setNewCourse({...course})
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

        if (response.ok) {
          setShowAddForm(false)
          loadCourses()
          alert("Course updated successfully!")
        } else {
          alert("Error updating course. Please try again.")
        }
      } else {
        // Add new course
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCourse),
        })

        if (response.ok) {
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
          loadCourses()

          alert("Course added successfully!")
        } else {
          alert("Error adding course. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error processing course:", error)
      alert("Error processing course. Please try again.")
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

      if (response.ok) {
        // Reload courses
        loadCourses()
        alert(`Course status updated to ${status}!`)
      } else {
        alert("Error updating course status. Please try again.")
      }
    } catch (error) {
      console.error("Error updating course status:", error)
      alert("Error updating course status. Please try again.")
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

      if (response.ok) {
        // Reload courses
        loadCourses();
        alert("Course deleted successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error deleting course: ${errorData.message || "Please try again."}`);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Network error. Please try again later.");
    }
  }

  // Filter courses by status
  const pendingCourses = filteredCourses.filter((course) => course.status === "pending")
  const validCourses = filteredCourses.filter((course) => course.status === "valid")
  const invalidCourses = filteredCourses.filter((course) => course.status === "invalid")

  return (
    <>
      <section className="banner">
        <h1 className="title">Welcome Admin</h1>
        <h2>Creating & Validation Courses</h2>
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
                onDelete={() => deleteCourse(course)}
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
                onEdit={handleEditCourse}
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
                onEdit={handleEditCourse}
                onDelete={() => deleteCourse(course)}
              />
            ))
          )}
        </div>
      </div>

      {showAddForm && (
        <div className={styles.formContainer}>
          <div className={styles.formBox}>
            <h3>{isEditMode ? "Edit Course" : "Add New Course"}</h3>
            <form onSubmit={handleSubmitCourse}>
              <div className={styles.formBoxContainer}>
                <label>
                  Name:
                  <input type="text" name="name" value={newCourse.name} onChange={handleInputChange} required />
                </label>
                <label>
                  Course Number:
                  <input
                    type="number"
                    name="courseNum"
                    value={newCourse.courseNum}
                    onChange={handleInputChange}
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
                    required
                  />
                </label>
                <label>
                  Category:
                  <select name="category" value={newCourse.category} onChange={handleInputChange}>
                    <option value="CMPS">Computer Science</option>
                    <option value="CMPE">Computer Engineering</option>
                    <option value="MATH">Mathematics</option>
                    <option value="GENG">General Engineering</option>
                  </select>
                </label>
                {isEditMode && (
                  <label>
                    Status:
                    <select name="status" value={newCourse.status} onChange={handleInputChange}>
                      <option value="pending">Pending</option>
                      <option value="valid">Valid</option>
                      <option value="invalid">Invalid</option>
                    </select>
                  </label>
                )}
              </div>
              <div className={styles.formButtons}>
                <button type="submit" className="pixel2">
                  {isEditMode ? "Update" : "Save"}
                </button>
                <button type="button" className="pixel2" onClick={() => setShowAddForm(false)}>
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