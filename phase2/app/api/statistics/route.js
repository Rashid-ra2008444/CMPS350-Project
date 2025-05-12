import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // Debug logging
    console.log("Full session in statistics API:", JSON.stringify(session, null, 2));
    console.log("User role:", session?.user?.role);
    console.log("User object:", session?.user);
    
    // Check if session exists
    if (!session) {
      console.log("No session found");
      return NextResponse.json(
        { success: false, message: "No session found. Please log in." },
        { status: 401 }
      );
    }
    
    // Check if user exists in session
    if (!session.user) {
      console.log("No user in session");
      return NextResponse.json(
        { success: false, message: "No user in session. Please log in again." },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    if (session.user.role !== "admin") {
      console.log("User is not admin. Role:", session.user.role);
      return NextResponse.json(
        { success: false, message: `Unauthorized: Role '${session.user.role}' is not admin.` },
        { status: 401 }
      );
    }
    
    console.log("Admin access granted");
    
    // Statistics calculations
    const [
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      avgEnrollmentPerCourse,
      coursesFillRate,
      topCourses,
      coursesByCategory,
      studentsPerCategory,
      coursesWithCategory,
      gradeDistribution,
      instructorWorkload,
      passingGrades,
      totalGradedStudents,
      failuresByCategory,
      allEnrollments,
      prerequisiteAnalysis,
      popularInstructors
    ] = await Promise.all([
      // 1. Total number of students
      prisma.user.count({
        where: { status: 'student' }
      }),
      
      // 2. Total number of instructors
      prisma.user.count({
        where: { status: 'instructor' }
      }),
      
      // 3. Total number of courses
      prisma.course.count({
        where: { status: 'valid' }
      }),
      
      // 4. Total enrollments
      prisma.enrollment.count(),
      
      // 5. Average enrollment per course
      prisma.course.aggregate({
        _avg: {
          enrollment_actual: true
        },
        where: { status: 'valid' }
      }),
      
      // 6. Course fill rate
      prisma.course.aggregate({
        _avg: {
          enrollment_actual: true,
          enrollment_maximum: true
        },
        where: { status: 'valid' }
      }),
      
      // 7. Top 5 courses by enrollment
      prisma.course.findMany({
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
      }),
      
      // 8. Courses by category
      prisma.course.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        where: { status: 'valid' }
      }),
      
      // 9. Students per category
      prisma.enrollment.groupBy({
        by: ['courseNum'],
        _count: {
          studentId: true
        }
      }),
      
      // Get category for each course
      prisma.course.findMany({
        select: {
          courseNum: true,
          category: true
        }
      }),
      
      // 10. Grade distribution
      await prisma.enrollment.groupBy({
      by: ['grade'],
      _count: {
        _all: true // count of all rows for each grade
      },
      where: {
        grade: { not: null }
      }
    }),
      
      // 11. Instructor workload
      prisma.course.groupBy({
        by: ['instructor'],
        _count: {
          id: true
        },
        _sum: {
          enrollment_actual: true
        },
        where: { status: 'valid' }
      }),
      
      // 12. Course success rate (students who passed)
      prisma.enrollment.count({
        where: {
          grade: {
            in: ['A', 'B+', 'B','C+', 'C','D', 'D+']
          }
        }
      }),
      
      prisma.enrollment.count({
        where: {
          grade: { not: null }
        }
      }),
      
      // 13. Failure rate by course category
      prisma.enrollment.findMany({
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
      }),
      
      // Count total enrollments by category
      prisma.enrollment.findMany({
        include: {
          course: {
            select: {
              category: true
            }
          }
        }
      }),
      
      // 14. Courses with prerequisites analysis
      prisma.course.groupBy({
        by: ['prerequisite'],
        _count: {
          id: true
        },
        _avg: {
          enrollment_actual: true
        }
      }),
      
      // 15. Most popular instructors
      prisma.enrollment.groupBy({
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
      })
    ]);

    // Process students by category
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

    // Calculate success rate
    const successRate = totalGradedStudents > 0 ? (passingGrades / totalGradedStudents) * 100 : 0;

    // Calculate failure rates by category
    const failureRateByCategory = {};
    const totalEnrollmentsByCategory = {};

    // Count failures by category
    failuresByCategory.forEach(enrollment => {
      if (enrollment.course) {
        const category = enrollment.course.category;
        if (!failureRateByCategory[category]) {
          failureRateByCategory[category] = 0;
        }
        failureRateByCategory[category]++;
      }
    });

    // Count total enrollments by category
    allEnrollments.forEach(enrollment => {
      if (enrollment.course) {
        const category = enrollment.course.category;
        if (!totalEnrollmentsByCategory[category]) {
          totalEnrollmentsByCategory[category] = 0;
        }
        totalEnrollmentsByCategory[category]++;
      }
    });

    // Calculate failure rates
    Object.keys(totalEnrollmentsByCategory).forEach(category => {
      const failures = failureRateByCategory[category] || 0;
      const total = totalEnrollmentsByCategory[category];
      failureRateByCategory[category] = total > 0 ? (failures / total) * 100 : 0;
    });

    // Calculate course fill rate
    const courseFillRate = coursesFillRate._avg.enrollment_maximum > 0 
      ? (coursesFillRate._avg.enrollment_actual / coursesFillRate._avg.enrollment_maximum) * 100 
      : 0;

    const statistics = {
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      avgEnrollmentPerCourse: avgEnrollmentPerCourse._avg.enrollment_actual || 0,
      courseFillRate,
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