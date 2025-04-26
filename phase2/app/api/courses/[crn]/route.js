// import { NextResponse } from "next/server"
// import fs from "fs"
// import path from "path"

// export async function PUT(request, { params }) {
//   try {
//     const { crn } = params
//     const updatedCourse = await request.json()

//     // Read existing courses
//     const coursesPath = path.join(process.cwd(), "data", "courses.json")
//     const coursesData = fs.readFileSync(coursesPath, "utf8")
//     const courses = JSON.parse(coursesData)

//     // Find course index
//     const courseIndex = courses.findIndex((c) => Number.parseInt(c.crn, 10) === Number.parseInt(crn, 10))

//     if (courseIndex === -1) {
//       return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 })
//     }

//     // Update course
//     courses[courseIndex] = updatedCourse

//     // Write back to file
//     fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2))

//     // Also update enrollments if status changed
//     if (updatedCourse.status !== courses[courseIndex].status) {
//       updateEnrollmentStatus(updatedCourse)
//     }

//     return NextResponse.json({ success: true, course: updatedCourse })
//   } catch (error) {
//     console.error("Error updating course:", error)
//     return NextResponse.json({ success: false, message: "Error updating course" }, { status: 500 })
//   }
// }

// export async function DELETE(request, { params }) {
//   try {
//     const { crn } = params

//     // Read existing courses
//     const coursesPath = path.join(process.cwd(), "data", "courses.json")
//     const coursesData = fs.readFileSync(coursesPath, "utf8")
//     const courses = JSON.parse(coursesData)

//     // Filter out the course to delete
//     const filteredCourses = courses.filter((c) => Number.parseInt(c.crn, 10) !== Number.parseInt(crn, 10))

//     if (filteredCourses.length === courses.length) {
//       return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 })
//     }

//     // Write back to file
//     fs.writeFileSync(coursesPath, JSON.stringify(filteredCourses, null, 2))

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error("Error deleting course:", error)
//     return NextResponse.json({ success: false, message: "Error deleting course" }, { status: 500 })
//   }
// }

// // Helper function to update enrollment status
// async function updateEnrollmentStatus(course) {
//   try {
//     // Read enrollments
//     const enrollmentsPath = path.join(process.cwd(), "data", "enrollment.json")
//     const enrollmentsData = fs.readFileSync(enrollmentsPath, "utf8")
//     const enrollments = JSON.parse(enrollmentsData)

//     // Update enrollments for this course
//     const updatedEnrollments = enrollments.map((enrollment) => {
//       if (
//         (enrollment.crn && Number.parseInt(enrollment.crn, 10) === Number.parseInt(course.crn, 10)) ||
//         (Number.parseInt(enrollment.courseNum, 10) === Number.parseInt(course.courseNum, 10) &&
//           enrollment.instructor === course.instructor)
//       ) {
//         return {
//           ...enrollment,
//           courseStatus: course.status,
//         }
//       }
//       return enrollment
//     })

//     // Write back to file
//     fs.writeFileSync(enrollmentsPath, JSON.stringify(updatedEnrollments, null, 2))
//   } catch (error) {
//     console.error("Error updating enrollment status:", error)
//   }
// }
import { NextResponse } from "next/server";
import { courseRepo, enrollmentRepo } from "@/repo/repository";

export async function PUT(request, { params }) {
  try {
    const { crn } = params;
    const updatedCourse = await request.json();
    
    // First, get the existing course to check if status changed
    const existingCourse = await courseRepo.findByCRN(crn);
    
    if (!existingCourse) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 }
      );
    }
    
    // Update the course
    const result = await courseRepo.update("crn", crn, updatedCourse);
    
    // If status changed, update enrollments
    if (existingCourse.status !== updatedCourse.status) {
      await enrollmentRepo.updateCourseStatus(crn, updatedCourse.status);
    }
    
    return NextResponse.json({ success: true, course: result });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { success: false, message: "Error updating course: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { crn } = params;
    
    await courseRepo.delete("crn", crn);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting course: " + error.message },
      { status: 500 }
    );
  }
}