# Use an official Python runtime as a parent image
FROM python:3

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY stackoverflow-csv-script.py website-html-parsing-script.py /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir requests beautifulsoup4 lxml

# Make port 80 available to the world outside this container
EXPOSE 80

# Option 1: generate website export of Digital.gov.bc.ca

# Note that "digital-website" folder is required to match the data store structure from GCP
# Usage: python3 website-html-parsing-script.py <download_directory> <output_directory> <output_metadata_file>"
CMD ["python3", "website-html-parsing-script.py", "output/digital-website-original/", "output/digital-website", "output/html_files_metadata.jsonl"]

# Option 2: export StackOverflow content
# CMD ["python3", "stackoverflow-csv-script.py"]
