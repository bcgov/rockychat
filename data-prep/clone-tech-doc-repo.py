# This does the following:
# - git clone doc repo

import os
import sys
import shutil

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python clone-tech-doc-repo.py <repo_url> <output_directory>")
        sys.exit(1)
    
    repo_url = sys.argv[1]
    output_directory = sys.argv[2]

    # Check if the folder exists
    if os.path.exists(output_directory):
        # Remove the existing folder
        shutil.rmtree(output_directory)

    # clone repo:
    os.system(f"git clone {repo_url} {output_directory}")
