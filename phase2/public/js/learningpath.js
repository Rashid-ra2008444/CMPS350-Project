// Global data store
const appData = {
    courses: [],
    enrollments: [],
    currentStudent: null
};

// Page initialization
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        // Authenticate user
        const currentUser = validateUserSession();
        if (!currentUser) return;
        
        // Load all required data
        await fetchAllData();
        
        // Set up the learning path for current student
        setupLearningPath(currentUser);
        
        // Set up navigation buttons
        setupMove();
        
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error loading data. Please try again.');
    }
}

// Authentication & Session validation
function validateUserSession() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'student') {
        window.location.href = 'login.html';
        return null;
    }
    
    return currentUser;
}

// Data fetching - updated to use localStorage first and check multiple sources
async function fetchAllData() {
    try {
        // Load courses data - try all possible localStorage sources
        let loadedCourses = false;
        
        // First try courseData (admin data)
        const adminCoursesStorage = localStorage.getItem('courseData');
        if (adminCoursesStorage) {
            appData.courses = JSON.parse(adminCoursesStorage);
            console.log(`Loaded ${appData.courses.length} courses from 'courseData' in localStorage`);
            loadedCourses = true;
        } 
        // Then try courses (registration system data)
        else {
            const registrationCoursesStorage = localStorage.getItem('courses');
            if (registrationCoursesStorage) {
                appData.courses = JSON.parse(registrationCoursesStorage);
                console.log(`Loaded ${appData.courses.length} courses from 'courses' in localStorage`);
                loadedCourses = true;
            }
        }
        
        // If no courses found in localStorage, load from file
        if (!loadedCourses) {
            const coursesResponse = await fetch('data/courses.json');
            appData.courses = await coursesResponse.json();
            console.log(`Loaded ${appData.courses.length} courses from data file`);
        }
        
        // Priority to data stored in localStorage for enrollments
        const storedEnrollments = localStorage.getItem('enrollment');
        
        if (storedEnrollments) {
            // Use data from localStorage
            appData.enrollments = JSON.parse(storedEnrollments);
            console.log(`Loaded ${appData.enrollments.length} enrollment records from localStorage`);
        } else {
            // Only if no data in localStorage, use the original file
            const enrollmentResponse = await fetch('data/enrollment.json');
            appData.enrollments = await enrollmentResponse.json();
            console.log(`Loaded ${appData.enrollments.length} enrollment records from file`);
            
            // Store data in localStorage for next time
            localStorage.setItem('enrollment', JSON.stringify(appData.enrollments));
        }
    } catch (error) {
        console.error("Error loading data:", error);
        throw error;
    }
}

// Learning path setup
function setupLearningPath(user) {
    const { username, password } = user;
    const studentId = password.toString();
    
    // Store current student info
    appData.currentStudent = { name: username, id: studentId };
    
    // Update UI with student info
    updateStudentInfo(username, studentId);
    
    // Find student enrollments
    const studentEnrollments = appData.enrollments.filter(
        enrollment => enrollment.studentName === username
    );
    
    console.log(`Found ${studentEnrollments.length} enrollments for student ${username}`);
    
    if (studentEnrollments.length === 0) {
        displayNoEnrollmentMessage();
        return;
    }
    
    // Process and display all course categories
    processCourseCategories(studentEnrollments);
}

// UI Updates
function updateStudentInfo(name, id) {
    document.getElementById('student-name').textContent = name;
    document.getElementById('student-id').textContent = `Student ID: ${id}`;
}

function displayNoEnrollmentMessage() {
    const noDataMessage = '<tr><td colspan="4">No enrollment data found for this student</td></tr>';
    
    document.querySelector('#completed-courses tbody').innerHTML = noDataMessage;
    document.querySelector('#in-progress-courses tbody').innerHTML = noDataMessage;
    document.querySelector('#pending-courses tbody').innerHTML = noDataMessage;
}

