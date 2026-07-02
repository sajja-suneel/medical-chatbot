# backend/app/rag/pdf_loader.py
import os
import fitz
import pandas as pd
from docx import Document

from .log import logger
from app.rag.ocr import ocr_pdf_page


class DocumentProcessor:
    """A class to handle text extraction and processing from multiple file formats."""

    def __init__(self, default_folder: str = "data/pdfs"):
        self.default_folder = default_folder

    def _extract_from_pdf(self, file_path: str) -> list:
        doc = None
        try:
            doc = fitz.open(file_path)
            pages = []

            for page in doc:
                page_text = ""
                try:
                    # Try normal text extraction first
                    text = page.get_text("text")

                    if text and text.strip():
                        page_text = text
                    else:
                        logger.info(f"OCR running on page {page.number + 1}")
                        ocr_text = ocr_pdf_page(page)
                        page_text = ocr_text

                    if page_text.strip():
                        pages.append({
                            "text": page_text.strip(),
                            "page": page.number + 1
                        })

                except Exception as page_error:
                    logger.error(
                        f"Error processing page {page.number + 1}: {page_error}"
                    )

            return pages

        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            raise
        finally:
            if doc:
                doc.close()

    def _extract_from_docx(self, file_path: str) -> str:
        try:
            doc = Document(file_path)
            return "\n".join(para.text for para in doc.paragraphs)
        except Exception as e:
            logger.error(f"DOCX processing failed: {e}")
            raise

    def _extract_from_csv(self, file_path: str) -> str:
        try:
            df = pd.read_csv(file_path)
            return df.to_string(index=False)
        except Exception as e:
            logger.error(f"CSV processing failed: {e}")
            raise

    def _extract_from_excel(self, file_path: str) -> str:
        try:
            df = pd.read_excel(file_path)
            return df.to_string(index=False)
        except Exception as e:
            logger.error(f"Excel processing failed: {e}")
            raise

    def _extract_from_txt(self, file_path: str) -> str:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            logger.error(f"TXT processing failed: {e}")
            raise

    def process_document(self, file_path: str) -> list:
        """Determines the file extension and processes the document accordingly."""
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            logger.info(f"Processing PDF: {file_path}")
            return self._extract_from_pdf(file_path)

        elif ext == ".docx":
            logger.info(f"Processing DOCX: {file_path}")
            text = self._extract_from_docx(file_path)
            return [{"text": text, "page": 1}]

        elif ext == ".csv":
            logger.info(f"Processing CSV: {file_path}")
            text = self._extract_from_csv(file_path)
            return [{"text": text, "page": 1}]

        elif ext in [".xlsx", ".xls"]:
            logger.info(f"Processing Excel: {file_path}")
            text = self._extract_from_excel(file_path)
            return [{"text": text, "page": 1}]

        elif ext == ".txt":
            logger.info(f"Processing TXT: {file_path}")
            text = self._extract_from_txt(file_path)
            return [{"text": text, "page": 1}]

        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def load_all_documents(self, folder_path: str = None) -> list:
        """Iterates through a folder and processes all supported documents."""
        target_folder = folder_path or self.default_folder
        documents = []

        if not os.path.exists(target_folder):
            raise FileNotFoundError(f"Folder not found: {target_folder}")

        for file in os.listdir(target_folder):
            file_path = os.path.join(target_folder, file)

            if not os.path.isfile(file_path):
                continue

            try:
                pages = self.process_document(file_path)

                # Keep track of individual page metadata
                for p in pages:
                    documents.append({
                        "source": file,
                        "text": p["text"],
                        "page": p["page"]
                    })

                logger.info(f"Successfully processed: {file} ({len(pages)} pages)")

            except Exception as e:
                logger.error(f"Failed processing {file}: {e}")

        return documents


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_processor = DocumentProcessor()
extract_text_from_pdf = _processor.process_document
extract_text_from_docx = _processor._extract_from_docx
extract_text_from_csv = _processor._extract_from_csv
extract_text_from_excel = _processor._extract_from_excel
extract_text_from_txt = _processor._extract_from_txt
process_document = _processor.process_document
load_all_documents = _processor.load_all_documents


if __name__ == "__main__":
    docs = load_all_documents("data/pdfs")

    print(f"Total Document Pages: {len(docs)}")

    if docs:
        print(f"\nSource: {docs[0]['source']} | Page: {docs[0]['page']}")
        print("\nContent Preview:\n")
        print(docs[0]["text"][:1000])