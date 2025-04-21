document.addEventListener("DOMContentLoaded", function() {
    // Add form submission event listener
    const loginForm = document.querySelector("form");
    if (loginForm) {
        loginForm.addEventListener("submit", login);
    } else {
        console.error("Login form not found");
    }
    
    // Add error message element if it doesn't exist
    if (!document.getElementById("error-message")) {
        const errorDiv = document.createElement("div");
        errorDiv.id = "error-message";
        loginForm?.appendChild(errorDiv);
    }
});

async function login(event) {
    event.preventDefault();
        
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMessageElement = document.getElementById("error-message") || document.createElement("div");
    
    if (!errorMessageElement.id) {
        errorMessageElement.id = "error-message";
        document.querySelector(".login-form")?.appendChild(errorMessageElement);
    }
    
    if (!usernameInput || !passwordInput) {
        console.error("One or more form elements not found!");
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    try {
        // Fix the path - use relative path to avoid 405 errors
        const response = await fetch("data/login.json"); 
        const users = await response.json();
        
        const user = users.find(user => 
            user.username == username && 
            user.password == parseInt(password, 10));
        
        if (user) {
            // Store user info in localStorage instead of sessionStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            alert("✅ Login successful!");
            
            // Fix redirect paths
            if (user.status === "admin") {
                window.location.href = "create_course.html";
            } else if (user.status === "student") {
                window.location.href = "Coursepage.html";
            } else if (user.status === "instructor") {
                window.location.href = "instructor_classes.html";
            } else {
                errorMessageElement.textContent = "❌ Unknown user status";
                errorMessageElement.style.color = "red";
            }
        } else {
            errorMessageElement.textContent = "❌ Invalid username or password";
            errorMessageElement.style.color = "red";
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        errorMessageElement.textContent = "❌ Error loading user data";
        errorMessageElement.style.color = "red";
    }
}

