document.addEventListener("DOMContentLoaded", function () {
    // Check current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Load enrollment data from localStorage
    let enrollmentsData = JSON.parse(localStorage.getItem("enrollment")) || [];

    if (!currentUser || currentUser.status !== 'student') {
        // Redirect to login page if not a student
        window.location.href = 'login.html';
        return;
    }

    // Display student name
    const studentNameElement = document.getElementById('student-name');
    if (studentNameElement) {
        studentNameElement.textContent = currentUser.username;
    }

    // Add courses button event listener
    const coursepageButton = document.querySelector('.Coursepage');
    if (coursepageButton) {
        coursepageButton.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'Coursepage.html';
        });
    }
    
    // Add study plan button event listener
    const planButton = document.querySelector('.plan');
    if (planButton) {
        planButton.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'LearningPath.html';
        });
    }
    
    // Add logout button event listener
    const logoutButton = document.querySelector('.logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    // Load all available courses for registration
    loadAllCourses(currentUser);

    // Add search input event listener
    const searchInput = document.querySelector('#searchInput');
    if (searchInput) {
        searchInput.addEventListener("input", filterCourses);
    }
    
    // Add subject filter event listener
    const subjectSelect = document.querySelector('#subjectSelect');
    if (subjectSelect) {
        subjectSelect.addEventListener("change", filterCategory);
    }
});

// Global variables to store course data
let allCourses = [];
let today = new Date();

// Load all available courses - updated to use localStorage
async function loadAllCourses(currentUser) {
    try {
        // Load courses data
        const coursesResponse = await fetch("data/courses.json");
        const coursesData = await coursesResponse.json();
        
        // Load enrollment data from localStorage
        let enrollmentData = JSON.parse(localStorage.getItem("enrollment"));
        
        // If data not in localStorage, load from file
        if (!enrollmentData) {
            const enrollmentResponse = await fetch('data/enrollment.json');
            enrollmentData = await enrollmentResponse.json();
            localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
        }
        
        // Display courses in UI - Using #pendingCourses
        const courseBox = document.querySelector('#pendingCourses');
        
        // Make sure the element exists before trying to use it
        if (!courseBox) {
            console.error("Course container (#pendingCourses) not found in the document");
            return;
        }
        
        courseBox.innerHTML = '';

        if (coursesData.length === 0) {
            courseBox.innerHTML = '<p>No courses available currently.</p>';
            return;
        }

        // Store all courses in global variable
        allCourses = coursesData;
        
        // Get current enrollments to avoid showing already enrolled courses
        // Fixed: Ensure we're correctly checking for this specific student's enrollments
        const currentUserName = currentUser.username;
        console.log("Current user:", currentUserName);
        
        const userEnrollments = enrollmentData.filter(e => 
            e.studentName && e.studentName.toLowerCase() === currentUserName.toLowerCase()
        );
        
        console.log("User enrollments found:", userEnrollments.length);
        
        const enrolledCourseNums = userEnrollments.map(e => parseInt(e.courseNum, 10));
        console.log("Already enrolled in courses:", enrolledCourseNums);
        
        // Filter courses to show only valid ones not already enrolled in
        const availableCourses = coursesData.filter(course => {
            const courseNum = parseInt(course.courseNum, 10);
            const isValid = course.status === "valid";
            const isAlreadyEnrolled = enrolledCourseNums.includes(courseNum);
            
            if (isAlreadyEnrolled) {
                console.log(`Course ${courseNum} already enrolled, skipping`);
            }
            
            return isValid && !isAlreadyEnrolled;
        });
        
        console.log("Available courses for registration:", availableCourses.length);
        
        if (availableCourses.length === 0) {
            courseBox.innerHTML = '<p>No courses available for registration.</p>';
            return;
        }
        
        // Display available courses
        availableCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-num', course.courseNum);

            // Add a class to indicate prerequisite status
            const prereqStatus = getPrerequisiteStatus(course, userEnrollments, coursesData);
            if (prereqStatus !== 'met') {
                classDiv.classList.add('prerequisite-not-met');
            }

            classDiv.innerHTML = `
                <h3>Name: ${course.name}</h3>
                <p>Instructor: ${course.instructor}</p>
                <p>Course Number: ${course.category} ${course.courseNum}</p>
                <p>Category: ${course.category}</p>
                <p>Prerequisite: ${course.prerequisite}</p>
                <p>Status: ${course.status}</p>
                ${prereqStatus !== 'met' ? `<p class="prereq-warning">⚠️ Prerequisite not completed</p>` : ''}
                <div class="button-container">
                    <button class="Register pixel2">Register</button>
                </div>
            `;

            courseBox.append(classDiv);
            
            // Add register button event listener
            const registerCourse = classDiv.querySelector('.Register');
            if (registerCourse) {
                registerCourse.addEventListener('click', function () {
                    addCourse(course, currentUser);
                });
            }
        });
    } catch (error) {
        console.error("Error loading courses:", error);
        const courseBox = document.querySelector('#pendingCourses');
        if (courseBox) {
            courseBox.innerHTML = '<p>Error loading courses. Please try again later.</p>';
        }
    }
}

