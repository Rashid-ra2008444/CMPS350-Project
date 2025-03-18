document.addEventListener("DOMContentLoaded", function() {
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'instructor') {
       
        window.location.href = 'login.html';
        return;
    }
    
    
    const selectedCourseNum = parseInt(localStorage.getItem('selectedCourse'), 10);
    if (!selectedCourseNum) {
        
        window.location.href = 'instructor_classes.html';
        return;
    }
    
    
    document.getElementById('instructor-name').textContent = currentUser.username;
    
    
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
    
    
    document.getElementById('back-to-classes').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'instructor_classes.html';
    });
    
    
    loadCourseForGrading(currentUser.username, selectedCourseNum);
});

async function loadCourseForGrading(instructorName, courseNum) {
    try {
        
        const coursesResponse = await fetch("data/courses.json");
        const coursesData = await coursesResponse.json();
        
        
        const course = coursesData.find(c => c.courseNum === courseNum && c.instructor === instructorName);
        
        if (!course) {
            document.getElementById('course-container').innerHTML = 
                '<p>Course not found or you do not have permission to grade this course.</p>';
            return;
        }
        
        
        document.getElementById('course-title').textContent = `${course.name} (${course.category} ${course.courseNum})`;
        
        
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
        
        
        const enrolledStudents = enrollmentsData.filter(enrollment => 
            enrollment.courseNum === course.courseNum && 
            enrollment.instructor === instructorName
        );
        
        const courseDetails = document.getElementById('course-details');
        const studentList = document.getElementById('student-list');
        
        
        const statusClass = course.status === 'valid' ? 'status-valid' : 
                            course.status === 'pending' ? 'status-pending' : 'status-invalid';
        
        courseDetails.innerHTML = `
            <div class="course-details">
                <p>Category: ${course.category}</p>
                <p>Status: <span class="${statusClass}">${course.status}</span></p>
                <p>Enrollment: ${course.enrollment_actual}/${course.enrollment_maximum}</p>
            </div>
        `;
        
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
                                       placeholder="Grade"
                                       value="${student.grade || ''}">
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

function submitGrades(students, course, form) {
    try {
        let allEnrollments = [];
        const storedEnrollments = localStorage.getItem('enrollment');
        
        if (storedEnrollments) {
            allEnrollments = JSON.parse(storedEnrollments);
        }
        
        
        let updatedEnrollments = allEnrollments.map(enrollment => {
            if (enrollment.courseNum === course.courseNum && 
                students.some(s => s.studentId === enrollment.studentId)) {
                
               
                const gradeInput = form.querySelector(`input[name="grade-${enrollment.studentId}"]`);
                const grade = parseInt(gradeInput.value, 10);
                
               
                return { ...enrollment, grade: grade };
            }
            return enrollment;
        });
        
        
        localStorage.setItem('enrollment', JSON.stringify(updatedEnrollments));
        
        
        const successMessage = document.getElementById('success-message');
        successMessage.style.display = 'block';
        
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
        
        console.log("Grades submitted and saved to localStorage:", updatedEnrollments);
        
    } catch (error) {
        console.error("Error submitting grades:", error);
        alert("Error submitting grades. Please try again.");
    }
}