"use client";

import { useState, useEffect } from "react";
import styles from "./courses.module.css";
import { useSession } from "next-auth/react";
import {
  findAllCoursesActions,
  findAllEnrollmentsActions,
  findAllCategoriesActions,
} from "@/app/actions/server-actions";

export default function StudentCourses() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [validCourses, setValidCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (session) {
      setUser(session.user);
      loadAllCourses(session.user);
      loadCategories();
    }
  }, [session]);

  const loadCategories = async () => {
    try {
      const cats = await findAllCategoriesActions();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setCategories([]);
    }
  };

  const loadAllCourses = async (currentUser) => {
    try {
      const coursesData = await findAllCoursesActions();
      const enrollmentData = await findAllEnrollmentsActions();

      const studentCourses = enrollmentData.filter(
        (enrollment) =>
          enrollment.studentName.toLowerCase() ===
          currentUser.username.toLowerCase()
      );

      if (studentCourses.length === 0) {
        setPendingCourses([]);
        setValidCourses([]);
        return;
      }

      const pending = [];
      const valid = [];

      studentCourses.forEach((enrollment) => {
        const course = coursesData.find(
          (c) =>
            Number.parseInt(c.crn, 10) ===
              Number.parseInt(enrollment.crn, 10) ||
            Number.parseInt(c.courseNum, 10) ===
              Number.parseInt(enrollment.courseNum, 10)
        );

        if (course) {
          const courseWithInfo = {
            ...course,
            grade: enrollment.grade,
            instructor: enrollment.instructor || course.instructor,
            crn: course.crn || enrollment.crn,
          };

          const isPending =
            enrollment.courseStatus === "pending" ||
            course.status === "pending";
          const isValid = course.status === "valid";
          const hasGrade =
            enrollment.grade !== null && enrollment.grade !== undefined;

          if (isPending) {
            pending.push(courseWithInfo);
          } else if (isValid && !hasGrade) {
            valid.push(courseWithInfo);
          }
        }
      });

      setPendingCourses(pending);
      setValidCourses(valid);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const filteredValidCourses = validCourses.filter(
    (course) =>
      (selectedSubject === "All" || course.category === selectedSubject) &&
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingCourses = pendingCourses.filter(
    (course) =>
      (selectedSubject === "All" || course.category === selectedSubject) &&
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <section className="banner">
        <h1 className="title">Welcome {user?.username}</h1>
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
          <select
            id="subjectSelect"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="All">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="course-box">
        <h2>Current Courses</h2>
        <div id="validCourses" className={styles.coursesGrid}>
          {filteredValidCourses.length === 0 ? (
            <p>You have no approved courses.</p>
          ) : (
            filteredValidCourses.map((course, index) => (
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
                  Status:{" "}
                  <span className="status-pill status-valid">Approved</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="course-box">
        <h2>Pending Courses</h2>
        <div id="pendingCourses" className={styles.coursesGrid}>
          {filteredPendingCourses.length === 0 ? (
            <p>You have no pending courses.</p>
          ) : (
            filteredPendingCourses.map((course, index) => (
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
                  Status:{" "}
                  <span className="status-pill status-pending">
                    Pending Approval
                  </span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificent
        Work 2025. All rights reserved.
      </footer>
    </>
  );
}
