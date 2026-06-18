import urllib.request
import urllib.parse
import sys

def ping_search_engines(sitemap_url):
    print(f"Pinging search engines with sitemap: {sitemap_url}\n")
    
    engines = {
        "Google": "http://www.google.com/ping?sitemap=",
        "Bing": "http://www.bing.com/ping?sitemap="
    }
    
    encoded_sitemap = urllib.parse.quote(sitemap_url)
    
    for engine, ping_url in engines.items():
        full_url = ping_url + encoded_sitemap
        try:
            req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                if response.getcode() == 200:
                    print(f"Successfully notified {engine}")
                else:
                    print(f"Warning: {engine} returned status code: {response.getcode()}")
        except Exception as e:
            print(f"Failed to notify {engine}: {e}")

if __name__ == "__main__":
    sitemap = "https://lyqn.app/sitemap.xml"
    
    if len(sys.argv) > 1:
        sitemap = sys.argv[1]
        
    ping_search_engines(sitemap)
    
    print("\nNOTE: Pinging tells search engines that your sitemap has changed.")
    print("For the absolute fastest indexing, you must also submit this sitemap directly within your Google Search Console dashboard.")
