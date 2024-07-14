# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set the working directory
WORKDIR /backend

# Copy the current directory contents into the container at /backend
COPY . /backend

# Install necessary packages
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
RUN pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
RUN pip install nltk spacy flask flask-cors transformers
RUN python -m spacy download en_core_web_sm
RUN pip install --no-deps packaging ninja einops xformers trl peft accelerate bitsandbytes python-dotenv

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variable
ENV FLASK_APP run.py
ENV FLASK_RUN_HOST 0.0.0.0

# Run app.py when the container launches
CMD ["flask", "run"]
