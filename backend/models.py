from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)

    parent = db.relationship(
        'Category',
        remote_side=[id],
        backref=db.backref('subcategories', cascade='all, delete-orphan')
    )

    def to_dict(self):
        """Полная структура категории с подкатегориями"""
        return {
            "id": self.id,
            "name": self.name,
            "parent_id": self.parent_id,
            "subcategories": [s.to_dict_basic() for s in self.subcategories]
        }

    def to_dict_basic(self):
        """Краткая структура категории"""
        return {"id": self.id, "name": self.name}


class MenuItem(db.Model):
    __tablename__ = 'menu_items'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, default='')
    price = db.Column(db.Float, nullable=False, default=0.0)
    image_url = db.Column(db.String(300), default='')
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)

    category = db.relationship('Category', backref=db.backref('menu_items', cascade='all, delete-orphan'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Для фронта (JSON-ответ)"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "image_url": self.image_url,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "parent_category": self.category.parent.name if self.category and self.category.parent else None,
            "subcategory": self.category.name if self.category and self.category.parent else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
