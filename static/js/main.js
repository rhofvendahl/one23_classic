window.addEventListener("load", () => {
    let conversation = "";
    let password = localStorage.getItem("password") || "";

    const verifyPassword = async () => {
        let passwordCorrect = false;
        while (!passwordCorrect) {
            await fetch("/process_input", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password })
            })
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson.password_correct) {
                    passwordCorrect = true;
                    localStorage.setItem("password", password);
                    document.getElementById("prompt").innerHTML = "Enter a message";
                    return;
                }
                document.getElementById("prompt").innerHTML = "Password incorrect";
                password = prompt("Password incorrect.\n\nPlease enter password:");
            })
            .catch((err) => {
                console.error(err);
                document.getElementById("prompt").innerHTML = "Internal error";
            });
        }
    }

    verifyPassword();

    const formElement = document.getElementById("form");
    const inputElement = document.getElementById("user-input");
    inputElement.focus();

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
        event.preventDefault();
        
        const userInput = inputElement.value;
        inputElement.value = "";

        const promptElement = document.getElementById("prompt");
        promptElement.innerHTML = "Loading..."
        
        fetch("/process_input", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password, conversation, user_input: userInput })
        })
        .then(response => response.json())
        .then(responseJson => {
            if (!responseJson.password_correct) {
                verifyPassword();
                return;
            }

            const convoElement = document.getElementById("conversation");
            convoElement.innerHTML = "";

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

            // document.getElementById("moderation").innerHTML = getModText(responseJson.moderation);
            console.log("moderation", responseJson.moderation)
            document.getElementById("prompt").innerHTML = "";
        })
        .catch((err) => {
            console.error(err);
            document.getElementById("prompt").innerHTML = "Internal error";
        });
    }
    
    formElement.addEventListener("submit", (event) => {
        submitUserInput(event);
    });

    formElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            submitUserInput(event);
        }
    });
    
    inputElement.addEventListener("input", () => {
        inputElement.style.height = "auto";
        inputElement.style.height = Math.min(inputElement.scrollHeight, 200) + "px";
    });

    // let modHidden = true;
    // const modToggleElement = document.getElementById("moderation-toggle");
    // const modElement = document.getElementById("moderation");
    // modToggleElement.addEventListener("click", (event) => {
    //     if (modHidden) {
    //         modToggleElement.innerHTML = "Hide moderation";
    //     } else {
    //         modToggleElement.innerHTML = "Show moderation";
    //     }
    //     modElement.hidden = !modHidden;
    //     modHidden = !modHidden;
    // });
});