document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("icon-button").addEventListener("click", function () {
        window.location.href = "login.html";
    });
});

function showBoxes(userType) {
    let boxes = document.querySelectorAll('.box');
    boxes.forEach(box => box.style.display = 'none')

    let numToShow = userType === 'student' ? 4 :
        (userType === 'teacher' ? 6 : 8);

    for (let i = 0; i < numToShow; i++) {
        boxes[i].style.display = 'block';
    }
};

function testFunction() {
    console.log("Test function is working!");
    alert("Test function is working!");
}

document.addEventListener("DOMContentLoaded", function () {
document.getElementById("sub").addEventListener("click", function () {
    showBoxes("student");
})
});

document.addEventListener("DOMContentLoaded", function () {
document.getElementById("teacher").addEventListener("click", function () {
    showBoxes("teacher");
})
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("testBtn").addEventListener("click",function(){
        testFunction();
    })
});