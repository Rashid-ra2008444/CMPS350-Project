document.addEventListener("DOMContentLoaded", function() {
    let courseData = [];

    // reading the json file 
    fetch("../Phase 1/data/courses.json")
        .then(response => response.json())
        .then(courses => {
            courseData = courses;
            displayCourses(courseData);
        })
        .catch(error => console.error("Error fetching courses data:", error));
        // Content of the box
    function displayCourses(courses) {

        const pendingCourses = document.getElementById("pendingCourses");
        const validCourses = document.getElementById("validCourses");
        const invalidCourses = document.getElementById("invalidCourses");

        pendingCourses.innerHTML = "";
        validCourses.innerHTML = "";
        invalidCourses.innerHTML = "";

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
                <p><strong>Status:</strong> ${course.status}</p>
            `;

            let buttonContainer = document.createElement("div");
            buttonContainer.classList.add("button-container");

            if(course.status === "pending") {
                let editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.addEventListener("click", () => editCourse(course , box));
                buttonContainer.appendChild(editButton);

                let validateButton = document.createElement("button");
                validateButton.textContent = "Validate";
                validateButton.addEventListener("click", () => validateCourse(course, box));
                buttonContainer.appendChild(validateButton);
            }

            let deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteCourse(course, box));
            buttonContainer.appendChild(deleteButton);

            

            box.appendChild(courseContent);
            box.appendChild(buttonContainer);
            
            if(course.status === "pending") {
                pendingCourses.appendChild(box);
            }
            else if(course.status === "valid") {
                validCourses.appendChild(box);
            }
            else {
                invalidCourses.appendChild(box);
            }
        });
    }

    function editCourse(course , box) {
        let courseContent = box.querySelector(".course-content");
        courseContent.innerHTML=`
         <input type="text" id="editName" value="${course.name}" />
        <input type="text" id="editInstructor" value="${course.instructor}" />
        <input type="text" id="editPrerequisite" value="${course.prerequisite}" />
        <input type="number" id="editEnrolled" value="${course.enrolled}" />
        <button onclick="saveCourse('${course.name}', this)">Save</button>
        `;
    }

    //Need to fix not returning to the original form after saving course
    function saveCourse(oldName,saveButton) {
        const box = saveButton.closet(".box");

        let updateCourse = {
            name: box.querySelector("#editName").value,
            instructor: box.querySelector("#editInstructor").value,
            prerequisite: box.querySelector("#editPrerequisite").value,
            enrolled: parseInt(box.querySelector("#editEnrolled").value),
            status: "pending"
        };

        let index = courseData.findIndex(course => course.name === oldName);
        if(index!== -1) {
            courseData[index] = updateCourse;
            displayCourses(courseData);
        }
        displayCourses(courseData);
    }

    function deleteCourse(course) {
        courseData = courseData.filter(c => c.name !== course.name);
        displayCourses(courseData);
    }

   //filter function
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




   
