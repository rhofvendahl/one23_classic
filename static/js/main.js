window.addEventListener("load", () => {
    const checkPassword = async (passwordAttempt) => {
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
    
    const unlockVip = () => {
        const modelBasicVip = document.getElementById("basic-model-vip");
        const modelBasicVipLocked = document.getElementById("basic-model-vip-locked");
        const modelDetailVip = document.getElementById("detail-model-vip");
        const modelDetailVipLocked= document.getElementById("detail-model-vip-locked");
        const statusElement = document.getElementById("password-status");
        const statusLockedElement = document.getElementById("password-status-locked");

        statusElement.style.display = "block";
        statusLockedElement.style.display = "none";
        
        modelBasicVip.style.display = "block";
        modelBasicVipLocked.style.display = "none";
        modelDetailVip.style.display = "block";
        modelDetailVipLocked.style.display = "none";
    };

    const gatekeep = async () => {
        try {
            let passwordStatus = await checkPassword(password);
            
            while (passwordStatus === "invalid") {
                if (password === "") {
                    password = prompt("Please enter password:");
                } else {
                    password = prompt("Password incorrect.\n\nPlease enter password:");
                }
                passwordStatus = await checkPassword(password);
            }
            if (passwordStatus === "vip") {
                unlockVip();
            }
            localStorage.setItem("password", password);
        } catch (err) {
            console.error(err);
            document.getElementById("messagePrompt").innerHTML = "Internal error";
            alert("There was an internal error, please reload and try again.");
        }
    }

    let password = localStorage.getItem("password") || "";

    // General models are currently free to use
    // gatekeep();

    // Instead, check for vip password once for new users or else set auth quietly
    const gatekeepPermissive = async () => {
        if (password === "") {
            password = prompt("Enter password to unlock VIP:");
            const passwordStatus = await checkPassword(passwordAttempt);
            if (passwordStatus === "vip") {
                unlockVip();
            } else {
                password = "not_vip";
                alert("Password incorrect.");
            }
            localStorage.setItem("password", passwordAttempt);
        } else {
            const passwordStatus = await checkPassword(password);
            if (passwordStatus === "vip") {
                unlockVip();
            }
        }
    }

    gatekeepPermissive();

    const statusLockedElement = document.getElementById("password-status-locked");
    // TODO: Refactor this with other VIP stuff
    statusLockedElement.addEventListener("click", async () => {
        const passwordAttempt = prompt("Enter password to unlock VIP:");
        const passwordStatus = await checkPassword(passwordAttempt);
        if (passwordStatus === "vip") {
            unlockVip();
            password = passwordAttempt;
            localStorage.setItem("password", passwordAttempt);
        } else {
            alert("Password incorrect.");
        }
    });

    let messages = [];

    const promptElement = document.getElementById("message-prompt");
    const submitElement = document.getElementById("message-submit");
    const inputElement = document.getElementById("message-input");
    inputElement.focus();
    
    const submitUserInput = () => {
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
                    const command = `<br><div class="message-command">initial command: "${message.content}"</div>`;
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
            
            document.getElementById("conversation").innerHTML = conversation;
            document.getElementById("tokens-used").innerHTML = responseJson.tokensUsed;
            document.getElementById("max-tokens").innerHTML = responseJson.maxTokens;

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
    const settingsDetail = document.getElementById("settings-detail");
    
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
