"use client"

import { useState, useEffect } from "react"
import styles from "./admin-courses.module.css"
import CourseCard from "../../components/CourseCard"
import ConfirmModel from "../../components/ConfirmModel"
import Notification from "../../components/Notification"
import CreateEditCourse from "../../components/CreateEditCourse"
import { useRouter } from "next/navigation"
import { findAllCoursesActions ,deleteCourseActions , updateCourseActions , updateStatusActions} from "@/app/actions/server-actions"

function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showEditForm, setShowEditForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState({ show: false, course: null })
  const [notification, setNotification] = useState({message: "", type: ""})
  const [courseToEdit, setCourseToEdit] = useState(null)
  const router = useRouter()

  useEffect(() => {
    loadCourses()

    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
      searchInput.addEventListener("input", handleSearchInput)
      if (searchInput.value) {
        setSearchTerm(searchInput.value.toLowerCase().trim())
      }
    }

    const categorySelect = document.getElementById("courseCategory")
    if (categorySelect) {
      categorySelect.addEventListener("change", handleCategoryChange)
      if (categorySelect.value) {
        setCategoryFilter(categorySelect.value)
      }
    }

    return () => {
      if (searchInput) {
        searchInput.removeEventListener("input", handleSearchInput)
      }
      if (categorySelect) {
        categorySelect.removeEventListener("change", handleCategoryChange)
      }
    }
  }, [])

  useEffect(() => {
    filterCourses()
  }, [searchTerm, categoryFilter, courses])

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value.toLowerCase().trim())
  }

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value)
  }

 async function loadCourses() {
  setLoading(true);
  setError("");

  try {
    const data = await findAllCoursesActions(); // This is already the course list
    console.log("Courses loaded:", data);
    setCourses(data); // Set directly
  } catch (error) {
    console.error("Error loading courses:", error);
    setError("Failed to load courses. Please try again.");
  } finally {
    setLoading(false);
  }
}

  const filterCourses = () => {
    if (!courses || courses.length === 0) {
      setFilteredCourses([]);
      return;
    }
    
    const filtered = courses.filter(course => {
      const searchTermLower = searchTerm.toLowerCase();
      
      const courseName = (course.name || "").toLowerCase();
      const courseNum = course.courseNum !== undefined ? course.courseNum.toString() : "";
      const courseCategory = (course.category || "").toLowerCase();
      const courseInstructor = (course.instructor || "").toLowerCase();
      
      const nameMatch = courseName.includes(searchTermLower);
      
      const numMatch = courseNum.includes(searchTermLower);
      
      const codeMatch = `${courseCategory} ${courseNum}`.includes(searchTermLower);
      
      const instructorMatch = courseInstructor.includes(searchTermLower);
      
      const categoryMatch = categoryFilter === "all" || course.category === categoryFilter;
      
      return (nameMatch || numMatch || codeMatch || instructorMatch) && categoryMatch;
    });
    
    setFilteredCourses(filtered);
  }
  
  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification({ message: "", type: "" }),4000)
  }

  const askToDeleteCourse = (course) => {
    setConfirmDelete({ show: true, course })
  }
  
const confirmDeleteCourse = async () => {
  const course = confirmDelete.course;
  setConfirmDelete({ show: false, course: null });

  try {
    const response = await deleteCourseActions(course.crn);
    
    if (response?.ok === false) {
      const errorData = await response.json?.();
      throw new Error(errorData?.message || "Failed to delete course");
    }
    await loadCourses();

    showNotification("Course deleted successfully!", "success");
  } catch (error) {
    console.error("Error deleting course:", error);
    showNotification(`Error: ${error.message || "Failed to delete course"}`, "error");
  }
};

  const handleEditCourse = (course, isValidCourse = false) => {
    setCourseToEdit({...course, isValidCourse})
    setShowEditForm(true)
  }

  const handleUpdateCourse = async (courseData) => {
  try {
    const response = await updateCourseActions(courseData.crn,courseData);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update course");
    }

    await loadCourses();
    showNotification("Course updated successfully!", "success");
  } catch (error) {
    console.error("Error updating course:", error);
    showNotification(`Error: ${error.message || "Failed to update course"}`, "error");
  }
};

  const validateCourse = async (course, status) => {
  try {
    const updatedCourse = await updateStatusActions(course.crn, status);
    // Reload courses
    await loadCourses();
    showNotification(`Course status updated to ${status}!`, "success");
  } catch (error) {
    console.error("Error updating course status:", error);
    showNotification(`Error: ${error.message || "Failed to update course status"}`, "error");
  }
};

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
      {notification.message && (
        <Notification message={notification.message} type={notification.type} />
      )}  
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
                onDelete={() => askToDeleteCourse(course)}
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
                onDelete={() => askToDeleteCourse(course)}
              />
            ))
          )}
        </div>
      </div>

      {showEditForm && courseToEdit && (
        <CreateEditCourse
          isEditMode={true}
          initialCourseData={courseToEdit}
          onSubmit={handleUpdateCourse}
          onCancel={() => {
            setShowEditForm(false)
            setCourseToEdit(null)
          }}
        />
      )}

      {confirmDelete.show && (
        <ConfirmModel
          message={`Are you sure you want to delete "${confirmDelete.course.name}"?`}
          onConfirm={confirmDeleteCourse}
          onCancel={() => setConfirmDelete({ show: false, course: null })}
        />
      )}

      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificant Work 2025. All rights reserved
      </footer>
    </>
  )
}

export default AdminCourses;