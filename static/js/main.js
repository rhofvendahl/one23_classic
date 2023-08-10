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
            const passwordStatus = await checkPassword(password);
            if (passwordStatus === "vip") {
                unlockVip();
                setModel("gpt-4");
            } else {
                password = "not_vip";
                alert("Password incorrect.");
            }
            localStorage.setItem("password", password);
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
        }

        const userInput = inputElement.value;
        inputElement.value = "";
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
            convElement = document.getElementById("conversation");
            convElement.innerHTML = "";
            for (message of messages) {
              convElement.appendChild(document.createElement("br"));
              const newDiv = document.createElement("div");
              const separator = message.content.includes("\n") ? "\n" : " ";
              if (message.role === "system") {
                  newDiv.classList.add("message-command");
                  newDiv.innerText = `initial command:${separator}"${message.content}"`
                  convElement.appendChild(newDiv);
                  continue;
              } else if (message.role === "user") {
                roleSpan = document.createElement("span");
                roleSpan.classList.add("role-user");
                roleSpan.innerText = "User:"
                contentText = document.createTextNode(`${separator}${message.content}`);
                newDiv.classList.add("message-user");
                newDiv.appendChild(roleSpan);
                newDiv.appendChild(contentText);
                convElement.appendChild(newDiv);
              } else {
                newDiv.classList.add("message-model");
                roleSpan = document.createElement("span");
                roleSpan.classList.add("role-model");
                roleSpan.innerText = "Model:"
                contentText = document.createTextNode(`${separator}${message.content}`);
                newDiv.classList.add("message-model");
                newDiv.appendChild(roleSpan);
                newDiv.appendChild(contentText);
                convElement.appendChild(newDiv);
              }
            }
            document.getElementById("tokens-used").innerText = responseJson.tokensUsed;
            document.getElementById("max-tokens").innerText = responseJson.maxTokens;

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

    inputElement.addEventListener("keyup", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            submitUserInput();
            // Prevent 'enter' from creating newline
            event.preventDefault();
        }
    });
    
    inputElement.addEventListener("input", () => {
        inputElement.style.height = "auto";
        inputElement.style.height = Math.min(inputElement.scrollHeight, 200) + "px";
    });

    const toggleSettings = document.getElementById("toggle-settings");
    const settingsBasic = document.getElementById("settings-basic");
    const settingsDetail = document.getElementById("settings-detail");

    const showDetail = () => {
        settingsDetail.style.display = "block";
        settingsBasic.style.display = "none";
        toggleSettings.innerHTML = "Show less";
    };

    const hideDetail = () => {
        settingsDetail.style.display = "none";
        settingsBasic.style.display = "block";
        toggleSettings.innerHTML = "Show more";
    };
    
    toggleSettings.addEventListener("click", () => {
        // If only basic settings are shown, show detail
        if (settingsDetail.style.display !== "block") {
            showDetail();
        // If detailed settings are shown, hide detail
        } else {
            hideDetail();
        }
    });

    let model = localStorage.getItem("model") || "text-davinci-003";

    const chatModels = [
        "gpt-4",
        "gpt-4-32k",
        "gpt-3.5-turbo",    
    ];

    const startModels = [
        "gpt-4",
        "gpt-3.5-turbo",
        "text-davinci-003",
    ];

    const commandElement = document.getElementById("command");
    const commandInputWrapper = document.getElementById("command-input-wrapper");
    
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
        // Expand to show more if appropriate
        if (!startModels.includes(model)) {
            showDetail();
        }
        if (chatModels.includes(newModel)) {
            commandElement.style.display = "block";
            // Command input shouldn't re-appear if it's already been hidden by new message listener
            if (messages.length == 0) {
                // TODO: Resolve this css quirk 
                commandInputWrapper.style.display = "flex";
            }
        } else {
            commandElement.style.display = "none";
            commandInputWrapper.style.display = "none";
        }
    };
    setModel(model);

    settingsBasic.addEventListener("change", (event) => {
        setModel(event.target.id.replace("_", "."));
    });
    settingsDetail.addEventListener("change", (event) => {
        setModel(event.target.id.replace("_", "."));
    });
});
