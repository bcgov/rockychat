# Use an official Python runtime as a parent image
FROM python:3

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY stackoverflow-csv-script.py website-html-script.py /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir requests

# Make port 80 available to the world outside this container
EXPOSE 80

CMD ["python3", "stackoverflow-csv-script.py"]
