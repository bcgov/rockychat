# This is does the following:
# - fetch HTML files from a website
# - parse the html file and removes header footers and style blocks
# - create metadata JSONL file, for the digital.gov.bc.ca website html exports
# Reference: https://cloud.google.com/dialogflow/vertex/docs/concept/data-store#with-metadata

import os
import sys
import json
import subprocess
import re
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

# def clean_title(title):
#     # Remove special ASCII characters
#     cleaned_title = re.sub(r'[^\x00-\x7F]+', '', title)
#     return cleaned_title.strip()

# Get page title and URL from the HTML headers:
def extract_metadata(html_file):
    metadata = {}
    with open(html_file, "r", encoding="utf-8") as f:
        for line in f:
            # Extract canonical URL
            match_canonical = re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', line)
            if match_canonical and not metadata.get("url"):
                metadata["url"] = match_canonical.group(1)

            # Extract page title
            match_title = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', line)
            if match_title and not metadata.get("title"):
                metadata["title"] = match_title.group(1)

            # Break if both URL and title are found
            if metadata.get("url") and metadata.get("title"):
                break
    return metadata

# Setup JSONL with unique ID and Cloud Storage file path:
def generate_json_lines(directory):
    json_lines = []
    id_counter = 1
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".html"):
                # first generate a unique ID, in the format of d001:
                unique_id = "d{:03d}".format(id_counter)

                # get the path to the HTML file:
                html_file_path = os.path.join(root, file)

                # Convert to URI of document in GCP Cloud Storage
                url = os.path.relpath(html_file_path, directory)
                file_url = "gs://" + url.replace("\\", "/")  # starts with gs://
                content = {"mimeType": "text/html", "uri": file_url}

                # collect the page title and URL:
                metadata = extract_metadata(html_file_path)

                # Example: {"id": "d001", "content": {"mimeType": "text/html", "uri": "gs://digital-website/cloud/services/index.html"}, "structData": {"title": "Learn about cloud services available in the B.C. government.", "url": "https://digital.gov.bc.ca/cloud/services/"}}
                json_lines.append(json.dumps({"id": unique_id, "content": content, "structData": metadata}))

                id_counter += 1
                
    return json_lines

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python website-html-parsing-script.py <download_directory> <output_directory> <output_metadata_file>")
        sys.exit(1)
    
    download_directory = sys.argv[1]
    output_directory = sys.argv[2]
    output_metadata_file = sys.argv[3]

    # Access the environment variable
    if 'DIGITAL_WEBSITE_URL' in os.environ and 'DIGITAL_WEBSITE_SESSION_TOKEN' in os.environ:
        website_url = os.environ.get("DIGITAL_WEBSITE_URL")
        session_token = os.environ.get("DIGITAL_WEBSITE_SESSION_TOKEN")

        print(f"Sourcing from {website_url}")
    
    else:
        print("Missing env var!")
        sys.exit(1)


    # Download the website
    print(f"Fetching data from {website_url}, output to {download_directory}")
    download_website(website_url, download_directory, session_token)
    
    # Process the downloaded HTML files
    print(f"Parsing file from {download_directory}, output to {output_directory}")
    process_html_files(download_directory, output_directory)

    print(f"sourcing file from {output_directory}, and output metadata to {output_metadata_file}")
    json_lines = generate_json_lines(output_directory)

    with open(output_metadata_file, "w") as f:
        f.write('\n'.join(json_lines))
