import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

// User Repository
export const userRepo = {
  // Find a user by username
  async findByUsername(username) {
    try {
      return await prisma.user.findUnique({
        where: { username },
      });
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw new Error("Failed to find user");
    }
  },

  // Authenticate user with username and password
  async authenticate(username, password) {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });
      
      if (user && user.password === Number(password)) {
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error authenticating user:", error);
      throw new Error("Authentication failed");
    }
  },

  // Create a new user
  async create(userData) {
    try {
      return await prisma.user.create({
        data: {
          username: userData.username,
          password: Number(userData.password),
          status: userData.status,
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  },

  // Find user by ID
  async findById(id) {
    try {
      return await prisma.user.findUnique({
        where: { id: Number(id) },
      });
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw new Error("Failed to find user");
    }
  },

  // Find all users with specific status (admin, instructor, student)
  async findByStatus(status) {
    try {
      return await prisma.user.findMany({
        where: { status },
      });
    } catch (error) {
      console.error("Error finding users by status:", error);
      throw new Error("Failed to find users");
    }
  }
};

// Course Repository
export const courseRepo = {
  // Find all courses
  async findAll() {
    try {
      return await prisma.course.findMany({
        include: {
          enrollments: true,
        },
      });
    } catch (error) {
      console.error("Error finding all courses:", error);
      throw new Error("Failed to fetch courses");
    }
  },

  // Find course by CRN
  async findByCRN(crn) {
    try {
      return await prisma.course.findUnique({
        where: { crn: Number(crn) },
        include: {
          enrollments: true,
        },
      });
    } catch (error) {
      console.error("Error finding course by CRN:", error);
      throw new Error("Failed to find course");
    }
  },

  // Find courses by category
  async findByCategory(category) {
    try {
      return await prisma.course.findMany({
        where: { category },
        include: {
          enrollments: true,
        },
      });
    } catch (error) {
      console.error("Error finding courses by category:", error);
      throw new Error("Failed to find courses");
    }
  },

  // Find courses by status (valid, pending, invalid)
  async findByStatus(status) {
    try {
      return await prisma.course.findMany({
        where: { status },
        include: {
          enrollments: true,
        },
      });
    } catch (error) {
      console.error("Error finding courses by status:", error);
      throw new Error("Failed to find courses");
    }
  },

  // Find courses by instructor
  async findByInstructor(instructor) {
    try {
      return await prisma.course.findMany({
        where: { instructor },
        include: {
          enrollments: true,
        },
      });
    } catch (error) {
      console.error("Error finding courses by instructor:", error);
      throw new Error("Failed to find courses");
    }
  },

  // Create a new course
  async create(courseData) {
    try {
      console.log("Creating course with data:", courseData);
      return await prisma.course.create({
        data: {
          name: courseData.name,
          courseNum: Number(courseData.courseNum),
          instructor: courseData.instructor,
          prerequisite: courseData.prerequisite || "none",
          enrollment_maximum: Number(courseData.enrollment_maximum) || 30,
          enrollment_actual: Number(courseData.enrollment_actual) || 0,
          category: courseData.category,
          status: courseData.status || "pending",
          crn: Number(courseData.crn),
        },
      });
    } catch (error) {
      console.error("Error creating course:", error);
      throw new Error("Failed to create course");
    }
  },

  // Update a course
  async update(field, value, courseData) {
    try {
      const whereClause = {};
      whereClause[field] = field === "crn" ? Number(value) : value;
      
      return await prisma.course.update({
        where: whereClause,
        data: {
          name: courseData.name,
          courseNum: Number(courseData.courseNum),
          instructor: courseData.instructor,
          prerequisite: courseData.prerequisite || "none",
          enrollment_maximum: Number(courseData.enrollment_maximum) || 30,
          enrollment_actual: Number(courseData.enrollment_actual) || 0,
          category: courseData.category,
          status: courseData.status || "pending",
        },
      });
    } catch (error) {
      console.error("Error updating course:", error);
      throw new Error("Failed to update course");
    }
  },

  // Update course status
  async updateStatus(crn, status) {
    try {
      return await prisma.course.update({
        where: { crn: Number(crn) },
        data: { status },
      });
    } catch (error) {
      console.error("Error updating course status:", error);
      throw new Error("Failed to update course status");
    }
  },

  // Delete a course
  async delete(field, value) {
    try {
      const whereClause = {};
      whereClause[field] = field === "crn" ? Number(value) : value;
      
      // Delete all enrollments for this course first
      if (field === "crn") {
        await prisma.enrollment.deleteMany({
          where: { crn: Number(value) },
        });
      }

      return await prisma.course.delete({
        where: whereClause,
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      throw new Error("Failed to delete course");
    }
  },
};

// Enrollment Repository
export const enrollmentRepo = {
  // Find all enrollments
  async findAll() {
    try {
      return await prisma.enrollment.findMany({
        include: {
          course: true,
        },
      });
    } catch (error) {
      console.error("Error finding all enrollments:", error);
      throw new Error("Failed to fetch enrollments");
    }
  },

  // Find enrollments by student ID
  async findByStudentId(studentId) {
    try {
      return await prisma.enrollment.findMany({
        where: { studentId: String(studentId) },
        include: {
          course: true,
        },
      });
    } catch (error) {
      console.error("Error finding enrollments by student ID:", error);
      throw new Error("Failed to find enrollments");
    }
  },

  // Find enrollments by student name
  async findByStudentName(studentName) {
    try {
      return await prisma.enrollment.findMany({
        where: { studentName },
        include: {
          course: true,
        },
      });
    } catch (error) {
      console.error("Error finding enrollments by student name:", error);
      throw new Error("Failed to find enrollments");
    }
  },

  // Find enrollments by course CRN
  async findByCRN(crn) {
    try {
      return await prisma.enrollment.findMany({
        where: { crn: Number(crn) },
        include: {
          course: true,
        },
      });
    } catch (error) {
      console.error("Error finding enrollments by CRN:", error);
      throw new Error("Failed to find enrollments");
    }
  },

  // Find enrollments by instructor
  async findByInstructor(instructor) {
    try {
      return await prisma.enrollment.findMany({
        where: { instructor },
        include: {
          course: true,
        },
      });
    } catch (error) {
      console.error("Error finding enrollments by instructor:", error);
      throw new Error("Failed to find enrollments");
    }
  },

  // Find enrollments by course status
  async findByCourseStatus(courseStatus) {
    try {
      return await prisma.enrollment.findMany({
        where: { courseStatus },
        include: {
          course: true,
        },
      });
    } catch (error) {
      console.error("Error finding enrollments by course status:", error);
      throw new Error("Failed to find enrollments");
    }
  },

  // Create a new enrollment
  async create(enrollmentData) {
    try {
      // Increment enrollment_actual count for the course
      await prisma.course.update({
        where: { crn: Number(enrollmentData.crn) },
        data: { enrollment_actual: { increment: 1 } },
      });

      return await prisma.enrollment.create({
        data: {
          studentId: String(enrollmentData.studentId),
          studentName: enrollmentData.studentName,
          courseNum: Number(enrollmentData.courseNum),
          crn: Number(enrollmentData.crn),
          instructor: enrollmentData.instructor,
          enrollmentDate: enrollmentData.enrollmentDate,
          grade: enrollmentData.grade || null,
          courseStatus: enrollmentData.courseStatus || null,
        },
      });
    } catch (error) {
      console.error("Error creating enrollment:", error);
      throw new Error("Failed to create enrollment");
    }
  },

  // Update grade for a student in a course
  async updateGrade(studentId, crn, grade) {
    try {
      return await prisma.enrollment.updateMany({
        where: { 
          studentId: String(studentId),
          crn: Number(crn)
        },
        data: { grade },
      });
    } catch (error) {
      console.error("Error updating grade:", error);
      throw new Error("Failed to update grade");
    }
  },

  // Update course status for all enrollments of a course
  async updateCourseStatus(crn, status) {
    try {
      return await prisma.enrollment.updateMany({
        where: { crn: Number(crn) },
        data: { courseStatus: status },
      });
    } catch (error) {
      console.error("Error updating course status:", error);
      throw new Error("Failed to update course status");
    }
  },

  // Save all enrollments (batch update)
  async saveAll(enrollments) {
    try {
      return await prisma.$transaction(
        enrollments.map((enrollment) => 
          prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
              grade: enrollment.grade,
              courseStatus: enrollment.courseStatus,
            },
          })
        )
      );
    } catch (error) {
      console.error("Error saving all enrollments:", error);
      throw new Error("Failed to save enrollments");
    }
  },

  // Delete an enrollment
  async delete(id) {
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: Number(id) },
      });

      if (enrollment) {
        // Decrement enrollment_actual count for the course
        await prisma.course.update({
          where: { crn: enrollment.crn },
          data: { enrollment_actual: { decrement: 1 } },
        });

        return await prisma.enrollment.delete({
          where: { id: Number(id) },
        });
      }
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      throw new Error("Failed to delete enrollment");
    }
  },

  // Delete all enrollments for a student
  async deleteByStudentId(studentId) {
    try {
      // Get all enrollments for this student
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: String(studentId) },
      });

      // Decrement enrollment_actual for each course
      for (const enrollment of enrollments) {
        await prisma.course.update({
          where: { crn: enrollment.crn },
          data: { enrollment_actual: { decrement: 1 } },
        });
      }

      // Delete all enrollments for this student
      return await prisma.enrollment.deleteMany({
        where: { studentId: String(studentId) },
      });
    } catch (error) {
      console.error("Error deleting enrollments for student:", error);
      throw new Error("Failed to delete student enrollments");
    }
  },

  // Get enrollment statistics
  async getStatistics() {
    try {
      return {
        // Total number of enrollments
        totalEnrollments: await prisma.enrollment.count(),
        
        // Enrollments by course status
        enrollmentsByStatus: await prisma.enrollment.groupBy({
          by: ['courseStatus'],
          _count: true,
        }),
        
        // Enrollments by grade
        enrollmentsByGrade: await prisma.enrollment.groupBy({
          by: ['grade'],
          _count: true,
          where: {
            grade: { not: null }
          }
        }),
        
        // Enrollments by instructor
        enrollmentsByInstructor: await prisma.enrollment.groupBy({
          by: ['instructor'],
          _count: true,
        }),
      };
    } catch (error) {
      console.error("Error getting enrollment statistics:", error);
      throw new Error("Failed to get enrollment statistics");
    }
  }
};

// Export Prisma client for direct use if needed
export { prisma };