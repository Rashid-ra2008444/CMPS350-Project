// const { PrismaClient } = require("@prisma/client")
// const fs = require("fs")
// const path = require("path")
// const prisma = new PrismaClient()

// async function main() {
//   console.log("Starting database seeding...")

//   try {
//     // Read JSON files
//     const usersData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/data/login.json"), "utf8"))
//     const coursesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/data/courses.json"), "utf8"))
//     const enrollmentsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/data/enrollment.json"), "utf8"))

//     console.log(
//       `Found ${usersData.length} users, ${coursesData.length} courses, and ${enrollmentsData.length} enrollments`,
//     )

//     // Seed users
//     console.log("Seeding users...")
//     for (const user of usersData) {
//       await prisma.user.upsert({
//         where: { username: user.username },
//         update: {},
//         create: {
//           username: user.username,
//           password: Number.parseInt(user.password),
//           status: user.status,
//         },
//       })
//     }

//     // Seed courses
//     console.log("Seeding courses...")
//     for (const course of coursesData) {
//       await prisma.course.upsert({
//         where: { crn: Number.parseInt(course.crn) },
//         update: {},
//         create: {
//           name: course.name,
//           courseNum: Number.parseInt(course.courseNum),
//           instructor: course.instructor,
//           prerequisite: course.prerequisite || "none",
//           enrollment_maximum: Number.parseInt(course.enrollment_maximum) || 30,
//           enrollment_actual: Number.parseInt(course.enrollment_actual) || 0,
//           category: course.category,
//           status: course.status,
//           crn: Number.parseInt(course.crn),
//         },
//       })
//     }

//     // Seed enrollments
//     console.log("Seeding enrollments...")
//     // First, delete all existing enrollments to avoid duplicates
//     // (since enrollments don't have a unique identifier in the JSON)
//     await prisma.enrollment.deleteMany({})

//     for (const enrollment of enrollmentsData) {
//       await prisma.enrollment.create({
//         data: {
//           studentId: enrollment.studentId,
//           studentName: enrollment.studentName,
//           courseNum: Number.parseInt(enrollment.courseNum),
//           crn: Number.parseInt(enrollment.crn),
//           instructor: enrollment.instructor,
//           enrollmentDate: enrollment.enrollmentDate,
//           grade: enrollment.grade,
//           courseStatus: enrollment.courseStatus,
//         },
//       })
//     }

//     console.log("Database seeding completed successfully!")
//   } catch (error) {
//     console.error("Error during database seeding:", error)
//     process.exit(1)
//   }
// }

// main()
//   .catch((e) => {
//     console.error("Failed to seed database:", e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })
// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    // Read user data
    const usersData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'app/data', 'login.json'), 'utf8')
    );

    // Read course data
    const coursesData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'app/data', 'courses.json'), 'utf8')
    );

    // Read enrollment data
    const enrollmentsData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'app/data', 'enrollment.json'), 'utf8')
    );

    console.log(`Deleting existing data...`);
    
    // Delete existing data first (in reverse order to avoid foreign key issues)
    await prisma.enrollment.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});

    console.log(`Adding ${usersData.length} users...`);
    
    // Add users
    for (const user of usersData) {
      await prisma.user.create({
        data: {
          username: user.username,
          password: Number(user.password),
          status: user.status
        }
      });
    }

    console.log(`Adding ${coursesData.length} courses...`);
    
    // Add courses
    for (const course of coursesData) {
      await prisma.course.create({
        data: {
          name: course.name,
          courseNum: Number(course.courseNum),
          instructor: course.instructor,
          prerequisite: course.prerequisite || "none",
          enrollment_maximum: Number(course.enrollment_maximum),
          enrollment_actual: Number(course.enrollment_actual),
          category: course.category,
          status: course.status,
          crn: Number(course.crn)
        }
      });
    }

    console.log(`Adding ${enrollmentsData.length} enrollments...`);
    
    // Add enrollments
    for (const enrollment of enrollmentsData) {
      await prisma.enrollment.create({
        data: {
          studentId: enrollment.studentId,
          studentName: enrollment.studentName,
          courseNum: Number(enrollment.courseNum),
          crn: Number(enrollment.crn),
          instructor: enrollment.instructor,
          enrollmentDate: enrollment.enrollmentDate,
          grade: enrollment.grade || null,
          courseStatus: enrollment.courseStatus || null
        }
      });
    }

    // Update actual enrollment count for each course
    const courses = await prisma.course.findMany();
    for (const course of courses) {
      const enrollmentCount = await prisma.enrollment.count({
        where: { crn: course.crn }
      });
      
      await prisma.course.update({
        where: { id: course.id },
        data: { enrollment_actual: enrollmentCount }
      });
    }

    console.log(`All data added successfully!`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();