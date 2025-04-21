document.addEventListener("DOMContentLoaded", function () {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || currentUser.status !== 'student') {
        // Redirect to login if not a student
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('student-name').textContent = currentUser.username;
    
    document.getElementById('logout').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Add navigation to learning path when study plan button is clicked
    document.querySelector('.plan').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'LearningPath.html';
    });
    
    // Add navigation to Registration when Register courses button is
    document.querySelector('.Register').addEventListener('click',function(e){
        e.preventDefault();
        window.location.href = 'Registration.html';
    });

    loadAllCourses(currentUser);

    document.querySelector('#searchInput').addEventListener("input", filterCourses);
    document.querySelector('#subjectSelect').addEventListener("change", filterCategory);
});

// Arrays for course categories
let pendingCourses = []; // Pending courses
let validCourses = []; // Valid courses
let enrollmentsData = [];

async function loadAllCourses(currentUser) {
    try {
        console.log("Loading pending courses for user:", currentUser.username);
        
        // First, load course data from localStorage (for admin-added courses)
        let coursesData = [];
        
        // Try to load from courseData first (admin data)
        const adminCoursesStorage = localStorage.getItem('courseData');
        if (adminCoursesStorage) {
            coursesData = JSON.parse(adminCoursesStorage);
            console.log(`Loaded ${coursesData.length} courses from 'courseData' in localStorage`);
        } 
        // If not available, try to load from courses (registration system data)
        else {
            const registrationCoursesStorage = localStorage.getItem('courses');
            if (registrationCoursesStorage) {
                coursesData = JSON.parse(registrationCoursesStorage);
                console.log(`Loaded ${coursesData.length} courses from 'courses' in localStorage`);
            } 
            // If still not available, load from file
            else {
                console.log("No courses in localStorage, loading from file");
                const coursesResponse = await fetch("data/courses.json");
                coursesData = await coursesResponse.json();
                console.log(`Loaded ${coursesData.length} courses from data file`);
            }
        }

        // Load enrollment data from localStorage
        let enrollmentData = [];
        const localEnrollments = localStorage.getItem('enrollment');

        if (localEnrollments) {
            // Use data from localStorage
            enrollmentData = JSON.parse(localEnrollments);
            console.log(`Found ${enrollmentData.length} enrollment records in localStorage`);
        } else {
            // Only if no data in localStorage, use the original file
            try {
                console.log("No enrollment data in localStorage, loading from file");
                const studentsResponse = await fetch("data/enrollment.json");
                enrollmentData = await studentsResponse.json();
                console.log(`Loaded ${enrollmentData.length} enrollment records from file`);

                // Store data in localStorage for next time
                localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
            } catch (err) {
                console.warn("Could not load enrollment data, using empty array:", err);
                enrollmentData = [];
            }
        }

        // Find student enrollments - ensure using correct student name/case
        console.log(`Looking for enrollments for student: '${currentUser.username}'`);
        const studentCourses = enrollmentData.filter(enrollment => {
            // Make the student name comparison case-insensitive
            const match = enrollment.studentName && 
                          enrollment.studentName.toLowerCase() === currentUser.username.toLowerCase();
            if (match) {
                console.log(`Found enrollment for course ${enrollment.courseNum} ${enrollment.crn ? `(CRN: ${enrollment.crn})` : ''}`);
            }
            return match;
        });
        
        console.log(`Found ${studentCourses.length} enrollments for this student`);
        
        // Get the containers for both pending and valid courses
        const pendingBox = document.querySelector('#pendingCourses');
        const validBox = document.querySelector('#validCourses');
        
        pendingBox.innerHTML = '';
        validBox.innerHTML = '';

        if (studentCourses.length === 0) {
            pendingBox.innerHTML = '<p>You have no pending courses.</p>';
            validBox.innerHTML = '<p>You have no approved courses.</p>';
            return;
        }
        
        // Reset the course arrays
        pendingCourses = [];
        validCourses = [];
        
        // Filter courses by status
        studentCourses.forEach(enrollment => {
            console.log(`Checking enrollment for course ${enrollment.courseNum} with status: ${enrollment.courseStatus || 'unknown'}`);
            
            // Try to find course by CRN first (preferred)
            let course = null;
            
            if (enrollment.crn) {
                course = coursesData.find(c => parseInt(c.crn, 10) === parseInt(enrollment.crn, 10));
                if (course) {
                    console.log(`Found course by CRN ${enrollment.crn}`);
                }
            }
            
            // If not found by CRN, fallback to courseNum (backward compatibility)
            if (!course) {
                course = coursesData.find(c => parseInt(c.courseNum, 10) === parseInt(enrollment.courseNum, 10));
                if (course) {
                    console.log(`Found course by courseNum ${enrollment.courseNum}`);
                    
                    // Update enrollment with CRN if missing
                    if (!enrollment.crn && course.crn) {
                        enrollment.crn = course.crn;
                        console.log(`Updated enrollment with CRN ${course.crn}`);
                    }
                }
            }
            
            if (course) {
                console.log(`Found course ${course.courseNum} with status: ${course.status}`);
                
                // Add enrollment info to course object
                const courseWithInfo = {
                    ...course,
                    grade: enrollment.grade,
                    instructor: enrollment.instructor || course.instructor,
                    crn: course.crn || enrollment.crn // Ensure CRN is included
                };
                
                console.log(`Course ${course.courseNum} instructor set to:`, courseWithInfo.instructor);
                
                // Check if course is pending or valid
                const isPending = enrollment.courseStatus === 'pending' || course.status === 'pending';
                const isValid = course.status === 'valid';
                const hasGrade = enrollment.grade !== null && enrollment.grade !== undefined;
                
                if (isPending) {
                    console.log(`Course ${course.courseNum} is pending, adding to pending list`);
                    pendingCourses.push(courseWithInfo);
                } 
                // Only add to valid courses if it has no grade yet
                else if (isValid && !hasGrade) {
                    console.log(`Course ${course.courseNum} is valid and has no grade, adding to valid list`);
                    validCourses.push(courseWithInfo);
                } 
                else if (hasGrade) {
                    console.log(`Course ${course.courseNum} has grade ${enrollment.grade}, skipping (completed course)`);
                }
                else {
                    console.log(`Course ${course.courseNum} is neither pending nor valid (status: ${course.status}), skipping`);
                }
            } else {
                console.log(`Could not find course data for course ${enrollment.courseNum}`);
            }
        });

        console.log(`Found ${pendingCourses.length} pending courses and ${validCourses.length} valid courses to display`);

        // Display pending courses
        if (pendingCourses.length === 0) {
            pendingBox.innerHTML = '<p>You have no pending courses.</p>';
        } else {
            pendingCourses.forEach(course => {
                const classDiv = document.createElement('div');
                classDiv.className = 'class-card pending-card'; // Add pending-card class for styling
                classDiv.setAttribute('data-course-num', course.courseNum);
                classDiv.setAttribute('data-crn', course.crn); // Add CRN attribute

                console.log(`Pending course ${course.courseNum} (CRN: ${course.crn}) instructor:`, course.instructor);
                
                const instructorName = course.instructor || "Unknown";
                
                classDiv.innerHTML = `
                    <h1>${course.name}</h1>
                    <p>Instructor: ${instructorName}</p>
                    <p>Course Number: ${course.courseNum}</p>
                    <p>CRN: ${course.crn}</p>
                    <p>Category: ${course.category}</p>
                    <p>Prerequisite: ${course.prerequisite}</p>
                    <p class="pending-status">Status: <span class="status-pill status-pending">Pending Approval</span></p>
                `;

                pendingBox.append(classDiv);
            });
        }
        
        // Display valid courses
        if (validCourses.length === 0) {
            validBox.innerHTML = '<p>You have no active approved courses. Courses with grades will appear in your Learning Path.</p>';
        } else {
            validCourses.forEach(course => {
                const classDiv = document.createElement('div');
                classDiv.className = 'class-card valid-card'; // Add valid-card class for styling
                classDiv.setAttribute('data-course-num', course.courseNum);
                classDiv.setAttribute('data-crn', course.crn); // Add CRN attribute

                console.log(`Valid course ${course.courseNum} (CRN: ${course.crn}) instructor:`, course.instructor);
                
                const instructorName = course.instructor || "Unknown";
                
                classDiv.innerHTML = `
                    <h1>${course.name}</h1>
                    <p>Instructor: ${instructorName}</p>
                    <p>Course Number: ${course.courseNum}</p>
                    <p>CRN: ${course.crn}</p>
                    <p>Category: ${course.category}</p>
                    <p>Prerequisite: ${course.prerequisite}</p>
                    <p class="status">Status: <span class="status-pill status-valid">Approved</span></p>
                `;

                validBox.append(classDiv);
            });
        }

    } catch (error) {
        console.error("Error loading courses:", error);
        console.error("Stack trace:", error.stack);
        document.querySelector('#pendingCourses').innerHTML =
            '<p>Error loading courses. Please try again later.</p>';
    }
}

