# This does the following:
# - split the StackOverflow CSV file into individual txt files that:
#   - contains the question, answer, title
#   - named after the ID of the question for URL reference

import csv
import os
import sys

def split_csv_to_txt_files(csv_file_path, output_dir):
    # Read the CSV file
    with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        
        for row in csv_reader:
            # Extract relevant fields
            question = row['question']
            answer = row['answer']
            title = row['title']
            url = row['url']
            
            # Extract the unique identifier from the URL
            unique_id = url.rstrip('/').split('/')[-1]  # Get the last part of the URL
            
            # Generate the file name using the unique identifier
            file_name = f"{unique_id}.txt"
            file_path = os.path.join(output_dir, file_name)
            
            # Write to the text file
            with open(file_path, mode='w', encoding='utf-8') as txt_file:
                txt_file.write(f"Title: {title}\n")
                txt_file.write(f"Question: {question}\n")
                txt_file.write(f"Answer: {answer}\n")

    print(f"Text files created in the '{output_dir}' directory.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python azure-data-transformation-script.py <csv_file_path> <output_directory>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    output_directory = sys.argv[2]

    # Create the output directory if it doesn't exist
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    # split the CSV
    split_csv_to_txt_files(csv_file_path, output_directory)
