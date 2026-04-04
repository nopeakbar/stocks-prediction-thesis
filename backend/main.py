from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import os
import numpy as np

app = FastAPI()

# Izinin frontend buat narik data tanpa kena block CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Nanti ganti sama URL Vercel lu kalau udah rilis
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

all_models_data = {}

def convert_to_list(data):
    """Konversi numpy array ke list supaya bisa dikirim format JSON"""
    if isinstance(data, np.ndarray):
        return data.flatten().tolist()
    elif isinstance(data, dict):
        return {k: convert_to_list(v) for k, v in data.items()}
    return data

@app.on_event("startup")
def load_all_models():
    # List ke-10 folder sesuai dengan yang lu punya
    folders = [
        'A_B_models', 'C_models', 'D_models', 'E_models', 
        'F_models', 'G_models', 'H_models', 'I_models', 'J_models'
    ]
    
    base_path = './' 
    
    for folder in folders:
        folder_path = os.path.join(base_path, folder)
        if not os.path.exists(folder_path):
            continue
            
        all_models_data[folder] = {}
        
        for file in os.listdir(folder_path):
            # Cuma ambil file results berformat .pkl biar ringan
            if file.endswith('.pkl') and 'results' in file:
                file_path = os.path.join(folder_path, file)
                try:
                    with open(file_path, 'rb') as f:
                        raw_data = pickle.load(f)
                        key_name = file.replace('.pkl', '')
                        all_models_data[folder][key_name] = convert_to_list(raw_data)
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")

@app.get("/api/models")
def get_all_models_data():
    """Endpoint untuk diambil oleh web portofolio"""
    return {
        "status": "success",
        "data": all_models_data
    }