// Helper function to check prerequisite status
function getPrerequisiteStatus(course, userEnrollments, allCourses) {
    if (course.prerequisite === "none" || course.prerequisite === "None") {
        return 'met';
    }
    
    // Find the prerequisite course
    const prereqCourse = allCourses.find(c => c.name === course.prerequisite);
    if (!prereqCourse) {
        return 'unknown';
    }
    
    // Check if student has completed the prerequisite
    const prereqEnrollment = userEnrollments.find(e => 
        parseInt(e.courseNum, 10) === parseInt(prereqCourse.courseNum, 10)
    );
    
    if (!prereqEnrollment) {
        return 'not-enrolled';
    }
    
    if (!prereqEnrollment.grade) {
        return 'in-progress';
    }
    
    if (prereqEnrollment.grade === 'F') {
        return 'failed';
    }
    
    return 'met';
}

// Filter courses by search term
function filterCourses() {
    const searchInput = document.querySelector('#searchInput');
    if (!searchInput) return;
    
    const searchValue = searchInput.value.toLowerCase();
    
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Get enrollment data
    const enrollmentData = JSON.parse(localStorage.getItem("enrollment")) || [];
    const userEnrollments = enrollmentData.filter(e => 
        e.studentName && e.studentName.toLowerCase() === currentUser.username.toLowerCase()
    );
    const enrolledCourseNums = userEnrollments.map(e => parseInt(e.courseNum, 10));
    
    // Filter courses
    const filteredCourses = allCourses.filter(course =>
        course.status === "valid" &&
        !enrolledCourseNums.includes(parseInt(course.courseNum, 10)) &&
        (course.name.toLowerCase().includes(searchValue) ||
         course.category.toLowerCase().includes(searchValue))
    );
    
    displayFilteredCourses(filteredCourses, userEnrollments);
}

// Filter courses by category
function filterCategory() {
    const select = document.querySelector('#subjectSelect');
    if (!select) return;
    
    const selectValue = select.value;
    
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Get enrollment data
    const enrollmentData = JSON.parse(localStorage.getItem("enrollment")) || [];
    const userEnrollments = enrollmentData.filter(e => 
        e.studentName && e.studentName.toLowerCase() === currentUser.username.toLowerCase()
    );
    const enrolledCourseNums = userEnrollments.map(e => parseInt(e.courseNum, 10));
    
    // Filter courses
    let filteredCourses = [];
    
    if (selectValue !== 'All') {
        filteredCourses = allCourses.filter(course =>
            course.status === "valid" &&
            !enrolledCourseNums.includes(parseInt(course.courseNum, 10)) &&
            course.category === selectValue
        );
    } else {
        filteredCourses = allCourses.filter(course =>
            course.status === "valid" &&
            !enrolledCourseNums.includes(parseInt(course.courseNum, 10))
        );
    }

    displayFilteredCourses(filteredCourses, userEnrollments);
}

