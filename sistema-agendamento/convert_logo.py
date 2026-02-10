
import base64
import os

file_path = r"c:\Users\luiz-\Desktop\PROJETO ANTIGRAVITY\sistema-agendamento\public\logo-objetivo.jpg"
output_path = r"c:\Users\luiz-\Desktop\PROJETO ANTIGRAVITY\sistema-agendamento\logo_base64.txt"

try:
    with open(file_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    
    with open(output_path, "w") as text_file:
        text_file.write(f"data:image/jpeg;base64,{encoded_string}")
        
    print(f"Base64 saved to {output_path}")
except Exception as e:
    print(f"Error: {e}")
