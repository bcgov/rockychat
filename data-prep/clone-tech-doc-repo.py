# This does the following:
# - git clone doc repo

import os
import sys
import shutil

if __name__ == "__main__":
    # Access the environment variable
    if 'TECH_DOC_REPO' in os.environ and 'TECH_DOC_OUTPUT_PATH' in os.environ:
        repo_url = os.environ.get("TECH_DOC_REPO")
        output_directory = os.environ.get("TECH_DOC_OUTPUT_PATH")

        print(f"Clone repo {repo_url}. Output to {output_directory}")
    
    else:
        print("Missing env var!")
        sys.exit(1)

    # Check if the folder exists
    if os.path.exists(output_directory):
        # Remove the existing folder
        shutil.rmtree(output_directory)

    # clone repo:
    os.system(f"git clone {repo_url} {output_directory}")
