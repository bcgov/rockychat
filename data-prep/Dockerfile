# Use an official Python runtime as a parent image
FROM python:3

# Set the working directory in the container
WORKDIR /app

# Install any needed packages specified in requirements.txt
COPY requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

# Install the Azure CLI
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Copy the current directory contents into the container at /app
COPY stackoverflow-csv-script.py website-html-parsing-script.py clone-tech-doc-repo.py /app
COPY azure-data-transformation-script.py /app
COPY data_preparation.py data_utils.py config.json /app
COPY all-scripts.sh /app

# Make port 80 available to the world outside this container
EXPOSE 80

# Run each script one by one
CMD ["./all-scripts.sh"]
