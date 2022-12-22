from flask import Flask, request, render_template, jsonify
import os
import openai

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

@app.route('/')
def index():
    """Render the index.html template"""
    return render_template('index.html')

@app.route('/process_input', methods=['POST'])
def process_input():
    """Process user input and return API response"""
    # Get the user input from the form
    request_data = request.get_json()

    passcode = request_data["passcode"]
    print(request_data)

    print("PASSCODE TYPE", passcode, type(passcode))
    print("OSPASSCODE TYPE", os.getenv("PASSCODE"), type(os.getenv("PASSCODE")))
    if passcode != os.getenv("PASSCODE"):
        return jsonify({
            "passcode_correct": False,
        })

    conversation = request_data["conversation"]
    user_input = request_data['user_input'].strip()

    mod = openai.Moderation.create(
        input=user_input
    )
    print(mod)
    
    # Don't start a conversation with "User: " or chat will respond with some variation of "Robot: "
    # Instead, wait until a pattern can be established with at least one "Human" and "AI".
    # conversation = conversation + "User: " + user_input + "AI: "
    if conversation == "":
        conversation = "User: " + user_input + "\n\nAI: "
    else:
        # Might have to change depending on whether AI wants to continue after "AI" or go ahead and add that
        conversation = conversation + "\n\nUser: " + user_input + "\n\nAI: "

    # Make a request to the OpenAI API for text-davinci-003 (DAVINCI3) model
    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=conversation,
        temperature=0.7,
        max_tokens=1024,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        stop=["User:"],
    )

    # Get the API's response
    response_text = response["choices"][0]["text"]

    conversation = conversation + response_text.strip()
 
    # Return the API's response to the frontend
    return jsonify({
        "passcode_correct": True,
        "conversation": conversation,
        "moderation": mod["results"][0],
    })

if __name__ == '__main__':
    app.run()
