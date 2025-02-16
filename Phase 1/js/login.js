document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", login);
    } else {
        console.error("Form not found!");
    }
});

async function login(event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("error-message");
    if (!usernameInput || !passwordInput ) {
        console.error("One or more elements not found!");
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    console.log(username);
    console.log(password);
    
    try {
        const response = await fetch("../Phase 1/data/login.json"); // Load JSON file
        const users = await response.json();
        console.log(users);
        const user = users.find(user => user.username == username && user.password == password);
        console.log(user);

        if (user) {
            alert("✅ تم تسجيل الدخول بنجاح!");
            if (user.status === "admin") {
                window.location.href = "create_course.html";
            } else if (user.status === "student") {
                window.location.href = "Coursepage.html";
            } else {
                errorMessage.textContent = "❌ حالة المستخدم غير معروفة";
                errorMessage.style.color = "red";
            }
        } else {
            errorMessage.textContent = "❌ اسم المستخدم أو كلمة المرور غير صحيحة";
            errorMessage.style.color = "red";
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        errorMessage.textContent = "❌ حدث خطأ أثناء تحميل بيانات المستخدم";
        errorMessage.style.color = "red";
    }
}


