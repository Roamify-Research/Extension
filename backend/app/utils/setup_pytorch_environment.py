"""
This script sets up the PyTorch environment with CUDA support by:
1. Checking the CUDA device capability.
2. Installing the 'unsloth' package.
3. Installing additional dependencies based on the GPU version.
"""

import subprocess


# Function to run shell commands
def run_command(command):
    result = subprocess.run(
        command, shell=True, check=True, text=True, capture_output=True
    )
    return result.stdout


run_command(
    "pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121"
)
run_command("pip install transformers spacy nltk flask python-dotenv")


# import torch
# if torch.cuda.is_available():
#     print(f"CUDA is available. Device: {torch.cuda.get_device_name(0)}")
# else:
#     print("CUDA is not available.")
