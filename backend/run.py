from app import create_app
import os

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=os.getenv("FLASK_RUN_PORT", 5001), debug=True)
