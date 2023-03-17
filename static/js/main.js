window.addEventListener("load", () => {
    let messages = [];
    let password = localStorage.getItem("password") || "";

    const promptElement = document.getElementById("message-prompt")

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
                    promptElement.innerHTML = "Enter a message";
                    if (authLevel === "vip") {
                        unlockModel();
                    }
                    return;
                }
                promptMessage = "Please enter password:"
                if (password !== "") {
                    promptMessage = "Password incorrect.\n\n" + promptMessage;
                }
                promptElement.innerHTML = "Password incorrect";
                password = prompt(promptMessage);
            })
            .catch((err) => {
                console.error(err);
                document.getElementById("messagePrompt").innerHTML = "Internal error";
                alert("There was an internal error, please reload and try again.");
            });
        }
    }

    verifyPassword();

    const submitElement = document.getElementById("message-submit");
    const inputElement = document.getElementById("message-input");
    inputElement.focus();
    
    const unavailable = [
        "gpt-4",
        "gpt-4-32k",
    ];

    const submitUserInput = () => {
        if (unavailable.includes(model)) {
            alert(`Unfortunately, model "${model}" is not available at this time.`);
            return;
        }

        if (messages.length === 0) {
            const commandInput = document.getElementById("command-input").value;
            messages.push({
                role: "system",
                content: commandInput,
            })
        }

        const userInput = inputElement.value;
        inputElement.value = "";
        document.getElementById("command-input-wrapper").style.display = "none";

        promptElement.innerHTML = "Loading..."

        messages.push({
            role: "user",
            content: userInput.trim(),
        })
        
        fetch("/get-completion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password,
                model,
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
                    const command = `<br><div class="message-command">command: "${message.content}"</div>`;
                    const commandElement = document.getElementById("command");
                    commandElement.innerHTML = command;
                    continue;
                } else if (message.role === "user") {
                    conversation += `<br><div class="message-user"><span class="role-user">User:</span>`;
                } else {
                    conversation += `<br><div class="message-model"><span class="role-model">Model:</span>`;
                }
                if (message.content.includes("\n")) {
                    conversation += "\n";
                } else {
                    conversation += " ";
                }
                conversation += `${message.content}</div>`
            }
            
            const conversationElement = document.getElementById("conversation");
            conversationElement.innerHTML = conversation;

            promptElement.innerHTML = "";
        })
        .catch((err) => {
            console.error(err);
            promptElement.innerHTML = "Internal error";
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

    const toggleSettings = document.getElementById("toggle-settings");
    const settingsBasic = document.getElementById("settings-basic");
    const modelBasicVip = document.getElementById("basic-model-vip");
    const modelBasicVipLocked = document.getElementById("basic-model-vip-locked");
    const settingsDetail = document.getElementById("settings-detail");
    const modelDetailVip = document.getElementById("detail-model-vip");
    const modelDetailVipLocked= document.getElementById("detail-model-vip-locked");

    const statusElement = document.getElementById("password-status");
    const unlockModel = () => {
        statusElement.innerHTML = "unlocked";

        modelBasicVip.style.display = "block";
        modelBasicVipLocked.style.display = "none";
        modelDetailVip.style.display = "block";
        modelDetailVipLocked.style.display = "none";
    };
    statusElement.addEventListener("click", () => {
        password = "";
        verifyPassword();
    });

    toggleSettings.addEventListener("click", () => {
        // If only basic settings are shown, show detail
        if (settingsDetail.style.display !== "block") {
            settingsDetail.style.display = "block";
            settingsBasic.style.display = "none";
            toggleSettings.innerHTML = "Show less";
        // If detailed settings are shown, hide detail
        } else {
            settingsDetail.style.display = "none";
            settingsBasic.style.display = "block";
            toggleSettings.innerHTML = "Show more";
        }
    });

    // NOTE: Currently this value is hardcoded in index.html
    let model = "gpt-3.5-turbo";

    const chatModels = [
        "gpt-4",
        "gpt-4-32k",
        "gpt-3.5-turbo",    
    ];

    const commandInputWrapper = document.getElementById("command-input-wrapper");
    
    const setModel = (newModel) => {
        model = newModel;
        radios = document.querySelectorAll('.model input[type="radio"]');
        for (radio of radios) {
            radio.checked = false;
        }
        const id = newModel.replace(".", "_")
        targetRadios = document.querySelectorAll(`#${id}`);
        for (radio of targetRadios) {
            radio.checked = true;
        }
        if (chatModels.includes(newModel)) {
            // TODO: Resolve this css quirk
            commandInputWrapper.style.display = "flex";
        } else {
            commandInputWrapper.style.display = "none";
        }
    };
    setModel("text-davinci-003");

    settingsBasic.addEventListener("change", (event) => {
        setModel(event.target.id.replace("_", "."));
    })
    settingsDetail.addEventListener("change", (event) => {
        setModel(event.target.id.replace("_", "."));
    })
});