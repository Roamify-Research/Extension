from flask import Blueprint, request, jsonify
from app.models import User
from app.extensions import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Missing fields'}), 400

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 400

    user = User(name=name, username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        token = user.generate_token()
        return jsonify({'token': token, 'username': user.username, 'name': user.name}), 200

    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/auth/me', methods=['GET'])
def me():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Missing token'}), 401
    
    # Remove 'Bearer ' prefix if present
    if token.startswith('Bearer '):
        token = token.split(' ')[1]

    user = User.verify_token(token)
    if user:
        return jsonify({'username': user.username, 'email': user.email}), 200
    
    return jsonify({'error': 'Invalid token'}), 401