// Display filtered courses
function displayFilteredCourses(filteredCourses, userEnrollments) {
    const courseBox = document.querySelector('#pendingCourses');
    if (!courseBox) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    courseBox.innerHTML = '';

    if (filteredCourses.length === 0) {
        courseBox.innerHTML = '<p>No courses match your criteria.</p>';
        return;
    }
    
    filteredCourses.forEach(course => {
        const classDiv = document.createElement('div');
        classDiv.className = 'class-card';
        classDiv.setAttribute('data-course-num', course.courseNum);

        // Add a class to indicate prerequisite status
        const prereqStatus = getPrerequisiteStatus(course, userEnrollments, allCourses);
        if (prereqStatus !== 'met') {
            classDiv.classList.add('prerequisite-not-met');
        }

        classDiv.innerHTML = `
            <h3>Name: ${course.name}</h3>
            <p>Instructor: ${course.instructor}</p>
            <p>Course Number: ${course.category} ${course.courseNum}</p>
            <p>Category: ${course.category}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            <p>Status: ${course.status}</p>
            ${prereqStatus !== 'met' ? `<p class="prereq-warning">⚠️ Prerequisite not completed</p>` : ''}
            <div class="button-container">
                <button class="Register pixel2">Register</button>
            </div>
        `;
        
        courseBox.append(classDiv);
        
        // Add register button event listener
        const registerCourse = classDiv.querySelector('.Register');
        if (registerCourse) {
            registerCourse.addEventListener('click', function () {
                addCourse(course, currentUser);
            });
        }
    });
}

// Add a course for the student - updated to properly check prerequisites
async function addCourse(course, currentUser) {
    try {
        // Get enrollment data from localStorage
        let enrollmentData = JSON.parse(localStorage.getItem("enrollment"));
        
        // If data not in localStorage, load from file
        if (!enrollmentData) {
            const enrollmentResponse = await fetch('data/enrollment.json');
            enrollmentData = await enrollmentResponse.json();
        }
        
        // Load courses data
        const coursesData = await fetch("data/courses.json").then(res => res.json());
        
        // Check student enrollments - Fixed to use case-insensitive comparison
        const userEnrollments = enrollmentData.filter(e => 
            e.studentName && e.studentName.toLowerCase() === currentUser.username.toLowerCase()
        );
        
        // Convert course numbers to integers for correct comparison
        const courseNum = parseInt(course.courseNum, 10);
        
        // Check if student is already enrolled in the course
        if (userEnrollments.some(e => parseInt(e.courseNum, 10) === courseNum)) {
            alert('Course has already been registered');
            return;
        }
        
        // Check prerequisites
        if (course.prerequisite === "none" || course.prerequisite === "None") {
            // No prerequisites, can register
            registerNewCourse(course, currentUser, enrollmentData);
        } else {
            // Find the prerequisite course in the available courses
            const prereqCourse = coursesData.find(c => c.name === course.prerequisite);
            
            if (!prereqCourse) {
                alert(`Prerequisite course "${course.prerequisite}" not found in the system.`);
                return;
            }
            
            // Check if the student has completed the prerequisite course
            const prereqEnrollment = userEnrollments.find(e => 
                parseInt(e.courseNum, 10) === parseInt(prereqCourse.courseNum, 10)
            );
            
            if (!prereqEnrollment) {
                alert(`You must first enroll in and complete the prerequisite course: ${course.prerequisite}`);
                return;
            }
            
            // Check if the prerequisite course has a grade (meaning it's completed)
            if (!prereqEnrollment.grade) {
                alert(`You must first complete the prerequisite course: ${course.prerequisite}`);
                return;
            }
            
            // Check if the prerequisite course was passed with a passing grade
            if (prereqEnrollment.grade === "F") {
                alert(`You must pass the prerequisite course: ${course.prerequisite} (Current grade: F)`);
                return;
            }
            
            // Prerequisites met, can register
            registerNewCourse(course, currentUser, enrollmentData);
        }
    } catch (error) {
        console.error("Error registering for course:", error);
        alert("Error registering for course. Please try again.");
    }
}

// Register a new course
function registerNewCourse(course, currentUser, enrollmentData) {
    // Create new enrollment record
    const enrollment = {
        studentId: currentUser.password.toString(),
        studentName: currentUser.username,
        courseNum: parseInt(course.courseNum, 10),
        courseName: course.name, // Add course name for easier reference
        instructor: course.instructor,
        enrollmentDate: today.toLocaleDateString(),
        grade: null,
        courseStatus: course.status // Track course status
    };
    
    // Add new record
    enrollmentData.push(enrollment);
    
    // Update localStorage
    localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
    
    // Notify user
    alert('Course registered successfully');
    
    // Reload the page to show updated courses
    window.location.reload();
}