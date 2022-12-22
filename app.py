from flask import Flask, request, render_template, jsonify
import os
import openai

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Set the OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Create a Flask app
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

    # Get the passcode from the request data
    passcode = request_data["passcode"]

    # If the passcode is incorrect, return a JSON object with passcode_correct set to False
    if passcode != os.getenv("PASSCODE"):
        return jsonify({
            "passcode_correct": False,
        })

    # Get the conversation and user input from the request data
    conversation = request_data["conversation"]
    user_input = request_data['user_input'].strip()

    # Moderate the user input
    mod = openai.Moderation.create(
        input=user_input
    )
    
    # If the conversation is empty, start a new conversation with the user input
    if conversation == "":
        conversation = "User: " + user_input + "\n\nAI: "
    else:
        # If the conversation is not empty, add the user input to the conversation
        conversation = conversation + "\n\nUser: " + user_input + "\n\nAI: "

    # Make a request to the OpenAI API for text-davinci-003 (DAVINCI3) model
    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=conversation,
        temperature=0.7,
        max_tokens=2048,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        stop=["User:"],
    )

    # Get the API's response
    response_text = response["choices"][0]["text"]

    # Add the API's response to the conversation
    conversation = conversation + response_text.strip()
 
    # Return the API's response to the frontend
    return jsonify({
        "passcode_correct": True,
        "conversation": conversation,
        "moderation": mod["results"][0],
    })

if __name__ == '__main__':
    app.run()
