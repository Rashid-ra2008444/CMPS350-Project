"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import styles from "./courses.module.css"

export default function StudentCourses() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pendingCourses, setPendingCourses] = useState([])
  const [validCourses, setValidCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("All")

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

    loadAllCourses()
  }, [session, status, router])

  const loadAllCourses = async () => {
    try {
      // Fetch courses
      const coursesResponse = await fetch("/api/courses")
      const coursesData = await coursesResponse.json()

      // Fetch enrollments for current student
      const enrollmentsResponse = await fetch(`/api/enrollments?studentId=${session.user.studentId}`)
      const enrollmentData = await enrollmentsResponse.json()

      if (enrollmentData.length === 0) {
        setPendingCourses([])
        setValidCourses([])
        return
      }

      // Process courses
      const pending = []
      const valid = []

      enrollmentData.forEach((enrollment) => {
        // Find course details
        const course = coursesData.find(
          (c) =>
            Number.parseInt(c.crn, 10) === Number.parseInt(enrollment.crn, 10) ||
            Number.parseInt(c.courseNum, 10) === Number.parseInt(enrollment.courseNum, 10),
        )

        if (course) {
          // Add enrollment info to course object
          const courseWithInfo = {
            ...course,
            grade: enrollment.grade,
            instructor: enrollment.instructor || course.instructor,
            crn: course.crn || enrollment.crn,
          }

          // Check course status
          const isPending = enrollment.courseStatus === "pending" || course.status === "pending"
          const isValid = course.status === "valid"
          const hasGrade = enrollment.grade !== null && enrollment.grade !== undefined

          if (isPending) {
            pending.push(courseWithInfo)
          } else if (isValid && !hasGrade) {
            valid.push(courseWithInfo)
          }
        }
      })

      setPendingCourses(pending)
      setValidCourses(valid)
    } catch (error) {
      console.error("Error loading courses:", error)
    }
  }

  if (status === "loading") {
    return <div>Loading...</div>
  }

  const filterCourses = () => {
    // Filter logic will be implemented here
  }

  return (
    <>
      <section className="banner">
        <h1 className="title">Welcome {session?.user?.name}</h1>
      </section>

      <div className="course-box">
        <div className="search-bar">
          <h2>Courses</h2>
          <input
            type="text"
            id="searchInput"
            placeholder="Course Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select id="subjectSelect" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
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
        <div id="validCourses" className={styles.coursesGrid}>
          {validCourses.length === 0 ? (
            <p>You have no approved courses.</p>
          ) : (
            validCourses.map((course, index) => (
              <div
                key={index}
                className="class-card valid-card"
                data-course-num={course.courseNum}
                data-crn={course.crn}
              >
                <h1>{course.name}</h1>
                <p>Instructor: {course.instructor || "Unknown"}</p>
                <p>Course Number: {course.courseNum}</p>
                <p>CRN: {course.crn}</p>
                <p>Category: {course.category}</p>
                <p>Prerequisite: {course.prerequisite}</p>
                <p className="status">
                  Status: <span className="status-pill status-valid">Approved</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="course-box">
        <h2>Pending Courses</h2>
        <div id="pendingCourses" className={styles.coursesGrid}>
          {pendingCourses.length === 0 ? (
            <p>You have no pending courses.</p>
          ) : (
            pendingCourses.map((course, index) => (
              <div
                key={index}
                className="class-card pending-card"
                data-course-num={course.courseNum}
                data-crn={course.crn}
              >
                <h1>{course.name}</h1>
                <p>Instructor: {course.instructor || "Unknown"}</p>
                <p>Course Number: {course.courseNum}</p>
                <p>CRN: {course.crn}</p>
                <p>Category: {course.category}</p>
                <p>Prerequisite: {course.prerequisite}</p>
                <p className="pending-status">
                  Status: <span className="status-pill status-pending">Pending Approval</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificant Work 2025. All rights reserved
      </footer>
    </>
  )
}