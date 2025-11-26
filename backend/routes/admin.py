import os
from flask import Blueprint, request, jsonify
from models import db, MenuItem, Category

admin_bp = Blueprint('admin_bp', __name__)

def check_admin_auth():
    admin_pw = os.getenv('ADMIN_PASSWORD', 'secret123')
    auth = request.headers.get('Authorization')
    if not auth and request.is_json:
        auth = (request.get_json() or {}).get('admin_password')
    return auth == admin_pw

@admin_bp.route('/api/admin/items', methods=['GET'])
def get_all_items_admin():
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        items = MenuItem.query.all()
        # Можно вернуть те же данные что и в обычном /api/menu
        return jsonify([item.to_dict() for item in items])
    except Exception as e:
        print("Error in admin items:", str(e))
        return jsonify({"error": "Internal server error"}), 500

@admin_bp.route('/api/admin/items', methods=['POST'])
def create_item():
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    name = data.get('name')
    price = data.get('price', 0)
    description = data.get('description', '')
    image_url = data.get('image_url', '')
    category_id = data.get('category_id')

    if not name or not category_id:
        return jsonify({'error': 'name and category_id are required'}), 400

    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Invalid category_id'}), 400

    item = MenuItem(
        name=name,
        category=category,
        price=price,
        description=description,
        image_url=image_url
    )
    db.session.add(item)
    db.session.commit()

    return jsonify(item.to_dict()), 201

@admin_bp.route('/api/admin/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    print("DELETE request received for item_id:", item_id)
    print("Authorization header:", request.headers.get("Authorization"))

    if not check_admin_auth():
        print("Unauthorized")
        return jsonify({'error': 'Unauthorized'}), 401

    item = MenuItem.query.get(item_id)
    if not item:
        print("Item not found")
        return jsonify({'error': 'Item not found'}), 404

    db.session.delete(item)
    db.session.commit()
    print("Item deleted successfully")
    return jsonify({'message': 'Item deleted successfully'}), 200

@admin_bp.route('/api/admin/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401

    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    # Проверяем, есть ли связанные элементы меню
    if category.menu_items:
        return jsonify({
            'error': 'Cannot delete category with menu items', 
            'items_count': len(category.menu_items)
        }), 400

    # Проверяем, есть ли подкатегории
    if category.subcategories:
        return jsonify({
            'error': 'Cannot delete category with subcategories',
            'subcategories_count': len(category.subcategories)
        }), 400

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully'}), 200


@admin_bp.route('/api/admin/categories/<int:category_id>/force', methods=['DELETE'])
def force_delete_category(category_id):
    """Принудительное удаление категории вместе с подкатегориями"""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401

    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    # Удаляем все подкатегории
    for subcategory in category.subcategories:
        # Проверяем, есть ли элементы в подкатегории
        if subcategory.menu_items:
            return jsonify({
                'error': f'Cannot delete subcategory "{subcategory.name}" with menu items',
                'subcategory_name': subcategory.name,
                'items_count': len(subcategory.menu_items)
            }), 400
        db.session.delete(subcategory)
    
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category and subcategories deleted successfully'}), 200

@admin_bp.route('/api/admin/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    name = data.get('name')
    price = data.get('price', 0)
    description = data.get('description', '')
    image_url = data.get('image_url', '')
    category_id = data.get('category_id')

    if not name or not category_id:
        return jsonify({'error': 'name and category_id are required'}), 400

    item = MenuItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404

    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Invalid category_id'}), 400

    # Обновляем поля
    item.name = name
    item.price = price
    item.description = description
    item.image_url = image_url
    item.category_id = category_id
    item.category = category

    db.session.commit()

    return jsonify(item.to_dict()), 200