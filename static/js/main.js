window.addEventListener("load", () => {
    let messages = [
        {
            role: "system",
            content: "You are a helpful assistant."
        }
    ];
    let password = localStorage.getItem("password") || "";
    let authLevel;

    const verifyPassword = async () => {
        let passwordCorrect = false;
        while (!passwordCorrect) {
            await fetch("/check-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    password,
                })
            })
            .then(response => response.json())
            .then(responseJson => {
                authLevel = responseJson.authLevel;
                if (["general", "vip"].includes(authLevel)) {
                    passwordCorrect = true;
                    localStorage.setItem("password", password);
                    document.getElementById("prompt").innerHTML = "Enter a message";
                    authLevel = responseJson.authLevel;
                    return;
                }
                promptMessage = "Please enter password:"
                if (password !== "") {
                    promptMessage = "Password incorrect.\n\n" + promptMessage;
                }
                document.getElementById("prompt").innerHTML = "Password incorrect";
                password = prompt(promptMessage);
            })
            .catch((err) => {
                console.error(err);
                document.getElementById("prompt").innerHTML = "Internal error";
                alert("There was an internal error, please reload and try again.");
            });
        }
    }

    verifyPassword();

    const submitElement = document.getElementById("message-submit");
    const inputElement = document.getElementById("message-input");
    inputElement.focus();
    
    const submitUserInput = () => {
        const userInput = inputElement.value;
        inputElement.value = "";

        const promptElement = document.getElementById("prompt");
        promptElement.innerHTML = "Loading..."

        messages.push({
            role: "user",
            content: userInput.trim(),
        })
        console.log("MESSAGES", messages);
        
        fetch("/get-completion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password,
                model: "gpt-3.5-turbo",
                messages,
            })
        })
        .then(response => response.json())
        .then(responseJson => {
            messages.push(responseJson.message);
            
            
            const roleMap = {
                user: "User",
                assistant: "Model"
            }
            let conversation = ""
            for (message of messages) {
                if (message.role === "system") {
                    const command = `<p class="message-system">command: "${message.content}"</p>`;
                    const commandElement = document.getElementById("command");
                    commandElement.innerHTML = command;
                    continue;
                } else if (message.role === "user") {
                    conversation += `<p class="message-user"><span class="role-user">User:</span>`;
                } else {
                    conversation += `<p class="message-model"><span class="role-model">Model:</span>`;
                }
                if (message.content.includes("\n")) {
                    conversation += "\n";
                } else {
                    conversation += " ";
                }
                conversation += `${message.content}</p>`
            }
            
            const conversationElement = document.getElementById("conversation");
            conversationElement.innerHTML = conversation;

            document.getElementById("prompt").innerHTML = "";
        })
        .catch((err) => {
            console.error(err);
            document.getElementById("prompt").innerHTML = "Internal error";
            alert("There was an internal error, please reload and try again.");
        });
    }
    
    submitElement.addEventListener("click", () => {
        submitUserInput();
    });

    inputElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            submitUserInput();
        }
    });
    
    inputElement.addEventListener("input", () => {
        inputElement.style.height = "auto";
        inputElement.style.height = Math.min(inputElement.scrollHeight, 200) + "px";
    });

    const toggleModelDetail = document.getElementById("toggle-model-detail");
    const modelBasic = document.getElementById("model-basic");
    const modelBasicVip = document.getElementById("model-basic-vip");
    const modelBasicVipUnauthorized = document.getElementById("model-basic-vip-unauthorized");
    const modelDetail = document.getElementById("model-detail");
    const modelDetailVip = document.getElementById("model-detail-vip");
    const modelDetailVipUnauthorized = document.getElementById("mmodel-detail-vip-unauthorized");

    toggleModelDetail.addEventListener("click", () => {
        if (modelBasic.style.display === "none") {
            modelBasic.style.display = "block";
            modelDetail.style.display = "none";
            toggleModelDetail.innerHTML = "Show more";
        } else {
            modelBasic.style.display = "none";
            modelDetail.style.display = "block";
            toggleModelDetail.innerHTML = "Show less";
        }
    });
});