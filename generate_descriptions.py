import os
import subprocess
import json

DIGITAL_BOOKS_PATH = "/home/ganapathiraj/Code/AndroidDevelopment/SriBagavath/DigitalBooks"

def get_pdf_text(path, pages=3):
    try:
        result = subprocess.run(['pdftotext', '-f', '1', '-l', str(pages), path, '-'], capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        return str(e)

def process_books():
    books_data = []
    for root, dirs, files in os.walk(DIGITAL_BOOKS_PATH):
        for file in files:
            if file.endswith('.pdf'):
                path = os.path.join(root, file)
                category = "English Books" if "English" in root else "Tamil Books"
                text = get_pdf_text(path)
                
                # Basic cleaning
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                description = " ".join(lines[:100]) # First 100 non-empty lines as a proxy
                
                books_data.append({
                    "filename": file,
                    "category": category,
                    "sample_text": description[:1000] # Cap at 1000 chars
                })
    
    with open("books_info.json", "w", encoding="utf-8") as f:
        json.dump(books_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    process_books()
