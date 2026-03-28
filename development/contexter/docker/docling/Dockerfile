FROM quay.io/docling-project/docling-serve:latest

# Install Tesseract OCR with English and Russian language data
# The upstream image is Debian/Ubuntu-based — use apt-get
# If the base is Alpine, replace with:
#   apk add --no-cache tesseract-ocr tesseract-ocr-data-eng tesseract-ocr-data-rus
# Verify base OS: docker run --rm quay.io/docling-project/docling-serve:latest cat /etc/os-release
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      tesseract-ocr \
      tesseract-ocr-eng \
      tesseract-ocr-rus && \
    rm -rf /var/lib/apt/lists/*

USER docling
