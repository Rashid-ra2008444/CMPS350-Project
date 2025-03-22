document.addEventListener("DOMContentLoaded", function () {
    document.querySelector('.Coursepage').addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'Coursepage.html';
    });
    document.querySelector('.plan').addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'LearningPath.html';
    });
    document.querySelector('.logout').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
});