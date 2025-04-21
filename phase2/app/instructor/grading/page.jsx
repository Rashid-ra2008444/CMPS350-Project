"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./grading.module.css"

export default function InstructorGrading() {
  const [user, setUser] = useState(null)
  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState({})
  const [successMessage, setSuccessMessage] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem("currentUser"))
    if (!currentUser) {
      router.push("/")
      return
    }
    setUser(currentUser)

    // Get the selected course number and CRN
    const selectedCourseNum = Number.parseInt(localStorage.getItem("selectedCourse"), 10)
    const selectedCRN = Number.parseInt(localStorage.getItem("selectedCRN"), 10)

    if (!selectedCourseNum && !selectedCRN) {
      router.push("/instructor/classes")
      return
    }

    // Load course data for grading
    loadCourseForGrading(currentUser.username, selectedCourseNum, selectedCRN)
  }, [router])

  const loadCourseForGrading = async (instructorName, courseNum, courseCRN) => {
    try {
      // Fetch courses
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()

      // Find the selected course
      let selectedCourse = null

      if (courseCRN) {
        selectedCourse = coursesData.find(
          (c) => Number.parseInt(c.crn, 10) === courseCRN && c.instructor === instructorName,
        )
      }

      // If no course found by CRN, try by courseNum
      if (!selectedCourse && courseNum) {
        selectedCourse = coursesData.find(
          (c) => Number.parseInt(c.courseNum, 10) === courseNum && c.instructor === instructorName,
        )
      }

      if (!selectedCourse) {
        alert("Course not found or you do not have permission to grade this course.")
        router.push("/instructor/classes")
        return
      }

      setCourse(selectedCourse)

      // Fetch enrollments
      const enrollmentsResponse = await fetch("/api/enrollments")
      const enrollmentData = await enrollmentsResponse.json()

      // Find students enrolled in the course
      const enrolledStudents = enrollmentData.filter((enrollment) => {
        if (enrollment.crn && courseCRN) {
          return Number.parseInt(enrollment.crn, 10) === courseCRN && enrollment.instructor === instructorName
        }
        return (
          Number.parseInt(enrollment.courseNum, 10) === Number.parseInt(selectedCourse.courseNum, 10) &&
          enrollment.instructor === instructorName
        )
      })

      setStudents(enrolledStudents)

      // Initialize grades state
      const initialGrades = {}
      enrolledStudents.forEach((student) => {
        initialGrades[student.studentId] = student.grade ? getNumericEquivalent(student.grade) : ""
      })
      setGrades(initialGrades)
    } catch (error) {
      console.error("Error loading course:", error)
    }
  }

  const getNumericEquivalent = (letterGrade) => {
    if (!letterGrade) return ""

    const upperGrade = letterGrade.toString().toUpperCase()

    switch (upperGrade) {
      case "A":
        return 90
      case "B+":
        return 85
      case "B":
        return 80
      case "C+":
        return 75
      case "C":
        return 70
      case "D+":
        return 65
      case "D":
        return 60
      case "F":
        return 0
      default:
        return ""
    }
  }

  const handleGradeChange = (studentId, value) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
      alert("Grade must be a number between 0 and 100.");
      return;
    }

    setGrades({
      ...grades,
      [studentId]: numericValue,
    });
  };

  const handleSubmitGrades = async (e) => {
    e.preventDefault()

    try {
      // Fetch current enrollments
      const enrollmentsResponse = await fetch("/api/enrollments")
      const allEnrollments = await enrollmentsResponse.json()

      // Update grades
      const updatedEnrollments = allEnrollments.map((enrollment) => {
        // Check if this enrollment matches our course and has a grade update
        const matchesByCRN = enrollment.crn && Number.parseInt(enrollment.crn, 10) === Number.parseInt(course.crn, 10)

        const matchesByCourseNum = Number.parseInt(enrollment.courseNum, 10) === Number.parseInt(course.courseNum, 10)

        if (
          (matchesByCRN || matchesByCourseNum) &&
          enrollment.instructor === user.username &&
          grades[enrollment.studentId] !== undefined
        ) {
          // Convert numeric grade to letter grade
          const numericGrade = Number.parseInt(grades[enrollment.studentId], 10)
          let letterGrade

          if (numericGrade >= 90) {
            letterGrade = "A"
          } else if (numericGrade >= 85) {
            letterGrade = "B+"
          } else if (numericGrade >= 80) {
            letterGrade = "B"
          } else if (numericGrade >= 75) {
            letterGrade = "C+"
          } else if (numericGrade >= 70) {
            letterGrade = "C"
          } else if (numericGrade >= 65) {
            letterGrade = "D+"
          } else if (numericGrade >= 60) {
            letterGrade = "D"
          } else {
            letterGrade = "F"
          }

          // Return updated enrollment
          return {
            ...enrollment,
            grade: letterGrade,
            crn: enrollment.crn || course.crn, // Ensure CRN is preserved or added
          }
        }

        return enrollment
      })

      // Save updated enrollments
      const response = await fetch("/api/enrollments/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEnrollments),
      })

      if (response.ok) {
        // Show success message
        setSuccessMessage(true)

        // Hide message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(false)
        }, 3000)

        alert("Grades saved successfully. Students can now see their grades in Learning Path.")
      } else {
        alert("Error submitting grades. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting grades:", error)
      alert("Error submitting grades. Please try again.")
    }
  }

  const handleBackToClasses = () => {
    router.push("/instructor/classes")
  }

  if (!course) {
    return <div>Loading course data...</div>
  }

  // Format course status class
  const statusClass =
    course.status === "valid" ? "status-valid" : course.status === "pending" ? "status-pending" : "status-invalid"

  return (
    <>
      <section className="banner">
        <h1 className="title">
          Course Grading - <span id="instructor-name">{user?.username}</span>
        </h1>
        <h2 id="course-title">
          Course: {course.name} ({course.category}
          {course.courseNum})
        </h2>
      </section>

      <div className="course-box">
        <h2>Course Details</h2>
        <div id="course-details" className={styles.courseDetails}>
          <p>Category: {course.category}</p>
          <p>
            Status: <span className={statusClass}>{course.status}</span>
          </p>
          <p>CRN: {course.crn}</p>
          <p>
            Enrollment: {students.length}/{course.enrollment_maximum}
          </p>
        </div>
      </div>

      <div className="course-box">
        <h2>Student Grades</h2>
        <div id="student-list" className={styles.studentList}>
          {course.status === "valid" ? (
            students.length > 0 ? (
              <form id="grades-form" onSubmit={handleSubmitGrades}>
                {students.map((student, index) => (
                  <div key={index} className={styles.studentItem}>
                    <span>
                      {student.studentName} ({student.studentId})
                    </span>
                    <input
                      type="number"
                      className={styles.gradeInput}
                      name={`grade-${student.studentId}`}
                      min="0"
                      max="100"
                      required
                      placeholder="Grade (0-100)"
                      value={grades[student.studentId]}
                      onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                    />
                  </div>
                ))}

                <button type="submit" className={styles.submitBtn}>
                  Submit Grades
                </button>
                {successMessage && <p className={styles.successMessage}>Grades submitted successfully!</p>}
              </form>
            ) : (
              <p>No students enrolled in this course.</p>
            )
          ) : (
            <div className={styles.errorMessage}>
              <p>⚠️ You can only submit grades for approved courses.</p>
              <p>
                Current status: <span className={statusClass}>{course.status}</span>
              </p>
              <p>Please contact an administrator to approve this course.</p>
            </div>
          )}
        </div>
      </div>

      <button onClick={handleBackToClasses} className={styles.backBtn}>
        &larr; Back to Classes
      </button>

      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificant Work 2025. All rights reserved
      </footer>
    </>
  )
}
