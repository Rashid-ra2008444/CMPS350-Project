'use client'
import styles from "./css/admin-course-card.module.css"

const CourseCard = ({ course, onValidate, onInvalidate, onDelete, onEdit }) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          {course.name} ({course.category} {course.courseNum})
        </h3>
        <span className={`${styles.statusBadge} ${styles[course.status]}`}>
          {course.status}
        </span>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.courseInfo}>
          <p>
            <span className={styles.label}>Instructor:</span>{" "}
            {course.instructor}
          </p>
          <p>
            <span className={styles.label}>Prerequisite:</span>{" "}
            {course.prerequisite}
          </p>
          <p>
            <span className={styles.label}>Enrollment Maximum:</span>{" "}
            {course.enrollment_maximum}
          </p>
          <p>
            <span className={styles.label}>Enrollment Actual:</span>{" "}
            {course.enrollment_actual}/{course.enrollment_maximum}
          </p>
          <p>
            <span className={styles.label}>CRN:</span> {course.crn}
          </p>
        </div>
      </div>
      <div className={styles.cardActions}>
        {onEdit && (
          <button
            className={`${styles.actionButton} ${styles.editButton}`}
            onClick={() => onEdit(course)}
          >
            Edit
          </button>
        )}

        {course.status === "pending" && (
          <>
            <button
              className={`${styles.actionButton} ${styles.validateButton}`}
              onClick={() => onValidate(course)}
            >
              Validate
            </button>
            <button
              className={`${styles.actionButton} ${styles.invalidateButton}`}
              onClick={() => onInvalidate(course)}
            >
              Invalidate
            </button>
          </>
        )}
        {onDelete && (
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={() => onDelete(course)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default CourseCard