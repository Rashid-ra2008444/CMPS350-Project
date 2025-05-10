"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import styles from "./learning-path.module.css"

export default function LearningPath() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [student, setStudent] = useState({ name: "", id: "" })
  const [completedCourses, setCompletedCourses] = useState([])
  const [inProgressCourses, setInProgressCourses] = useState([])
  const [pendingCourses, setPendingCourses] = useState([])

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/login")
      return
    }
    
    if (session.user.role !== "student") {
      router.push("/auth/login")
      return
    }

    // Set student info from session
    setStudent({
      name: session.user.name,
      id: session.user.studentId,
    })

    // Load learning path data
    loadLearningPathData()
  }, [session, status, router])

  const loadLearningPathData = async () => {
    try {
      // Fetch courses
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()

      // Fetch enrollments for current student
      const enrollmentsResponse = await fetch(`/api/enrollments?studentId=${session.user.studentId}`)
      const enrollmentData = await enrollmentsResponse.json()

      if (enrollmentData.length === 0) {
        return
      }

      // Process enrollments
      const completed = []
      const inProgress = []
      const pending = []

      enrollmentData.forEach((enrollment) => {
        // Find course info
        const course = coursesData.find(
          (c) => Number.parseInt(c.courseNum, 10) === Number.parseInt(enrollment.courseNum, 10),
        )

        if (!course) return

        // Check course status and grade
        if (enrollment.grade) {
          // Completed course (has a grade)
          completed.push({ course, enrollment })
        } else if (enrollment.courseStatus === "pending" || course.status === "pending") {
          // Pending course
          pending.push({ course, enrollment })
        } else {
          // In-progress course (not pending and no grade)
          inProgress.push({ course, enrollment })
        }
      })

      setCompletedCourses(completed)
      setInProgressCourses(inProgress)
      setPendingCourses(pending)
    } catch (error) {
      console.error("Error loading learning path data:", error)
    }
  }

  if (status === "loading") {
    return <div>Loading...</div>
  }

  const getGradeClass = (grade) => {
    if (!grade) return ""

    // Convert grade to uppercase to handle case differences
    const upperGrade = grade.toString().toUpperCase()

    if (upperGrade === "A") {
      return "grade-a"
    } else if (upperGrade === "B+" || upperGrade === "B") {
      return "grade-b"
    } else if (upperGrade === "C+" || upperGrade === "C") {
      return "grade-c"
    } else if (upperGrade === "D+" || upperGrade === "D") {
      return "grade-d"
    } else if (upperGrade === "F") {
      return "grade-f"
    } else {
      return ""
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.banner2}></div>
      <div className={styles.header}>
        <div>
          <h1>Learning Path</h1>
          <p>Track your academic progress</p>
        </div>
        <div className={styles.studentInfo}>
          <h3 id="student-name">{student.name}</h3>
          <p id="student-id">Student ID: {student.id}</p>
        </div>
      </div>

      <h2>Completed Courses</h2>
      <table className={styles.coursesTable} id="completed-courses">
        <thead>
          <tr>
            <th>Course Number</th>
            <th>Course Name</th>
            <th>Grade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {completedCourses.length === 0 ? (
            <tr>
              <td colSpan="4" className={styles.noCourses}>
                No courses in this category
              </td>
            </tr>
          ) : (
            completedCourses.map((item, index) => (
              <tr key={index}>
                <td>
                  {item.course.category} {item.course.courseNum}
                </td>
                <td>{item.course.name}</td>
                <td className={getGradeClass(item.enrollment.grade)}>{item.enrollment.grade}</td>
                <td>
                  <span className="status-pill status-completed">Completed</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2>In-Progress Courses</h2>
      <table className={styles.coursesTable} id="in-progress-courses">
        <thead>
          <tr>
            <th>Course Number</th>
            <th>Course Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inProgressCourses.length === 0 ? (
            <tr>
              <td colSpan="3" className={styles.noCourses}>
                No courses in this category
              </td>
            </tr>
          ) : (
            inProgressCourses.map((item, index) => (
              <tr key={index}>
                <td>
                  {item.course.category} {item.course.courseNum}
                </td>
                <td>{item.course.name}</td>
                <td>
                  <span className="status-pill status-in-progress">In Progress</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2>Pending Courses</h2>
      <table className={styles.coursesTable} id="pending-courses">
        <thead>
          <tr>
            <th>Course Number</th>
            <th>Course Name</th>
            <th>Start Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pendingCourses.length === 0 ? (
            <tr>
              <td colSpan="4" className={styles.noCourses}>
                No courses in this category
              </td>
            </tr>
          ) : (
            pendingCourses.map((item, index) => (
              <tr key={index}>
                <td>
                  {item.course.category} {item.course.courseNum}
                </td>
                <td>{item.course.name}</td>
                <td>{item.enrollment.enrollmentDate || new Date().toLocaleDateString()}</td>
                <td>
                  <span className="status-pill status-pending">Pending Approval</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className={styles.walkingDog}>
        <img
          src="https://th.bing.com/th/id/R.d3ced9489ad92112ec192b9b0a157abb?rik=xS4EjY43yu7E5Q&riu=http%3A%2F%2F24.media.tumblr.com%2F25ec1da1ceb3d8c59ff61abda466e66d%2Ftumblr_ms7532YHD61sfs2qco1_500.gif&ehk=HXsgue0NnAnJ%2FFqo9x0PQo1zFBZD6czkgM4kaC78jkU%3D&risl=&pid=ImgRaw&r=0"
          alt="Walking dog"
        />
      </div>
    </div>
  )
}