# Pakai image Python versi terbaru yang ringan
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy file requirements dan install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy semua file project lu (main.py dan folder model)
COPY . .

# Beri akses user (Syarat keamanan Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Pindah ke direktori home user
WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# Jalanin server FastAPI di port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]