document.addEventListener("DOMContentLoaded", function() {
    let courseData = [];
    let resetButtonAdded = false; // Flag to track if reset button has been added

    // Authenticate admin user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.status !== 'admin') {
        // Redirect to login if not an admin
        window.location.href = 'login.html';
        return;
    }
    
    // Load course data with improved handling
    function loadCourseData() {
        const storedData = localStorage.getItem('courseData');
        if (storedData) {
            return JSON.parse(storedData);
        } else {
            return fetch("data/courses.json")
                .then(response => response.json())
                .then(courses => {
                    // Save to BOTH storage locations for consistency
                    saveCourseData(courses);
                    return courses;
                })
                .catch(error => {
                    console.error("Error fetching courses data:", error);
                    return [];
                });
        }
    }

    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Improved saving to ensure consistency across the system
    function saveCourseData(courses) {
        // Save to courseData (admin primary source)
        localStorage.setItem('courseData', JSON.stringify(courses));
        
        // Also save to courses (student registration system)
        localStorage.setItem('courses', JSON.stringify(courses));
        
        console.log(`Saved ${courses.length} courses to both 'courseData' and 'courses' in localStorage`);
        
        // Update enrollment status to match course statuses
        updateEnrollmentStatusFlags(courses);
    }
    
    // Update enrollment records to match course statuses
    function updateEnrollmentStatusFlags(courses) {
        let enrollmentData = [];
        const localEnrollments = localStorage.getItem('enrollment');
        
        if (localEnrollments) {
            enrollmentData = JSON.parse(localEnrollments);
            console.log(`Found ${enrollmentData.length} enrollment records in localStorage`);
            
            // Map through enrollments and update course status
            const updatedEnrollments = enrollmentData.map(enrollment => {
                // Convert course numbers to integers for correct comparison
                const enrollmentCourseNum = parseInt(enrollment.courseNum, 10);
                
                // Find matching course
                const matchingCourse = courses.find(course => 
                    parseInt(course.courseNum, 10) === enrollmentCourseNum);
                
                if (matchingCourse) {
                    console.log(`Updating enrollment status for course ${enrollmentCourseNum} to ${matchingCourse.status}`);
                    
                    // Return updated enrollment with course status
                    return {
                        ...enrollment,
                        courseStatus: matchingCourse.status 
                    };
                }
                return enrollment;
            });
            
            // Save updated enrollments
            localStorage.setItem('enrollment', JSON.stringify(updatedEnrollments));
            console.log(`Updated and saved ${updatedEnrollments.length} enrollment records`);
        } else {
            console.log("No enrollment data found in localStorage");
        }
    }

    // Initialize the app
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

    // Display courses with status indicators
    function displayCourses(courses) {
        const pendingCourses = document.getElementById("pendingCourses");
        const validCourses = document.getElementById("validCourses");
        const invalidCourses = document.getElementById("invalidCourses");

        pendingCourses.innerHTML = "";
        validCourses.innerHTML = "";
        invalidCourses.innerHTML = "";

        // Count courses by status for display
        let pendingCount = 0;
        let validCount = 0;
        let invalidCount = 0;

        courses.forEach(course => {
            const box = document.createElement("div");
            box.classList.add("box");

            // Track actual enrollment from enrollment data
            const actualEnrollment = getActualEnrollment(course.courseNum);
            
            // Update course enrollment count if different
            if (actualEnrollment !== null && course.enrollment_actual !== actualEnrollment) {
                course.enrollment_actual = actualEnrollment;
                // We'll save this update at the end
            }

            let courseContent = document.createElement("div");
            courseContent.classList.add("course-content");
            courseContent.innerHTML = `
                <h3>${course.name} (${course.category} ${course.courseNum})</h3>
                <p><strong>Instructor:</strong> ${course.instructor}</p>
                <p><strong>Prerequisite:</strong> ${course.prerequisite}</p>
                <p><strong>Enrollment Maximum:</strong> ${course.enrollment_maximum}</p>
                <p><strong>Enrollment Actual:</strong> ${course.enrollment_actual}</p>
                <p><strong>Status:</strong> <span class="status-${course.status}">${course.status}</span></p>
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
                validateButton.addEventListener("click", () => validateCourse(course.courseNum, course.name, box));
                buttonContainer.appendChild(validateButton);
                
                pendingCount++;
            } else if(course.status === "valid") {
                validCount++;
            } else {
                invalidCount++;
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
        
        // Save any enrollment count updates
        saveCourseData(courseData);
        
        // Add counters to headers
        document.querySelector('.course-box h2:contains("Pending")').textContent = `Pending (${pendingCount})`;
        document.querySelector('.course-box h2:contains("Valid")').textContent = `Valid Course (${validCount})`;
        document.querySelector('.course-box h2:contains("Invalid")').textContent = `Invalid Course (${invalidCount})`;
    }

    // Get actual enrollment count from enrollment data
    function getActualEnrollment(courseNum) {
        const enrollmentData = JSON.parse(localStorage.getItem('enrollment'));
        if (!enrollmentData) return null;
        
        // Convert course numbers to integers for correct comparison
        const courseNumInt = parseInt(courseNum, 10);
        
        // Count enrollments for this course
        const enrollments = enrollmentData.filter(e => parseInt(e.courseNum, 10) === courseNumInt);
        
        return enrollments.length;
    }

    function editCourse(course, box) {
        let courseContent = box.querySelector(".course-content");
        courseContent.innerHTML = `
            <p>Name<input type="text" id="editName" value="${course.name}" /></p>
            <p>Course Number<input type="number" id="editCourseNum" value="${course.courseNum}" /></p>
            <p>Instructor<input type="text" id="editInstructor" value="${course.instructor}" /></p>
            <p>Prerequisite<input type="text" id="editPrerequisite" value="${course.prerequisite}" /></p>
            <p>Max Enrollment<input type="number" id="editEnrolled" value="${course.enrollment_maximum}" /></p>
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
            saveCourse(course.courseNum, course.name, box);
        });
    }

    function saveCourse(oldCourseNum, oldName, box) {
        // Find course index in data
        let index = courseData.findIndex(course => 
            parseInt(course.courseNum, 10) === parseInt(oldCourseNum, 10) && course.name === oldName);

        if (index === -1) {
            console.error("Course not found");
            return;
        }

        // Get current enrollment count
        const currentEnrollment = courseData[index].enrollment_actual;

        // Create updated course object
        let updateCourse = {
            name: box.querySelector("#editName").value,
            courseNum: box.querySelector("#editCourseNum").value,
            instructor: box.querySelector("#editInstructor").value,
            prerequisite: box.querySelector("#editPrerequisite").value,
            enrollment_maximum: parseInt(box.querySelector("#editEnrolled").value),
            enrollment_actual: currentEnrollment, // Preserve current enrollment count
            category: box.querySelector("#editCategory").value,
            status: courseData[index].status
        };

        // Update course data
        courseData[index] = updateCourse;
        
        // Save to localStorage (both keys)
        saveCourseData(courseData);
        
        // Update display
        box.innerHTML = `
        <div class="course-content">
            <h3>${updateCourse.name} (${updateCourse.category} ${updateCourse.courseNum})</h3>
            <p><strong>Instructor:</strong> ${updateCourse.instructor}</p>
            <p><strong>Prerequisite:</strong> ${updateCourse.prerequisite}</p>
            <p><strong>Enrollment Maximum:</strong> ${updateCourse.enrollment_maximum}</p>
            <p><strong>Enrollment Actual:</strong> ${updateCourse.enrollment_actual}</p>
            <p><strong>Status:</strong> <span class="status-${updateCourse.status}">${updateCourse.status}</span></p>
        </div>
        <div class="button-container">
            <button class="edit-btn pixel2">Edit</button>
            ${updateCourse.status === "pending" ? `<button class="validate-btn pixel2">Validate</button>` : ""}
            <button class="delete-btn pixel2">Delete</button>
        </div>
        `;

        console.log("Box updated with course changes");

        // Re-attach event listeners
        box.querySelector(".edit-btn").addEventListener("click", () => editCourse(updateCourse, box));
        if (updateCourse.status === "pending") {
            box.querySelector(".validate-btn").addEventListener("click", () => 
                validateCourse(updateCourse.courseNum, updateCourse.name, box));
        }
        box.querySelector(".delete-btn").addEventListener("click", () => deleteCourse(updateCourse, box));
    }

    function deleteCourse(course) {
        if (!confirm(`Are you sure you want to delete "${course.name}"? This cannot be undone.`)) {
            return;
        }
        
        // Filter out the course to delete
        courseData = courseData.filter(c => 
            !(parseInt(c.courseNum, 10) === parseInt(course.courseNum, 10) && c.name === course.name));
        
        // Save changes to localStorage
        saveCourseData(courseData);
        
        // Refresh the display
        displayCourses(courseData);
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
    
    function validateCourse(courseNum, courseName, box) {
        // Find the course
        let course = courseData.find(c => 
            parseInt(c.courseNum, 10) === parseInt(courseNum, 10) && c.name === courseName);

        if(course === undefined) {
            console.error("Course not found");
            return;
        }
        
        // Show validation options
        box.innerHTML = `
        <div class="course-content"> 
            <h3>${course.name}</h3>
            <p>Change course status:</p>
            <button class="valid-btn pixel2">Valid</button>
            <button class="invalid-btn pixel2">Invalid</button>
        </div>
        `;

        // Add event listeners for validation buttons
        box.querySelector(".valid-btn").addEventListener("click", () => {
            updateCourseStatus(courseNum, courseName, "valid");
            console.log("Course status updated to valid");
            displayCourses(courseData);
        });
        
        box.querySelector(".invalid-btn").addEventListener("click", () => {
            updateCourseStatus(courseNum, courseName, "invalid");
            console.log("Course status updated to invalid");
            displayCourses(courseData);
        });
    }
    
    function updateCourseStatus(courseNum, courseName, status) {
        // Find course using both courseNum and name to handle duplicate names
        let course = courseData.find(c => 
            parseInt(c.courseNum, 10) === parseInt(courseNum, 10) && c.name === courseName);
            
        if(course === undefined) {
            console.error("Course not found");
            return;
        }
        
        // Update status
        course.status = status;
        
        // Save to localStorage (updates both keys and enrollment status)
        saveCourseData(courseData);
        
        console.log(`Course ${course.name} (${course.courseNum}) status updated to: ${status}`);
    }

    function addCourse() {
        let addCourseButton = document.querySelector(".add-course");
    
        if (addCourseButton) {
            addCourseButton.addEventListener("click", function() {
                // Create form container
                let formContainer = document.createElement("div");
                formContainer.classList.add("form-container");
                formContainer.innerHTML = `
                    <div class="form-box">
                        <h3>Add New Course</h3>
                        <div class="form-box-container">
                        <label>Name: <input type="text" id="newName" required></label>
                        <label>Course Number: <input type="number" id="newCourseNum" required></label>
                        <label>Instructor: <input type="text" id="newInstructor" required></label>
                        <label>Prerequisite: <input type="text" id="newPrerequisite" placeholder="none"></label>
                        <label>Max Enrollment: <input type="number" id="newMaxEnrolled" value="30" required></label>
                        <label>Category:
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
    
                // Save new course button
                document.getElementById("saveNewCourse").addEventListener("click", function() {
                    // Form validation
                    const name = document.getElementById("newName").value;
                    const courseNum = document.getElementById("newCourseNum").value;
                    const instructor = document.getElementById("newInstructor").value;
                    
                    if (!name || !courseNum || !instructor) {
                        alert("Please fill in all required fields.");
                        return;
                    }
                    
                    // Create new course object
                    let newCourse = {
                        name: name,
                        courseNum: courseNum,
                        instructor: instructor,
                        prerequisite: document.getElementById("newPrerequisite").value || "none",
                        enrollment_maximum: parseInt(document.getElementById("newMaxEnrolled").value),
                        enrollment_actual: 0,
                        category: document.getElementById("newCategory").value,
                        status: "pending"
                    };
                    
                    // Add course to data
                    courseData.push(newCourse);
                    
                    // Save to localStorage
                    saveCourseData(courseData);
                    
                    // Refresh display
                    displayCourses(courseData);
                    
                    // Remove form
                    document.body.removeChild(formContainer);
                    
                    // Confirmation
                    alert(`Course "${newCourse.name}" added successfully!`);
                });
                
                // Cancel button
                document.getElementById("cancelNewCourse").addEventListener("click", function() {
                    document.body.removeChild(formContainer);
                });
            });
        }
    }

    // Add reset button to sidebar
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
                    // Clear both course storage locations
                    localStorage.removeItem('courseData');
                    localStorage.removeItem('courses');
                    
                    // Also reset enrollment data
                    if (confirm("Do you also want to reset enrollment data? This will clear all student registrations.")) {
                        localStorage.removeItem('enrollment');
                    }
                    
                    // Reload fresh data
                    loadFreshData();
                }
            });
            
            sidebar.appendChild(resetButton);
        }
    }
    
    // Load fresh data from JSON files
    async function loadFreshData() {
        try {
            // Load courses from file
            courseData = await fetch("data/courses.json")
                .then(response => response.json())
                .then(courses => {
                    saveCourseData(courses);
                    return courses;
                });
                
            // If enrollment was reset, load that too
            if (!localStorage.getItem('enrollment')) {
                const enrollmentData = await fetch("data/enrollment.json")
                    .then(response => response.json());
                    
                localStorage.setItem('enrollment', JSON.stringify(enrollmentData));
                console.log("Reset enrollment data from file");
            }
            
            // Refresh display
            displayCourses(courseData);
            
            alert("Data has been reset successfully!");
        } catch (error) {
            console.error("Error loading fresh data:", error);
            alert("Error loading fresh data. Please try again.");
        }
    }
    
    // Initialize the application
    initializeApp();
    addCourse();

    // Add event listeners for filtering
    document.getElementById("searchInput").addEventListener("input", filterCourses);
    document.getElementById("courseCategory").addEventListener("change", filterCourses);
});