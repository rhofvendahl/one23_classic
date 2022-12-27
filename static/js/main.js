// main.js

// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let conversation = "";
    let passcode = localStorage.getItem("passcode") || "";

    // Get the form element
    const formElement = document.getElementById('form');

    const inputElement = document.getElementById("user-input");

    inputElement.focus();

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
        // const inputElement = document.getElementById("user-input");
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
                localStorage.setItem("passcode", null);
                return;
            }
            localStorage.setItem("passcode", passcode);

            const convoElement = document.getElementById("conversation");
            convoElement.innerHTML = "";

            // Update the conversation and moderation text
            conversation = responseJson.conversation;

            let tempConvo = conversation;
            while (tempConvo.length > 0) {
                const speakerIndex = tempConvo.search(/User:|AI:/);

                let preSpeaker;
                let speaker;
                if (speakerIndex < 0) {
                    preSpeaker = tempConvo;
                    tempConvo = "";
                } else {
                    preSpeaker = tempConvo.substring(0, speakerIndex);
                    speaker = tempConvo[speakerIndex] === "U" ? "User:" : "AI:";
                    tempConvo = tempConvo.substring(speakerIndex + speaker.length);
                }
                if (preSpeaker) {
                    let preSpeakerELement = document.createTextNode(preSpeaker);
                    convoElement.appendChild(preSpeakerELement);
                }
                if (speaker) {
                    let speakerElement = document.createElement("span");
                    speakerElement.innerHTML = `<b>${speaker}</b>`;
                    convoElement.appendChild(speakerElement);
                }
            }

            // Update the text field with the API's response
            document.getElementById("prompt").innerHTML = "";
            document.getElementById("moderation").innerHTML = getModText(responseJson.moderation);
        });
    }
    
    // Add a submit event listener to the form
    formElement.addEventListener('submit', function(event) {
        submitUserInput(event);
    }); 

    // Add an event listener to the form to detect when the user presses a key
    formElement.addEventListener('keydown', function(event) {
        // If the user presses the enter key without holding shift, and if the ctrl or meta key is
        // also pressed, submit the form
        if (event.key === "Enter" && !event.shiftKey) {
            submitUserInput(event);
        }
    }); 
    
    inputElement.addEventListener('input', () => {

        inputElement.style.height = 'auto';
        inputElement.style.height = Math.min(inputElement.scrollHeight, 200) + 'px';
    });
});