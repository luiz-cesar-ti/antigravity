from PIL import Image, ImageOps

# Config
BLUE_COLOR = "#0047AB"
OUTPUT_SIZE = (512, 512)
LOGO_PATH = "public/logo-objetivo.png"
OUTPUT_PATH = "public/pwa-icon.png"

def create_icon():
    try:
        # Create solid blue square
        icon = Image.new("RGBA", OUTPUT_SIZE, BLUE_COLOR)
        
        # Open logo
        logo = Image.open(LOGO_PATH).convert("RGBA")
        
        # The logo likely has the symbol on the left and text on the right.
        # We need to crop the symbol.
        # Let's assume the symbol is roughly the height of the image, and square-ish.
        # We'll traverse from the left to find the content, and stop before the text starts.
        # Or simpler: Split current logo into r,g,b,a. access the alpha channel.
        # Find the bounding box of the non-transparent pixels? 
        # But that includes text.
        
        # Harder heuristic: The symbol is usually separated from text by a gap.
        # Let's crop the left 40% of the image first?
        # Let's rely on the user's "symbol only" request.
        
        # Standard approach for this logo: Symbol is roughly square on the left.
        # Let's try to crop the bounding box of the LEFTMOST object.
        
        # 1. Get alpha channel
        alpha = logo.split()[3]
        bbox = alpha.getbbox() # (left, top, right, bottom)
        
        if bbox:
            # Crop to content first
            content = logo.crop(bbox)
            
            # Now we have [Symbol] [Space] [Text]
            # We want just [Symbol].
            # Let's look for a vertical gap in the alpha channel?
            
            # Simple heuristic: Crop the first square area (left-most squared based on height).
            # If height is H, crop width H?
            h = content.height
            # Usually symbol aspect ratio is 1:1 or slightly wider.
            # Let's try cropping width = height * 1.2 (heuristic)
            # Better: let's scan columns.
            
            # Let's just crop the image to be square from the left!
            # If the original logo is wide (e.g. 400x100), cropping 100x100 from left gets the symbol.
            
            crop_width = content.height * 1.0 # Assume symbol is roughly square
            symbol = content.crop((0, 0, int(crop_width * 1.3), content.height))
            
            # Now resize this symbol to fit in the icon
            # 80% of icon width
            target_width = int(OUTPUT_SIZE[0] * 0.7)
            ratio = target_width / float(symbol.width)
            target_height = int(symbol.height * ratio)
            
            symbol_resized = symbol.resize((target_width, target_height), Image.Resampling.LANCZOS)
            
            # Create a white mask for the symbol (since we want it white)
            # Extract alpha from resized symbol
            sym_alpha = symbol_resized.split()[3]
            
            # Create white layer
            white_layer = Image.new("RGBA", symbol_resized.size, "white")
            
            # Center it
            pos_x = (OUTPUT_SIZE[0] - target_width) // 2
            pos_y = (OUTPUT_SIZE[1] - target_height) // 2
            
            # Paste white logo onto blue background
            icon.paste(white_layer, (pos_x, pos_y), mask=sym_alpha)
            
            icon.save(OUTPUT_PATH, "PNG")
            print(f"Icon created successfully at {OUTPUT_PATH}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_icon()
