from app import create_app
import os

app = create_app()

if __name__ == "__main__":
    app.run(port=os.getenv("FLASK_RUN_PORT", 5000))
