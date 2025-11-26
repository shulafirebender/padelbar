import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from models import db
from dotenv import load_dotenv
from routes.categories import categories_bp

# Load .env if present
load_dotenv()


def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Config
    database_url = os.getenv('DATABASE_URL', 'sqlite:///database.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Init extensions
    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

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
