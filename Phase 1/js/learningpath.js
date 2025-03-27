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

// Data fetching
async function fetchAllData() {
    // Load courses data
    const coursesResponse = await fetch('data/courses.json');
    appData.courses = await coursesResponse.json();
    
    // Load enrollments (from localStorage if available, otherwise from file)
    const storedEnrollments = localStorage.getItem('enrollment');
    
    if (storedEnrollments) {
        appData.enrollments = JSON.parse(storedEnrollments);
    } else {
        const enrollmentResponse = await fetch('data/enrollment.json');
        appData.enrollments = await enrollmentResponse.json();
        localStorage.setItem('enrollment', JSON.stringify(appData.enrollments));
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

// Course processing
function processCourseCategories(studentEnrollments) {
    // Clear all tables
    clearAllTables();
    
    // Process enrolled courses (completed and in-progress)
    studentEnrollments.forEach(enrollment => {
        const course = appData.courses.find(c => c.courseNum === enrollment.courseNum);
        
        if (!course) {
            return;
        }
        
        if (enrollment.grade) {
            // Completed course
            addCompletedCourse(course, enrollment);
        } else {
            // In-progress course
            addInProgressCourse(course, enrollment);
        }
    });
    
    // Find and add pending courses
    // const pendingCount = addPendingCourses(studentEnrollments);
    addPendingCourses(studentEnrollments);
    
    // Check if tables are empty and display messages if needed
    checkEmptyTables();
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
    
    // Generate a random progress percentage between 30% and 90%
    const progress = Math.floor(Math.random() * (90 - 30 + 1)) + 30;
    
    row.innerHTML = `
        <td>${course.category} ${course.courseNum}</td>
        <td>${course.name}</td>
        <td>${progress}%</td>
        <td><span class="status-pill status-in-progress">In Progress</span></td>
    `;
    
    tableBody.appendChild(row);
}

function addPendingCourses(studentEnrollments) {
    const tableBody = document.querySelector('#pending-courses tbody');
    let count = 0;
    
    // Get course numbers the student is already enrolled in
    const enrolledCourseNums = studentEnrollments.map(enrollment => enrollment.courseNum);
    
    // Get completed course names (for prerequisite checking)
    const completedCourses = getCompletedCourseNames(studentEnrollments);
    
    // Find eligible pending courses
    appData.courses.forEach(course => {
        // Skip if already enrolled or invalid
        if (enrolledCourseNums.includes(course.courseNum) || course.status === 'invalid') {
            return;
        }
        
        // Check if prerequisites are met
        if (arePrerequisitesMet(course, completedCourses)) {
            addPendingCourseToTable(course, tableBody);
            count++;
        }
    });
    
    return count;
}

// Helper Functions
function getCompletedCourseNames(enrollments) {
    return enrollments
        .filter(enrollment => enrollment.grade) // Only completed courses
        .map(enrollment => {
            const course = appData.courses.find(c => c.courseNum === enrollment.courseNum);
            return course ? course.name : null;
        })
        .filter(name => name !== null);
}

function arePrerequisitesMet(course, completedCourses) {
    // No prerequisites or "none" means requirements are met
    if (!course.prerequisite || 
        course.prerequisite === 'none' || 
        course.prerequisite === 'None') {
        return true;
    }
    
    // Check if the prerequisite course is completed
    return completedCourses.includes(course.prerequisite);
}

function addPendingCourseToTable(course, tableBody) {
    const row = document.createElement('tr');
    
    // Generate a future start date
    const startDate = generateFutureDate();
    
    row.innerHTML = `
        <td>${course.category} ${course.courseNum}</td>
        <td>${course.name}</td>
        <td>${startDate}</td>
        <td><span class="status-pill status-pending">Pending</span></td>
    `;
    
    tableBody.appendChild(row);
}

function checkEmptyTables() {
    const tables = [
        'completed-courses',
        'in-progress-courses',
        'pending-courses'
    ];
    
    tables.forEach(tableId => {
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

function generateFutureDate() {
    const today = new Date();
    const futureDate = new Date(today);
    
    // Add 1-3 months to the current date
    const monthsToAdd = Math.floor(Math.random() * 3) + 1;
    futureDate.setMonth(today.getMonth() + monthsToAdd);
    
    // Format the date as MM/DD/YYYY
    return `${futureDate.getMonth() + 1}/${futureDate.getDate()}/${futureDate.getFullYear()}`;
}

// Move
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