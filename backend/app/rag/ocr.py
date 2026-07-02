# backend/app/rag/ocr.py
import os
import fitz
import pandas as pd
import pytesseract
from pypdf import PdfReader
from docx import Document
from PIL import Image

from .log import logger


class DocumentProcessor:
    """A comprehensive class to handle multi-format document text extraction,
    including fallback OCR processing for scanned PDFs.
    """

    def __init__(
        self,
        tesseract_cmd: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        default_folder: str = "data/pdfs",
    ):
        self.default_folder = default_folder
        # Set the Tesseract executable path dynamically
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def ocr_pdf_page(self, page) -> str:
        """Converts a PDF page into an image and processes it via Tesseract OCR."""
        pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
        img = Image.frombytes(
            "RGB", [pix.width, pix.height], pix.samples
        )
        return pytesseract.image_to_string(img, lang="eng", config="--psm 6")

    def extract_text_from_pdf(self, file_path: str) -> list:
        """Extracts text using standard PyPDF text extraction."""
        reader = PdfReader(file_path)
        pages = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                pages.append({
                    "text": page_text.strip(),
                    "page": index + 1
                })
        return pages

    def extract_text_from_scanned_pdf(self, file_path: str) -> list:
        """Fallback extraction using fitz and Tesseract OCR for scanned text PDFs."""
        doc = fitz.open(file_path)
        pages = []
        try:
            for page in doc:
                logger.info(f"OCR running on page {page.number + 1}")
                ocr_text = self.ocr_pdf_page(page)
                if ocr_text and ocr_text.strip():
                    pages.append({
                        "text": ocr_text.strip(),
                        "page": page.number + 1
                    })
            return pages
        finally:
            doc.close()

    def extract_text_from_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        return "\n".join(para.text for para in doc.paragraphs)

    def extract_text_from_csv(self, file_path: str) -> str:
        df = pd.read_csv(file_path)
        return df.to_string(index=False)

    def extract_text_from_excel(self, file_path: str) -> str:
        df = pd.read_excel(file_path)
        return df.to_string(index=False)

    def extract_text_from_txt(self, file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def process_document(self, file_path: str) -> list:
        """Determines the file format and extracts text accordingly."""
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            logger.info(f"Processing PDF: {file_path}")
            pages = self.extract_text_from_pdf(file_path)
            if not pages:
                logger.info("No text found. Running OCR...")
                pages = self.extract_text_from_scanned_pdf(file_path)
            return pages

        elif ext == ".docx":
            logger.info(f"Processing DOCX: {file_path}")
            text = self.extract_text_from_docx(file_path)
            return [{"text": text, "page": 1}]

        elif ext == ".csv":
            logger.info(f"Processing CSV: {file_path}")
            text = self.extract_text_from_csv(file_path)
            return [{"text": text, "page": 1}]

        elif ext in [".xlsx", ".xls"]:
            logger.info(f"Processing Excel: {file_path}")
            text = self.extract_text_from_excel(file_path)
            return [{"text": text, "page": 1}]

        elif ext == ".txt":
            logger.info(f"Processing TXT: {file_path}")
            text = self.extract_text_from_txt(file_path)
            return [{"text": text, "page": 1}]

        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def load_all_documents(self, folder_path: str = None) -> list:
        """Scans a directory and parses all valid files found within it."""
        target_folder = folder_path or self.default_folder
        documents = []

        if not os.path.exists(target_folder):
            logger.error(f"Target folder missing: {target_folder}")
            return documents

        for file in os.listdir(target_folder):
            file_path = os.path.join(target_folder, file)
            if not os.path.isfile(file_path):
                continue

            try:
                pages = self.process_document(file_path)
                for p in pages:
                    documents.append({
                        "source": file,
                        "text": p["text"],
                        "page": p["page"]
                    })
                logger.info(f"Processed {file} ({len(pages)} pages)")
            except Exception as e:
                logger.error(f"Failed {file}: {e}")

        return documents


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_processor = DocumentProcessor()
ocr_pdf_page = _processor.ocr_pdf_page
extract_text_from_pdf = _processor.extract_text_from_pdf
extract_text_from_scanned_pdf = _processor.extract_text_from_scanned_pdf
extract_text_from_docx = _processor.extract_text_from_docx
extract_text_from_csv = _processor.extract_text_from_csv
extract_text_from_excel = _processor.extract_text_from_excel
extract_text_from_txt = _processor.extract_text_from_txt
process_document = _processor.process_document
load_all_documents = _processor.load_all_documents


if __name__ == "__main__":
    # Example usage:
    processor = DocumentProcessor()
    docs = processor.load_all_documents()