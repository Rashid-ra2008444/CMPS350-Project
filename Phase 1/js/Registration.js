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
        const searchValue = document.querySelector('#searchInput').value;
        console.log(allCourses);
        const filteredCourses = allCourses.filter(course =>
            course.name.toLowerCase().includes(searchValue) ||
            course.category.toLowerCase().includes(searchValue)
            );
        const courseBox = document.querySelector('#validCourses');

        courseBox.innerHTML = '';

        if (allCourses.length === 0) {
            courseBox.innerHTML = '<p>You currently have no assigned courses.</p>';
            return;
        }
        filteredCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-num', course.courseNum);

            classDiv.innerHTML = `
            <h1>Name: ${course.name}</h1>
            <p>Instructor: ${course.instructor}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Category: ${course.category}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            <p>Status: ${course.status}</p>
            <div class="button-container">
                ${course.status === "valid" ? `<button class="Register pixel2">Register</button>` : ""}
                ${course.status === "valid" ? `<button class="Remove pixel2">Remove</button>` : ""}
            </div>
            `;

            courseBox.append(classDiv);
        });
    });
    document.querySelector('#subjectSelect').addEventListener("change", filterCategory);
});
let allCourses = [];
let today = new Date();

async function loadAllCourses(currentUser){
    const coursesResponse = await fetch("data/courses.json");
    const coursesData = await coursesResponse.json();
    // console.log(allCourses);
    // console.log(coursesData);
    const courseBox = document.querySelector('#validCourses');

    courseBox.innerHTML = '';

    if (coursesData.length === 0) {
        courseBox.innerHTML = '<p>No courses available currently.</p>';
        return;
    }

    coursesData.forEach(course =>{
        const classDiv = document.createElement('div');
        classDiv.className = 'class-card';
        classDiv.setAttribute('data-course-num', course.courseNum);
        allCourses.push(course);

        classDiv.innerHTML = `
            <h1>Name: ${course.name}</h1>
            <p>Instructor: ${course.instructor}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Category: ${course.category}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            <p>Status: ${course.status}</p>
            <div class="button-container">
                ${course.status === "valid" ? `<button class="Register pixel2">Register</button>` : ""}
                ${course.status === "valid" ? `<button class="Remove pixel2">Remove</button>` : ""}
            </div>
            `;

        courseBox.append(classDiv);
        if(course.status === "valid"){
            const registerCourse = classDiv.querySelector('.Register')
            registerCourse.addEventListener('click', function () {
                addCourse(course,currentUser);
            });
        }
        
    });
}

async function filterCategory() {
    const select = document.querySelector('#subjectSelect').value;
    let filteredCourses = [];
    if (select !== 'All') {
        filteredCourses = allCourses.filter(course =>
            course.category === select);
    } else {
        filteredCourses = allCourses;
    }

    const courseBox = document.querySelector('#validCourses');

    courseBox.innerHTML = '';

    if (allCourses.length === 0) {
        courseBox.innerHTML = '<p>You currently have no assigned courses.</p>';
        return;
    }
    filteredCourses.forEach(course => {
        const classDiv = document.createElement('div');
        classDiv.className = 'class-card';
        classDiv.setAttribute('data-course-num', course.courseNum);

        classDiv.innerHTML = `
            <h1>Name: ${course.name}</h1>
            <p>Instructor: ${course.instructor}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Category: ${course.category}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            <p>Status: ${course.status}</p>
            <div class="button-container">
                ${course.status === "valid" ? `<button class="Register pixel2">Register</button>` : ""}
                ${course.status === "valid" ? `<button class="Remove pixel2">Remove</button>` : ""}
            </div>
        `;
        courseBox.append(classDiv);

    });
}

async function addCourse(course,currentUser){
    const enrollmentfile = await fetch('data/enrollment.json');
    let enrollmentData = await enrollmentfile.json();
    const coursesResponse = await fetch("data/courses.json");
    const coursesData = await coursesResponse.json();
    const userEnrollments = enrollmentData.filter(c=>c.studentName == currentUser.username);
    const userCourses = coursesData.filter(course=>
        userEnrollments.some(enrollment => enrollment.courseNum === course.courseNum)
        );
    let preCourse = userCourses.find(c => c.name===course.prerequisite);
    let checkingCourse = enrollmentData.find(c=> c.courseNum == preCourse.courseNum); 
    if (userEnrollments.find(c=>c.courseNum==course.courseNum)){
        alert('Course has already been registered');
    }else if(course.prerequisite === "none" || checkingCourse.grade != "F"){
        enrollment = {
            studentId: currentUser.password.toString(),
            studentName: currentUser.username,
            courseNum: course.courseNum,
            instructor: course.instructor,
            enrollmentDate: today.toLocaleDateString(),
            grade: null
        };
        enrollmentData.push(enrollment);
        localStorage.enrollment = JSON.stringify(enrollmentData);
        alert('Course registered successfully');
    }else if(checkingCourse.grade == "F"){
        alert("Prerequisite not passed");
    }else{
        alert("Prerequisite not completed");
    }
}