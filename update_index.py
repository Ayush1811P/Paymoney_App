import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove desktop-nav
content = re.sub(r'<nav class="desktop-nav">.*?</nav>', '', content, flags=re.DOTALL)
# Remove hamburger-menu
content = re.sub(r'<div class="hamburger-menu">.*?</div>', '', content, flags=re.DOTALL)
# Remove mobile-menu
content = re.sub(r'<div class="mobile-menu">.*?</div>', '', content, flags=re.DOTALL)

# Add js/utils.js
content = content.replace('<script src="js/main.js"></script>', '<script src="js/utils.js"></script>\n  <script src="js/main.js"></script>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated index.html")
