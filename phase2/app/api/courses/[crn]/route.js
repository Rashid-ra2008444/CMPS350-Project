import { NextResponse } from "next/server";
import { courseRepo, enrollmentRepo } from "@/app/repo/repository.js";

export async function PUT(request, { params }) {
  try {
    const { crn } = await params;
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
    const { crn } = await params;
    
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