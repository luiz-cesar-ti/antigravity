
import base64
import re
import os

# Define paths
ts_file_path = r'src/components/TermDocumentLogo.ts'
output_image_path = r'public/logo-objetivo.jpg'

print(f"Reading from {ts_file_path}...")

try:
    with open(ts_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the base64 string
    match = re.search(r"export const LOGO_BASE64 = '(.*?)';", content)
    if match:
        base64_string = match.group(1)
        
        # Remove data:image/jpeg;base64, prefix if present
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,")[1]
        
        # Decode and write
        img_data = base64.b64decode(base64_string)
        
        with open(output_image_path, 'wb') as f:
            f.write(img_data)
        
        print(f"Successfully restored {output_image_path}")
        print(f"New file size: {os.path.getsize(output_image_path)} bytes")
    else:
        print("Could not find Base64 string in the source file.")

except Exception as e:
    print(f"Error: {e}")
