from flask import Blueprint, jsonify, request
from models import db, Category
import os

categories_bp = Blueprint('categories_bp', __name__)

def check_admin_auth():
    admin_pw = os.getenv('ADMIN_PASSWORD', 'secret123')
    auth = request.headers.get('Authorization') or request.json.get('admin_password', '')
    return auth == admin_pw


@categories_bp.route('/api/categories', methods=['GET'])
def get_categories():
    """Return categories with their nested subcategories"""
    parents = Category.query.filter_by(parent_id=None).all()
    result = [
        {
            "name": c.name,
            "id": c.id,
            "subcategories": [
                {"id": s.id, "name": s.name} 
                for s in c.subcategories
            ]
        }
        for c in parents
    ]
    return jsonify(result)


@categories_bp.route('/api/admin/categories', methods=['POST'])
def create_category():
    if not check_admin_auth():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    name = data.get('name')
    parent_id = data.get('parent_id')

    if not name:
        return jsonify({"error": "Name required"}), 400

    # Проверяем, существует ли родительская категория
    if parent_id:
        parent = Category.query.get(parent_id)
        if not parent:
            return jsonify({"error": "Parent category not found"}), 400

    cat = Category(name=name, parent_id=parent_id)
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201