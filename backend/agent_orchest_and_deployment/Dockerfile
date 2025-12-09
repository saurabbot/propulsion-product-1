FROM debian:bookworm-slim

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /cortex

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --break-system-packages -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV HF_HOME=/opt/huggingface

# Download model files
RUN python3 main.py download-files

# Ensure permissions
RUN chmod -R 777 /opt/huggingface

# Expose port
EXPOSE 8081

# Set environment variables (Injected for deployment fix)

CMD ["python3", "main.py", "start"]