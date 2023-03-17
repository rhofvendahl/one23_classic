from flask import Flask, request, render_template, jsonify
import os
import openai

from dotenv import load_dotenv
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

PASSWORD_GENERAL = os.getenv("PASSWORD_GENERAL")
PASSWORD_VIP = os.getenv("PASSWORD_VIP")

# passwords = {
#     password_general,
#     password_vip: "vip",
# }


models = {
    # gpt-4
    "gpt-4",
    "gpt-4-32k",
    # gpt-3.5
    "gpt-3.5-turbo",
    "text-davinci-003",
    "text-davinci-002",
    "code-davinci-002", # (also under codex section)
    # codex
    "code-cushman-001",
    # gpt-3
    "text-curie-001",
    "text-babbage-001",
    "text-ada-001",
    "davinci",
    "curie",
    "babbage",
    "ada",
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

def get_messages(conversation):
    # If a conversation doesn't begin with "User:" or "AI:" it will be treated as user input
    if not conversation.startswith("User:"):
        conversation = "User: " + conversation
    
    messages = []
    while conversation:
        pass
        # peel off user
        # peel off AI (or break)
    return messages

def join_messages(messages):
    # TODO: This
    return ""



@app.route("/")
def index():
    """Render the index.html template"""
    return render_template("index.html")

@app.route("/process_input", methods=["POST"])
def process_input():
    """Process user input and return API response"""
    
    try:
        data = request.get_json()
        
        if "password" not in data or "model" not in data:
            return "", 400

        # Check if request password is valid
        if data["password"] == PASSWORD_VIP:
            auth_level = "vip"
        elif data["password"] == PASSWORD_GENERAL:
            auth_level = "general"
        else:
            return jsonify({ "authorized": False })
    
        model = data["model"]
        # Check if request model is valid
        if model not in models:
            return jsonify({ "authorized": False })
        print("TWO")
        
        # Check if auth is insufficient for model
        if auth_level == "general" and model in vip_models:
            return jsonify({ "authorized": False })

        # If there's no conversation property, assume the request is just a password check
        if "conversation" not in data:
            return jsonify({ "authorized": True })
        
        if "user_input" not in data:
            return "", 400

        conversation = data["conversation"]
        user_input = data["user_input"]
        
        prev_messages = get_messages(conversation)
        new_message = get_messages(user_input)

        # mod = openai.Moderation.create(
        #     input=user_input
        # )

        user_ws = "\n" if "\n" in user_input else " " 
        # TODO: Why isn't whitespace being added to later user inputs?
        # TODO: Would be good to check each message if it starts with "User:"
        # TODO: Oh or better yet, break each message into constituent parts! that way can always do that trick
        if conversation == "":
            conversation = f"User:{user_ws}{user_input}\n\nAI:"
        else:
            conversation = conversation + "\n\nUser: " + user_input + "\n\nAI:"
        
        if model in chat_models:
            
            # TODO: Break convo down into messages (I liike this way cause it lets me input whole convos)
            response = openai.ChatCompletion.create(
                model = model,
                messages = prev_messages + new_message,
            )
        else:
            conversation = join_messages(prev_messages + new_message)
            response = openai.Completion.create(
                model=model,
                prompt=conversation,
                temperature=0.7,
                max_tokens=2048,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0,
                stop=["User:"],
            )

        response_text = response["choices"][0]["text"].strip()
        response_message = { "role": "system", "content": response_text }

        # response_ws = "\n" if "\n" in response_text else " " 

        # conversation = f"{conversation}{response_ws}{response_text}"
        
        conversation = join_messages(prev_messages + new_message + response_message)
    
        return jsonify({
            "authorized": True,
            "conversation": conversation,
            # "moderation": mod["results"][0],
        })  
    except Exception as err:
        print(err)
        return "", 500

if __name__ == "__main__":
    app.run()
