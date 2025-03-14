document.addEventListener("DOMContentLoaded", function() {
    let courseData = [];
    let resetButtonAdded = false; // Flag to track if reset button has been added

    
    function loadCourseData() {
        const storedData = localStorage.getItem('courseData');
        if (storedData) {
            return JSON.parse(storedData);
        } else {
            
            return fetch("../Phase 1/data/courses.json")
                .then(response => response.json())
                .then(courses => {
                    
                    saveCourseData(courses);
                    return courses;
                })
                .catch(error => {
                    console.error("Error fetching courses data:", error);
                    return [];
                });
        }
    }

    
    function saveCourseData(courses) {
        localStorage.setItem('courseData', JSON.stringify(courses));
    }

    
    async function initializeApp() {
        try {
            courseData = await loadCourseData();
            displayCourses(courseData);
            
            
            if (!resetButtonAdded) {
                addResetButton();
                resetButtonAdded = true;
            }
        } catch (error) {
            console.error("Error initializing app:", error);
        }
    }

    
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
                <p><strong>Enrollment Maximum:</strong> ${course.enrollment_maximum}</p>
                <p><strong>Enrollment Actual:</strong> ${course.enrollment_actual}</p>
                <p><strong>Status:</strong> ${course.status}</p>
            `;

            let buttonContainer = document.createElement("div");
            buttonContainer.classList.add("button-container");

            if(course.status === "pending") {
                let editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.classList.add("pixel2");
                editButton.addEventListener("click", () => editCourse(course, box));
                buttonContainer.appendChild(editButton);

                let validateButton = document.createElement("button");
                validateButton.textContent = "Validate";
                validateButton.classList.add("pixel2");
                validateButton.addEventListener("click", () => validateCourse(course.name, box));
                buttonContainer.appendChild(validateButton);
            }

            let deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.classList.add("pixel2");
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

    function editCourse(course, box) {
        let courseContent = box.querySelector(".course-content");
        courseContent.innerHTML = `
            <p>Name<input type="text" id="editName" value="${course.name}" /></p>
            <p>Course Number<input type="number" id="editCourseNum" value="${course.courseNum}" /></p>
            <p>Instructor<input type="text" id="editInstructor" value="${course.instructor}" /></p>
            <p>Prerequisite<input type="text" id="editPrerequisite" value="${course.prerequisite}" /></p>
            <p>Enrolled<input type="number" id="editEnrolled" value="${course.enrollment_maximum}" /></p>
            <p>Category
                <select id="editCategory">
                    <option value="all" ${course.category === 'all' ? 'selected' : ''}>All Category</option>
                    <option value="CMPS" ${course.category === 'CMPS' ? 'selected' : ''}>Computer Science</option>
                    <option value="CMPE" ${course.category === 'CMPE' ? 'selected' : ''}>Computer Engineering</option>
                    <option value="MATH" ${course.category === 'MATH' ? 'selected' : ''}>Mathematics</option>
                    <option value="GENG" ${course.category === 'GENG' ? 'selected' : ''}>General Engineering</option>
                </select>
            </p>
            <button class="pixel2" id="saveButton">Save</button>
        `;

        box.querySelector("#saveButton").addEventListener("click", function() {
            console.log("save button clicked");
            saveCourse(course.name, box);
        });
    }

    function saveCourse(oldName, box) {
        let index = courseData.findIndex(course => course.name === oldName);

        if (index === -1) {
            console.error("Course not found");
            return;
        }

        let updateCourse = {
            name: box.querySelector("#editName").value,
            courseNum: box.querySelector("#editCourseNum").value,
            instructor: box.querySelector("#editInstructor").value,
            prerequisite: box.querySelector("#editPrerequisite").value,
            enrollment_maximum: parseInt(box.querySelector("#editEnrolled").value),
            enrollment_actual: courseData[index].enrollment_actual,
            category: box.querySelector("#editCategory").value,
            status: courseData[index].status
        };

        courseData[index] = updateCourse;
        
        
        saveCourseData(courseData);
        
        box.innerHTML = `
        <div class="course-content">
            <h3>${updateCourse.name} (${updateCourse.category} ${updateCourse.courseNum})</h3>
            <p><strong>Instructor:</strong> ${updateCourse.instructor}</p>
            <p><strong>Prerequisite:</strong> ${updateCourse.prerequisite}</p>
            <p><strong>Enrollment Maximum:</strong> ${updateCourse.enrollment_maximum}</p>
            <p><strong>Enrollment Actual:</strong> ${updateCourse.enrollment_actual}</p>
            <p><strong>Status:</strong> ${updateCourse.status}</p>
        </div>
        <div class="button-container">
            <button class="edit-btn pixel2">Edit</button>
            ${updateCourse.status === "pending" ? `<button class="validate-btn pixel2">Validate</button>` : ""}
            <button class="delete-btn pixel2">Delete</button>
        </div>
        `;

        console.log("Box updated back to normal state");

        box.querySelector(".edit-btn").addEventListener("click", () => editCourse(updateCourse, box));
        if (updateCourse.status === "pending") {
            box.querySelector(".validate-btn").addEventListener("click", () => validateCourse(updateCourse.name, box));
        }
        box.querySelector(".delete-btn").addEventListener("click", () => deleteCourse(updateCourse, box));
    }

    function deleteCourse(course) {
        courseData = courseData.filter(c => c.name !== course.name);
        
        saveCourseData(courseData);
        displayCourses(courseData);
    }

    // Filter function
    function filterCourses() {
        const searchValue = document.getElementById("searchInput").value.toLowerCase();
        const categoryValue = document.getElementById("courseCategory").value;

        const filteredCourses = courseData.filter(course =>
            course.name.toLowerCase().includes(searchValue) &&
            (categoryValue === "all" || course.category === categoryValue)
        );

        displayCourses(filteredCourses);
    }
    
    function validateCourse(courseName, box) {
        let course = courseData.find(course => course.name === courseName);

        if(course === undefined) {
            console.error("Course not found");
            return;
        }
        box.innerHTML = `
        <div class="course-content"> 
            <button class="valid-btn pixel2">Valid</button>
            <button class="invalid-btn pixel2">Invalid</button>
        </div>
        `;

        box.querySelector(".valid-btn").addEventListener("click", () => {
            updateCourseStatus(courseName, "valid");
            console.log("Course status updated to valid");
            displayCourses(courseData);
        });
        box.querySelector(".invalid-btn").addEventListener("click", () => {
            updateCourseStatus(courseName, "invalid");
            console.log("Course status updated to invalid");
            displayCourses(courseData);
        });
    }
    
    function updateCourseStatus(courseName, status) {
        let course = courseData.find(course => course.name === courseName);
        if(course === undefined) {
            console.error("Course not found");
            return;
        }
        course.status = status;
        
        saveCourseData(courseData);
        console.log("Course status updated");
    }

    function addCourse() {
        let addCourseButton = document.querySelector(".add-course");
    
        if (addCourseButton) {
            addCourseButton.addEventListener("click", function() {
                let formContainer = document.createElement("div");
                formContainer.classList.add("form-container");
                formContainer.innerHTML = `
                    <div class="form-box" style="
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background-color: white;
                        padding: 20px;
                        border: 2px solid black;
                        box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2);
                        border-radius: 10px;
                        text-align: center;">
                        <h3>Add New Course</h3>
                        <div class="form-box-container">
                        <label style="width:100%; float: left">Name: <input type="text" id="newName" required></label>
                        <label style="width:100%">Course Number: <input type="number" id="newCourseNum" required></label>
                        <label style="width:100%">Instructor: <input type="text" id="newInstructor" required></label>
                        <label style="width:100%">Prerequisite: <input type="text" id="newPrerequisite"></label>
                        <label style="width:100%">Enrolled: <input type="number" id="newEnrolled" value="0" required></label>
                        <label style="width:100%">Category:
                            <select id="newCategory">
                                <option value="CMPS">Computer Science</option>
                                <option value="CMPE">Computer Engineering</option>
                                <option value="MATH">Mathematics</option>
                                <option value="GENG">General Engineering</option>
                            </select>
                        </label>
                        </div>
                        <button class="pixel2" id="saveNewCourse">Save</button>
                        <button class="pixel2" id="cancelNewCourse">Cancel</button>
                    </div>
                `;
                
                document.body.appendChild(formContainer);
    
                document.getElementById("saveNewCourse").addEventListener("click", function() {
                    let newCourse = {
                        name: document.getElementById("newName").value,
                        courseNum: document.getElementById("newCourseNum").value,
                        instructor: document.getElementById("newInstructor").value,
                        prerequisite: document.getElementById("newPrerequisite").value || "None",
                        enrollment_maximum: parseInt(document.getElementById("newEnrolled").value),
                        enrollment_actual: 0,
                        category: document.getElementById("newCategory").value,
                        status: "pending"
                    };
                    
                    courseData.push(newCourse);
                    
                    saveCourseData(courseData);
                    displayCourses(courseData);
                    document.body.removeChild(formContainer);
                });
                
                document.getElementById("cancelNewCourse").addEventListener("click", function() {
                    document.body.removeChild(formContainer);
                });
            });
        }
    }

    
    function addResetButton() {
        const sidebar = document.querySelector(".sidebar nav");
        
        if (sidebar) {
           
            const resetButton = document.createElement("button");
            resetButton.textContent = "Reset Data";
            resetButton.classList.add("pixel2");
            resetButton.id = "resetDataButton";
            resetButton.style.marginTop = "10px";
            
            resetButton.addEventListener("click", function() {
                if (confirm("Are you sure you want to reset all course data? This will reload data from the original JSON file.")) {
                    localStorage.removeItem('courseData');
                    
                    loadFreshData();
                }
            });
            
            sidebar.appendChild(resetButton);
        }
    }
    
    
    async function loadFreshData() {
        try {
            courseData = await fetch("../Phase 1/data/courses.json")
                .then(response => response.json())
                .then(courses => {
                    saveCourseData(courses);
                    return courses;
                });
            displayCourses(courseData);
        } catch (error) {
            console.error("Error loading fresh data:", error);
        }
    }
    
    
    initializeApp();
    addCourse();

    document.getElementById("searchInput").addEventListener("input", filterCourses);
    document.getElementById("courseCategory").addEventListener("change", filterCourses);
});