// Filter courses by search term - for both pending and valid courses
function filterCourses() {
    const searchValue = document.querySelector('#searchInput').value.toLowerCase();
    
    // Filter pending courses
    const filteredPending = pendingCourses.filter(course =>
        course.name.toLowerCase().includes(searchValue) ||
        course.category.toLowerCase().includes(searchValue));
    
    // Filter valid courses
    const filteredValid = validCourses.filter(course =>
        course.name.toLowerCase().includes(searchValue) ||
        course.category.toLowerCase().includes(searchValue));
    
    // Display filtered courses
    displayFilteredCourses(filteredPending, filteredValid);
}

// Filter courses by category - for both pending and valid courses
function filterCategory() {
    const select = document.querySelector('#subjectSelect').value;
    
    // Filter courses
    let filteredPending = [];
    let filteredValid = [];
    
    if (select !== 'All') {
        filteredPending = pendingCourses.filter(course =>
            course.category === select);
        filteredValid = validCourses.filter(course =>
            course.category === select);
    } else {
        filteredPending = pendingCourses;
        filteredValid = validCourses;
    }

    // Display filtered courses
    displayFilteredCourses(filteredPending, filteredValid);
}

// Display filtered courses - for both pending and valid courses
function displayFilteredCourses(filteredPending, filteredValid) {
    // Pending courses
    const pendingBox = document.querySelector('#pendingCourses');
    pendingBox.innerHTML = '';
    
    if (filteredPending.length === 0) {
        pendingBox.innerHTML = '<p>No pending courses match your criteria.</p>';
    } else {
        filteredPending.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card pending-card'; // Add pending-card class for styling
            classDiv.setAttribute('data-course-num', course.courseNum);
            classDiv.setAttribute('data-crn', course.crn); // Add CRN attribute

            const instructorName = course.instructor || "Unknown";

            classDiv.innerHTML = `
                <h1>${course.name}</h1>
                <p>Instructor: ${instructorName}</p>
                <p>Course Number: ${course.courseNum}</p>
                <p>CRN: ${course.crn}</p>
                <p>Category: ${course.category}</p>
                <p>Prerequisite: ${course.prerequisite}</p>
                <p class="pending-status">Status: <span class="status-pill status-pending">Pending Approval</span></p>
                <span class="status-pill status-waiting">Waiting for Approval</span>
            `;

            pendingBox.append(classDiv);
        });
    }
    
    // Valid courses
    const validBox = document.querySelector('#validCourses');
    validBox.innerHTML = '';
    
    if (filteredValid.length === 0) {
        validBox.innerHTML = '<p>No active approved courses match your criteria. Courses with grades will appear in your Learning Path.</p>';
    } else {
        filteredValid.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card valid-card'; // Add valid-card class for styling
            classDiv.setAttribute('data-course-num', course.courseNum);
            classDiv.setAttribute('data-crn', course.crn); // Add CRN attribute

            const instructorName = course.instructor || "Unknown";

            classDiv.innerHTML = `
                <h1>${course.name}</h1>
                <p>Instructor: ${instructorName}</p>
                <p>Course Number: ${course.courseNum}</p>
                <p>CRN: ${course.crn}</p>
                <p>Category: ${course.category}</p>
                <p>Prerequisite: ${course.prerequisite}</p>
                <p class="status">Status: <span class="status-pill status-valid">Approved</span></p>
            `;

            validBox.append(classDiv);
        });
    }
}