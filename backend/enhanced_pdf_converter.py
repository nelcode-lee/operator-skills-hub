#!/usr/bin/env python3
"""
Enhanced PDF to Web Content Converter
Converts PDF files to web-friendly content including both text and images.
"""

import os
import json
import pdfplumber
from PIL import Image
import base64
from io import BytesIO
import hashlib

def convert_pdf_to_web_content_with_images(pdf_path: str, output_dir: str = "converted_content"):
    """
    Converts a PDF file into a structured JSON format suitable for web display.
    Extracts both text content and images from each page.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Create images directory
    images_dir = os.path.join(output_dir, "images")
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)

    output_filename = os.path.join(output_dir, "workbook_content.json")
    
    web_content = {
        "title": "Forward Tipping Dumper - Learner Workbook",
        "description": "Digital version of the Forward Tipping Dumper learner workbook",
        "content_type": "web_content",
        "sections": [],
        "total_sections": 0,
        "source_pdf": os.path.basename(pdf_path)
    }

    print(f"Converting PDF: {pdf_path}")
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Processing PDF with {len(pdf.pages)} pages...")
            
            for i, page in enumerate(pdf.pages):
                print(f"Processing page {i + 1}...")
                
                # Extract text
                text = page.extract_text()
                
                # Extract images
                images = []
                if hasattr(page, 'images') and page.images:
                    for img_index, img in enumerate(page.images):
                        try:
                            # Extract image from PDF
                            img_obj = page.within_bbox(img)
                            img_data = img_obj.to_image()
                            
                            # Convert to PIL Image
                            pil_img = img_data.original
                            
                            # Generate filename
                            img_hash = hashlib.md5(f"page_{i+1}_img_{img_index}".encode()).hexdigest()[:8]
                            img_filename = f"page_{i+1}_img_{img_index}_{img_hash}.png"
                            img_path = os.path.join(images_dir, img_filename)
                            
                            # Save image
                            pil_img.save(img_path, "PNG")
                            
                            # Get image dimensions
                            width, height = pil_img.size
                            
                            # Add image info to section
                            images.append({
                                "filename": img_filename,
                                "path": f"images/{img_filename}",
                                "width": width,
                                "height": height,
                                "alt_text": f"Image from page {i+1}"
                            })
                            
                            print(f"  Extracted image: {img_filename} ({width}x{height})")
                            
                        except Exception as e:
                            print(f"  Error extracting image {img_index} from page {i+1}: {e}")
                            continue
                
                if not text:
                    continue
                
                # Clean up the text
                cleaned_text = text.strip()
                
                # Extract a meaningful title
                section_title = f"Page {i + 1}"
                lines = cleaned_text.split('\n')
                
                # Look for meaningful titles in the first few lines
                for line in lines[:5]:  # Check first 5 lines
                    line = line.strip()
                    if len(line) > 10 and len(line) < 100:
                        # Skip common headers/footers
                        if not any(skip in line.lower() for skip in ['learner workbook', 'page', 'of 50', 'ftd v4']):
                            section_title = line
                            break
                
                # If we found a good title, use it
                if section_title == f"Page {i + 1}":
                    # Try to find a better title from the content
                    for line in lines:
                        line = line.strip()
                        if len(line) > 15 and len(line) < 80:
                            if any(keyword in line.lower() for keyword in ['section', 'introduction', 'contents', 'glossary', 'safe', 'health', 'safety']):
                                section_title = line
                                break
                
                # Clean up the content - remove excessive whitespace and page numbers
                content_lines = []
                for line in lines:
                    line = line.strip()
                    if line and not line.endswith('Page') and 'Page' not in line:
                        content_lines.append(line)
                
                content = '\n'.join(content_lines)
                
                # Only add sections with meaningful content
                if len(content) > 50:  # Only include sections with substantial content
                    web_content["sections"].append({
                        "page": i + 1,
                        "title": section_title,
                        "content": content,
                        "images": images,
                        "type": "text",
                        "order": len(web_content["sections"]) + 1
                    })
            
            # Update total sections to actual count
            web_content["total_sections"] = len(web_content["sections"])
            
            with open(output_filename, 'w', encoding='utf-8') as f:
                json.dump(web_content, f, ensure_ascii=False, indent=2)
            
            print(f"Web content saved to: {output_filename}")
            print("✅ Successfully converted PDF to web format with images!")
            print(f"📊 Total sections: {web_content['total_sections']}")
            print(f"📁 Output directory: {output_dir}")
            print(f"🖼️  Images directory: {images_dir}")
            return output_filename
    except Exception as e:
        print(f"❌ Error converting PDF: {e}")
        return None

if __name__ == "__main__":
    # Example usage:
    pdf_file = "/Users/admin/OperatorSkillsHub/backend/uploads/courses/2_Learner Workbook FTD v4 June 2025.pdf"
    convert_pdf_to_web_content_with_images(pdf_file)



