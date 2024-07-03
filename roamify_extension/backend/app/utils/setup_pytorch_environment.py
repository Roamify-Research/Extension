"""
This script sets up the PyTorch environment with CUDA support by:
1. Checking the CUDA device capability.
2. Installing the 'unsloth' package.
3. Installing additional dependencies based on the GPU version.
"""



# import torch
# major_version, minor_version = torch.cuda.get_device_capability()
# # Must install separately since Colab has torch 2.2.1, which breaks packages
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
# if major_version >= 8:
#     # Use this for new   GPUs like Ampere, Hopper GPUs (RTX 30xx, RTX 40xx, A100, H100, L40)
#     !pip install --no-deps packaging ninja einops flash-attn xformers trl peft accelerate bitsandbytes
# else:
#     # Use this for older GPUs (V100, Tesla T4, RTX 20xx)
#     !pip install --no-deps xformers trl peft accelerate bitsandbytes
# pass



import subprocess
import torch

# Get CUDA device capability
major_version, minor_version = torch.cuda.get_device_capability()

# Function to run shell commands
def run_command(command):
    result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
    return result.stdout

# Install unsloth package
run_command('pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"')

# Install additional packages based on GPU version
if major_version >= 8:
    # Use this for new GPUs like Ampere, Hopper GPUs (RTX 30xx, RTX 40xx, A100, H100, L40)
    run_command('pip install --no-deps packaging ninja einops flash-attn xformers trl peft accelerate bitsandbytes')
else:
    # Use this for older GPUs (V100, Tesla T4, RTX 20xx)
    run_command('pip install --no-deps xformers trl peft accelerate bitsandbytes')



# import torch
# if torch.cuda.is_available():
#     print(f"CUDA is available. Device: {torch.cuda.get_device_name(0)}")
# else:
#     print("CUDA is not available.")