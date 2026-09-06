import os
import glob
import re

html_files = glob.glob('*.html')

pattern = re.compile(r'<svg class="logo-icon-svg"[\s\S]*?</svg>')
replacement = '<img src="img/logo.png" alt="PayMoney Logo" class="logo-icon-img" style="height: 48px; object-fit: contain;">'

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub(replacement, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
