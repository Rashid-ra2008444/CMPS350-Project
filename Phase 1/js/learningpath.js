const appData = {
    courses: [],
    enrollments: [],
    currentStudent: null
};


document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
 
        const currentUser = validateUserSession();
        if (!currentUser) return;
        
    
        await fetchAllData();
        
       
        setupLearningPath(currentUser);
        
     
        setupMove();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please try again.');
    }
}


function validateUserSession() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'student') {
        window.location.href = 'login.html';
        return null;
    }
    
    return currentUser;
}


async function fetchAllData() {
   
    const localStorageCourses = localStorage.getItem('courses');
    
    if (localStorageCourses) {
        appData.courses = JSON.parse(localStorageCourses);
    } else {
       
        const coursesResponse = await fetch('data/courses.json');
        appData.courses = await coursesResponse.json();
        
    
        localStorage.setItem('courses', JSON.stringify(appData.courses));
    }
    
  
    const storedEnrollments = localStorage.getItem('enrollment');
    
    if (storedEnrollments) {
        appData.enrollments = JSON.parse(storedEnrollments);
    } else {
        const enrollmentResponse = await fetch('data/enrollment.json');
        appData.enrollments = await enrollmentResponse.json();
        localStorage.setItem('enrollment', JSON.stringify(appData.enrollments));
    }
}

function setupLearningPath(user) {
    const { username, password } = user;
    const studentId = password.toString();
    
 
    appData.currentStudent = { name: username, id: studentId };
    
 
    updateStudentInfo(username, studentId);
    

    const studentEnrollments = appData.enrollments.filter(
        enrollment => enrollment.studentName === username
    );
    
    if (studentEnrollments.length === 0) {
        displayNoEnrollmentMessage();
        return;
    }
    

    processCourseCategories(studentEnrollments);
}


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


function processCourseCategories(studentEnrollments) {
    
    clearAllTables();
    
    
    studentEnrollments.forEach(enrollment => {
        const course = appData.courses.find(c => 
            c.courseNum === enrollment.courseNum && 
            c.name === (enrollment.courseName || c.name)
        );
        
        if (!course) {
            return; 
        }
        
        if (enrollment.grade) {
          
            addCompletedCourse(course, enrollment);
        } else if (course.status === "valid") {
           
            addInProgressCourse(course, enrollment);
        } else {
           
            addPendingCourseFromEnrollment(course, enrollment);
        }
    });
    
  
    addRecommendedCourses(studentEnrollments);
    
   
    checkEmptyTables();
}

function clearAllTables() {
    document.querySelector('#completed-courses tbody').innerHTML = '';
    document.querySelector('#in-progress-courses tbody').innerHTML = '';
    document.querySelector('#pending-courses tbody').innerHTML = '';
}


function addCompletedCourse(course, enrollment) {
    const tableBody = document.querySelector('#completed-courses tbody');
    const row = document.createElement('tr');
    

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
    
 
    const progress = enrollment.progress || Math.floor(Math.random() * (90 - 30 + 1)) + 30;
    
   
    if (!enrollment.progress) {
        enrollment.progress = progress;
        
        
        const allEnrollments = appData.enrollments.map(e => 
            (e.studentName === enrollment.studentName && 
             e.courseNum === enrollment.courseNum && 
             e.courseName === enrollment.courseName) ? 
                {...e, progress} : e
        );
        
        localStorage.setItem('enrollment', JSON.stringify(allEnrollments));
    }
    
    row.innerHTML = `
        <td>${course.category} ${course.courseNum}</td>
        <td>${course.name}</td>
        <td>${progress}%</td>
        <td><span class="status-pill status-in-progress">In Progress</span></td>
    `;
    
    tableBody.appendChild(row);
}

function addPendingCourseFromEnrollment(course, enrollment) {
    const tableBody = document.querySelector('#pending-courses tbody');
    const row = document.createElement('tr');
    
   
    const startDate = enrollment.enrollmentDate || generateFutureDate();
    
    row.innerHTML = `
        <td>${course.category} ${course.courseNum}</td>
        <td>${course.name}</td>
        <td>${startDate}</td>
        <td><span class="status-pill status-pending">Pending</span></td>
    `;
    
    tableBody.appendChild(row);
}

function addRecommendedCourses(studentEnrollments) {
    const tableBody = document.querySelector('#pending-courses tbody');
    

    const enrolledCourseIds = studentEnrollments.map(enrollment => 
        `${enrollment.courseNum}-${enrollment.courseName || ''}`
    );
    
    const completedCourses = getCompletedCourseNames(studentEnrollments);
    
    appData.courses.forEach(course => {
        const courseId = `${course.courseNum}-${course.name}`;
        
       
        if (enrolledCourseIds.includes(courseId) || course.status === 'invalid') {
            return;
        }
        
     
        if (arePrerequisitesMet(course, completedCourses)) {
            addRecommendedCourseToTable(course, tableBody);
        }
    });
}


function getCompletedCourseNames(enrollments) {
    return enrollments
        .filter(enrollment => enrollment.grade) 
        .map(enrollment => {
            const course = appData.courses.find(c => 
                c.courseNum === enrollment.courseNum && 
                c.name === (enrollment.courseName || c.name)
            );
            return course ? course.name : null;
        })
        .filter(name => name !== null);
}

function arePrerequisitesMet(course, completedCourses) {
  
    if (!course.prerequisite || 
        course.prerequisite === 'none' || 
        course.prerequisite === 'None') {
        return true;
    }
    
    
    return completedCourses.includes(course.prerequisite);
}

function addRecommendedCourseToTable(course, tableBody) {
    const row = document.createElement('tr');
    
  
    const startDate = generateFutureDate();
    
    row.innerHTML = `
        <td>${course.category} ${course.courseNum}</td>
        <td>${course.name}</td>
        <td>${startDate}</td>
        <td><span class="status-pill status-recommended">Recommended</span></td>
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
    
    const monthsToAdd = Math.floor(Math.random() * 3) + 1;
    futureDate.setMonth(today.getMonth() + monthsToAdd);
    
   
    return `${futureDate.getMonth() + 1}/${futureDate.getDate()}/${futureDate.getFullYear()}`;
}


function setupMove() {
  
    document.querySelector(".coursesBUT").addEventListener('click', () => {
        window.location.href = 'Coursepage.html';
    });
    
  
    document.querySelector(".lougBUT").addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}