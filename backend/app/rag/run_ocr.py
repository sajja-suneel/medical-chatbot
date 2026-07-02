# backend/run_ocr.py
"""
Run PDF loading with smart OCR from the backend folder:

    python run_ocr.py
    python run_ocr.py data/pdfs/your_file.pdf
"""

import sys
from app.rag.pdf_loader import (
    load_all_documents,
    process_document,
)


class OCRRunner:
    """A runner class to execute document loading and OCR processing from the command line."""

    def __init__(self, default_folder: str = "data/pdfs"):
        self.default_folder = default_folder

    def run(self, args: list = None):
        """Runs the document extraction process based on command line arguments."""
        if args is None:
            args = sys.argv

        if len(args) > 1:
            file_path = args[1]
            # process_document returns a list of pages: [{"text": ..., "page": ...}]
            pages = process_document(file_path)

            total_chars = sum(len(p.get("text", "")) for p in pages)
            print(f"Total Pages: {len(pages)}")
            print(f"Total Characters: {total_chars}")
            print("\nPreview of Page 1:\n")
            if pages:
                print(pages[0]["text"][:1000])
            return

        docs = load_all_documents(self.default_folder)
        print(f"Total Pages Processed: {len(docs)}")

        if docs:
            print(f"\nSource: {docs[0]['source']} | Page: {docs[0]['page']}")
            print("\nContent Preview:\n")
            print(docs[0]["text"][:1000])


if __name__ == "__main__":
    runner = OCRRunner()
    runner.run()