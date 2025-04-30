"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./instructor-classes.module.css"

export default function InstructorClasses() {
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem("currentUser"))
    if (!currentUser) return
    setUser(currentUser)

    // Load instructor classes
    loadInstructorClasses(currentUser.username)

    // Add search input event listener
    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
      searchInput.addEventListener("input", (e) => setSearchTerm(e.target.value))
    }

    return () => {
      // Clean up event listener
      if (searchInput) {
        searchInput.removeEventListener("input", (e) => setSearchTerm(e.target.value))
      }
    }
  }, [])

  const loadInstructorClasses = async (instructorName) => {
    try {
      // Fetch courses
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()

      // Fetch enrollments
      const enrollmentsResponse = await fetch("/api/enrollments")
      const enrollmentData = await enrollmentsResponse.json()

      // Find courses taught by the instructor
      const instructorCourses = coursesData.filter((course) => course.instructor === instructorName)

      // Process courses with enrollment data
      const processedClasses = instructorCourses.map((course) => {
        // Find students enrolled in this course
        const enrolledStudents = enrollmentData.filter((enrollment) => {
          if (enrollment.crn) {
            return (
              Number.parseInt(enrollment.crn, 10) === Number.parseInt(course.crn, 10) &&
              enrollment.instructor === instructorName
            )
          }
          return (
            Number.parseInt(enrollment.courseNum, 10) === Number.parseInt(course.courseNum, 10) &&
            enrollment.instructor === instructorName
          )
        })

        return {
          ...course,
          enrolledStudents: enrolledStudents.length,
        }
      })

      setClasses(processedClasses)
    } catch (error) {
      console.error("Error loading classes:", error)
    }
  }

  

  const handleViewGrades = (course) => {
    // Store selected course for grading page
    localStorage.setItem("selectedCourse", course.courseNum)
    localStorage.setItem("selectedCRN", course.crn)
    router.push("/instructor/grading")
  }

  // Filter classes by search term
  const filteredClasses = classes.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseNum.toString().includes(searchTerm),
  )

  return (
    <>
      <section className="banner">
        <h1 className="title">
          Welcome <span id="instructor-name">{user?.username}</span>
        </h1>
        <h2>My Classes</h2>
      </section>

      <div className="course-box">
        <h2>Current Classes</h2>
        <div id="classes-container" className={styles.classesGrid}>
          {filteredClasses.length === 0 ? (
            <p>You currently have no assigned courses.</p>
          ) : (
            filteredClasses.map((course, index) => {
              // Determine course status class
              const statusClass =
                course.status === "valid"
                  ? "status-valid"
                  : course.status === "pending"
                    ? "status-pending"
                    : "status-invalid"

              // Determine if grading is allowed (only for valid courses)
              const canGrade = course.status === "valid"

              return (
                <div key={index} className="class-card" data-course-num={course.courseNum} data-crn={course.crn}>
                  <h3>
                    {course.name} ({course.category} {course.courseNum})
                  </h3>
                  <p>Category: {course.category}</p>
                  <p>
                    Status: <span className={statusClass}>{course.status}</span>
                  </p>
                  <p>CRN: {course.crn}</p>
                  <p>
                    Enrollment: {course.enrolledStudents}/{course.enrollment_maximum}
                  </p>
                  <p>
                    <strong>Students Enrolled: {course.enrolledStudents}</strong>
                  </p>

                  {canGrade ? (
                    <button className="view-grades-btn" onClick={() => handleViewGrades(course)}>
                      View & Submit Grades
                    </button>
                  ) : (
                    <p className={styles.gradingNotice}>⚠️ Grading unavailable until course is approved</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificant Work 2025. All rights reserved
      </footer>
    </>
  )
}
