import { NextResponse } from "next/server";
import { enrollmentRepo } from "@/app/repo/repository.js";

export async function POST(request) {
  try {
    const updatedEnrollments = await request.json();
    await enrollmentRepo.saveAll(updatedEnrollments);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating enrollments:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error updating enrollments" },
      { status: 500 }
    );
  }
}