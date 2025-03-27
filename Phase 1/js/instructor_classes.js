document.addEventListener("DOMContentLoaded", function() {
    // Check current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'instructor') {
        // Redirect to login page if not an instructor
        window.location.href = 'login.html';
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
    
    // Load instructor classes
    loadInstructorClasses(currentUser.username);
});

// Load instructor classes - updated to use localStorage
async function loadInstructorClasses(instructorName) {
    try {
        // Load courses data
        const coursesResponse = await fetch("data/courses.json");
        const coursesData = await coursesResponse.json();
        
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
        
        // Find courses taught by the instructor
        const instructorCourses = coursesData.filter(course => course.instructor === instructorName);
        
        // Display element
        const classesContainer = document.getElementById('classes-container');
        
        // Clear previous content
        classesContainer.innerHTML = '';
        
        if (instructorCourses.length === 0) {
            classesContainer.innerHTML = '<p>You currently have no assigned courses.</p>';
            return;
        }
        
        // Display courses
        instructorCourses.forEach(course => {
            // Convert course number to integer for correct comparison
            const courseNum = parseInt(course.courseNum, 10);
            
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-num', courseNum);
            
            // Determine course status
            const statusClass = course.status === 'valid' ? 'status-valid' : 
                              course.status === 'pending' ? 'status-pending' : 'status-invalid';
            
            // Find students enrolled in the course
            const enrolledStudents = enrollmentsData.filter(enrollment => 
                parseInt(enrollment.courseNum, 10) === courseNum && 
                enrollment.instructor === instructorName
            );
            
            classDiv.innerHTML = `
                <h3>${course.name} (${course.category} ${course.courseNum})</h3>
                <p>Category: ${course.category}</p>
                <p>Status: <span class="${statusClass}">${course.status}</span></p>
                <p>Enrollment: ${course.enrollment_actual}/${course.enrollment_maximum}</p>
                <p><strong>Students Enrolled: ${enrolledStudents.length}</strong></p>
                <button class="view-grades-btn">View & Submit Grades</button>
            `;
            
            classesContainer.appendChild(classDiv);
            
            // Add view grades button event listener
            const viewGradesBtn = classDiv.querySelector('.view-grades-btn');
            viewGradesBtn.addEventListener('click', function() {
                localStorage.setItem('selectedCourse', courseNum);
                window.location.href = 'instructor_grading.html';
            });
        });
        
    } catch (error) {
        console.error("Error loading courses:", error);
        document.getElementById('classes-container').innerHTML = 
            '<p>Error loading courses. Please try again later.</p>';
    }
}