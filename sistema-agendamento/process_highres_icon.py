from PIL import Image
import os

# Config
BLUE_COLOR = "#0047AB"
OUTPUT_SIZE = (512, 512)
# We will detect the input path dynamically or hardcode if found
# Assuming found file is 'dist/objetivo-logo.png' or similar
OUTPUT_PATH = "public/pwa-icon.png"

def find_file():
    # Helper to find the file if exact name isn't known
    possible_roots = ["dist", "public", "."]
    for root in possible_roots:
        if os.path.exists(root):
            for f in os.listdir(root):
                if "objetivo-logo" in f:
                    return os.path.join(root, f)
    return None

def create_icon():
    try:
        source_path = find_file()
        if not source_path:
            print("Error: Could not find 'objetivo-logo' file.")
            return

        print(f"Processing source: {source_path}")
        img = Image.open(source_path).convert("RGBA")
        
        # 1. Crop the symbol logic
        # Assuming the symbol is the leftmost part.
        alpha = img.split()[3]
        bbox = alpha.getbbox() 
        if not bbox:
            print("Error: Empty image")
            return
            
        content = img.crop(bbox)
        
        # Analyze columns again to separate symbol from text if needed with high res
        # If the user downloaded an SVG -> PNG, it might rely on the same structure.
        # Let's verify if crop is needed. User said "apenas o simbolo".
        
        # Heuristic: Scan for the first vertical gap.
        width, height = content.size
        
        # Scan vertical columns for empty space
        alpha_content = content.split()[3]
        
        split_x = width # default to full width
        
        # Only scan if aspect ratio suggests text (width > height)
        if width > height * 1.2:
            gap_found = False
            consecutive_empty = 0
            for x in range(width):
                is_empty = True
                for y in range(height):
                    if alpha_content.getpixel((x, y)) > 10:
                        is_empty = False
                        break
                
                if is_empty:
                    consecutive_empty += 1
                    if consecutive_empty > (width * 0.02): # >2% width gap
                        split_x = x - consecutive_empty
                        print(f"Found gap at x={split_x}")
                        gap_found = True
                        break
                else:
                    consecutive_empty = 0
            
            if not gap_found:
                print("No clear gap found, using whole image (maybe it IS just the symbol?)")
        
        symbol = content.crop((0, 0, split_x, height))
        
        # 2. Trim the symbol
        symbol_bbox = symbol.getbbox()
        if symbol_bbox:
            symbol = symbol.crop(symbol_bbox)
            
        # 3. Create Icon
        icon = Image.new("RGBA", OUTPUT_SIZE, BLUE_COLOR)
        
        # Scaled to 80% (large)
        target_w = int(OUTPUT_SIZE[0] * 0.80)
        ratio = target_w / float(symbol.width)
        target_h = int(symbol.height * ratio)
        
        # Constrain height too
        if target_h > int(OUTPUT_SIZE[1] * 0.80):
             target_h = int(OUTPUT_SIZE[1] * 0.80)
             ratio = target_h / float(symbol.height)
             target_w = int(symbol.width * ratio)
             
        sym_resized = symbol.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Make white
        white_layer = Image.new("RGBA", sym_resized.size, "white")
        sym_alpha = sym_resized.split()[3]
        
        # Center
        pos_x = (OUTPUT_SIZE[0] - target_w) // 2
        pos_y = (OUTPUT_SIZE[1] - target_h) // 2
        
        icon.paste(white_layer, (pos_x, pos_y), mask=sym_alpha)
        icon.save(OUTPUT_PATH)
        print(f"Success! Icon saved to {OUTPUT_PATH}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_icon()
