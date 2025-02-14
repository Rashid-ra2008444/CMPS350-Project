
    document.addEventListener("DOMContentLoaded", function () {
        // Select all elements with the class 'box'
        document.querySelectorAll(".box").forEach(box => {
            // Create a button container
            let buttonContainer = document.createElement("div");
            buttonContainer.classList.add("button-container");

            // Define button labels
            let buttons = ["Edit", "Delete", "Validate"];

            // Create buttons dynamically
            buttons.forEach(text => {
                let button = document.createElement("button");
                button.textContent = text;
                buttonContainer.appendChild(button);
            });

            // Append buttons only if they are not already present
            if (!box.querySelector(".button-container")) {
                box.appendChild(buttonContainer);
            }
        });
    });
