from flask import Flask, request, render_template, jsonify
import os
import openai

from dotenv import load_dotenv
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

PASSWORD_GENERAL = os.getenv("PASSWORD_GENERAL")
PASSWORD_VIP = os.getenv("PASSWORD_VIP")

models = {
    # gpt-4
    "gpt-4": 8192,
    "gpt-4-32k": 32768,
    # gpt-3.5
    "gpt-3.5-turbo": 4096,
    "text-davinci-003": 4096,
    "text-davinci-002": 4096,
    "code-davinci-002": 8001, # (gpt-3.5 AND codex)
    # codex
    "code-cushman-001": 2048,
    # gpt-3
    "text-curie-001": 2049,
    "text-babbage-001": 2049,
    "text-ada-001": 2049,
    "davinci": 2049,
    "curie": 2049,
    "babbage": 2049,
    "ada": 2049,
}

vip_models = [
    "gpt-4",
    "gpt-4-32k",
]

chat_models = [
    "gpt-4",
    "gpt-4-32k",
    "gpt-3.5-turbo",    
]

def get_auth_level(password):
    auth_level = "invalid"
    if password == PASSWORD_VIP:
        auth_level = "vip"
    if password == PASSWORD_GENERAL:
        auth_level = "general"
    return auth_level

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/check-password", methods=["POST"])
def check_password():
    data = request.get_json()
    
    if "password" not in data:
        return "", 400

    auth_level = get_auth_level(data["password"])
    return jsonify({ "authLevel": auth_level })

@app.route("/get-completion", methods=["POST"])
def get_completion():    
    try:
        data = request.get_json()
        
        if "password" not in data or "model" not in data or "messages" not in data:
            return "request missing data", 400

        auth_level = get_auth_level(data["password"])
        if not auth_level in ["vip", "general"]:
            return "password invalid", 401
        
        model = data["model"]
        if model not in models:
            return "model not found", 404
        
        if auth_level == "general" and model in vip_models:
            return "model not allowed", 401

        messages = data["messages"]
        if not isinstance(messages, list):
            return "messages invalid", 400
        messages_valid = True
        for message in messages:
            if len(message) > 2 or "role" not in message or "content" not in message:
                messages_valid = False
                break
            if message["role"] not in ["system", "user", "assistant"]:
                messages_valid = False
                break
        if not messages_valid:
            return "messages invalid", 400
        
        if model in chat_models:
            response = openai.ChatCompletion.create(
                model = model,
                messages = messages,
                max_tokens = 256,
            )
            total_tokens = response["usage"]["total_tokens"]
            completion_message = response["choices"][0]["message"]
            return jsonify({
                "tokensUsed": total_tokens,
                "message": completion_message,
                "maxTokens": models[model],
            })

        prompt = ""
        for message in messages:
            if message["role"] == "system":
                continue
            
            roleMap = {
                "user": "User",
                "assistant": "AI",
            }
            prompt += roleMap[message["role"]] + ": " + message["content"] + "\n\n"
        prompt += "AI: "
        response = openai.Completion.create(
            model = model,
            prompt = prompt,
            max_tokens = 256,
            stop=["User:"],
        )
        total_tokens = response["usage"]["total_tokens"]
        # Generally the model will stick to the prompt format, prepending "assistant: " to the response text
        content = response["choices"][0]["text"]
        content = content.strip()
        if content.startswith("AI:"):
            content = content[len("AI:"):]
            content = content.strip()
        response_message = { "role": "assistant", "content": content }
        return jsonify({
            "tokensUsed": total_tokens,
            "message": response_message,
            "maxTokens": models[model],
        })
        
    except Exception as err:
        print(err)
        return "", 500

if __name__ == "__main__":
    app.run(port=1234)
