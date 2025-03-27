document.addEventListener("DOMContentLoaded", function () {

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let enrollments = localStorage.getItem("enrollment");

    if (!currentUser || currentUser.status !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('student-name').textContent = currentUser.username;

    document.querySelector('.Coursepage').addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'Coursepage.html';
    });
    document.querySelector('.plan').addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'LearningPath.html';
    });
    document.querySelector('.logout').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    loadAllCourses(currentUser);

    document.querySelector('#searchInput').addEventListener("input", () => {
        const searchValue = document.querySelector('#searchInput').value.toLowerCase();
        const filteredCourses = allCourses.filter(course =>
            course.status === "pending" && (
                course.name.toLowerCase().includes(searchValue) ||
                course.category.toLowerCase().includes(searchValue)
            )
        );
        const courseBox = document.querySelector('#pendingCourses');

        courseBox.innerHTML = '';

        if (filteredCourses.length === 0) {
            courseBox.innerHTML = '<p>No pending courses match your search.</p>';
            return;
        }
        filteredCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-id', `${course.name}-${course.courseNum}`);

            classDiv.innerHTML = `
            <h1>${course.name}</h1>
            <p>Instructor: ${course.instructor}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Category: ${course.category}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            <p>Enrollment Actual: ${course.enrollment_actual}</p>
            <p>Enrollment Remaining: ${course.enrollment_maximum}</p>
            <div class="button-container">
                <button class="Register pixel2">Register</button>
            </div>
            `;

            courseBox.append(classDiv);
            
            const registerCourse = classDiv.querySelector('.Register');
            registerCourse.addEventListener('click', function () {
                addCourse(course, currentUser);
            });
        });
    });
    document.querySelector('#subjectSelect').addEventListener("change", filterCategory);
});
let allCourses = [];
let today = new Date();

async function loadAllCourses(currentUser){
   
    const localStorageCourses = localStorage.getItem('courses');
    let coursesData;
    
    if (localStorageCourses) {
        coursesData = JSON.parse(localStorageCourses);
    } else {
       
        const coursesResponse = await fetch("data/courses.json");
        coursesData = await coursesResponse.json();
        
        
        localStorage.setItem('courses', JSON.stringify(coursesData));
    }
    
    const courseBox = document.querySelector('#pendingCourses');
    courseBox.innerHTML = '';

    
    const pendingCourses = coursesData.filter(course => course.status === "pending");
    
    if (pendingCourses.length === 0) {
        courseBox.innerHTML = '<p>No pending courses available currently.</p>';
        return;
    }

    allCourses = coursesData; 
    
    pendingCourses.forEach(course => {
        const classDiv = document.createElement('div');
        classDiv.className = 'class-card';
        classDiv.setAttribute('data-course-id', `${course.name}-${course.courseNum}`);

        classDiv.innerHTML = `
            <h1>${course.name}</h1>
            <p>Instructor: ${course.instructor}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Category: ${course.category}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            <p>Enrollment Actual: ${course.enrollment_actual}</p>
            <p>Enrollment Remaining: ${course.enrollment_maximum}</p>
            <div class="button-container">
                <button class="Register pixel2">Register</button>
            </div>
            `;

        courseBox.append(classDiv);
        
        const registerCourse = classDiv.querySelector('.Register');
        registerCourse.addEventListener('click', function () {
            addCourse(course, currentUser);
        });
    });
}

async function filterCategory() {
    const select = document.querySelector('#subjectSelect').value;
    let filteredCourses = [];
    
    if (select !== 'All') {
        filteredCourses = allCourses.filter(course =>
            course.status === "pending" && course.category === select);
    } else {
        
        filteredCourses = allCourses.filter(course => course.status === "pending");
    }

    const courseBox = document.querySelector('#pendingCourses');

    courseBox.innerHTML = '';

    if (filteredCourses.length === 0) {
        courseBox.innerHTML = '<p>No pending courses available.</p>';
        return;
    }
    
    filteredCourses.forEach(course => {
        const classDiv = document.createElement('div');
        classDiv.className = 'class-card';
        classDiv.setAttribute('data-course-id', `${course.name}-${course.courseNum}`);

        classDiv.innerHTML = `
            <h1>${course.name}</h1>
            <p>Instructor: ${course.instructor}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Category: ${course.category}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            <p>Enrollment Actual: ${course.enrollment_actual}</p>
            <p>Enrollment Remaining: ${course.enrollment_maximum}</p>
            <div class="button-container">
                <button class="Register pixel2">Register</button>
            </div>
        `;
        courseBox.append(classDiv);
        
        const registerCourse = classDiv.querySelector('.Register');
        registerCourse.addEventListener('click', function () {
            addCourse(course, currentUser);
        });
    });
}

async function addCourse(course, currentUser) {
    try {
        let enrollmentData;
        const localEnrollments = localStorage.getItem('enrollment');
        
        if (localEnrollments) {
            enrollmentData = JSON.parse(localEnrollments);
        } else {
            const enrollmentResponse = await fetch('data/enrollment.json');
            enrollmentData = await enrollmentResponse.json();
        }

       
        let coursesData;
        const localCourses = localStorage.getItem('courses');
        
        if (localCourses) {
            coursesData = JSON.parse(localCourses);
        } else {
            const coursesResponse = await fetch('data/courses.json');
            coursesData = await coursesResponse.json();
        }

        const userEnrollments = enrollmentData.filter(e => e.studentName === currentUser.username);
        const userCompletedCourses = userEnrollments.filter(e => e.grade && e.grade !== 'F');

       
        const isAlreadyRegistered = userEnrollments.some(
            e => e.courseNum === course.courseNum && e.courseName === course.name
        );

        if (isAlreadyRegistered) {
            alert('This specific course is already registered');
            return;
        }

        const prerequisiteValidation = validatePrerequisite(course, userCompletedCourses, coursesData);

        if (prerequisiteValidation.isValid) {
            const newEnrollment = {
                studentId: currentUser.password.toString(),
                studentName: currentUser.username,
                courseNum: course.courseNum,
                courseName: course.name, 
                instructor: course.instructor,
                enrollmentDate: new Date().toISOString().split('T')[0],
                grade: null
            };

            enrollmentData.push(newEnrollment);
            localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
            
           
            const courseIndex = coursesData.findIndex(c => 
                c.courseNum === course.courseNum && c.name === course.name);
                
            if (courseIndex !== -1) {
                coursesData[courseIndex].enrollment_actual += 1;
                localStorage.setItem('courses', JSON.stringify(coursesData));
                localStorage.setItem('courseData', JSON.stringify(coursesData)); // Also update admin view
            }
            
            alert('Course registered successfully');
            
          
            loadAllCourses(currentUser);
        } else {
            alert(prerequisiteValidation.message);
        }
    } catch (error) {
        console.error('Course registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

function validatePrerequisite(course, completedCourses, allCourses) {
    if (course.prerequisite === 'none') {
        return { isValid: true, message: '' };
    }

    const prerequisiteCourse = allCourses.find(c => c.name === course.prerequisite);

    if (!prerequisiteCourse) {
        return { 
            isValid: false, 
            message: 'Invalid prerequisite configuration' 
        };
    }

    const isPrerequisiteCompleted = completedCourses.some(
        completedCourse => completedCourse.courseNum === prerequisiteCourse.courseNum
    );

    return isPrerequisiteCompleted 
        ? { isValid: true, message: '' }
        : { 
            isValid: false, 
            message: `You must complete ${course.prerequisite} before registering` 
        };
}