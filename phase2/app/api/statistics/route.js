import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Total number of students
    const totalStudents = await prisma.user.count({
      where: { status: 'student' }
    });

    // 2. Total number of instructors
    const totalInstructors = await prisma.user.count({
      where: { status: 'instructor' }
    });

    // 3. Total number of courses
    const totalCourses = await prisma.course.count({
      where: { status: 'valid' }
    });

    // 4. Total enrollments
    const totalEnrollments = await prisma.enrollment.count();

    // 5. Average enrollment per course
    const avgEnrollmentPerCourse = await prisma.course.aggregate({
      _avg: {
        enrollment_actual: true
      },
      where: { status: 'valid' }
    });

    // 6. Course fill rate
    const coursesFillRate = await prisma.course.aggregate({
      _avg: {
        enrollment_actual: true,
        enrollment_maximum: true
      },
      where: { status: 'valid' }
    });

    // 7. Top 5 courses by enrollment
    const topCourses = await prisma.course.findMany({
      where: { status: 'valid' },
      orderBy: {
        enrollment_actual: 'desc'
      },
      take: 5,
      select: {
        name: true,
        courseNum: true,
        category: true,
        enrollment_actual: true,
        enrollment_maximum: true,
        instructor: true
      }
    });

    // 8. Courses by category
    const coursesByCategory = await prisma.course.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      where: { status: 'valid' }
    });

    // 9. Students per category
    const studentsPerCategory = await prisma.enrollment.groupBy({
      by: ['courseNum'],
      _count: {
        studentId: true
      }
    });

    // Get category for each course
    const coursesWithCategory = await prisma.course.findMany({
      select: {
        courseNum: true,
        category: true
      }
    });

    const categoryMap = {};
    coursesWithCategory.forEach(course => {
      categoryMap[course.courseNum] = course.category;
    });

    const studentsByCategoryAggregate = {};
    studentsPerCategory.forEach(item => {
      const category = categoryMap[item.courseNum];
      if (category) {
        if (!studentsByCategoryAggregate[category]) {
          studentsByCategoryAggregate[category] = 0;
        }
        studentsByCategoryAggregate[category] += item._count.studentId;
      }
    });

    // 10. Grade distribution
    const gradeDistribution = await prisma.enrollment.groupBy({
      by: ['grade'],
      _count: {
        id: true
      },
      where: {
        grade: { not: null }
      }
    });

    // 11. Instructor workload
    const instructorWorkload = await prisma.course.groupBy({
      by: ['instructor'],
      _count: {
        id: true
      },
      _sum: {
        enrollment_actual: true
      },
      where: { status: 'valid' }
    });

    // 12. Course success rate (students who passed)
    const passingGrades = await prisma.enrollment.count({
      where: {
        grade: {
          in: ['A', 'B+', 'B','C+', 'C','D']
        }
      }
    });

    const totalGradedStudents = await prisma.enrollment.count({
      where: {
        grade: { not: null }
      }
    });

    const successRate = totalGradedStudents > 0 ? (passingGrades / totalGradedStudents) * 100 : 0;

    // 13. Failure rate by course category
    const failuresByCategory = await prisma.enrollment.findMany({
      where: {
        grade: 'F'
      },
      include: {
        course: {
          select: {
            category: true
          }
        }
      }
    });

    const failureRateByCategory = {};
    const totalEnrollmentsByCategory = {};

    // Count failures by category
    failuresByCategory.forEach(enrollment => {
      const category = enrollment.course.category;
      if (!failureRateByCategory[category]) {
        failureRateByCategory[category] = 0;
      }
      failureRateByCategory[category]++;
    });

    // Count total enrollments by category
    const allEnrollments = await prisma.enrollment.findMany({
      include: {
        course: {
          select: {
            category: true
          }
        }
      }
    });

    allEnrollments.forEach(enrollment => {
      const category = enrollment.course.category;
      if (!totalEnrollmentsByCategory[category]) {
        totalEnrollmentsByCategory[category] = 0;
      }
      totalEnrollmentsByCategory[category]++;
    });

    // Calculate failure rates
    Object.keys(totalEnrollmentsByCategory).forEach(category => {
      const failures = failureRateByCategory[category] || 0;
      const total = totalEnrollmentsByCategory[category];
      failureRateByCategory[category] = (failures / total) * 100;
    });

    // 14. Courses with prerequisites analysis
    const prerequisiteAnalysis = await prisma.course.groupBy({
      by: ['prerequisite'],
      _count: {
        id: true
      },
      _avg: {
        enrollment_actual: true
      }
    });

    // 15. Most popular instructors
    const popularInstructors = await prisma.enrollment.groupBy({
      by: ['instructor'],
      _count: {
        studentId: true
      },
      orderBy: {
        _count: {
          studentId: 'desc'
        }
      },
      take: 5
    });

    const statistics = {
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      avgEnrollmentPerCourse: avgEnrollmentPerCourse._avg.enrollment_actual,
      courseFillRate: (coursesFillRate._avg.enrollment_actual / coursesFillRate._avg.enrollment_maximum) * 100,
      topCourses,
      coursesByCategory,
      studentsByCategoryAggregate,
      gradeDistribution,
      instructorWorkload,
      successRate,
      failureRateByCategory,
      prerequisiteAnalysis,
      popularInstructors
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching statistics: " + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}