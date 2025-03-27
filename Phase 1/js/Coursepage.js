document.addEventListener("DOMContentLoaded", function () {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || currentUser.status !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('student-name').textContent = currentUser.username;
    
    document.getElementById('logout').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    document.querySelector('.plan').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'LearningPath.html';
    });

    document.querySelector('.Register').addEventListener('click',function(e){
        e.preventDefault();
        window.location.href = 'Registration.html';
    });

    loadStudentClasses(currentUser);

    document.querySelector('#searchInput').addEventListener("input", () => {
        const searchValue = document.querySelector('#searchInput').value.toLowerCase();
        filterAndDisplayCourses(searchValue);
    });

    document.querySelector('#subjectSelect').addEventListener("change", () => {
        const searchValue = document.querySelector('#searchInput').value.toLowerCase();
        filterAndDisplayCourses(searchValue);
    });
});

let enrolledCourses = [];
let enrollmentsData = [];

// Check if a course is completed (has a grade)
function isCompletedCourse(course, currentUser) {
    const enrollment = enrollmentsData.find(e => 
        e.studentName === currentUser.username && 
        e.courseNum === course.courseNum && 
        e.courseName === course.name
    );
    
    return enrollment && enrollment.grade;
}

function filterAndDisplayCourses(searchValue) {
    const categoryValue = document.querySelector('#subjectSelect').value;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Filter courses that aren't completed and match search criteria
    const filteredCourses = enrolledCourses.filter(course => {
        // Skip completed courses
        if (isCompletedCourse(course, currentUser)) return false;
        
        const matchesSearch = course.name.toLowerCase().includes(searchValue) || 
                             course.category.toLowerCase().includes(searchValue);
        const matchesCategory = categoryValue === 'All' || course.category === categoryValue;
        
        return matchesSearch && matchesCategory;
    });
    
    displayCoursesByStatus(filteredCourses);
}

function displayCoursesByStatus(courses) {
    const validCourseBox = document.querySelector('#validCourses');
    const pendingCourseBox = document.querySelector('#pendingCourses');
    
    // Clear both containers
    validCourseBox.innerHTML = '';
    pendingCourseBox.innerHTML = '';
    
    // Separate courses by status
    const validCourses = courses.filter(course => course.status === "valid");
    const pendingCourses = courses.filter(course => course.status === "pending");
    
    // Display valid courses
    if (validCourses.length === 0) {
        validCourseBox.innerHTML = '<p>You currently have no validated courses.</p>';
    } else {
        validCourses.forEach(course => {
            const classDiv = createCourseCard(course);
            validCourseBox.appendChild(classDiv);
        });
    }
    
    // Display pending courses
    if (pendingCourses.length === 0) {
        pendingCourseBox.innerHTML = '<p>You currently have no pending courses.</p>';
    } else {
        pendingCourses.forEach(course => {
            const classDiv = createCourseCard(course, true);
            pendingCourseBox.appendChild(classDiv);
        });
    }
}

function createCourseCard(course, isPending = false) {
    const classDiv = document.createElement('div');
    classDiv.className = 'class-card';
    classDiv.setAttribute('data-course-id', `${course.name}-${course.courseNum}`);

    classDiv.innerHTML = `
        <h1>Name: ${course.name}</h1>
        <p>Category: ${course.category}</p>
        <p>Course Number: ${course.courseNum}</p>
        <p>Instructor: ${course.instructor}</p>
        <p>Prerequisite: ${course.prerequisite}</p>
        <div class="button-container">
            ${isPending ? `<button class="delete pixel2">Drop Course</button>` : ''}
        </div>
    `;
    
    if (isPending) {
        classDiv.querySelector('.delete').addEventListener('click', function() {
            dropCourse(course);
        });
    }
    
    return classDiv;
}

async function dropCourse(course) {
    if (confirm(`Are you sure you want to drop ${course.name}?`)) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            let enrollmentData = JSON.parse(localStorage.getItem('enrollment') || '[]');
            
            enrollmentData = enrollmentData.filter(enrollment => 
                !(enrollment.studentName === currentUser.username && 
                  enrollment.courseNum === course.courseNum &&
                  enrollment.courseName === course.name)
            );
            
            localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
            
            let coursesData = JSON.parse(localStorage.getItem('courses') || '[]');
            const courseIndex = coursesData.findIndex(c => 
                c.courseNum === course.courseNum && c.name === course.name
            );
            
            if (courseIndex !== -1) {
                coursesData[courseIndex].enrollment_actual = Math.max(0, coursesData[courseIndex].enrollment_actual - 1);
                localStorage.setItem('courses', JSON.stringify(coursesData));
                localStorage.setItem('courseData', JSON.stringify(coursesData)); 
            }
            
            loadStudentClasses(currentUser);
            
            alert('Course dropped successfully');
        } catch (error) {
            console.error('Error dropping course:', error);
            alert('Failed to drop course. Please try again.');
        }
    }
}

async function loadStudentClasses(currentUser) {
    try {
        let coursesData;
        const localCourses = localStorage.getItem('courses');
        
        if (localCourses) {
            coursesData = JSON.parse(localCourses);
        } else {
            const coursesResponse = await fetch("data/courses.json");
            coursesData = await coursesResponse.json();
        }

        const localEnrollments = localStorage.getItem('enrollment');

        if (localEnrollments) {
            enrollmentsData = JSON.parse(localEnrollments);
        } else {
            try {
                const studentsResponse = await fetch("data/enrollment.json");
                enrollmentsData = await studentsResponse.json();
                localStorage.setItem('enrollment', JSON.stringify(enrollmentsData));
            } catch (err) {
                console.warn("Could not load enrollment data, using empty array:", err);
                enrollmentsData = [];
            }
        }

        const studentEnrollments = enrollmentsData.filter(e => e.studentName === currentUser.username);
        
        if (studentEnrollments.length === 0) {
            document.querySelector('#validCourses').innerHTML = '<p>You currently have no validated courses.</p>';
            document.querySelector('#pendingCourses').innerHTML = '<p>You currently have no pending courses.</p>';
            enrolledCourses = [];
            return;
        }

        // Get all enrolled courses
        enrolledCourses = coursesData.filter(course => 
            studentEnrollments.some(enrollment => 
                enrollment.courseNum === course.courseNum && 
                enrollment.courseName === course.name
            )
        );
        
        // Filter out completed courses and display the rest
        const activeCourses = enrolledCourses.filter(course => !isCompletedCourse(course, currentUser));
        
        if (activeCourses.length === 0) {
            document.querySelector('#validCourses').innerHTML = '<p>You have no active courses. View your Learning Path to see completed courses.</p>';
            document.querySelector('#pendingCourses').innerHTML = '<p>You have no pending courses.</p>';
            return;
        }
        
        displayCoursesByStatus(activeCourses);

    } catch(error) {
        console.error("Error loading courses:", error);
        document.querySelector('#validCourses').innerHTML = 
            '<p>Error loading courses. Please try again later.</p>';
        document.querySelector('#pendingCourses').innerHTML = 
            '<p>Error loading courses. Please try again later.</p>';
    }
}