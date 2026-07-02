# backend/app/rag/text_splitter.py
import os
import hashlib
import pandas as pd
from docx import Document

from .pdf_loader import extract_text_from_pdf
from .log import logger


class DocumentSplitter:
    """A class to handle loading, hashing, and splitting of documents into text chunks."""

    def __init__(
        self,
        data_folder: str = "data",
        chunk_size: int = 1000,
        chunk_overlap: int = 100
    ):
        self.data_folder = data_folder
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def calculate_file_hash(self, file_path: str) -> str:
        """Calculates SHA-256 hash of a file's contents."""
        sha256 = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                while chunk := f.read(8192):
                    sha256.update(chunk)
            return sha256.hexdigest()
        except Exception as e:
            logger.error(f"Error hashing file {file_path}: {e}")
            return ""

    def load_file(self, file_path: str) -> list:
        """Loads a file based on its extension and returns text content per page."""
        ext = os.path.splitext(file_path)[1].lower()

        try:
            logger.info(f"Loading: {file_path}")

            if ext == ".pdf":
                pages = extract_text_from_pdf(file_path)
                # If it returned a single string (fallback), wrap it
                if isinstance(pages, str):
                    return [{"text": pages, "page": 1}]
                return pages

            elif ext == ".csv":
                df = pd.read_csv(file_path)
                text = df.to_string(index=False)
                return [{"text": text, "page": 1}]

            elif ext in [".xlsx", ".xls"]:
                df = pd.read_excel(file_path)
                text = df.to_string(index=False)
                return [{"text": text, "page": 1}]

            elif ext == ".docx":
                doc = Document(file_path)
                text = "\n".join(para.text for para in doc.paragraphs)
                return [{"text": text, "page": 1}]

            elif ext == ".txt":
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
                return [{"text": text, "page": 1}]

            else:
                logger.warning(f"Unsupported File: {file_path}")
                return []

        except Exception as e:
            logger.error(f"Error Loading {file_path}: {e}")
            return []

    def recursive_split_text(
        self,
        text: str,
        chunk_size: int = None,
        chunk_overlap: int = None
    ) -> list:
        """Splits text content into chunks of specified size and overlap."""
        size = chunk_size or self.chunk_size
        overlap = chunk_overlap or self.chunk_overlap
        chunks = []
        start = 0

        while start < len(text):
            end = start + size
            chunk = text[start:end]
            chunks.append(chunk)
            start += (size - overlap)

        return chunks

    def split_documents(self, skip_hashes: set = None) -> list:
        """Walks through the data directory, loads files, hashes them, and splits them into chunks."""
        if skip_hashes is None:
            skip_hashes = set()

        all_chunks = []
        logger.info("Document Splitting Started")

        if not os.path.exists(self.data_folder):
            logger.error(f"{self.data_folder} not found")
            return []

        for root, dirs, files in os.walk(self.data_folder):
            for file in files:
                file_path = os.path.join(root, file)

                # Compute the SHA-256 hash of this file
                file_hash = self.calculate_file_hash(file_path)
                if not file_hash:
                    continue

                # Skip processing if we already indexed a file with this hash
                if file_hash in skip_hashes:
                    logger.info(f"File '{file}' (hash: {file_hash}) is already indexed. Skipping.")
                    continue

                logger.info(f"Processing: {file_path}")
                pages = self.load_file(file_path)

                if not pages:
                    logger.warning(f"No Text Found: {file}")
                    continue

                for p in pages:
                    page_text = p["text"]
                    page_no = p["page"]

                    chunks = self.recursive_split_text(
                        text=page_text,
                        chunk_size=self.chunk_size,
                        chunk_overlap=self.chunk_overlap
                    )

                    logger.info(f"{file} (Page {page_no}) -> {len(chunks)} chunks")

                    for chunk in chunks:
                        all_chunks.append({
                            "text": chunk,
                            "source": file,
                            "page": page_no,
                            "file_hash": file_hash  # Save hash with each chunk
                        })

        logger.info(f"Total Chunks: {len(all_chunks)}")
        return all_chunks


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_splitter = DocumentSplitter()
calculate_file_hash = _splitter.calculate_file_hash
load_file = _splitter.load_file
recursive_split_text = _splitter.recursive_split_text
split_documents = _splitter.split_documents