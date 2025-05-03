// app/admin/courses/form/page.jsx
"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PrismaClient } from '@prisma/client';
import styles from "../admin-courses.module.css";

const prisma = new PrismaClient();

async function getCourseActions(crn) {
  return await prisma.course.findUnique({
    where: { crn: parseInt(crn) }
  });
}

async function createCourseActions(data) {
  return await prisma.course.create({
    data: {
      name: data.name,
      courseNum: data.courseNum.toString(),
      instructor: data.instructor,
      prerequisite: data.prerequisite,
      enrollment_maximum: data.enrollment_maximum,
      enrollment_actual: data.enrollment_actual || 0,
      category: data.category,
      status: data.status || "pending",
      crn: data.crn
    }
  });
}

async function updateCourseActions(crn, data) {
  return await prisma.course.update({
    where: { crn: parseInt(crn) },
    data: {
      name: data.name,
      courseNum: data.courseNum.toString(),
      instructor: data.instructor,
      prerequisite: data.prerequisite,
      enrollment_maximum: data.enrollment_maximum,
      enrollment_actual: data.enrollment_actual,
      category: data.category,
      status: data.status
    }
  });
}

export default async function CourseFormPageActions({ searchParams }) {
  const { crn, isValidCourse } = searchParams;
  const isEdit = !!crn;
  
  // Define default course data
  const defaultCourse = {
    name: "",
    courseNum: "",
    instructor: "",
    prerequisite: "none",
    enrollment_maximum: 30,
    enrollment_actual: 0,
    category: "CMPS",
    status: "pending",
    crn: Math.floor(10000 + Math.random() * 90000)
  };
  
  // For edit mode, fetch the course data using Prisma
  let course = defaultCourse;
  if (isEdit) {
    try {
      const fetchedCourse = await getCourseActions(crn);
      if (fetchedCourse) {
        course = fetchedCourse;
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  }
  
  async function processCourseFormActions(formData) {
    
    try {
      const courseData = {
        name: formData.get("name"),
        courseNum: formData.get("courseNum"),
        instructor: formData.get("instructor"),
        prerequisite: formData.get("prerequisite") || "none",
        enrollment_maximum: parseInt(formData.get("enrollment_maximum")),
        enrollment_actual: parseInt(formData.get("enrollment_actual") || 0),
        category: formData.get("category"),
        status: formData.get("status") || "pending",
        crn: parseInt(formData.get("crn"))
      };
      
      if (isEdit) {
        await updateCourseActions(crn, courseData);
      } else {
        await createCourseActions(courseData);
      }
      
      await prisma.$disconnect();
      revalidatePath('/admin/courses');
      redirect('/admin/courses');
    } catch (error) {
      console.error("Error processing course:", error);
      await prisma.$disconnect();
      throw error;
    }
  }
  
  return (
    <>
      <section className="banner">
        <h1 className="title">
          {isEdit 
            ? (isValidCourse === "true" ? "Edit Instructor Name" : "Edit Course") 
            : "Add New Course"}
        </h1>
        <h2>Course Management System</h2>
      </section>
      
      <div className="course-box">
        <form action={processCourseFormActions} className={styles.serverForm}>
          <div className={styles.formBoxContainer}>
            <label>
              Course Name:
              <input 
                type="text" 
                name="name" 
                defaultValue={course.name} 
                readOnly={isValidCourse === "true"}
                required 
              />
            </label>
            
            <label>
              Course Number:
              <input
                type="number"
                name="courseNum"
                defaultValue={course.courseNum}
                readOnly={isValidCourse === "true"}
                required
              />
            </label>
            
            <label>
              Instructor:
              <input
                type="text"
                name="instructor"
                defaultValue={course.instructor}
                required
              />
            </label>
            
            <label>
              Prerequisite:
              <input
                type="text"
                name="prerequisite"
                defaultValue={course.prerequisite}
                readOnly={isValidCourse === "true"}
                placeholder="none"
              />
            </label>
            
            <label>
              Max Enrollment:
              <input
                type="number"
                name="enrollment_maximum"
                defaultValue={course.enrollment_maximum}
                readOnly={isValidCourse === "true"}
                required
              />
            </label>
            
            <label>
              Category:
              <select 
                name="category" 
                defaultValue={course.category} 
                disabled={isValidCourse === "true"}
              >
                <option value="CMPS">Computer Science</option>
                <option value="CMPE">Computer Engineering</option>
                <option value="MATH">Mathematics</option>
                <option value="GENG">General Engineering</option>
              </select>
            </label>
            
            <input 
              type="hidden" 
              name="enrollment_actual" 
              defaultValue={course.enrollment_actual} 
            />
            
            <input 
              type="hidden" 
              name="status" 
              defaultValue={course.status} 
            />
            
            <input
              type="hidden"
              name="crn"
              defaultValue={course.crn}
            />
          </div>
          
          <div className={styles.formButtons}>
            <button type="submit" className={styles.submitButton}>
              {isEdit ? "Update Course" : "Add Course"}
            </button>
            <a href="/admin/courses" className={styles.cancelButton}>
              Cancel
            </a>
          </div>
        </form>
      </div>
      
      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificant Work 2025. All rights reserved
      </footer>
    </>
  );
}