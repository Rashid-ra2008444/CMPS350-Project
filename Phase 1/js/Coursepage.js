document.addEventListener("DOMContentLoaded", function () {
    // document.getElementById("icon-button").addEventListener("click", function () {
    //     window.location.href = "login.html";
    // });

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


        // Add navigation to learning path when study plan button is clicked
    document.querySelector('.plan').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'LearningPath.html';
    });


    loadStudentClasses(currentUser);

    document.querySelector('#searchInput').addEventListener("input",()=>{
        const searchValue = document.querySelector('#searchInput').value;
        const filteredCourses = matchedCourses.filter(course =>
            course.name.toLowerCase().includes(searchValue) ||
            course.category.toLowerCase().includes(searchValue));
        const courseBox = document.querySelector('#validCourses');

        courseBox.innerHTML = '';

        if (matchedCourses.length === 0) {
            courseBox.innerHTML = '<p>You currently have no assigned courses.</p>';
            return;
        }
        filteredCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-num', course.courseNum);

            classDiv.innerHTML = `
            <h1>Name: ${course.name}</h1>
            <p>Category: ${course.category}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Instructor: ${course.instructor}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            `;

            courseBox.append(classDiv);
        });
    });

    document.querySelector('#subjectSelect').addEventListener("change",filterCategory);
});
let matchedCourses = [];
let enrollmentsData = [];
async function loadStudentClasses(currentUser) {
    try{
        // const courseBox = document.querySelector('#validCourses');

        // const coursesfetch = await fetch("data/enrollment.json");
        // const courses = await coursesfetch.json();

        // let Studentcourses = [];

        // Studentcourses = courses.filter(c => c.studentName === currentUser.username);
        // console.log(Studentcourses);
        // const HTMLcourse = Studentcourses.map(c => `<h3>${c.courseNum}</h3>`).join('');
        // courseBox.innerHTML = HTMLcourse;

        const coursesResponse = await fetch("data/courses.json");
        const coursesData = await coursesResponse.json();

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
            }
        }

        const studentCourses = enrollmentsData.filter(c => c.studentName === currentUser.username);
        const courseBox = document.querySelector('#validCourses');

        courseBox.innerHTML = '';

        if (studentCourses.length === 0) {
            courseBox.innerHTML = '<p>You currently have no assigned courses.</p>';
            return;
        }
        const enrollmentNums = studentCourses.map(e=>e.courseNum);
        matchedCourses = coursesData.filter(course => enrollmentNums.includes(course.courseNum));
        // console.log(matchedCourses);
        matchedCourses.forEach(course =>{
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-num', course.courseNum);

            classDiv.innerHTML=`
            <h1>Name: ${course.name}</h1>
            <p>Category: ${course.category}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Instructor: ${course.instructor}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            `;

            courseBox.append(classDiv);
        });


    }catch(error){
        console.error("Error loading courses:", error);
        document.querySelector('#validCourses').innerHTML =
            '<p>Error loading courses. Please try again later.</p>';
    }
};

async function filterCategory(){
    const select = document.querySelector('#subjectSelect').value;
    let filteredCourses = [];
    if(select !== 'All'){
        filteredCourses = matchedCourses.filter(course =>
            course.category === select);
    }else{
        filteredCourses = matchedCourses;
    }

    const courseBox = document.querySelector('#validCourses');

    courseBox.innerHTML = '';

    if (matchedCourses.length === 0) {
        courseBox.innerHTML = '<p>You currently have no assigned courses.</p>';
        return;
    }
    filteredCourses.forEach(course => {
        const classDiv = document.createElement('div');
        classDiv.className = 'class-card';
        classDiv.setAttribute('data-course-num', course.courseNum);

        classDiv.innerHTML = `
            <h1>Name: ${course.name}</h1>
            <p>Category: ${course.category}</p>
            <p>Course Number: ${course.courseNum}</p>
            <p>Instructor: ${course.instructor}</p>
            <p>Prerequisite: ${course.prerequisite}</p>
            `;

        courseBox.append(classDiv);
    });
}
// function showBoxes(userType) {
//     let boxes = document.querySelectorAll('.box');
//     boxes.forEach(box => box.style.display = 'none')

//     let numToShow = userType === 'student' ? 4 :
//         (userType === 'teacher' ? 6 : 8);

//     for (let i = 0; i < numToShow; i++) {
//         boxes[i].style.display = 'block';
//     }
// };

// function testFunction() {
//     console.log("Test function is working!");
//     alert("Test function is working!");
// }

// document.addEventListener("DOMContentLoaded", function () {
// document.getElementById("sub").addEventListener("click", function () {
//     showBoxes("student");
// })
// });

// document.addEventListener("DOMContentLoaded", function () {
// document.getElementById("teacher").addEventListener("click", function () {
//     showBoxes("teacher");
// })
// });

// document.addEventListener("DOMContentLoaded", function () {
//     document.getElementById("testBtn").addEventListener("click",function(){
//         testFunction();
//     })
// });