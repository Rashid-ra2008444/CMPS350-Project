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

// Data fetching - updated to use localStorage first
async function fetchAllData() {
    try {
        // Load courses data
        const coursesResponse = await fetch('data/courses.json');
        appData.courses = await coursesResponse.json();
        
        // Priority to data stored in localStorage
        const storedEnrollments = localStorage.getItem('enrollment');
        
        if (storedEnrollments) {
            // Use data from localStorage
            appData.enrollments = JSON.parse(storedEnrollments);
            console.log("Using enrollment data from localStorage");
        } else {
            // Only if no data in localStorage, use the original file
            const enrollmentResponse = await fetch('data/enrollment.json');
            appData.enrollments = await enrollmentResponse.json();
            
            // Store data in localStorage for next time
            localStorage.setItem('enrollment', JSON.stringify(appData.enrollments));
            console.log("Using enrollment data from JSON file, saved to localStorage");
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
        // Convert courseNum to integer for correct comparison
        enrollment.courseNum = parseInt(enrollment.courseNum, 10);
        
        const course = appData.courses.find(c => parseInt(c.courseNum, 10) === enrollment.courseNum);
        
        if (!course) {
            console.warn(`Course ${enrollment.courseNum} not found in courses data`);
            return;
        }
        
        // Check if course has a grade (completed) or not (in-progress)
        if (enrollment.grade) {
            // Completed course (has a grade)
            addCompletedCourse(course, enrollment);
        } else {
            // In-progress course
            addInProgressCourse(course, enrollment);
        }
    });
    
    // MODIFIED: Only show a message in pending courses section
    const pendingCoursesTable = document.querySelector('#pending-courses tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td colspan="4" class="no-courses">No pending courses. Use the Registration page to register for new courses.</td>
    `;
    pendingCoursesTable.appendChild(row);
    
    // Check if tables are empty and display messages if needed
    checkEmptyTables(['completed-courses', 'in-progress-courses']);
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

// REMOVED: The addPendingCourses function to prevent automatic display of pending courses

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

function generateFutureDate() {
    const today = new Date();
    const futureDate = new Date(today);
    
    // Add 1-3 months to the current date
    const monthsToAdd = Math.floor(Math.random() * 3) + 1;
    futureDate.setMonth(today.getMonth() + monthsToAdd);
    
    // Format the date as MM/DD/YYYY
    return `${futureDate.getMonth() + 1}/${futureDate.getDate()}/${futureDate.getFullYear()}`;
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