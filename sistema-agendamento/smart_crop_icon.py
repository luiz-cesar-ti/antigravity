from PIL import Image
import sys

def analyze_and_crop():
    try:
        img = Image.open("public/logo-objetivo.png").convert("RGBA")
        width, height = img.size
        print(f"Original size: {width}x{height}")
        
        # Get alpha channel data
        alpha = img.split()[3]
        alpha_data = list(alpha.getdata())
        
        # Scan columns to find the gap
        # We look for a column that is completely transparent (or mostly), 
        # occurring after some content has been seen.
        
        has_started_content = False
        gap_start = -1
        
        # Threshold for considering a pixel "visible"
        ALPHA_THRESHOLD = 10
        
        content_ranges = [] # Stores (start_x, end_x) of solid content blocks
        
        in_content = False
        current_start = 0
        
        for x in range(width):
            is_column_empty = True
            for y in range(height):
                # get pixel alpha
                if alpha.getpixel((x, y)) > ALPHA_THRESHOLD:
                    is_column_empty = False
                    break
            
            if not in_content and not is_column_empty:
                in_content = True
                current_start = x
            elif in_content and is_column_empty:
                in_content = False
                content_ranges.append((current_start, x))
        
        if in_content:
            content_ranges.append((current_start, width))
            
        print(f"Detected content blocks (horizontal): {content_ranges}")
        
        if not content_ranges:
            print("No content found.")
            return

        # Smart Crop Logic:
        # The symbol is usually the first block if reading Left-to-Right.
        # Sometimes symbol is multiple 'parts' (like the fish arrows).
        # Let's assume the logo involves the first major block(s).
        # BUT: The 'fish' symbol might be seen as two blocks if there is a vertical gap in the design itself?
        # Visual check of logo: It's two arrows/circles. They might be connected or separate.
        # If separate, we might find 2 blocks for the symbol, then a big gap, then text.
        
        # Heuristic: The text is usually wide and on the right. The symbol is square-ish and on the left.
        # Let's take the first block(s) until we hit a "large" gap?
        # Or simply: Take the first block/group that forms a roughly square aspect ratio.
        
        # Let's crop just the FIRST DETECTED RANGE for now and check dimensions.
        # Ideally, we combine all ranges that are close to each other (gap < X pixels), 
        # and ignore the big block on the right (Text).
        
        # Let's define "Large Gap" as > 5% of width?
        # Or just take the first N ranges that make up a square-ish shape.
        
        # For 'Objetivo', the symbol is the "Fish". It is one cohesive visual element usually.
        # Let's try cropping everything up to the first LARGE gap (e.g. > 20px).
        
        consolidated_end = content_ranges[0][1]
        
        # Iterate ranges to see if we should merge them (symbol parts)
        # If gap between range[i] and range[i+1] is small, merge.
        # If gap is large, stop (assume rest is text).
        
        last_end = content_ranges[0][1]
        
        # Threshold for "Text Gap". Text usually starts significantly after.
        GAP_THRESHOLD = 20 
        
        symbol_end_x = last_end
        
        for i in range(1, len(content_ranges)):
            start = content_ranges[i][0]
            gap = start - last_end
            if gap > GAP_THRESHOLD:
                # Found the gap between Symbol and Text
                print(f"Found gap of {gap}px at x={last_end}. Assuming Text starts at {start}.")
                break
            else:
                symbol_end_x = content_ranges[i][1]
                last_end = symbol_end_x
                
        # Now we have the X range of the symbol: [content_ranges[0][0], symbol_end_x]
        start_x = content_ranges[0][0]
        end_x = symbol_end_x
        
        print(f"Cropping symbol from x={start_x} to x={end_x}")
        
        # Crop vertically too (trim top/bottom transparency)
        symbol_img_strip = img.crop((start_x, 0, end_x, height))
        bbox = symbol_img_strip.getbbox() # (target_left, target_top, target_right, target_bottom) within the strip
        
        final_symbol = symbol_img_strip.crop(bbox)
        print(f"Final symbol size: {final_symbol.size}")
        
        # NOW GENERATE THE ICON
        BLUE_COLOR = "#0047AB"
        OUTPUT_SIZE = (512, 512)
        
        icon = Image.new("RGBA", OUTPUT_SIZE, BLUE_COLOR)
        
        # Resize symbol to fit nicely (70% width)
        target_w = int(OUTPUT_SIZE[0] * 0.70)
        ratio = target_w / float(final_symbol.width)
        target_h = int(final_symbol.height * ratio)
        
        # if height is too tall, constrain by height instead
        if target_h > int(OUTPUT_SIZE[1] * 0.70):
             target_h = int(OUTPUT_SIZE[1] * 0.70)
             ratio = target_h / float(final_symbol.height)
             target_w = int(final_symbol.width * ratio)
             
        sym_resized = final_symbol.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Make white
        white_layer = Image.new("RGBA", sym_resized.size, "white")
        sym_alpha = sym_resized.split()[3]
        
        # Center
        pos_x = (OUTPUT_SIZE[0] - target_w) // 2
        pos_y = (OUTPUT_SIZE[1] - target_h) // 2
        
        icon.paste(white_layer, (pos_x, pos_y), mask=sym_alpha)
        icon.save("public/pwa-icon.png")
        print("Icon saved to public/pwa-icon.png")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_and_crop()
