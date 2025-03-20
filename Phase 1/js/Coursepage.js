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
    loadStudentClasses(currentUser);

});


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

        let enrollmentsData = [];
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

        const Studentcourses = enrollmentsData.filter(c => c.studentName === currentUser.username);
        const courseBox = document.querySelector('#validCourses');

        courseBox.innerHTML = '';

        if (Studentcourses.length === 0) {
            courseBox.innerHTML = '<p>You currently have no assigned courses.</p>';
            return;
        }
        const enrollmentNums = Studentcourses.map(e=>e.courseNum);
        const matchedCourses = coursesData.filter(course => enrollmentNums.includes(course.courseNum));
        console.log(matchedCourses);
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
        // document.getElementById('classes-container').innerHTML =
        //     '<p>Error loading courses. Please try again later.</p>';
    }
};

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