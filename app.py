#Servidor
from flask import Flask, render_template, request, jsonify 
from backend.graph import generar_grafo

app = Flask(__name__) #Instancia de la clase Flask, crea la aplicacion Flask

@app.route('/') #Ruta donde se ejecutaran las funciones GET -> pagina principal, la raiz del sitio, cuando pones en el navegador este envia un GET a la ruta /
def index():
    return render_template('index.html') #Devuelve el html

@app.route('/grafo', methods=['POST']) #Ruta que solo acepta POST
def grafo():
    try:
        num=int(request.get_json()['n'])    #Lee el JSON del navegador
        return jsonify(generar_grafo(num))  #Genera el grafo y lo devuelve como JSON
    except (ValueError, KeyError, TypeError) as error:
        return jsonify({'error':str(error)}), 400

if __name__=='__main__':   #Ejecuta la aplicacion
    app.run(debug=True) #Flask reinicia cuando hay cambios y correra en el puerto 5000 