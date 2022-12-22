// main.js

// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let conversation = "";
    let passcode = "";

    // Get the form element
    const form = document.getElementById('form');

    // Create a function to return the moderation text
    const getModText = (mod) => {
        // Get an array of categories
        let categories = [];
        for (let cat in mod.categories) {
            categories.push(cat);
        }

        // Start building the moderation text string
        let modText = `<p><b>Flagged:</b> ${mod.flagged ? "TRUE" : "false"}</p><hr>`;

        // Loop through the categories and add them to the moderation text string
        for (let cat of categories) {
            modText += `<p><b>${cat}:</b> ${mod.categories[cat] ? "TRUE" : "false"} (${(mod.category_scores[cat].toFixed(2))})</p>`;
        }
        return modText;
    }
    
    // Create a function to submit the user input
    const submitUserInput = (event) => {
        // Prevent the default form submission
        event.preventDefault();

        // If the passcode is not set, prompt the user for it
        if (passcode === "") {
            passcode = prompt("Passcode:");
        }
        
        // Get the user input
        const inputElement = document.getElementById("user-input");
        const userInput = inputElement.value;
        inputElement.value = "";

        // Update the prompt to show that the input is being processed
        const promptElement = document.getElementById("prompt");
        promptElement.innerHTML = "Loading..."
        
        // Send the user input to the backend for processing
        fetch('/process_input', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ passcode, conversation, user_input: userInput })
        })
        .then(response => response.json())
        .then(responseJson => {
            // If the passcode is incorrect, show an alert and reset the passcode variable
            if (!responseJson.passcode_correct) {
                alert("Passcode incorrect.");
                document.getElementById("prompt").innerHTML = "Passcode incorrect.";
                passcode = "";
                return;
            }

            // Update the conversation and moderation text
            conversation = responseJson.conversation;
            boldConvo = responseJson.conversation.split("AI:").join("<b>AI:</b>").split("User:").join("<b>User:</b>");
            
            // Update the text field with the API's response
            document.getElementById("prompt").innerHTML = "";
            document.getElementById('conversation').innerHTML = boldConvo;
            document.getElementById("moderation").innerHTML = getModText(responseJson.moderation);
        });
    }
    
    // Add a submit event listener to the form
    form.addEventListener('submit', function(event) {
        submitUserInput(event);
    }); 

    // Add a keydown event listener to the form to allow for submission with the enter key
    form.addEventListener('keydown', function(event) {
        // If the enter key is pressed, submit the form if the ctrl or meta key is also pressed
        if (event.key === "Enter") {
            if (event.ctrlKey || event.metaKey) {
                submitUserInput(event);
            }
        }
    }); 
});
