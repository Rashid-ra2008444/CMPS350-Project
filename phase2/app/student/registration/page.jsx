"use client";

import { useState, useEffect } from "react";
import styles from "./registration.module.css";
import Notification from "@/app/components/Notification";
import {
  findAllCoursesActions,
  findAllEnrollmentsActions,
  createEnrollmentActions,
} from "@/app/actions/server-actions";
import { useSession } from "next-auth/react";

export default function Registration() {
  const { data: session, status } = useSession(); // Get session data from next-auth
  const [user, setUser] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [completedCourses, setCompletedCourses] = useState([]);
  const [passedCourses, setPassedCourses] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    if (session) {
      setUser(session.user); // Set user from the session data
      loadUserData(session.user); // Fetch user data
    }
  }, [session]); // Run when session changes (e.g., after login)

  const loadUserData = async (currentUser) => {
    try {
      const coursesData = await findAllCoursesActions();
      const enrollmentData = await findAllEnrollmentsActions();

      // Get user's enrollments
      const userEnrollments = enrollmentData.filter(
        (e) =>
          e.studentName &&
          e.studentName.toLowerCase() === currentUser.username.toLowerCase()
      );

      // Find completed courses (courses with grades)
      const userCompletedCourses = [];
      const userPassedCourseNames = [];

      userEnrollments.forEach((enrollment) => {
        if (enrollment.grade) {
          const course = coursesData.find(
            (c) =>
              Number.parseInt(c.courseNum, 10) ===
              Number.parseInt(enrollment.courseNum, 10)
          );

          if (course) {
            userCompletedCourses.push({
              ...course,
              grade: enrollment.grade,
            });

            // Consider courses with passing grades (A, B, C, D)
            const grade = enrollment.grade.toString().toUpperCase();
            if (!grade.includes("F")) {
              userPassedCourseNames.push(course.name);
            }
          }
        }
      });

      setCompletedCourses(userCompletedCourses);
      setPassedCourses(userPassedCourseNames);

      // Filter available courses
      const availableCourses = getAvailableCourses(
        coursesData,
        userEnrollments
      );
      setAllCourses(availableCourses);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 4000);
  };

  const getAvailableCourses = (coursesData, userEnrollments) => {
    // Create sets of enrolled course identifiers
    const enrolledCRNs = new Set();
    const enrolledCourseNums = new Set();

    userEnrollments.forEach((enrollment) => {
      if (enrollment.crn) {
        enrolledCRNs.add(Number.parseInt(enrollment.crn, 10));
      }
      enrolledCourseNums.add(Number.parseInt(enrollment.courseNum, 10));
    });

    // Filter available courses
    return coursesData.filter((course) => {
      const courseCRN = Number.parseInt(course.crn, 10);
      const courseNum = Number.parseInt(course.courseNum, 10);

      // Check if the course is valid (we only want pending courses for registration)
      const isPending = course.status === "pending";

      // Check if student is already enrolled
      const isAlreadyEnrolled =
        enrolledCRNs.has(courseCRN) || enrolledCourseNums.has(courseNum);

      // Only show pending courses that the student is not already enrolled in
      return isPending && !isAlreadyEnrolled;
    });
  };

  const checkPrerequisiteMet = (course) => {
    // If no prerequisite is required
    if (!course.prerequisite || course.prerequisite === "none") {
      return true;
    }

    // Check if the student has passed the prerequisite course
    return passedCourses.includes(course.prerequisite);
  };

  const addCourse = async (course) => {
    try {
      // Ensure user is defined
      if (!user || !user.studentId || !user.username) {
        showNotification(
          "User information is missing. Please refresh the page and try again.",
          "error"
        );
        return;
      }

      // Check if the course is pending
      if (course.status !== "pending") {
        showNotification("Only pending courses can be registered.", "error");
        return;
      }

      // Check if prerequisites are met
      if (!checkPrerequisiteMet(course)) {
        showNotification(
          `You must complete the prerequisite course "${course.prerequisite}" before registering for this course.`,
          "error"
        );
        return;
      }

      // Check if the course is full
      if (course.enrollment_actual >= course.enrollment_maximum) {
        showNotification(
          "This course is full. Please select another course.",
          "error"
        );
        return;
      }

      // Create new enrollment
      const enrollment = {
        studentId: user.studentId,
        studentName: user.username,
        courseNum: Number(course.courseNum),
        crn: Number(course.crn),
        instructor: course.instructor,
        enrollmentDate: new Date().toLocaleDateString(),
        grade: null,
        courseStatus: "pending",
      };

      // Send enrollment to API
      const response = await createEnrollmentActions(enrollment);

      if (response.ok) {
        showNotification(
          "Course registered successfully! Note that this course is pending approval.",
          "success"
        );
        // Reload courses
        loadUserData(user);
      } else {
        showNotification(
          "Error registering for course. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error registering for course:", error);
      showNotification(
        "Error registering for course. Please try again.",
        "error"
      );
    }
  };

  // Filter courses based on search term and subject
  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      searchTerm === "" ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseNum.toString().includes(searchTerm.toLowerCase());

    const matchesSubject =
      selectedSubject === "All" || course.category === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  return (
    <>
      <section className="banner">
        <h1 className="title">Welcome {user?.username}</h1>
      </section>
      {notification.message && (
        <Notification message={notification.message} type={notification.type} />
      )}

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
          <select
            id="subjectSelect"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
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
        <div id="pendingCourses" className={styles.coursesGrid}>
          {filteredCourses.length === 0 ? (
            <p>No pending courses available for registration.</p>
          ) : (
            filteredCourses.map((course, index) => {
              // Check if prerequisites are met
              const prereqMet = checkPrerequisiteMet(course);
              const isFull =
                course.enrollment_actual >= course.enrollment_maximum;

              return (
                <div
                  key={index}
                  className={`class-card status-${course.status}`}
                  data-course-num={course.courseNum}
                  data-crn={course.crn}
                >
                  <h3>{course.name}</h3>
                  <p>Instructor: {course.instructor}</p>
                  <p>
                    Course Number: {course.category} {course.courseNum}
                  </p>
                  <p>CRN: {course.crn}</p>
                  <p>Category: {course.category}</p>
                  <p>Prerequisite: {course.prerequisite}</p>
                  <p>
                    Status:{" "}
                    <span className="status-pill status-pending">
                      Pending Approval
                    </span>
                  </p>
                  <p>
                    Enrollment: {course.enrollment_actual}/
                    {course.enrollment_maximum}
                  </p>

                  {isFull && (
                    <p className={styles.fullWarning}>⚠️ Course is full</p>
                  )}

                  {!prereqMet && (
                    <p className={styles.prereqWarning}>
                      ⚠️ Prerequisite "{course.prerequisite}" not completed
                    </p>
                  )}

                  <p className={styles.pendingNotice}>
                    ℹ️ This course is pending approval
                  </p>

                  <div className="button-container">
                    <button
                      className="Register"
                      disabled={isFull || !prereqMet}
                      onClick={() => addCourse(course)}
                    >
                      Register
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.walkingDog}>
        <img
          src="https://th.bing.com/th/id/R.d3ced9489ad92112ec192b9b0a157abb?rik=xS4EjY43yu7E5Q&riu=http%3A%2F%2F24.media.tumblr.com%2F25ec1da1ceb3d8c59ff61abda466e66d%2Ftumblr_ms7532YHD61sfs2qco1_500.gif&ehk=HXsgue0NnAnJ%2FFqo9x0PQo1zFBZD6czkgM4kaC78jkU%3D&risl=&pid=ImgRaw&r=0"
          alt="Walking dog"
        />
      </div>

      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificent
        Work 2025. All rights reserved
      </footer>
    </>
  );
}
