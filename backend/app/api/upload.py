# backend/app/api/upload.py
import os
import re
from typing import List
from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile, Depends
from pydantic import BaseModel
from app.rag.vector_store import store_vectors, client, COLLECTION_NAME, create_collection
from app.utils.firebase_verifier import get_current_user
from qdrant_client.models import Filter, FieldCondition, MatchValue

router = APIRouter()
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".csv", ".xlsx", ".xls", ".txt"}

class URLScrapeRequest(BaseModel):
    url: str
    is_dynamic: bool = False

def run_rag_indexing():
    store_vectors()

@router.post("/index")
def index_documents(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    background_tasks.add_task(run_rag_indexing)
    return {"message": "RAG indexing started"}

@router.post("/scrape-url")
async def scrape_and_index_url(
    request: URLScrapeRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    url = request.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="Invalid URL protocol. Must start with http:// or https://"
        )

    try:
        from app.rag.scraper import WebScraper
        scraper = WebScraper()

        if request.is_dynamic:
            text_content = scraper.scrape_dynamic(url)
        else:
            text_content = scraper.scrape_static(url)

        if not text_content or len(text_content.strip()) < 20:
            raise HTTPException(
                status_code=400,
                detail="The scraped website did not return enough text content to index."
            )

        # Sanitize the URL to construct a clean file name
        clean_name = re.sub(r'[^a-zA-Z0-9]', '_', url.replace("https://", "").replace("http://", ""))[:60]
        filename = f"webpage_{clean_name}.txt"

        # Save webpage content locally in data folder
        pdf_dir = "data/pdfs"
        os.makedirs(pdf_dir, exist_ok=True)
        file_path = os.path.join(pdf_dir, filename)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(text_content)

        # Ingest text chunks into Qdrant vector database
        background_tasks.add_task(run_rag_indexing)

        return {
            "message": f"Successfully scraped and indexed website.",
            "filename": filename,
            "char_count": len(text_content)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to scrape webpage: {str(e)}"
        )

@router.post("/upload-files")
async def upload_multiple_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    for file in files:
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' is not allowed.")

    os.makedirs("data/pdfs", exist_ok=True)
    saved_files = []
    
    for file in files:
        file_path = os.path.join("data/pdfs", file.filename)
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        saved_files.append({"filename": file.filename, "content_type": file.content_type})

    background_tasks.add_task(run_rag_indexing)
    return {"message": "Files uploaded successfully.", "files": saved_files}

@router.get("/files")
def list_uploaded_files(current_user: dict = Depends(get_current_user)):
    pdf_dir = "data/pdfs"
    if not os.path.exists(pdf_dir):
        return []
    files_list = []
    for filename in os.listdir(pdf_dir):
        file_path = os.path.join(pdf_dir, filename)
        if os.path.isfile(file_path):
            files_list.append({"filename": filename, "size": os.path.getsize(file_path)})
    return files_list

@router.delete("/files/{filename}")
async def delete_single_file(filename: str, current_user: dict = Depends(get_current_user)):
    file_path = os.path.join("data/pdfs", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    try:
        os.remove(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    try:
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(must=[FieldCondition(key="source", match=MatchValue(value=filename))])
        )
    except Exception as e:
        print(f"Qdrant deletion failed: {e}")
    return {"message": "File deleted."}

@router.delete("/files")
async def delete_all_files(current_user: dict = Depends(get_current_user)):
    pdf_dir = "data/pdfs"
    if os.path.exists(pdf_dir):
        for filename in os.listdir(pdf_dir):
            file_path = os.path.join(pdf_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
    try:
        client.delete_collection(collection_name=COLLECTION_NAME)
        create_collection()
    except Exception as e:
        print(f"Qdrant wipe failed: {e}")
    return {"message": "Database cleared."}