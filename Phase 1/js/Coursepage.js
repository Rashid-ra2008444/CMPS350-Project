document.addEventListener("DOMContentLoaded", function () {
    // document.getElementById("icon-button").addEventListener("click", function () {
    //     window.location.href = "login.html";
    // });

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


    loadStudentClasses(currentUser);

    document.querySelector('#searchInput').addEventListener("input", filterCourses);
    document.querySelector('#subjectSelect').addEventListener("change", filterCategory);
});

let matchedCourses = [];
let completedCourses = [];
let enrollmentsData = [];

async function loadStudentClasses(currentUser) {
    try{
        // Load courses data
        const coursesResponse = await fetch("data/courses.json");
        const coursesData = await coursesResponse.json();

        // Load enrollment data - always from localStorage first
        const localEnrollments = localStorage.getItem('enrollment');

        if (localEnrollments) {
            // Use data from localStorage
            enrollmentsData = JSON.parse(localEnrollments);
            console.log("Using enrollment data from localStorage");
        } else {
            // Only if no data in localStorage, use the original file
            try {
                console.log("No enrollment data in localStorage, loading from file");
                const studentsResponse = await fetch("data/enrollment.json");
                enrollmentsData = await studentsResponse.json();

                // Store data in localStorage for next time
                localStorage.setItem('enrollment', JSON.stringify(enrollmentsData));
            } catch (err) {
                console.warn("Could not load enrollment data, using empty array:", err);
                enrollmentsData = [];
            }
        }

        // Find student enrollments
        const studentCourses = enrollmentsData.filter(c => c.studentName === currentUser.username);
        
        // Clear course containers
        const courseBox = document.querySelector('#validCourses');
        const completedBox = document.querySelector('#CompletCourses');
        
        courseBox.innerHTML = '';
        completedBox.innerHTML = '';

        if (studentCourses.length === 0) {
            courseBox.innerHTML = '<p>You currently have no assigned courses.</p>';
            completedBox.innerHTML = '<p>You have not completed any courses yet.</p>';
            return;
        }
        
        // Get enrolled course numbers and convert to integers
        const enrollmentNums = studentCourses.map(e => parseInt(e.courseNum, 10));
        
        // Match enrolled courses with course data
        matchedCourses = [];
        completedCourses = [];
        
        // Separate courses into current and completed
        studentCourses.forEach(enrollment => {
            const course = coursesData.find(c => parseInt(c.courseNum, 10) === parseInt(enrollment.courseNum, 10));
            
            if (course) {
                // Add enrollment info to course object
                const courseWithGrade = {
                    ...course,
                    grade: enrollment.grade
                };
                
                if (enrollment.grade) {
                    // Course has a grade - it's completed
                    completedCourses.push(courseWithGrade);
                } else {
                    // Course has no grade - it's current
                    matchedCourses.push(courseWithGrade);
                }
            }
        });

        // Display current courses
        if (matchedCourses.length === 0) {
            courseBox.innerHTML = '<p>You have no current courses.</p>';
        } else {
            matchedCourses.forEach(course => {
                const classDiv = document.createElement('div');
                classDiv.className = 'class-card';
                classDiv.setAttribute('data-course-num', course.courseNum);

                classDiv.innerHTML = `
                    <h1> ${course.name}</h1>
                    <p>Instructor: ${course.instructor}</p>
                    <p>Course Number: ${course.courseNum}</p>
                    <p>Category: ${course.category}</p>
                    <p>Prerequisite: ${course.prerequisite}</p>
                    <span class="status-pill status-in-progress">In Progress</span>
                `;

                courseBox.append(classDiv);
            });
        }
        
        // Display completed courses
        if (completedCourses.length === 0) {
            completedBox.innerHTML = '<p>You have not completed any courses yet.</p>';
        } else {
            completedCourses.forEach(course => {
                const classDiv = document.createElement('div');
                classDiv.className = 'class-card';
                classDiv.setAttribute('data-course-num', course.courseNum);
                
                // Get grade styling
                const gradeClass = getGradeClass(course.grade);

                classDiv.innerHTML = `
                    <h1>${course.name}</h1>
                    <p>Instructor: ${course.instructor}</p>
                    <p>Course Number: ${course.courseNum}</p>
                    <p>Category: ${course.category}</p>
                    <p>Prerequisite: ${course.prerequisite}</p>
                    <p>Grade: <span class="${gradeClass}">${course.grade}</span></p>
                    <span class="status-pill status-completed">Completed</span>
                `;

                completedBox.append(classDiv);
            });
        }

    } catch (error) {
        console.error("Error loading courses:", error);
        document.querySelector('#validCourses').innerHTML =
            '<p>Error loading courses. Please try again later.</p>';
    }
};

// Helper function to get grade styling class
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

// Filter courses by search term
function filterCourses() {
    const searchValue = document.querySelector('#searchInput').value.toLowerCase();
    
    // Filter current courses
    const filteredCurrent = matchedCourses.filter(course =>
        course.name.toLowerCase().includes(searchValue) ||
        course.category.toLowerCase().includes(searchValue));
    
    // Filter completed courses
    const filteredCompleted = completedCourses.filter(course =>
        course.name.toLowerCase().includes(searchValue) ||
        course.category.toLowerCase().includes(searchValue));
    
    // Display filtered courses
    displayFilteredCourses(filteredCurrent, filteredCompleted);
}

// Filter courses by category
async function filterCategory() {
    const select = document.querySelector('#subjectSelect').value;
    
    // Filter current courses
    let filteredCurrent = [];
    let filteredCompleted = [];
    
    if (select !== 'All') {
        filteredCurrent = matchedCourses.filter(course =>
            course.category === select);
        filteredCompleted = completedCourses.filter(course =>
            course.category === select);
    } else {
        filteredCurrent = matchedCourses;
        filteredCompleted = completedCourses;
    }

    // Display filtered courses
    displayFilteredCourses(filteredCurrent, filteredCompleted);
}

// Display filtered courses in both sections
function displayFilteredCourses(currentCourses, completedCourses) {
    // Current courses
    const courseBox = document.querySelector('#validCourses');
    courseBox.innerHTML = '';
    
    if (currentCourses.length === 0) {
        courseBox.innerHTML = '<p>No current courses match your criteria.</p>';
    } else {
        currentCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-num', course.courseNum);

            classDiv.innerHTML = `
                <h1>${course.name}</h1>
                <p>Instructor: ${course.instructor}</p>
                <p>Course Number: ${course.courseNum}</p>
                <p>Category: ${course.category}</p>
                <p>Prerequisite: ${course.prerequisite}</p>
                <span class="status-pill status-in-progress">In Progress</span>
            `;

            courseBox.append(classDiv);
        });
    }
    
    // Completed courses
    const completedBox = document.querySelector('#CompletCourses');
    completedBox.innerHTML = '';
    
    if (completedCourses.length === 0) {
        completedBox.innerHTML = '<p>No completed courses match your criteria.</p>';
    } else {
        completedCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-num', course.courseNum);
            
            // Get grade styling
            const gradeClass = getGradeClass(course.grade);

            classDiv.innerHTML = `
                <h1>${course.name}</h1>
                <p>Instructor: ${course.instructor}</p>
                <p>Course Number: ${course.courseNum}</p>
                <p>Category: ${course.category}</p>
                <p>Prerequisite: ${course.prerequisite}</p>
                <p>Grade: <span class="${gradeClass}">${course.grade}</span></p>
                <span class="status-pill status-completed">Completed</span>
            `;

            completedBox.append(classDiv);
        });
    }
}