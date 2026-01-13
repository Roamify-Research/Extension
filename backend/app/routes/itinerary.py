from flask import Blueprint, request, jsonify
from app.models import Itinerary, User
from app.extensions import db
import json

itinerary_bp = Blueprint('itinerary', __name__)

@itinerary_bp.route('/itinerary/save', methods=['POST'])
def save_itinerary():
    # Expects token in headers for auth
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Missing token'}), 401
    
    if token.startswith('Bearer '):
        token = token.split(' ')[1]

    user = User.verify_token(token)
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 401

    data = request.get_json()
    destination = data.get('destination')
    content = data.get('content') # Should be the JSON object or string

    if not destination or not content:
        return jsonify({'error': 'Missing destination or content'}), 400

    # SQLAlchemy handles JSON serialization for db.JSON
    new_itinerary = Itinerary(user_id=user.id, destination=destination, content=content)
    db.session.add(new_itinerary)
    db.session.commit()

    return jsonify({'message': 'Itinerary saved successfully', 'id': new_itinerary.id}), 201

@itinerary_bp.route('/itinerary/list', methods=['GET'])
def list_itineraries():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Missing token'}), 401
    
    if token.startswith('Bearer '):
        token = token.split(' ')[1]

    user = User.verify_token(token)
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 401

    itineraries = Itinerary.query.filter_by(user_id=user.id).order_by(Itinerary.created_at.desc()).all()
    
    result = []
    for it in itineraries:
        result.append({
            'id': it.id,
            'destination': it.destination,
            'created_at': it.created_at.isoformat(),
            # We don't necessarily need to send full content for the list view, but we can
            # 'content': json.loads(it.content) 
        })

    return jsonify(result), 200

@itinerary_bp.route('/itinerary/<int:id>', methods=['GET'])
def get_itinerary(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Missing token'}), 401
    
    if token.startswith('Bearer '):
        token = token.split(' ')[1]

    user = User.verify_token(token)
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 401

    itinerary = Itinerary.query.get(id)
    if not itinerary:
        return jsonify({'error': 'Itinerary not found'}), 404
        
    if itinerary.user_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({
        'id': itinerary.id,
        'destination': itinerary.destination,
        'content': itinerary.content,
        'created_at': itinerary.created_at.isoformat()
    }), 200
