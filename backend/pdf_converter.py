#!/usr/bin/env python3
"""
PDF to Web Content Converter
Converts PDF files to web-friendly HTML content for the learning platform.
"""

import os
import json
import pdfplumber
from pathlib import Path
from typing import List, Dict, Any
import re

class PDFToWebConverter:
    def __init__(self, pdf_path: str, output_dir: str = "converted_content"):
        self.pdf_path = pdf_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def extract_text_content(self) -> List[Dict[str, Any]]:
        """Extract text content from PDF and structure it for web display."""
        content_sections = []
        
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                print(f"Processing PDF with {len(pdf.pages)} pages...")
                
                for page_num, page in enumerate(pdf.pages, 1):
                    print(f"Processing page {page_num}...")
                    
                    # Extract text
                    text = page.extract_text()
                    if not text:
                        continue
                    
                    # Clean and structure the text
                    cleaned_text = self._clean_text(text)
                    
                    # Split into sections (you can customize this logic)
                    sections = self._split_into_sections(cleaned_text)
                    
                    for section in sections:
                        if section.strip():
                            content_sections.append({
                                "page": page_num,
                                "title": self._extract_title(section),
                                "content": section,
                                "type": "text",
                                "order": len(content_sections) + 1
                            })
                
                print(f"Extracted {len(content_sections)} content sections")
                return content_sections
                
        except Exception as e:
            print(f"Error processing PDF: {e}")
            return []
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove page numbers and headers/footers
        text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)
        # Clean up common PDF artifacts
        text = re.sub(r'[^\w\s.,!?;:()\-\[\]{}"\']+', '', text)
        return text.strip()
    
    def _split_into_sections(self, text: str) -> List[str]:
        """Split text into logical sections."""
        # Split by common section markers
        sections = re.split(r'\n\s*(?=[A-Z][a-z].*:|\d+\.\s+[A-Z])', text)
        return [s.strip() for s in sections if s.strip()]
    
    def _extract_title(self, text: str) -> str:
        """Extract a title from a text section."""
        lines = text.split('\n')
        for line in lines[:3]:  # Check first 3 lines
            if len(line) > 10 and len(line) < 100:
                return line.strip()
        return f"Section {len(text)}"
    
    def convert_to_web_format(self) -> Dict[str, Any]:
        """Convert PDF to web-friendly format."""
        print(f"Converting PDF: {self.pdf_path}")
        
        # Extract content
        content_sections = self.extract_text_content()
        
        if not content_sections:
            return {"error": "No content extracted from PDF"}
        
        # Create web-friendly structure
        web_content = {
            "title": "Forward Tipping Dumper - Learner Workbook",
            "description": "Digital version of the Forward Tipping Dumper learner workbook",
            "content_type": "web_content",
            "sections": content_sections,
            "total_sections": len(content_sections),
            "source_pdf": os.path.basename(self.pdf_path)
        }
        
        # Save to JSON file
        output_file = self.output_dir / "workbook_content.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(web_content, f, indent=2, ensure_ascii=False)
        
        print(f"Web content saved to: {output_file}")
        return web_content

def main():
    """Main function to convert the FTD workbook PDF."""
    pdf_path = "/Users/admin/OperatorSkillsHub/backend/uploads/courses/2_Learner Workbook FTD v4 June 2025.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"PDF file not found: {pdf_path}")
        return
    
    converter = PDFToWebConverter(pdf_path)
    result = converter.convert_to_web_format()
    
    if "error" not in result:
        print(f"✅ Successfully converted PDF to web format!")
        print(f"📊 Total sections: {result['total_sections']}")
        print(f"📁 Output directory: {converter.output_dir}")
    else:
        print(f"❌ Error: {result['error']}")

if __name__ == "__main__":
    main()



