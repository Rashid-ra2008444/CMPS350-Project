// Global variables to store data
let coursesData = [];
let enrollmentData = [];
let currentStudent = null;

// On page load, fetch all necessary data
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check for logged in user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser || currentUser.status !== 'student') {
            // Redirect to login if not a student
            window.location.href = 'login.html';
            return;
        }
        
        // Load all data then initialize the student's learning path
        await loadAllData();
        
        // Load the learning path for the current student
        const studentId = currentUser.password.toString();
        loadStudentLearningPath(currentUser.username, studentId);
        
        // Add navigation buttons
        addNavigationToLearningPath();
        
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error loading data. Please try again.');
    }
});

// Load all necessary data from JSON files or localStorage
async function loadAllData() {
    try {
        // 1. Load courses data
        const coursesResponse = await fetch('data/courses.json');
        coursesData = await coursesResponse.json();
        
        // 2. Load enrollment data - either from localStorage or from JSON file
        const localEnrollments = localStorage.getItem('enrollment');
        
        if (localEnrollments) {
            enrollmentData = JSON.parse(localEnrollments);
        } else {
            const enrollmentResponse = await fetch('data/enrollment.json');
            enrollmentData = await enrollmentResponse.json();
            localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
        }
        
        console.log('All data loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}

// Load learning path for a specific student
function loadStudentLearningPath(username, studentId) {
    console.log(`Loading learning path for: ${username} (ID: ${studentId})`);
    
    // Find student enrollments
    const studentEnrollments = enrollmentData.filter(enrollment => 
        enrollment.studentName === username);
    
    if (studentEnrollments.length === 0) {
        console.error('No enrollment data found for student:', username);
        document.querySelector('#completed-courses tbody').innerHTML = 
            '<tr><td colspan="4">No enrollment data found for this student</td></tr>';
        document.querySelector('#in-progress-courses tbody').innerHTML = 
            '<tr><td colspan="4">No enrollment data found for this student</td></tr>';
        document.querySelector('#pending-courses tbody').innerHTML = 
            '<tr><td colspan="4">No enrollment data found for this student</td></tr>';
        return;
    }
    
    // Set current student
    currentStudent = {
        name: username,
        id: studentId
    };
    
    // Update student info in the header
    document.getElementById('student-name').textContent = username;
    document.getElementById('student-id').textContent = `Student ID: ${studentId}`;
    
    // Process student courses
    processCourses(studentEnrollments);
}

// Process courses into completed, in-progress, and pending categories
function processCourses(studentEnrollments) {
    // Clear all tables
    document.querySelector('#completed-courses tbody').innerHTML = '';
    document.querySelector('#in-progress-courses tbody').innerHTML = '';
    document.querySelector('#pending-courses tbody').innerHTML = '';
    
    console.log(`Processing ${studentEnrollments.length} enrollments`);
    
    // Track counts for each category
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    
    // Process each enrollment
    studentEnrollments.forEach(enrollment => {
        // Find course details
        const course = coursesData.find(c => c.courseNum === enrollment.courseNum);
        
        if (!course) {
            console.warn(`Course ${enrollment.courseNum} not found in courses data`);
            return;
        }
        
        // Determine course status
        if (enrollment.grade) {
            // Completed course
            addCompletedCourse(course, enrollment);
            completedCount++;
            console.log(`Added completed course: ${course.name} with grade ${enrollment.grade}`);
        } else {
            // Course is in-progress
            addInProgressCourse(course, enrollment);
            inProgressCount++;
            console.log(`Added in-progress course: ${course.name}`);
        }
    });
    
    // Add pending courses (courses that have prerequisites satisfied but not enrolled)
    const pendingCoursesAdded = addPendingCourses(studentEnrollments);
    pendingCount = pendingCoursesAdded;
    
    console.log(`Learning path processed: ${completedCount} completed, ${inProgressCount} in-progress, ${pendingCount} pending`);
    
    // Handle empty tables
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

// Add a completed course to the table
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

// Add an in-progress course to the table
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

// Add pending courses (courses that have prerequisites satisfied but not enrolled)
function addPendingCourses(studentEnrollments) {
    const tableBody = document.querySelector('#pending-courses tbody');
    let count = 0;
    
    // Get array of courses the student is already enrolled in
    const enrolledCourseNums = studentEnrollments.map(enrollment => enrollment.courseNum);
    
    // Get courses the student has completed (with a grade)
    const completedCourses = studentEnrollments
        .filter(enrollment => enrollment.grade)
        .map(enrollment => {
            const course = coursesData.find(c => c.courseNum === enrollment.courseNum);
            return course ? course.name : null;
        })
        .filter(name => name !== null);
    
    // Find courses that the student can take based on prerequisites
    coursesData.forEach(course => {
        // Skip courses the student is already enrolled in
        if (enrolledCourseNums.includes(course.courseNum)) {
            return;
        }
        
        // Skip invalid courses
        if (course.status === 'invalid') {
            return;
        }
        
        // Check if prerequisites are met
        let prerequisitesMet = true;
        if (course.prerequisite && course.prerequisite !== 'none' && course.prerequisite !== 'None') {
            // Check if the student has completed the prerequisite course
            prerequisitesMet = completedCourses.includes(course.prerequisite);
        }
        
        // Add the course if prerequisites are met and it's a valid or pending course
        if (prerequisitesMet) {
            const row = document.createElement('tr');
            
            // Generate a start date 1-3 months in the future
            const startDate = generateFutureDate();
            
            row.innerHTML = `
                <td>${course.category} ${course.courseNum}</td>
                <td>${course.name}</td>
                <td>${startDate}</td>
                <td><span class="status-pill status-pending">Pending</span></td>
            `;
            
            tableBody.appendChild(row);
            count++;
        }
    });
    
    return count;
}

// Helper function to generate a future date for pending courses
function generateFutureDate() {
    const today = new Date();
    const futureDate = new Date(today);
    
    // Add 1-3 months to the current date
    const monthsToAdd = Math.floor(Math.random() * 3) + 1;
    futureDate.setMonth(today.getMonth() + monthsToAdd);
    
    // Format the date as MM/DD/YYYY
    return `${futureDate.getMonth() + 1}/${futureDate.getDate()}/${futureDate.getFullYear()}`;
}

// Helper function to add a message when a table is empty
function addEmptyTableMessage(tableId) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    const row = document.createElement('tr');
    row.innerHTML = `
        <td colspan="4" class="no-courses">No courses in this category</td>
    `;
    tableBody.appendChild(row);
}

// Helper function to get the appropriate CSS class for a grade
function getGradeClass(grade) {
    if (!grade) return '';
    
    // Convert grade to uppercase to handle case differences
    const upperGrade = grade.toUpperCase();
    
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

// Add navigation and logout functionality
function addNavigationToLearningPath() {
    const header = document.querySelector('.header');
    
    if (header) {
        // Create navigation buttons container
        const navContainer = document.createElement('div');
        navContainer.className = 'navigation-buttons';
        navContainer.style.marginTop = '15px';
        
        // Add navigation button to go back to course page
        const coursePageButton = document.createElement('button');
        coursePageButton.textContent = 'Course Page';
        coursePageButton.className = 'nav-button';
        coursePageButton.style.marginRight = '10px';
        coursePageButton.style.padding = '8px 16px';
        coursePageButton.style.backgroundColor = '#4285f4';
        coursePageButton.style.color = 'white';
        coursePageButton.style.border = 'none';
        coursePageButton.style.borderRadius = '4px';
        coursePageButton.style.cursor = 'pointer';
        
        coursePageButton.addEventListener('click', function() {
            window.location.href = 'Coursepage.html';
        });
        
        // Add logout button
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.className = 'nav-button';
        logoutButton.style.padding = '8px 16px';
        logoutButton.style.backgroundColor = '#dc3545';
        logoutButton.style.color = 'white';
        logoutButton.style.border = 'none';
        logoutButton.style.borderRadius = '4px';
        logoutButton.style.cursor = 'pointer';
        
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
        
        // Add buttons to the navigation container
        navContainer.appendChild(coursePageButton);
        navContainer.appendChild(logoutButton);
        
        // Add the navigation container to the header
        header.appendChild(navContainer);
    }
}