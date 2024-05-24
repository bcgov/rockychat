# This is the script to parse the html file, which removes header footers and style blocks

import sys
import os
import subprocess
from bs4 import BeautifulSoup

def remove_header_footer(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')  # Use the built-in parser

    # Remove header
    if soup.header:
        soup.header.decompose()

    # Remove footer
    if soup.footer:
        soup.footer.decompose()

    # Remove CSS (inline and external)
    for style in soup.find_all('style'):
        style.decompose()
    for link in soup.find_all('link', {'rel': 'stylesheet'}):
        link.decompose()

    # Optionally, remove scripts if not needed
    for script in soup.find_all('script'):
        script.decompose()

    return str(soup)

# loop through all the HTML files
def process_html_files(input_directory, output_directory):
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
    
    for root, dirs, files in os.walk(input_directory):
        for filename in files:
            if filename.endswith(".html"):
                input_filepath = os.path.join(root, filename)
                # Constructing output directory structure
                relative_path = os.path.relpath(input_filepath, input_directory)
                output_root = os.path.join(output_directory, os.path.dirname(relative_path))
                output_filepath = os.path.join(output_root, filename)
                
                with open(input_filepath, 'r', encoding='utf-8') as file:
                    html_content = file.read()

                cleaned_html = remove_header_footer(html_content)

                # Create output directory if it doesn't exist
                os.makedirs(output_root, exist_ok=True)

                # Save cleaned HTML
                with open(output_filepath, 'w', encoding='utf-8') as file:
                    file.write(cleaned_html)

# wget the HTML files from website
def download_website(url, output_directory, session_token):
    subprocess.run([
        'wget', '--header', f'Cookie: {session_token}', 
        '--recursive', '--no-parent', '--html-extension', '--no-clobber', '--no-host-directories', 
        '--domains', 'digital.gov.bc.ca', 
        f'--directory-prefix={output_directory}', url
    ])

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python website-html-chunking.py <download_directory> <output_directory>")
        sys.exit(1)
    
    download_directory = sys.argv[1]
    output_directory = sys.argv[2]

    # Access the environment variable
    if 'DIGITAL_WEBSITE_URL' in os.environ and 'DIGITAL_WEBSITE_SESSION_TOKEN' in os.environ:
        website_url = os.environ.get("DIGITAL_WEBSITE_URL")
        session_token = os.environ.get("DIGITAL_WEBSITE_SESSION_TOKEN")

        print(f"Sourcing from {website_url}")
    
    else:
        print("Missing env var!")
        sys.exit(1)


    # Download the website
    download_website(website_url, download_directory, session_token)
    
    # Process the downloaded HTML files
    process_html_files(download_directory, output_directory)
