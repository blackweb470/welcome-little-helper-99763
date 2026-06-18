import urllib.request
import json
import re
import csv
from collections import Counter
from html.parser import HTMLParser
import sys

# Standard English stop words to filter out
STOP_WORDS = set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
    "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
    "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", 
    "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
    "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
    "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", 
    "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", 
    "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", 
    "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", 
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", 
    "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
])

class SEOHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_description = ""
        self.h1_tags = []
        self.h2_tags = []
        self.h3_tags = []
        self.text_content = []
        
        self._current_tag = ""
        self._in_title = False
        self._in_h1 = False
        self._in_h2 = False
        self._in_h3 = False
        self._in_script_or_style = False

    def handle_starttag(self, tag, attrs):
        self._current_tag = tag
        if tag == "title":
            self._in_title = True
        elif tag == "h1":
            self._in_h1 = True
        elif tag == "h2":
            self._in_h2 = True
        elif tag == "h3":
            self._in_h3 = True
        elif tag in ["script", "style"]:
            self._in_script_or_style = True
            
        if tag == "meta":
            attrs_dict = dict(attrs)
            if attrs_dict.get("name", "").lower() == "description":
                self.meta_description = attrs_dict.get("content", "")

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False
        elif tag == "h2":
            self._in_h2 = False
        elif tag == "h3":
            self._in_h3 = False
        elif tag in ["script", "style"]:
            self._in_script_or_style = False

    def handle_data(self, data):
        text = data.strip()
        if not text or self._in_script_or_style:
            return
            
        if self._in_title:
            self.title += text + " "
        elif self._in_h1:
            self.h1_tags.append(text)
        elif self._in_h2:
            self.h2_tags.append(text)
        elif self._in_h3:
            self.h3_tags.append(text)
            
        # Collect all visible text for keyword analysis
        self.text_content.append(text)

def clean_and_tokenize(text):
    # Remove punctuation and convert to lowercase
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    # Split into words
    words = text.split()
    # Filter out stop words and short words
    return [w for w in words if w not in STOP_WORDS and len(w) > 2]

def get_ngrams(words, n):
    ngrams = []
    for i in range(len(words) - n + 1):
        ngrams.append(" ".join(words[i:i+n]))
    return ngrams

def analyze_url(url):
    print(f"\nAnalyzing {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
        parser = SEOHTMLParser()
        parser.feed(html)
        
        # Keyword Analysis
        full_text = " ".join(parser.text_content)
        words = clean_and_tokenize(full_text)
        
        single_words = Counter(words).most_common(15)
        bigrams = Counter(get_ngrams(words, 2)).most_common(15)
        trigrams = Counter(get_ngrams(words, 3)).most_common(10)
        
        return {
            "url": url,
            "title": parser.title.strip(),
            "description": parser.meta_description,
            "h1": parser.h1_tags,
            "h2_count": len(parser.h2_tags),
            "top_words": single_words,
            "top_phrases": bigrams,
            "top_long_phrases": trigrams
        }
    except Exception as e:
        print(f"❌ Error analyzing {url}: {e}")
        return None

def generate_report(results):
    report_path = "seo_competitor_analysis.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# 🕵️ Enterprise SEO Competitor Analysis\n\n")
        f.write("This report extracts the underlying keyword strategies of competitors so you can embed them into LYQN.\n\n")
        
        for res in results:
            if not res: continue
            
            f.write(f"## Target: {res['url']}\n")
            f.write(f"**Title Tag:** `{res['title']}`\n\n")
            f.write(f"**Meta Description:** `{res['description']}`\n\n")
            
            f.write("**Primary Headings (H1):**\n")
            for h1 in res['h1']:
                f.write(f"- {h1}\n")
            f.write(f"\n*(Found {res['h2_count']} H2 subheadings)*\n\n")
            
            f.write("### 🔑 Keyword Density & Strategy\n")
            f.write("By analyzing all paragraph text, these are the exact phrases they are optimizing for:\n\n")
            
            f.write("**Top Single Keywords:**\n")
            for word, count in res['top_words']:
                f.write(f"- `{word}` (used {count} times)\n")
                
            f.write("\n**Top 2-Word Phrases (Bigrams):**\n")
            for phrase, count in res['top_phrases']:
                f.write(f"- `{phrase}` (used {count} times)\n")
                
            f.write("\n**Top 3-Word Phrases (Trigrams):**\n")
            for phrase, count in res['top_long_phrases']:
                f.write(f"- `{phrase}` (used {count} times)\n")
                
            f.write("\n---\n\n")
            
    print(f"\nReport generated successfully: {report_path}")

if __name__ == "__main__":
    print("Welcome to the LYQN Enterprise SEO Python Suite!")
    print("This tool will scrape competitor websites and reverse-engineer their SEO strategy.")
    print("Enter competitor URLs separated by commas (e.g., https://intercom.com, https://drift.com)")
    
    # Check if URLs were passed as arguments
    if len(sys.argv) > 1:
        urls_input = sys.argv[1]
    else:
        urls_input = input("\nEnter URLs: ")
        
    urls = [url.strip() for url in urls_input.split(",") if url.strip()]
    
    if not urls:
        print("No URLs provided. Exiting.")
        sys.exit()
        
    results = []
    for url in urls:
        if not url.startswith("http"):
            url = "https://" + url
        res = analyze_url(url)
        results.append(res)
        
    generate_report(results)
    print("Next Step: Review the markdown file and integrate these high-frequency phrases into LYQN's React Helmet tags and landing pages.")
