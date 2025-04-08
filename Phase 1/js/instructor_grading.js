document.addEventListener("DOMContentLoaded", function() {
    // Check current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.status !== 'instructor') {
        // Redirect to login page if not an instructor
        window.location.href = 'login.html';
        return;
    }
    
    // Get the selected course number and CRN
    const selectedCourseNum = parseInt(localStorage.getItem('selectedCourse'), 10);
    const selectedCRN = parseInt(localStorage.getItem('selectedCRN'), 10);
    
    if (!selectedCourseNum && !selectedCRN) {
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
    loadCourseForGrading(currentUser.username, selectedCourseNum, selectedCRN);
    
    // Check for admin updates when page gets focus
    window.addEventListener('focus', function() {
        // Reload course data when window regains focus
        // This ensures course status changes by admin are reflected
        loadCourseForGrading(currentUser.username, selectedCourseNum, selectedCRN);
    });
});

async function loadCourseForGrading(instructorName, courseNum, courseCRN) {
    try {
        // Load courses data from localStorage first
        let coursesData = [];
        const adminCoursesStorage = localStorage.getItem('courseData');
        
        if (adminCoursesStorage) {
            coursesData = JSON.parse(adminCoursesStorage);
            console.log(`Loaded ${coursesData.length} courses from 'courseData' in localStorage`);
        } else {
            const coursesStorage = localStorage.getItem('courses');
            if (coursesStorage) {
                coursesData = JSON.parse(coursesStorage);
                console.log(`Loaded ${coursesData.length} courses from 'courses' in localStorage`);
            } else {
                // Fall back to file if not in localStorage
                console.log("No courses in localStorage, loading from file");
                const coursesResponse = await fetch("data/courses.json");
                coursesData = await coursesResponse.json();
            }
        }
        
        // Find the selected course - first try by CRN, then by courseNum
        let course = null;
        
        if (courseCRN) {
            course = coursesData.find(c => 
                parseInt(c.crn, 10) === courseCRN && c.instructor === instructorName
            );
            console.log(`Searching for course with CRN ${courseCRN}`);
        }
        
        // If no course found by CRN, try by courseNum (backward compatibility)
        if (!course && courseNum) {
            course = coursesData.find(c => 
                parseInt(c.courseNum, 10) === courseNum && c.instructor === instructorName
            );
            console.log(`Searching for course with courseNum ${courseNum}`);
        }
        
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
        
        // Find students enrolled in the course using CRN (primary) or courseNum (fallback)
        const enrolledStudents = enrollmentsData.filter(enrollment => {
            // Try to match by CRN first
            if (enrollment.crn && courseCRN) {
                return parseInt(enrollment.crn, 10) === courseCRN && 
                       enrollment.instructor === instructorName;
            }
            // Fall back to courseNum if CRN not available
            return parseInt(enrollment.courseNum, 10) === parseInt(course.courseNum, 10) && 
                   enrollment.instructor === instructorName;
        });
        
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
                <p>CRN: ${course.crn}</p>
                <p>Enrollment: ${enrolledStudents.length}/${course.enrollment_maximum}</p>
            </div>
        `;
        
        // Display student list and grade inputs - only for valid courses
        if (course.status === 'valid') {
            if (enrolledStudents.length > 0) {
                studentList.innerHTML = `
                    <h3>Students & Grades</h3>
                    <form id="grades-form">
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
                    </form>
                `;
                
                // Add form submit event listener
                const form = document.getElementById('grades-form');
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    submitGrades(enrolledStudents, course, form);
                });
            } else {
                studentList.innerHTML = '<p>No students enrolled in this course.</p>';
            }
        } else {
            // Cannot grade non-valid courses
            studentList.innerHTML = `
                <div class="error-message">
                    <p>⚠️ You can only submit grades for approved courses.</p>
                    <p>Current status: <span class="${statusClass}">${course.status}</span></p>
                    <p>Please contact an administrator to approve this course.</p>
                </div>
                ${enrolledStudents.length > 0 ? 
                    `<h3>Enrolled Students (${enrolledStudents.length})</h3>
                    <div class="student-list-readonly">
                        ${enrolledStudents.map(student => `
                            <div class="student-item-readonly">
                                <span>${student.studentName} (${student.studentId})</span>
                            </div>
                        `).join('')}
                    </div>` : 
                    '<p>No students enrolled in this course.</p>'
                }
            `;
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
        case 'A': return 90;
        case 'B+': return 85;
        case 'B': return 80;
        case 'C+': return 75;
        case 'C': return 70;
        case 'D+': return 65;
        case 'D': return 60;
        case 'F': return 0;
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
            // Check if this enrollment matches our course
            // First try matching by CRN (preferred)
            const matchesByCRN = enrollment.crn && 
                                 parseInt(enrollment.crn, 10) === parseInt(course.crn, 10);
            
            // Fallback to courseNum for backward compatibility
            const matchesByCourseNum = parseInt(enrollment.courseNum, 10) === parseInt(course.courseNum, 10);
            
            // Only update if the enrollment matches our course AND the student is in our list
            if ((matchesByCRN || matchesByCourseNum) && 
                students.some(s => s.studentId === enrollment.studentId)) {
                
                // Get the input grade
                const gradeInput = form.querySelector(`input[name="grade-${enrollment.studentId}"]`);
                
                if (gradeInput && gradeInput.value) {
                    // Convert numeric grade to letter grade
                    const numericGrade = parseInt(gradeInput.value, 10);
                    let letterGrade;
                    
                    if (numericGrade >= 90) {
                        letterGrade = "A";
                    } else if (numericGrade >= 85) {
                        letterGrade = "B+";
                    } else if (numericGrade >= 80) {
                        letterGrade = "B";
                    } else if (numericGrade >= 75) {
                        letterGrade = "C+";
                    } else if (numericGrade >= 70) {
                        letterGrade = "C";
                    } else if (numericGrade >= 65) {
                        letterGrade = "D+";
                    } else if (numericGrade >= 60) {
                        letterGrade = "D";
                    } else {
                        letterGrade = "F";
                    }
                    
                    console.log(`Updating grade for student ${enrollment.studentName} in course ${course.name} to ${letterGrade}`);
                    
                    // Create updated enrollment copy
                    // Make sure to include CRN in the updated enrollment
                    return { 
                        ...enrollment, 
                        grade: letterGrade,
                        crn: enrollment.crn || course.crn // Ensure CRN is preserved or added
                    };
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