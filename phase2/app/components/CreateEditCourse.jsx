import React, { useState, useEffect } from "react";
import styles from "./css/CreateEditCourse.module.css";
import { findAllCategoriesActions } from "../actions/server-actions";

export default function CreateEditCourse({
  isEditMode,
  initialCourseData,
  onSubmit,
  onCancel,
}) {
  const [courseData, setCourseData] = useState(initialCourseData);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await findAllCategoriesActions();
        console.log("Fetched categories:", categoriesData);
        if (categoriesData) {
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For number fields, convert the value to a number
    const processedValue = [
      "courseNum",
      "enrollment_maximum",
      "enrollment_actual",
      "crn",
    ].includes(name)
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
                value={courseData.category || ""}
                onChange={handleInputChange}
                disabled={courseData.isValidCourse}
              >
                {categories.length === 0 ? (
                  <option value="">Loading categories...</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))
                )}
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
