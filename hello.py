from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_ahmet():
	return '<h1 style={"color":"green"}>Hello Costumer, This is my little shoppig site.</h1>'
