# This is the script to create metadata JSONL file, for the digital.gov.bc.ca website html exports
# Reference: https://cloud.google.com/dialogflow/vertex/docs/concept/data-store#with-metadata

import os
import sys
import json
import re

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

# main
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 website-html-script.py <html_directory_path> <output_file_path>")
        sys.exit(1)
    directory = sys.argv[1]
    output_file = sys.argv[2]

    print(f"sourcing from {directory}, and output to {output_file}")
    json_lines = generate_json_lines(directory)

    with open(output_file, "w") as f:
        f.write('\n'.join(json_lines))

