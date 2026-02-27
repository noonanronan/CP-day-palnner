import os
from hmac import compare_digest
from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    password = data.get("password", "")
    expected = os.getenv("ADMIN_PASSWORD", "CenterParcs")
    if compare_digest(password, expected):
        return jsonify({"success": True}), 200
    return jsonify({"success": False, "error": "Invalid password"}), 401


@auth_bp.route("/")
def home():
    return "Flask app is running!"