// Course processing - updated to handle pending courses
function processCourseCategories(studentEnrollments) {
    // Clear all tables
    clearAllTables();
    
    // Count for different course types
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    
    // Process enrolled courses (completed, in-progress, and pending)
    studentEnrollments.forEach(enrollment => {
        // Convert courseNum to integer for correct comparison
        enrollment.courseNum = parseInt(enrollment.courseNum, 10);
        
        // Find course info
        const course = appData.courses.find(c => parseInt(c.courseNum, 10) === enrollment.courseNum);
        
        if (!course) {
            console.warn(`Course ${enrollment.courseNum} not found in courses data`);
            return;
        }
        
        console.log(`Processing enrollment for course ${course.courseNum} with status: ${course.status}`);
        console.log(`Enrollment courseStatus: ${enrollment.courseStatus || 'not set'}, has grade: ${!!enrollment.grade}`);
        
        // Check course status and grade
        if (enrollment.grade) {
            // Completed course (has a grade)
            addCompletedCourse(course, enrollment);
            completedCount++;
        } 
        // Check both enrollment.courseStatus and course.status for pending
        else if (enrollment.courseStatus === 'pending' || course.status === 'pending') {
            // Pending course
            addPendingCourse(course, enrollment);
            pendingCount++;
        } 
        else {
            // In-progress course (not pending and no grade)
            addInProgressCourse(course, enrollment);
            inProgressCount++;
        }
    });
    
    console.log(`Processed ${completedCount} completed courses, ${inProgressCount} in-progress courses, and ${pendingCount} pending courses`);
    
    // Check if tables are empty and display messages if needed
    if (completedCount === 0) {
        addEmptyTableMessage('completed-courses');
    }
    
    if (inProgressCount === 0) {
        addEmptyTableMessage('in-progress-courses');
    }
    
    if (pendingCount === 0) {
        addEmptyTableMessage('pending-courses');
    }
}

function clearAllTables() {
    document.querySelector('#completed-courses tbody').innerHTML = '';
    document.querySelector('#in-progress-courses tbody').innerHTML = '';
    document.querySelector('#pending-courses tbody').innerHTML = '';
}

// Table content methods
function addCompletedCourse(course, enrollment) {
    const tableBody = document.querySelector('#completed-courses tbody');
    const row = document.createElement('tr');
    
    // Format the grade with appropriate styling
    const gradeClass = getGradeClass(enrollment.grade);
    
    row.innerHTML = `
        <td>${course.category} ${course.courseNum}</td>
        <td>${course.name}</td>
        <td class="${gradeClass}">${enrollment.grade}</td>
        <td><span class="status-pill status-completed">Completed</span></td>
    `;
    
    tableBody.appendChild(row);
}

function addInProgressCourse(course, enrollment) {
    const tableBody = document.querySelector('#in-progress-courses tbody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${course.category} ${course.courseNum}</td>
        <td>${course.name}</td>
        <td><span class="status-pill status-in-progress">In Progress</span></td>
    `;
    
    tableBody.appendChild(row);
}

// New function to add pending courses to the pending courses table
function addPendingCourse(course, enrollment) {
    const tableBody = document.querySelector('#pending-courses tbody');
    const row = document.createElement('tr');
    
    // Use current date for enrollment date if not available
    const enrollmentDate = enrollment.enrollmentDate || new Date().toLocaleDateString();
    
    row.innerHTML = `
        <td>${course.category} ${course.courseNum}</td>
        <td>${course.name}</td>
        <td>${enrollmentDate}</td>
        <td><span class="status-pill status-pending">Pending Approval</span></td>
    `;
    
    // Add a class to highlight pending courses
    row.classList.add('pending-row');
    
    tableBody.appendChild(row);
}

function checkEmptyTables(tableIds) {
    tableIds.forEach(tableId => {
        const tableBody = document.querySelector(`#${tableId} tbody`);
        if (!tableBody.hasChildNodes()) {
            addEmptyTableMessage(tableId);
        }
    });
}

function addEmptyTableMessage(tableId) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    const row = document.createElement('tr');
    row.innerHTML = `
        <td colspan="4" class="no-courses">No courses in this category</td>
    `;
    tableBody.appendChild(row);
}

function getGradeClass(grade) {
    if (!grade) return '';
    
    // Convert grade to uppercase to handle case differences
    const upperGrade = grade.toString().toUpperCase();
    
    if (upperGrade === 'A') {
        return 'grade-a';
    } else if (upperGrade === 'B+' || upperGrade === 'B') {
        return 'grade-b';
    } else if (upperGrade === 'C+' || upperGrade === 'C') {
        return 'grade-c';
    } else if (upperGrade === 'D+' || upperGrade === 'D') {
        return 'grade-d';
    } else if (upperGrade === 'F') {
        return 'grade-f';
    } else {
        return '';
    }
}

// Navigation
function setupMove() {
    // Course page navigation
    document.querySelector(".coursesBUT").addEventListener('click', () => {
        window.location.href = 'Coursepage.html';
    });
    
    // Logout functionality
    document.querySelector(".lougBUT").addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}