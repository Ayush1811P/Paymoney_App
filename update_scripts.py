import os, glob, re

for html_file in glob.glob('*.html'):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find the block of scripts
    pattern = r'(\s*<script src="js/utils\.js"></script>\s*<script src="js/[a-zA-Z0-9_]+\.js"></script>)\s*(<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2"></script>\s*<script src="js/supabaseClient\.js"></script>)'
    
    # Replace by swapping the two groups
    new_content = re.sub(pattern, r'\2\1', content)
    
    if new_content != content:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {html_file}')
