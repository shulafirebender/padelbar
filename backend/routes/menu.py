from flask import Blueprint, jsonify
from models import MenuItem

menu_bp = Blueprint('menu_bp', __name__)

@menu_bp.route('/api/menu', methods=['GET'])
def get_menu():
    items = MenuItem.query.order_by(MenuItem.id).all()
    return jsonify([i.to_dict() for i in items])
