document.addEventListener("DOMContentLoaded", function() {
    // Get current instructor from localStorage (changed from sessionStorage)
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'instructor') {
        // Redirect to login if not an instructor
        window.location.href = '../Phase 1/login.html';
        return;
    }
    
    // Display instructor name
    document.getElementById('instructor-name').textContent = currentUser.username;
    
    // Set up logout functionality
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = '../Phase 1/login.html';
    });
    
    // Load instructor's classes
    loadInstructorClasses(currentUser.username);
});

async function loadInstructorClasses(instructorName) {
    try {
        // Fix paths - use relative paths
        const coursesResponse = await fetch("../Phase 1/data/courses.json");
        const coursesData = await coursesResponse.json();
        
        // Try to load enrollments from localStorage first, then from file if not available
        let enrollmentsData = [];
        const localEnrollments = localStorage.getItem('enrollment');
        
        if (localEnrollments) {
            enrollmentsData = JSON.parse(localEnrollments);
        } else {
            try {
                const studentsResponse = await fetch("../Phase 1/data/enrollment.json");
                enrollmentsData = await studentsResponse.json();
                // Store in localStorage for future use
                localStorage.setItem('enrollment', JSON.stringify(enrollmentsData));
            } catch (err) {
                console.warn("Could not load enrollment data, using empty array:", err);
            }
        }
        
        // Filter courses for this instructor
        const instructorCourses = coursesData.filter(course => course.instructor === instructorName);
        
        const classesContainer = document.getElementById('classes-container');
        
        // Clear loading message
        classesContainer.innerHTML = '';
        
        if (instructorCourses.length === 0) {
            classesContainer.innerHTML = '<p>You currently have no assigned courses.</p>';
            return;
        }
        
        // Display each course
        instructorCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            
            // Get status class for styling
            const statusClass = course.status === 'valid' ? 'status-valid' : 
                                course.status === 'pending' ? 'status-pending' : 'status-invalid';
            
            // Find students enrolled in this course
            const enrolledStudents = enrollmentsData.filter(enrollment => 
                enrollment.courseNum === course.courseNum && 
                enrollment.instructor === instructorName
            );
            
            classDiv.innerHTML = `
                <h3>${course.name} (${course.category} ${course.courseNum})</h3>
                <p>Category: ${course.category}</p>
                <p>Status: <span class="${statusClass}">${course.status}</span></p>
                <p>Enrollment: ${course.enrollment_actual}/${course.enrollment_maximum}</p>
                
                <div class="student-list">
                    <h4>Students & Grades</h4>
                    ${
                        course.status === 'valid' ? 
                        (enrolledStudents.length > 0 ? 
                            `<form id="grades-form-${course.courseNum}">
                                ${enrolledStudents.map(student => `
                                    <div class="student-item">
                                        <span>${student.studentName} (${student.studentId})</span>
                                        <input type="number" class="grade-input" 
                                               name="grade-${student.studentId}" 
                                               min="0" max="100" required
                                               placeholder="Grade"
                                               value="${student.grade || ''}">
                                    </div>
                                `).join('')}
                                
                                <button type="submit" class="submit-btn">Submit Grades</button>
                                <p class="success-message" id="success-${course.courseNum}" style="display:none">Grades submitted successfully!</p>
                            </form>`
                            : '<p>No students enrolled in this course.</p>'
                        )
                        : '<p>You can only submit grades for valid courses.</p>'
                    }
                </div>
            `;
            
            classesContainer.appendChild(classDiv);
            
            // Add submit event listener to the form if there are students and course is valid
            if (course.status === 'valid' && enrolledStudents.length > 0) {
                const form = document.getElementById(`grades-form-${course.courseNum}`);
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    submitGrades(enrolledStudents, course, form);
                });
            }
        });
        
    } catch (error) {
        console.error("Error loading courses:", error);
        document.getElementById('classes-container').innerHTML = 
            '<p>Error loading courses. Please try again later.</p>';
    }
}

function submitGrades(students, course, form) {
    try {
        
        let allEnrollments = [];
        const storedEnrollments = localStorage.getItem('enrollment');
        
        if (storedEnrollments) {
            allEnrollments = JSON.parse(storedEnrollments);
        }
        
        // Update grades for each student
        let updatedEnrollments = allEnrollments.map(enrollment => {
            
            if (enrollment.courseNum === course.courseNum && 
                students.some(s => s.studentId === enrollment.studentId)) {
                
                // Get the submitted grade
                const gradeInput = form.querySelector(`input[name="grade-${enrollment.studentId}"]`);
                const grade = parseInt(gradeInput.value, 10);
                
                // Update the enrollment with the new grade
                return { ...enrollment, grade: grade };
            }
            return enrollment;
        });
        
        // Save updated enrollments back to localStorage
        localStorage.setItem('enrollment', JSON.stringify(updatedEnrollments));
        
        // Show success message
        const successMessage = document.getElementById(`success-${course.courseNum}`);
        successMessage.style.display = 'block';
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
        
        console.log("Grades submitted and saved to localStorage:", updatedEnrollments);
        
    } catch (error) {
        console.error("Error submitting grades:", error);
        alert("Error submitting grades. Please try again.");
    }
}