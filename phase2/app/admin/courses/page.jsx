"use client"

import { useState, useEffect } from "react"
import styles from "./admin-courses.module.css"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
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

    // Add event listeners
    const addCourseButton = document.querySelector(".add-course")
    if (addCourseButton) {
      addCourseButton.addEventListener("click", () => setShowAddForm(true))
    }

    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
      searchInput.addEventListener("input", filterCourses)
    }

    const categorySelect = document.getElementById("courseCategory")
    if (categorySelect) {
      categorySelect.addEventListener("change", filterCourses)
    }

    return () => {
      // Clean up event listeners
      if (addCourseButton) {
        addCourseButton.removeEventListener("click", () => setShowAddForm(true))
      }
      if (searchInput) {
        searchInput.removeEventListener("input", filterCourses)
      }
      if (categorySelect) {
        categorySelect.removeEventListener("change", filterCourses)
      }
    }
  }, [])

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
    // This will be implemented for filtering courses
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewCourse({
      ...newCourse,
      [name]: value,
    })
  }

  const handleAddCourse = async (e) => {
    e.preventDefault()

    try {
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
    } catch (error) {
      console.error("Error adding course:", error)
      alert("Error adding course. Please try again.")
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
  const pendingCourses = courses.filter((course) => course.status === "pending")
  const validCourses = courses.filter((course) => course.status === "valid")
  const invalidCourses = courses.filter((course) => course.status === "invalid")

  return (
    <>
      <section className="banner">
        <h1 className="title">Welcome Admin</h1>
        <h2>Creating & Validation Courses</h2>
      </section>

      <div className="course-box">
        <h2>Pending</h2>
        <div id="pendingCourses" className={styles.coursesGrid}>
          {pendingCourses.length === 0 ? (
            <p>No pending courses.</p>
          ) : (
            pendingCourses.map((course, index) => (
              <div key={index} className="box">
                <div className="course-content">
                  <h3>
                    {course.name} ({course.category} {course.courseNum})
                  </h3>
                  <p>
                    <strong>Instructor:</strong> {course.instructor}
                  </p>
                  <p>
                    <strong>Prerequisite:</strong> {course.prerequisite}
                  </p>
                  <p>
                    <strong>Enrollment Maximum:</strong> {course.enrollment_maximum}
                  </p>
                  <p>
                    <strong>Enrollment Actual:</strong> {course.enrollment_actual}
                  </p>
                  <p>
                    <strong>Status:</strong> <span className="status-pending">{course.status}</span>
                  </p>
                  <p>
                    <strong>CRN:</strong> {course.crn}
                  </p>
                </div>
                <div className="button-container">
                  <button className="edit-btn pixel2">Edit</button>
                  <button className="validate-btn pixel2" onClick={() => validateCourse(course, "valid")}>
                    Validate
                  </button>
                  <button className="invalid-btn pixel2" onClick={() => validateCourse(course, "invalid")}>
                    Invalidate
                  </button>
                  <button className="delete-btn pixel2" onClick={() => deleteCourse(course)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="course-box">
        <h2>Valid Course</h2>
        <div id="validCourses" className={styles.coursesGrid}>
          {validCourses.length === 0 ? (
            <p>No valid courses.</p>
          ) : (
            validCourses.map((course, index) => (
              <div key={index} className="box">
                <div className="course-content">
                  <h3>
                    {course.name} ({course.category} {course.courseNum})
                  </h3>
                  <p>
                    <strong>Instructor:</strong> {course.instructor}
                  </p>
                  <p>
                    <strong>Prerequisite:</strong> {course.prerequisite}
                  </p>
                  <p>
                    <strong>Enrollment Maximum:</strong> {course.enrollment_maximum}
                  </p>
                  <p>
                    <strong>Enrollment Actual:</strong> {course.enrollment_actual}
                  </p>
                  <p>
                    <strong>Status:</strong> <span className="status-valid">{course.status}</span>
                  </p>
                  <p>
                    <strong>CRN:</strong> {course.crn}
                  </p>
                </div>
                <div className="button-container">
                  <button className="delete-btn pixel2" onClick={() => deleteCourse(course)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="course-box">
        <h2>Invalid Course</h2>
        <div id="invalidCourses" className={styles.coursesGrid}>
          {invalidCourses.length === 0 ? (
            <p>No invalid courses.</p>
          ) : (
            invalidCourses.map((course, index) => (
              <div key={index} className="box">
                <div className="course-content">
                  <h3>
                    {course.name} ({course.category} {course.courseNum})
                  </h3>
                  <p>
                    <strong>Instructor:</strong> {course.instructor}
                  </p>
                  <p>
                    <strong>Prerequisite:</strong> {course.prerequisite}
                  </p>
                  <p>
                    <strong>Enrollment Maximum:</strong> {course.enrollment_maximum}
                  </p>
                  <p>
                    <strong>Enrollment Actual:</strong> {course.enrollment_actual}
                  </p>
                  <p>
                    <strong>Status:</strong> <span className="status-invalid">{course.status}</span>
                  </p>
                  <p>
                    <strong>CRN:</strong> {course.crn}
                  </p>
                </div>
                <div className="button-container">
                  <button className="delete-btn pixel2" onClick={() => deleteCourse(course)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddForm && (
        <div className={styles.formContainer}>
          <div className={styles.formBox}>
            <h3>Add New Course</h3>
            <form onSubmit={handleAddCourse}>
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
              </div>
              <div className={styles.formButtons}>
                <button type="submit" className="pixel2">
                  Save
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
