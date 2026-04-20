import re
import sys

file_path = "src/pages/admin/AdminDashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove from tabs array
content = re.sub(r"\{\s*id:\s*'integrations'.*?,\n", "", content)
content = re.sub(r"\{\s*id:\s*'newsletter'.*?,\n", "", content)
content = re.sub(r"\{\s*id:\s*'ai-intelligence'.*?,?\n?", "", content)

# 2. Remove AI related state declarations and functions
# seedBlogPosts block
content = re.sub(r"  const seedBlogPosts = async \(\) => \{.*?(?=\n  const fetchAnalytics = async)/s", "", content)

# generateNewsletter block
content = re.sub(r"  const generateNewsletter = async \(\) => \{.*?(?=\n  useEffect\(\(\) => \{)/s", "", content)

# API test functions
content = re.sub(r"  const testGeminiAPI = async \(\) => \{.*?(?=\n  const testTavilyAPI)/s", "", content)
content = re.sub(r"  const testTavilyAPI = async \(\) => \{.*?(?=\n  const compressImage)/s", "", content)
content = re.sub(r"  const testGroqAPI = async \(\) => \{.*?(?=\n  const testGeminiAPI)/s", "", content) # wait, groq is before gemini?
content = re.sub(r"  const testGroqAPI = async \(\) => \{.*?(?=\n  const testTavilyAPI)/s", "", content)
content = re.sub(r"  const testGeminiAPI = async \(\) => \{.*?(?=\n  const testGroqAPI)/s", "", content)

# Ensure all 3 test functions are removed gracefully by matching carefully
content = re.sub(r"  const testGeminiAPI = async \(\) => \{[\s\S]*?(?=\n  const [a-zA-Z]+ =)", "", content)
content = re.sub(r"  const testGroqAPI = async \(\) => \{[\s\S]*?(?=\n  const [a-zA-Z]+ =)", "", content)
content = re.sub(r"  const testTavilyAPI = async \(\) => \{[\s\S]*?(?=\n  const [a-zA-Z]+ =)", "", content)

# 3. Remove the Admin Frame sections
content = re.sub(r" *\{activeTab === 'integrations'.*?<\/motion\.div>\n *\)\}\n", "", content, flags=re.DOTALL)
content = re.sub(r" *\{activeTab === 'newsletter'.*?<\/motion\.div>\n *\)\}\n", "", content, flags=re.DOTALL)
content = re.sub(r" *\{activeTab === 'ai-intelligence'.*?<\/motion\.div>\n *\)\}\n", "", content, flags=re.DOTALL)

# 4. Remove seed button from Blog tab
content = re.sub(r" *<button className=\"add-btn\" style=\{\{ background: '#f59e0b' \}\} onClick=\{seedBlogPosts\}.*?<\/button>\n", "", content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Admin cleanup completed.")
