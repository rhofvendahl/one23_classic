window.addEventListener("load", () => {
    let messages = [];
    let password = localStorage.getItem("password") || "";
    unlocked = false;

    const promptElement = document.getElementById("message-prompt");

    const getAuthLevel = async (passwordAttempt) => {
        return await fetch("/check-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: passwordAttempt,
            }),
        })
        .then(response => response.json())
        .then(responseJson => {
            return responseJson.authLevel;
        });
    };

    const checkPassword = async () => {
        try {
            while (true) {
                authLevel = await getAuthLevel(password);
                if (["general", "vip"].includes(authLevel)) {
                    localStorage.setItem("password", password);
                    if (authLevel === "vip") {
                        unlockVip();
                        unlocked = true;
                    }
                    break;
                }
                let promptMessage = "Please enter password:";
                if (password !== "") {
                    promptMessage = "Password incorrect.\n\n" + promptMessage;
                }
                password = prompt(promptMessage);
            }
        } catch (err) {
            console.error(err);
            document.getElementById("messagePrompt").innerHTML = "Internal error";
            alert("There was an internal error, please reload and try again.");

        }
    }

    checkPassword();

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
            const command = document.getElementById("command-input").value;
            messages.push({
                role: "system",
                content: command,
            });
            // if (document.getElementById("workaround-input").checked) {
            //     document.getElementById("workaround").innerHTML = "<br>moderation bypassed";
            //     // Push jailbreak prompt
            // }
        }

        const userInput = inputElement.value;
        inputElement.value = "";
        // document.getElementById("workaround-input-wrapper").style.display = "none";
        document.getElementById("command-input-wrapper").style.display = "none";

        promptElement.innerHTML = "Loading...";

        messages.push({
            role: "user",
            content: userInput.trim(),
        });
        
        fetch("/get-completion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password,
                model,
                messages,
            }),
        })
        .then(response => response.json())
        .then(responseJson => {
            messages.push(responseJson.message);
            
            const roleMap = {
                user: "User",
                assistant: "Model",
            }
            let conversation = "";
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
                conversation += `${message.content}</div>`;
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
    const unlockVip = () => {
        statusElement.innerHTML = "unlocked";

        modelBasicVip.style.display = "block";
        modelBasicVipLocked.style.display = "none";
        modelDetailVip.style.display = "block";
        modelDetailVipLocked.style.display = "none";
    };
    statusElement.addEventListener("click", async () => {
        if (unlocked) {
            return;
        }
        const passwordAttempt = prompt("Enter password to unlock:");
        const authLevel = await getAuthLevel(passwordAttempt);
        if (authLevel === "vip") {
            unlockVip();
            unlocked = true;
            localStorage.setItem("password", passwordAttempt);
        } else {
            alert("Password incorrect.");
        }
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

    let model = localStorage.getItem("model") || "text-davinci-003";

    const chatModels = [
        "gpt-4",
        "gpt-4-32k",
        "gpt-3.5-turbo",    
    ];

    // const moderatedModels = [
    //     "gpt-4",
    //     "gpt-4-32k",
    //     "gpt-3.5-turbo",    
    // ];

    const commandElement = document.getElementById("command");
    const commandInputWrapper = document.getElementById("command-input-wrapper");
    // const workaroundElement = document.getElementById("workaround");
    // const workaroundInputWrapper = document.getElementById("workaround-input-wrapper");
    
    const setModel = (newModel) => {
        model = newModel;
        localStorage.setItem("model", newModel);
        radios = document.querySelectorAll('.model input[type="radio"]');
        for (radio of radios) {
            radio.checked = false;
        }
        const id = newModel.replace(".", "_");
        targetRadios = document.querySelectorAll(`#${id}`);
        for (radio of targetRadios) {
            radio.checked = true;
        }
        if (chatModels.includes(newModel)) {
            commandElement.style.display = "block";
            // Command input shouldn't re-appear if it's already been hidden by new message listener
            if (messages.length == 0) {
                // TODO: Resolve this css quirk 
                commandInputWrapper.style.display = "flex";
            }
        } else {
            console.log("Should be hiding all command stuff");
            commandElement.style.display = "none";
            commandInputWrapper.style.display = "none";
        }
        // if (moderatedModels.includes(newModel)) {
        //     workaroundElement.style.display = "block"
        //     // Command input shouldn't re-appear if it's already been hidden by new message listener
        //     if (messages.length === 0) {
        //         workaroundInputWrapper.style.display = "block";
        //     }
        // } else {
        //     console.log("Should be hiding all workaround stuff");
        //     workaroundElement.style.display = "none";
        //     workaroundInputWrapper.style.display = "none";
        // }
    };
    setModel(model);

    settingsBasic.addEventListener("change", (event) => {
        setModel(event.target.id.replace("_", "."));
    });
    settingsDetail.addEventListener("change", (event) => {
        setModel(event.target.id.replace("_", "."));
    });
});
