document.addEventListener("DOMContentLoaded", function() {
    let courseData = [];

    
    fetch("../Phase 1/data/courses.json")
        .then(response => response.json())
        .then(courses => {
            courseData = courses;
            displayCourses(courseData);
        })
        .catch(error => console.error("Error fetching courses data:", error));

    function displayCourses(courses) {
        const container = document.querySelector(".container"); 
        container.innerHTML = ""; 

        courses.forEach(course => {
            const box = document.createElement("div");
            box.classList.add("box");

            let courseContent = document.createElement("div");
            courseContent.classList.add("course-content");
            courseContent.innerHTML = `
                <h3>${course.name} (${course.category} ${course.courseNum})</h3>
                <p><strong>Instructor:</strong> ${course.instructor}</p>
                <p><strong>Prerequisite:</strong> ${course.prerequisite}</p>
                <p><strong>Enrolled:</strong> ${course.enrolled} students</p>
            `;

            let buttonContainer = document.createElement("div");
            buttonContainer.classList.add("button-container");

            ["Edit", "Delete", "Validate"].forEach(text => {
                let button = document.createElement("button");
                button.textContent = text;
                buttonContainer.appendChild(button);
            });

            box.appendChild(courseContent);
            box.appendChild(buttonContainer);
            container.appendChild(box);
        });
    }

   
    function filterCourses() {
        const searchValue = document.getElementById("searchInput").value.toLowerCase();
        const categoryValue = document.getElementById("courseCategory").value;

        const filteredCourses = courseData.filter(course =>
            course.name.toLowerCase().includes(searchValue) &&
            (categoryValue === "all" || course.category === categoryValue)
        );

        displayCourses(filteredCourses);
    }


    document.getElementById("searchInput").addEventListener("input", filterCourses);
    document.getElementById("courseCategory").addEventListener("change", filterCourses);
});




   
