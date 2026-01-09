import json

try:
    with open('lint_results.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    with open('unused_vars_report.txt', 'w', encoding='utf-8') as out:
        for file_result in data:
            file_path = file_result.get('filePath')
            for msg in file_result.get('messages', []):
                if msg.get('ruleId') == '@typescript-eslint/no-unused-vars' or msg.get('ruleId') == 'no-unused-vars':
                    out.write(f"{file_path}:{msg.get('line')}:{msg.get('message')}\n")
                
                # Also check for SUPABASE_ANON_KEY specifically
                if 'SUPABASE_ANON_KEY' in msg.get('message', ''):
                     out.write(f"KEY_ISSUE:{file_path}:{msg.get('line')}:{msg.get('message')}\n")

except Exception as e:
    print(f"Error: {e}")
