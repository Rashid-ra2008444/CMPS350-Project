import React, { useState } from "react";
import styles from "./css/CreateEditCourse.module.css";

export default function CreateEditCourse({
  isEditMode,
  initialCourseData,
  onSubmit,
  onCancel
}) {
  const [courseData, setCourseData] = useState(initialCourseData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // For number fields, convert the value to a number
    const processedValue = ["courseNum", "enrollment_maximum", "enrollment_actual", "crn"].includes(name) 
      ? Number(value) 
      : value;
      
    setCourseData({
      ...courseData,
      [name]: processedValue,
    });
  };

  const handleSubmitCourse = (e) => {
    e.preventDefault();
    onSubmit(courseData, isEditMode);
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formBox}>
        <h3>
          {isEditMode
            ? courseData.isValidCourse
              ? "Edit Instructor Name"
              : "Edit Course"
            : "Add New Course"}
        </h3>
        <form onSubmit={handleSubmitCourse}>
          <div className={styles.formBoxContainer}>
            <label>
              Name:
              <input
                type="text"
                name="name"
                value={courseData.name || ""}
                onChange={handleInputChange}
                readOnly={courseData.isValidCourse}
                required
              />
            </label>
            <label>
              Course Number:
              <input
                type="number"
                name="courseNum"
                value={courseData.courseNum || ""}
                onChange={handleInputChange}
                readOnly={courseData.isValidCourse}
                required
              />
            </label>
            <label>
              Instructor:
              <input
                type="text"
                name="instructor"
                value={courseData.instructor || ""}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Prerequisite:
              <input
                type="text"
                name="prerequisite"
                value={courseData.prerequisite || "none"}
                onChange={handleInputChange}
                readOnly={courseData.isValidCourse}
                placeholder="none"
              />
            </label>
            <label>
              Max Enrollment:
              <input
                type="number"
                name="enrollment_maximum"
                value={courseData.enrollment_maximum || 30}
                onChange={handleInputChange}
                readOnly={courseData.isValidCourse}
                required
              />
            </label>
            <label>
              Category:
              <select
                name="category"
                value={courseData.category || "CMPS"}
                onChange={handleInputChange}
                disabled={courseData.isValidCourse}
              >
                <option value="CMPS">Computer Science</option>
                <option value="CMPE">Computer Engineering</option>
                <option value="MATH">Mathematics</option>
                <option value="GENG">General Engineering</option>
              </select>
            </label>
          </div>
          <div className={styles.formButtons}>
            <button type="submit">{isEditMode ? "Update" : "Save"}</button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}