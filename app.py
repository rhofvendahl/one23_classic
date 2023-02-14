from flask import Flask, request, render_template, jsonify
import os
import openai

from dotenv import load_dotenv
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

@app.route("/")
def index():
    """Render the index.html template"""
    return render_template("index.html")

@app.route("/process_input", methods=["POST"])
def process_input():
    """Process user input and return API response"""
    
    try:
        request_data = request.get_json()

        password = request_data["password"]

        if password != os.getenv("PASSWORD"):
            return jsonify({
                "password_correct": False,
            })

        if "conversation" not in request_data:
            return jsonify({
                "password_correct": True,
            })

        conversation = request_data["conversation"]

        user_input = request_data["user_input"].strip()

        # mod = openai.Moderation.create(
        #     input=user_input
        # )

        user_ws = "\n" if "\n" in user_input else " " 
        
        if conversation == "":
            conversation = f"User:{user_ws}{user_input}\n\nAI:"
        else:
            conversation = conversation + "\n\nUser: " + user_input + "\n\nAI:"
            
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

        response_text = response["choices"][0]["text"].strip()

        response_ws = "\n" if "\n" in response_text else " " 

        conversation = f"{conversation}{response_ws}{response_text}"
    
        return jsonify({
            "password_correct": True,
            "conversation": conversation,
            # "moderation": mod["results"][0],
        })  
    except Exception as err:
        print(err)
        return "", 500

if __name__ == "__main__":
    app.run()
