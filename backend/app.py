import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from models import db
from dotenv import load_dotenv
from routes.categories import categories_bp

# Load .env if present
load_dotenv()

def create_app():
    # Указываем static_folder на dist
    app = Flask(__name__, static_folder="dist", static_url_path="/")
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Config
    database_url = os.getenv('DATABASE_URL', 'sqlite:///database.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Init extensions
    db.init_app(app)

    # Register blueprints
    from routes.menu import menu_bp
    from routes.admin import admin_bp
    app.register_blueprint(menu_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(categories_bp)

    # Basic healthcheck
    @app.route('/health')
    def health():
        return {'status': 'ok'}

    # Отдача React статики
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        # Если путь существует в dist — отдать файл
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # Иначе отдаём index.html
        return send_from_directory(app.static_folder, 'index.html')

    return app

if __name__ == '__main__':
    app = create_app()
    # Ensure DB exists
    with app.app_context():
        db.create_all()
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=(os.getenv('FLASK_ENV') == 'development')
    )
