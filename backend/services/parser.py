import PyPDF2
import docx
import io
from fastapi import UploadFile

async def extract_text_from_file(file: UploadFile) -> str:
    """Извлекает текст из PDF или DOCX"""
    content = await file.read()
    
    if file.filename.endswith('.pdf'):
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ''
        for page in reader.pages:
            page_text = page.extract_text() or ''
            text += page_text
        return text
    
    elif file.filename.endswith('.docx'):
        doc = docx.Document(io.BytesIO(content))
        text = '\n'.join([para.text for para in doc.paragraphs])
        return text
    
    raise ValueError("Поддерживаются только PDF и DOCX")
