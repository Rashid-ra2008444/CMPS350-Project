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

// Load all available courses - updated to show ONLY pending courses
async function loadAllCourses(currentUser) {
    try {
        // First check localStorage for courses data (added by admin)
        let coursesData = [];
        const localCourses = localStorage.getItem('courseData');
        
        if (localCourses) {
            // Use courses from localStorage (these include admin additions)
            coursesData = JSON.parse(localCourses);
            console.log("Using courses data from localStorage (includes admin additions)");
        } else {
            // If not in localStorage, fall back to file
            console.log("No courses in localStorage, loading from file");
            const coursesResponse = await fetch("data/courses.json");
            coursesData = await coursesResponse.json();
        }
        
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

        // Store only pending courses in global variable
        allCourses = coursesData.filter(course => course.status === "pending");
        console.log(`Found ${allCourses.length} pending courses in total`);
        
        // Get current enrollments to avoid showing already enrolled courses
        const currentUserName = currentUser.username;
        console.log("Current user:", currentUserName);
        
        const userEnrollments = enrollmentData.filter(e => 
            e.studentName && e.studentName.toLowerCase() === currentUserName.toLowerCase()
        );
        
        console.log("User enrollments found:", userEnrollments.length);
        
        // Create a set of enrolled course identifiers (CRN and courseNum)
        const enrolledCRNs = new Set();
        const enrolledCourseNums = new Set();
        
        userEnrollments.forEach(enrollment => {
            // Add CRN to enrolled set if available
            if (enrollment.crn) {
                enrolledCRNs.add(parseInt(enrollment.crn, 10));
            }
            // Always add courseNum as backup
            enrolledCourseNums.add(parseInt(enrollment.courseNum, 10));
        });
        
        console.log("Already enrolled CRNs:", [...enrolledCRNs]);
        console.log("Already enrolled course numbers:", [...enrolledCourseNums]);
        
        // Filter courses to show ONLY pending ones not already enrolled in
        const availableCourses = coursesData.filter(course => {
            const courseNum = parseInt(course.courseNum, 10);
            const courseCRN = parseInt(course.crn, 10);
            const isPending = course.status === "pending";
            
            // Check if student is already enrolled using either CRN or courseNum
            const isAlreadyEnrolled = enrolledCRNs.has(courseCRN) || enrolledCourseNums.has(courseNum);
            
            if (isAlreadyEnrolled) {
                console.log(`Course ${courseNum} (CRN: ${courseCRN}) already enrolled, skipping`);
            }
            
            return isPending && !isAlreadyEnrolled;
        });
        
        console.log("Available pending courses for registration:", availableCourses.length);
        
        if (availableCourses.length === 0) {
            courseBox.innerHTML = '<p>No pending courses available for registration.</p>';
            return;
        }
        
        // Display available courses
        availableCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-num', course.courseNum);
            classDiv.setAttribute('data-crn', course.crn);

            // Add a class to indicate course status
            classDiv.classList.add(`status-${course.status}`);

            // Add a class to indicate prerequisite status
            const prereqStatus = getPrerequisiteStatus(course, userEnrollments, coursesData);
            if (prereqStatus !== 'met') {
                classDiv.classList.add('prerequisite-not-met');
            }
            
            // Add class if course is full
            if (course.enrollment_actual >= course.enrollment_maximum) {
                classDiv.classList.add('course-full');
            }
            
            // Disable registration if prerequisites not met or course is full
            const isRegistrationDisabled = course.enrollment_actual >= course.enrollment_maximum || 
                                          prereqStatus !== 'met';

            // Find enrolled students for this course by CRN (preferred) or courseNum
            const enrolledStudents = enrollmentData.filter(enrollment => {
                // Try to match by CRN first
                if (enrollment.crn && course.crn) {
                    return parseInt(enrollment.crn, 10) === parseInt(course.crn, 10) && 
                           enrollment.instructor === course.instructor;
                }
                // Fall back to courseNum
                return parseInt(enrollment.courseNum, 10) === parseInt(course.courseNum, 10) && 
                       enrollment.instructor === course.instructor;
            });
            
            classDiv.innerHTML = `
                <h3>${course.name}</h3>
                <p>Instructor: ${course.instructor}</p>
                <p>Course Number: ${course.category} ${course.courseNum}</p>
                <p>CRN: ${course.crn}</p>
                <p>Category: ${course.category}</p>
                <p>Prerequisite: ${course.prerequisite}</p>
                <p>Status: <span class="status-pill status-pending">Pending Approval</span></p>
                <p>Enrollment: ${course.enrollment_maximum-enrolledStudents.length}/${course.enrollment_maximum}</p>
                ${course.enrollment_actual >= course.enrollment_maximum ? 
                  `<p class="full-warning">⚠️ Course is full</p>` : ''}
                ${prereqStatus !== 'met' ? 
                  `<p class="prereq-warning">⚠️ Prerequisite not completed</p>` : ''}
                <p class="pending-notice">ℹ️ This course is pending approval</p>
                <div class="button-container">
                    <button class="Register pixel2" ${isRegistrationDisabled ? 'disabled' : ''}>Register</button>
                </div>
            `;

            courseBox.append(classDiv);
            
            // Add register button event listener
            const registerCourse = classDiv.querySelector('.Register');
            if (registerCourse && !registerCourse.hasAttribute('disabled')) {
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
    
    // Find the prerequisite course - check all courses, not just pending ones
    const prereqCourse = allCourses.find(c => c.name === course.prerequisite);
    if (!prereqCourse) {
        return 'unknown';
    }
    
    // Check if student has completed the prerequisite
    // First try to find by CRN
    let prereqEnrollment = null;
    
    if (prereqCourse.crn) {
        prereqEnrollment = userEnrollments.find(e => 
            e.crn && parseInt(e.crn, 10) === parseInt(prereqCourse.crn, 10)
        );
    }
    
    // If not found by CRN, fall back to courseNum
    if (!prereqEnrollment) {
        prereqEnrollment = userEnrollments.find(e => 
            parseInt(e.courseNum, 10) === parseInt(prereqCourse.courseNum, 10)
        );
    }
    
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

// Filter courses by search term - now only for pending courses
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
    
    // Create sets of enrolled course identifiers
    const enrolledCRNs = new Set();
    const enrolledCourseNums = new Set();
    
    userEnrollments.forEach(enrollment => {
        if (enrollment.crn) {
            enrolledCRNs.add(parseInt(enrollment.crn, 10));
        }
        enrolledCourseNums.add(parseInt(enrollment.courseNum, 10));
    });
    
    // Filter pending courses that match search term and are not enrolled
    const filteredCourses = allCourses.filter(course => {
        const courseCRN = parseInt(course.crn, 10);
        const courseNum = parseInt(course.courseNum, 10);
        const isEnrolled = enrolledCRNs.has(courseCRN) || enrolledCourseNums.has(courseNum);
        
        return !isEnrolled && (
            course.name.toLowerCase().includes(searchValue) ||
            course.category.toLowerCase().includes(searchValue) ||
            course.crn.toString().includes(searchValue) ||
            course.courseNum.toString().includes(searchValue)
        );
    });
    
    displayFilteredCourses(filteredCourses, userEnrollments);
}

// Filter courses by category - now only for pending courses
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
    
    // Create sets of enrolled course identifiers
    const enrolledCRNs = new Set();
    const enrolledCourseNums = new Set();
    
    userEnrollments.forEach(enrollment => {
        if (enrollment.crn) {
            enrolledCRNs.add(parseInt(enrollment.crn, 10));
        }
        enrolledCourseNums.add(parseInt(enrollment.courseNum, 10));
    });
    
    // Filter pending courses by category
    let filteredCourses = [];
    
    if (selectValue !== 'All') {
        filteredCourses = allCourses.filter(course => {
            const courseCRN = parseInt(course.crn, 10);
            const courseNum = parseInt(course.courseNum, 10);
            const isEnrolled = enrolledCRNs.has(courseCRN) || enrolledCourseNums.has(courseNum);
            
            return !isEnrolled && course.category === selectValue;
        });
    } else {
        filteredCourses = allCourses.filter(course => {
            const courseCRN = parseInt(course.crn, 10);
            const courseNum = parseInt(course.courseNum, 10);
            const isEnrolled = enrolledCRNs.has(courseCRN) || enrolledCourseNums.has(courseNum);
            
            return !isEnrolled;
        });
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
        courseBox.innerHTML = '<p>No pending courses match your criteria.</p>';
        return;
    }
    
    // Get all courses for prerequisite checking
    let allCoursesData = [];
    const localCourses = localStorage.getItem('courseData');
    
    if (localCourses) {
        allCoursesData = JSON.parse(localCourses);
    } else {
        allCoursesData = []; // Empty fallback if needed
    }
    
    // Get enrollment data to check current enrollment counts
    const enrollmentData = JSON.parse(localStorage.getItem("enrollment")) || [];
    
    filteredCourses.forEach(course => {
        const classDiv = document.createElement('div');
        classDiv.className = 'class-card';
        classDiv.setAttribute('data-course-num', course.courseNum);
        classDiv.setAttribute('data-crn', course.crn);

        // Add a class to indicate pending status
        classDiv.classList.add(`status-pending`);

        // Add a class to indicate prerequisite status
        const prereqStatus = getPrerequisiteStatus(course, userEnrollments, allCoursesData);
        if (prereqStatus !== 'met') {
            classDiv.classList.add('prerequisite-not-met');
        }
        
        // Find enrolled students in this course by CRN or courseNum
        const enrolledStudents = enrollmentData.filter(enrollment => {
            // Try to match by CRN first
            if (enrollment.crn && course.crn) {
                return parseInt(enrollment.crn, 10) === parseInt(course.crn, 10) && 
                       enrollment.instructor === course.instructor;
            }
            // Fall back to courseNum
            return parseInt(enrollment.courseNum, 10) === parseInt(course.courseNum, 10) && 
                   enrollment.instructor === course.instructor;
        });
        
        // Calculate current enrollment
        const currentEnrollment = enrolledStudents.length;
        
        // Add class if course is full
        if (currentEnrollment >= course.enrollment_maximum) {
            classDiv.classList.add('course-full');
        }
        
        // Disable registration if prerequisites not met or course is full
        const isRegistrationDisabled = currentEnrollment >= course.enrollment_maximum || 
                                      prereqStatus !== 'met';

        classDiv.innerHTML = `
            <h3>${course.name}</h3>
            <p>Instructor: ${course.instructor}</p>
            <p>Course Number: ${course.category} ${course.courseNum}</p>
            <p>CRN: ${course.crn}</p>
            <p>Category: ${course.category}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            <p>Status: <span class="status-pill status-pending">Pending Approval</span></p>
            <p>Enrollment: ${currentEnrollment}/${course.enrollment_maximum}</p>
            ${currentEnrollment >= course.enrollment_maximum ? 
              `<p class="full-warning">⚠️ Course is full</p>` : ''}
            ${prereqStatus !== 'met' ? 
              `<p class="prereq-warning">⚠️ Prerequisite not completed</p>` : ''}
            <p class="pending-notice">ℹ️ This course is pending approval</p>
            <div class="button-container">
                <button class="Register pixel2" ${isRegistrationDisabled ? 'disabled' : ''}>Register</button>
            </div>
        `;
        
        courseBox.append(classDiv);
        
        // Add register button event listener
        const registerCourse = classDiv.querySelector('.Register');
        if (registerCourse && !registerCourse.hasAttribute('disabled')) {
            registerCourse.addEventListener('click', function () {
                addCourse(course, currentUser);
            });
        }
    });
}

// Add a course for the student - updated for pending courses only
async function addCourse(course, currentUser) {
    try {
        // Confirm the course is pending
        if (course.status !== "pending") {
            alert('Only pending courses can be registered.');
            return;
        }
        
        // Get enrollment data from localStorage
        let enrollmentData = JSON.parse(localStorage.getItem("enrollment"));
        
        // If data not in localStorage, load from file
        if (!enrollmentData) {
            const enrollmentResponse = await fetch('data/enrollment.json');
            enrollmentData = await enrollmentResponse.json();
        }
        
        // Load all courses data for prerequisite checking from localStorage
        let coursesData = [];
        const localCourses = localStorage.getItem('courseData');
        
        if (localCourses) {
            coursesData = JSON.parse(localCourses);
        } else {
            // If not available in localStorage, load from file
            const coursesResponse = await fetch("data/courses.json");
            coursesData = await coursesResponse.json();
        }
        
        // Check student enrollments - Fixed to use case-insensitive comparison
        const userEnrollments = enrollmentData.filter(e => 
            e.studentName && e.studentName.toLowerCase() === currentUser.username.toLowerCase()
        );
        
        // Convert course identifiers to integers for correct comparison
        const courseNum = parseInt(course.courseNum, 10);
        const courseCRN = parseInt(course.crn, 10);
        
        // Check if student is already enrolled in the course (by CRN or courseNum)
        if (userEnrollments.some(e => 
            (e.crn && parseInt(e.crn, 10) === courseCRN) || 
            parseInt(e.courseNum, 10) === courseNum
        )) {
            alert('Course has already been registered');
            return;
        }
        
        // Find enrolled students in this course by CRN or courseNum
        const enrolledStudents = enrollmentData.filter(enrollment => {
            // Try to match by CRN first
            if (enrollment.crn && course.crn) {
                return parseInt(enrollment.crn, 10) === parseInt(course.crn, 10) && 
                       enrollment.instructor === course.instructor;
            }
            // Fall back to courseNum
            return parseInt(enrollment.courseNum, 10) === parseInt(course.courseNum, 10) && 
                   enrollment.instructor === course.instructor;
        });
        
        // Check if the course has available seats
        if (enrolledStudents.length >= course.enrollment_maximum) {
            alert(`Sorry, the course "${course.name}" is already full (${enrolledStudents.length}/${course.enrollment_maximum} students). Please choose another course.`);
            return;
        }
        
        // Check prerequisites
        if (course.prerequisite === "none" || course.prerequisite === "None") {
            // No prerequisites, can register
            registerNewCourse(course, currentUser, enrollmentData);
        } else {
            // Find the prerequisite course in all courses
            const prereqCourse = coursesData.find(c => c.name === course.prerequisite);
            
            if (!prereqCourse) {
                alert(`Prerequisite course "${course.prerequisite}" not found in the system.`);
                return;
            }
            
            // Check if the student has completed the prerequisite course
            // First try to find by CRN
            let prereqEnrollment = null;
            
            if (prereqCourse.crn) {
                prereqEnrollment = userEnrollments.find(e => 
                    e.crn && parseInt(e.crn, 10) === parseInt(prereqCourse.crn, 10)
                );
            }
            
            // If not found by CRN, fall back to courseNum
            if (!prereqEnrollment) {
                prereqEnrollment = userEnrollments.find(e => 
                    parseInt(e.courseNum, 10) === parseInt(prereqCourse.courseNum, 10)
                );
            }
            
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
    // Create new enrollment record with explicit pending status
    const enrollment = {
        studentId: currentUser.password.toString(),
        studentName: currentUser.username,
        courseNum: parseInt(course.courseNum, 10),
        crn: parseInt(course.crn, 10), // Include CRN for better course identification
        courseName: course.name, // Add course name for easier reference
        instructor: course.instructor,
        enrollmentDate: today.toLocaleDateString(),
        grade: null,
        courseStatus: 'pending' // Explicitly mark as pending
    };
    
    // Print registration information for verification
    console.log("Course instructor before registration:", course.instructor);
    console.log("New enrollment with CRN:", enrollment.crn);
    console.log("New enrollment with instructor:", enrollment);
    
    console.log("Creating new enrollment:", enrollment);
    
    // Add new record
    enrollmentData.push(enrollment);
    
    // Update enrollment counts in course data
    // First, get courses from localStorage
    let courses = [];
    const localCourses = localStorage.getItem('courseData');
    
    if (localCourses) {
        courses = JSON.parse(localCourses);
        
        // Find course by CRN (primary) or courseNum (fallback)
        let courseIndex = courses.findIndex(c => parseInt(c.crn, 10) === parseInt(course.crn, 10));
        
        // If not found by CRN, try by courseNum
        if (courseIndex === -1) {
            courseIndex = courses.findIndex(c => parseInt(c.courseNum, 10) === parseInt(course.courseNum, 10));
        }
        
        if (courseIndex !== -1) {
            // Increment enrollment count
            courses[courseIndex].enrollment_actual += 1;
            // Update courses in localStorage
            localStorage.setItem('courseData', JSON.stringify(courses));
            console.log(`Updated course enrollment in 'courseData': ${courses[courseIndex].name}, new count: ${courses[courseIndex].enrollment_actual}`);
        } else {
            console.warn("Course not found in localStorage courseData for updating enrollment count");
        }
    }
    
    // Also try to update courses in the standard 'courses' localStorage
    let altCourses = JSON.parse(localStorage.getItem('courses')) || [];
    
    // Find by CRN first
    let altCourseIndex = altCourses.findIndex(c => parseInt(c.crn, 10) === parseInt(course.crn, 10));
    
    // If not found by CRN, try by courseNum
    if (altCourseIndex === -1) {
        altCourseIndex = altCourses.findIndex(c => parseInt(c.courseNum, 10) === parseInt(course.courseNum, 10));
    }
    
    if (altCourseIndex !== -1) {
        // Increment enrollment count
        altCourses[altCourseIndex].enrollment_actual += 1;
        // Update courses in localStorage
        localStorage.setItem('courses', JSON.stringify(altCourses));
        console.log(`Updated course enrollment in 'courses': ${altCourses[altCourseIndex].name}, new count: ${altCourses[altCourseIndex].enrollment_actual}`);
    }
    
    // Also update the local allCourses array so UI reflects changes without refresh
    // Find by CRN first
    const localCourseIndex = allCourses.findIndex(c => parseInt(c.crn, 10) === parseInt(course.crn, 10));
    
    if (localCourseIndex !== -1) {
        allCourses[localCourseIndex].enrollment_actual += 1;
    } else {
        // If not found by CRN, try by courseNum
        const backupIndex = allCourses.findIndex(c => parseInt(c.courseNum, 10) === parseInt(course.courseNum, 10));
        if (backupIndex !== -1) {
            allCourses[backupIndex].enrollment_actual += 1;
        }
    }
    
    // Update localStorage
    localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
    console.log(`Updated 'enrollment' in localStorage with ${enrollmentData.length} records`);
    
    // Notify user
    alert('Course registered successfully! Note that this course is pending approval.');
    
    // Reload the page to show updated courses
    window.location.reload();
}