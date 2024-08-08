# **Roamify Extension**
## _Changing the Way World Travels_

[![Python 3.6+](https://img.shields.io/badge/python-3.6+-blue.svg)](https://www.python.org/downloads/release/python-360/)
[![PyTorch](https://img.shields.io/badge/pytorch-1.8.1-red.svg?logo=pytorch)](https://pytorch.org/)
[![Django](https://img.shields.io/badge/Django-5.0.6-blue.svg)](https://github.com/django/django)
[![gunicorn](https://img.shields.io/badge/gunicorn-22.0.0-blue.svg)](https://github.com/benoitc/gunicorn)
[![Hugging Face](https://img.shields.io/badge/huggingface-transformers-yellow.svg?logo=huggingface)](https://huggingface.co/transformers/)
[![Simple Transformers](https://img.shields.io/badge/simple-transformers-orange.svg)](https://simpletransformers.ai/)
[![CUDA](https://img.shields.io/badge/cuda-11.0-green.svg)](https://developer.nvidia.com/cuda-toolkit)

Welcome to the official repository of Roamify Chrome Extension. This repository contains the code and documentation for our innovative approach to providing personalized travel recommendations using a chrome extension.


## Table of Contents

- [Introduction](#introduction)
- [Directory Structure](#directory-structure)
- [Extension Objectives](#extension-objectives)
- [Citing This Work](#citing-this-work)
- [Acknowledgements](#acknowledgements)


## Introduction

Roamify aims to revolutionize the travel experience by leveraging the power of machine learning to provide personalized recommendations through a google chrome extension. 


## Directory Structure

```plaintext
Extension/
│
├── backend
│   ├── app
│   │   ├── routes
│   │   │   └── process.py
│   │   ├── utils
│   │   │   ├── bert_processing.py
│   │   │   ├── llama_processing.py
│   │   │   ├── nlp_process.py
│   │   │   ├── llama_processing.py
│   │   │   ├── pipeline_processing.py
│   │   │   ├── setup_pytorch_environment.py
│   │   │   ├── t5_processing.py
│   │   │   └── test.py
│   │   ├── __init__.py
│   │   └── config.py
│   ├── .env
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py
│
├── src
│   ├── assets
│   │   └── <icon>.svg
│   ├── scripts
│   │   ├── airport_dict.json
│   │   ├── background.js
│   │   ├── destination.js
│   │   ├── iata-icao-2.csv
│   │   ├── itinerary.js
│   │   ├── popup.js
│   │   ├── splash.js
│   │   └── transition.js
│   ├── styles
│   │   ├── itinerary.css
│   │   └── panel.css
│   ├── destination.html
│   ├── itinerary.html
│   ├── manifest.json
│   ├── options.html
│   └── panel.html
│
├── .gitignore
├── LICENSE
├── README.md
└── requirements.txt
```


## Extension Objectives

1. **User-Friendly and Minimal Design**: Ensure the extension is easy to use for individuals of all age groups by maintaining a clean and intuitive interface.
2. **Simplified Itinerary Creation**: Provide features that make it easier for users to create and manage travel itineraries with minimal effort.
3. **Real-Time Data Scraping**: Enable the extension to directly scrape data from the current Google tab to generate detailed and relevant itineraries.


## Citing This Work

If you use our work in your research or project, please cite it as follows:

```
@inproceedings{roamifyredefined2024,
  title={Roamify: Roaming Redefined},
  author={Vikranth Udandarao, Harsh Mistry, Muthuraj Vairamuthu, Noel Tiju, Armaan Singh, and Dhruv Kumar},
  year={2024},
  organization={IIIT Delhi, Computer Science Engineering Dept}
}
```

## Acknowledgements

We would like to thank our academic institution, [IIIT Delhi](https://iiitd.ac.in/), and our guide, [Dr. Dhruv Kumar](https://kudhru.github.io/) for their support and contributions to this research.

For more information on our research and publications, please visit our [Roamify Machine Learning repository](https://github.com/RoamifyRedefined/Machine-Learning).