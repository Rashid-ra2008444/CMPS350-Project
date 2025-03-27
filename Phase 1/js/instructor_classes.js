document.addEventListener("DOMContentLoaded", function() {
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'instructor') {
        
        window.location.href = 'login.html';
        return;
    }
    
   
    document.getElementById('instructor-name').textContent = currentUser.username;
    
    
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
    
    
    loadInstructorClasses(currentUser.username);
    
 
    document.getElementById('searchInput').addEventListener('input', function() {
        filterClasses(this.value.toLowerCase(), currentUser.username);
    });
});


function filterClasses(searchTerm, instructorName) {
    const classCards = document.querySelectorAll('.class-card');
    
    classCards.forEach(card => {
        const className = card.querySelector('h3').textContent.toLowerCase();
        if (className.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function loadInstructorClasses(instructorName) {
    try {
       
        let coursesData = [];
        const localCourses = localStorage.getItem('courses');
        
        if (localCourses) {
            coursesData = JSON.parse(localCourses);
        } else {
            const coursesResponse = await fetch("data/courses.json");
            coursesData = await coursesResponse.json();
        }
        
      
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
        
       
        const instructorCourses = coursesData.filter(course => course.instructor === instructorName);
        
        const classesContainer = document.getElementById('classes-container');
        
        
        classesContainer.innerHTML = '';
        
        if (instructorCourses.length === 0) {
            classesContainer.innerHTML = '<p>You currently have no assigned courses.</p>';
            return;
        }
        
      
        instructorCourses.forEach(course => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-card';
            classDiv.setAttribute('data-course-id', `${course.name}-${course.courseNum}`);
            
            
            const statusClass = course.status === 'valid' ? 'status-valid' : 
                               course.status === 'pending' ? 'status-pending' : 'status-invalid';
            
          
            const enrolledStudents = enrollmentsData.filter(enrollment => 
                enrollment.courseNum === course.courseNum && 
                enrollment.courseName === course.name
            );
            
           
            const completedStudents = enrolledStudents.filter(student => student.grade);
            
            classDiv.innerHTML = `
                <h3>${course.name} (${course.category} ${course.courseNum})</h3>
                <p>Category: ${course.category}</p>
                <p>Status: <span class="${statusClass}">${course.status}</span></p>
                <p>Enrollment: ${course.enrollment_actual}/${course.enrollment_maximum}</p>
                <p><strong>Students Enrolled: ${enrolledStudents.length}</strong></p>
                <p><strong>Students Graded: ${completedStudents.length}/${enrolledStudents.length}</strong></p>
                <button class="view-grades-btn ${course.status !== 'valid' ? 'disabled' : ''}" 
                        ${course.status !== 'valid' ? 'disabled' : ''}>
                    ${course.status === 'valid' ? 'View & Submit Grades' : 'Awaiting Validation'}
                </button>
            `;
            
            classesContainer.appendChild(classDiv);
            
            if (course.status === 'valid') {
                const viewGradesBtn = classDiv.querySelector('.view-grades-btn');
                viewGradesBtn.addEventListener('click', function() {
                    localStorage.setItem('selectedCourse', course.courseNum);
                    localStorage.setItem('selectedCourseName', course.name);
                    window.location.href = 'instructor_grading.html';
                });
            }
        });
        
    } catch (error) {
        console.error("Error loading courses:", error);
        document.getElementById('classes-container').innerHTML = 
            '<p>Error loading courses. Please try again later.</p>';
    }
}