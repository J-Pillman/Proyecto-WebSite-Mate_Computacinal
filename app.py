from flask import Flask, render_template, request, jsonify
from backend.graph import generar_grafo

app = Flask(__name__) #instancia de la clase Flask

@app.route('/') #ruta donde se ejecutaran las funciones GET->pagina principal
def index():
    return render_template('index.html')

@app.route('/grafo', methods=['POST'])
def grafo():
    try:
        num=int(request.get_json()['n'])
        return jsonify(generar_grafo(num))
    except (ValueError, KeyError, TypeError) as error:
        return jsonify({'error':str(error)}), 400

if __name__=='__main__':   #ejecutar la aplicacion
    app.run(debug=True) #Flask reinicia cuando hay cambios y correra en el puerto 5000 