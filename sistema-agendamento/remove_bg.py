from PIL import Image

def remove_white_background(input_path, output_path, tolerance=200):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Check if the pixel is close to white
        if item[0] > tolerance and item[1] > tolerance and item[2] > tolerance:
            newData.append((255, 255, 255, 0))  # Transparent
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

try:
    input_file = "c:/Users/luiz-/Desktop/PROJETO ANTIGRAVITY/sistema-agendamento/public/logo-full-blue.png"
    output_file = "c:/Users/luiz-/Desktop/PROJETO ANTIGRAVITY/sistema-agendamento/public/logo-full-blue-transparent.png"
    remove_white_background(input_file, output_file)
except Exception as e:
    print(f"Error: {e}")
