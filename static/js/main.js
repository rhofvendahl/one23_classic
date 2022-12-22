// main.js

// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    let conversation = "";
    let passcode = "";

    // Get the form element
    const form = document.getElementById('form');

    const getModText = (mod) => {
        let categories = [];
        for (let cat in mod.categories) {
            categories.push(cat);
        }

        let modText = `<p><b>Flagged:</b> ${mod.flagged ? "TRUE" : "false"}</p><hr>`;
        for (let cat of categories) {
            modText += `<p><b>${cat}:</b> ${mod.categories[cat] ? "TRUE" : "false"} (${(mod.category_scores[cat].toFixed(2))})</p>`;
        }
        return modText;
    }
    
    const submitUserInput = (event) => {
        // Prevent the default form submission
        event.preventDefault();

        if (passcode === "") {
            passcode = prompt("Passcode:");
        }
        
        // Get the user input
        const inputElement = document.getElementById("user-input");
        const userInput = inputElement.value;
        inputElement.value = "";

        const promptElement = document.getElementById("prompt");
        promptElement.innerHTML = "Loading..."
        

        console.log("ABT TO SEND PASSCODE", passcode, typeof passcode);
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
            console.log("RESPONSE", responseJson);

            if (!responseJson.passcode_correct) {
                alert("Passcode incorrect.");
                document.getElementById("prompt").innerHTML = "Passcode incorrect.";
                passcode = "";
                return;
            }

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

    // Add a submit event listener to the form
    form.addEventListener('keydown', function(event) {
        if (event.key === "Enter") {
            if (event.ctrlKey || event.metaKey) {
                submitUserInput(event);
            }
        }
    }); 
});
