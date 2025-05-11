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
    await prisma.student.deleteMany({}); // Add this to delete students
    await prisma.user.deleteMany({});
    
    console.log(`Adding ${usersData.length} users...`);
   
    // Add users
    for (const user of usersData) {
      await prisma.user.create({
        data: user
      });
      
      // Create student record for users with status "student"
      if(user.status === 'student') {
        await prisma.student.create({
          data: {
            studentId: user.studentId
          }
        });
      }
    }
   
    console.log(`Adding ${coursesData.length} courses...`);
   
    // Add courses
    for (const course of coursesData) {
      await prisma.course.create({
        data: course  
      });
    }
    
    console.log(`Adding ${enrollmentsData.length} enrollments...`);
   
    // Add enrollments with proper relations
    for (const enrollment of enrollmentsData) {
      // Check if the student exists before creating enrollment
      const student = await prisma.student.findUnique({
        where: { studentId: enrollment.studentId }
      });
      
      if (student) {
        await prisma.enrollment.create({
          data: enrollment
        });
      } else {
        console.warn(`Student with ID ${enrollment.studentId} not found. Skipping enrollment.`);
      }
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
    
    // Test the relations
    console.log('\nTesting relations...');
    
    // Get a student with their enrollments
    const studentWithEnrollments = await prisma.student.findFirst({
      include: {
        enrollments: {
          include: {
            course: true
          }
        }
      }
    });
    
    if (studentWithEnrollments) {
      console.log(`Student ${studentWithEnrollments.studentId} has ${studentWithEnrollments.enrollments.length} enrollments`);
    }
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();