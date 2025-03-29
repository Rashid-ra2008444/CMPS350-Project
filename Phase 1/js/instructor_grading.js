document.addEventListener("DOMContentLoaded", function() {
    // Check current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'instructor') {
        // Redirect to login page if not an instructor
        window.location.href = 'login.html';
        return;
    }
    
    // Get the selected course number
    const selectedCourseNum = parseInt(localStorage.getItem('selectedCourse'), 10);
    if (!selectedCourseNum) {
        // Redirect to instructor classes page if no course selected
        window.location.href = 'instructor_classes.html';
        return;
    }
    
    // Display instructor name
    document.getElementById('instructor-name').textContent = currentUser.username;
    
    // Add logout button event listener
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
    
    // Add back to classes button event listener
    document.getElementById('back-to-classes').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'instructor_classes.html';
    });
    
    // Load course data for grading
    loadCourseForGrading(currentUser.username, selectedCourseNum);
});

async function loadCourseForGrading(instructorName, courseNum) {
    try {
        // Load courses data
        const coursesResponse = await fetch("data/courses.json");
        const coursesData = await coursesResponse.json();
        
        // Find the selected course
        const course = coursesData.find(c => parseInt(c.courseNum, 10) === courseNum && c.instructor === instructorName);
        
        if (!course) {
            document.getElementById('course-container').innerHTML = 
                '<p>Course not found or you do not have permission to grade this course.</p>';
            return;
        }
        
        // Display course title
        document.getElementById('course-title').textContent = `${course.name} (${course.category} ${course.courseNum})`;
        
        // Load enrollment data - always from localStorage first
        let enrollmentsData = [];
        const localEnrollments = localStorage.getItem('enrollment');
        
        if (localEnrollments) {
            console.log("Loading enrollments from localStorage");
            enrollmentsData = JSON.parse(localEnrollments);
        } else {
            try {
                console.log("No enrollments in localStorage, loading from file");
                const studentsResponse = await fetch("data/enrollment.json");
                enrollmentsData = await studentsResponse.json();
                
                // Store data in localStorage for next time
                localStorage.setItem('enrollment', JSON.stringify(enrollmentsData));
            } catch (err) {
                console.warn("Could not load enrollment data, using empty array:", err);
            }
        }
        
        // Find students enrolled in the course
        const enrolledStudents = enrollmentsData.filter(enrollment => 
            parseInt(enrollment.courseNum, 10) === courseNum && 
            enrollment.instructor === instructorName
        );
        
        console.log(`Found ${enrolledStudents.length} students enrolled in this course`);
        
        const courseDetails = document.getElementById('course-details');
        const studentList = document.getElementById('student-list');
        
        // Format course status class
        const statusClass = course.status === 'valid' ? 'status-valid' : 
                            course.status === 'pending' ? 'status-pending' : 'status-invalid';
        
        // Display course details
        courseDetails.innerHTML = `
            <div class="course-details">
                <p>Category: ${course.category}</p>
                <p>Status: <span class="${statusClass}">${course.status}</span></p>
                <p>Enrollment: ${course.enrollment_maximum - enrolledStudents.length}/${course.enrollment_maximum}</p>
            </div>
        `;
        
        // Display student list and grade inputs
        studentList.innerHTML = `
            <h3>Students & Grades</h3>
            ${
                course.status === 'valid' ? 
                (enrolledStudents.length > 0 ? 
                    `<form id="grades-form">
                        ${enrolledStudents.map(student => `
                            <div class="student-item">
                                <span>${student.studentName} (${student.studentId})</span>
                                <input type="number" class="grade-input" 
                                       name="grade-${student.studentId}" 
                                       min="0" max="100" required
                                       placeholder="Grade (0-100)"
                                       value="${student.grade ? getNumericEquivalent(student.grade) : ''}">
                            </div>
                        `).join('')}
                        
                        <button type="submit" class="submit-btn">Submit Grades</button>
                        <p class="success-message" id="success-message" style="display:none">Grades submitted successfully!</p>
                    </form>`
                    : '<p>No students enrolled in this course.</p>'
                )
                : '<p>You can only submit grades for valid courses.</p>'
            }
        `;
        
        // Add form submit event listener
        if (course.status === 'valid' && enrolledStudents.length > 0) {
            const form = document.getElementById('grades-form');
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitGrades(enrolledStudents, course, form);
            });
        }
        
    } catch (error) {
        console.error("Error loading course:", error);
        document.getElementById('course-details').innerHTML = 
            '<p>Error loading course data. Please try again later.</p>';
    }
}

// Helper function to convert letter grade to numeric value for display in input field
function getNumericEquivalent(letterGrade) {
    if (!letterGrade) return '';
    
    const upperGrade = letterGrade.toString().toUpperCase();
    
    switch (upperGrade) {
        case 'A': return 95;
        case 'B+': return 88;
        case 'B': return 85;
        case 'C+': return 78;
        case 'C': return 75;
        case 'D+': return 68;
        case 'D': return 65;
        case 'F': return 55;
        default: return '';
    }
}

function submitGrades(students, course, form) {
    try {
        // Get enrollment data from localStorage
        let allEnrollments = [];
        const storedEnrollments = localStorage.getItem('enrollment');
        
        if (storedEnrollments) {
            allEnrollments = JSON.parse(storedEnrollments);
            console.log("Loaded current enrollments from localStorage");
        } else {
            console.warn("No enrollments found in localStorage");
        }
        
        // Update student grades
        let updatedEnrollments = allEnrollments.map(enrollment => {
            // Convert courseNum to integer for correct comparison
            const enrollmentCourseNum = parseInt(enrollment.courseNum, 10);
            const courseCourseNum = parseInt(course.courseNum, 10);
            
            if (enrollmentCourseNum === courseCourseNum && 
                students.some(s => s.studentId === enrollment.studentId)) {
                
                // Get the input grade
                const gradeInput = form.querySelector(`input[name="grade-${enrollment.studentId}"]`);
                
                if (gradeInput && gradeInput.value) {
                    // Convert numeric grade to letter grade
                    const numericGrade = parseInt(gradeInput.value, 10);
                    let letterGrade;
                    
                    if (numericGrade >= 90) {
                        letterGrade = "A";
                    } else if (numericGrade >= 80) {
                        letterGrade = "B";
                    } else if (numericGrade >= 70) {
                        letterGrade = "C";
                    } else if (numericGrade >= 60) {
                        letterGrade = "D";
                    } else {
                        letterGrade = "F";
                    }
                    
                    console.log(`Updating grade for student ${enrollment.studentName} in course ${course.name} to ${letterGrade}`);
                    
                    // Create updated enrollment copy
                    return { ...enrollment, grade: letterGrade };
                }
            }
            return enrollment;
        });
        
        // Save updated data to localStorage
        localStorage.setItem('enrollment', JSON.stringify(updatedEnrollments));
        console.log("Saved updated enrollments to localStorage");
        
        // Show success message
        const successMessage = document.getElementById('success-message');
        successMessage.style.display = 'block';
        
        // Hide message after 3 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
        
        alert("Grades saved successfully. Students can now see their grades in Learning Path.");
        
    } catch (error) {
        console.error("Error submitting grades:", error);
        alert("Error submitting grades. Please try again.");
    }
}