# This is the script to create a CSV file, containing questions and verified answers from BCGov StackOverflow

import requests
import json
import sys
import csv
import os

# Declare global variables:
API_BASE_URL="https://stackoverflow.developer.gov.bc.ca/api/2.3"
PAGE_SIZE=100
PAGE_NUMBER_TOTAL=4
count = 0

# Get questions via pagination:
def get_all_questions(API_KEY, tag=None):
    all_questions = []

    # Collect all questions, looping through ~400 questions with pagination
    for i in range(1, PAGE_NUMBER_TOTAL + 1):
    
        # Set the API URL with page
        api_url = f"{API_BASE_URL}/questions?page={i}&pagesize={PAGE_SIZE}&key={API_KEY}"
        # Check if the tag is not empty
        if tag:
            api_url += f"&tagged={tag}"

        # Fetch questions data from API
        response = requests.get(api_url)
        questions_data = response.json()["items"]
        
        all_questions.extend(questions_data)

    return all_questions

# Fetch questions data from API
def get_question_details(API_KEY, q_id):
    q_processed = []
    a_verified = []

    q_api_url = f"{API_BASE_URL}/questions/{q_id}?filter=withbody&key={API_KEY}"
    a_api_url = f"{API_BASE_URL}/questions/{q_id}/answers?filter=withbody&key={API_KEY}"

    q_response = requests.get(q_api_url)
    a_response = requests.get(a_api_url)
    
    if q_response.status_code == 200 and a_response.status_code == 200:
        try:
            # Assuming the response contains JSON data, body container HTML
            q_decoded = json.loads(q_response.content.decode('utf-8'))
            a_decoded = json.loads(a_response.content.decode('utf-8'))

            # Process the question here
            for item in q_decoded["items"]:
                q_processed.append(item.get("body"))

            # Process the answers here
            for item in a_decoded["items"]:
                # only use accepted answer for quality control
                if item.get("is_accepted") == True:
                  a_verified.append(item.get("body"))
            
            return [q_processed, a_verified]

        except json.JSONDecodeError:
          print(f"Failed to decode JSON response for question {question_id}")

    else:
        print(f"Failed to fetch answers for question {question_id}. Status code: {response.status_code}")


def save_to_csv(API_KEY, questions, csv_filename):

    with open(csv_filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["question", "answer", "title", "url"])

        for question in questions:

            q_id = question["question_id"]
            # print(q_id)
            # compose the item to CSV: "question","answer","title","url"
            q_title = question["title"]
            q_url = question["link"]
            q_processed, a_verified = get_question_details(API_KEY, q_id)

            writer.writerow([q_processed, a_verified, q_title, q_url])


# main
if __name__ == "__main__":
    # Access the environment variable
    if 'STACKOVERFLOW_API_TOKEN' in os.environ and 'CSV_OUTPUT_PATH' in os.environ and 'STACKOVERFLOW_TAG' in os.environ:
        API_KEY = os.environ.get("STACKOVERFLOW_API_TOKEN")
        output_file = os.environ.get("CSV_OUTPUT_PATH")
        question_tag = os.environ.get("STACKOVERFLOW_TAG")

        print(f"Output to {output_file}")
    
    else:
        print("Missing env var!")
        sys.exit(1)

    # Fetch all questions from StackOverflow
    print(f"Fetch -{question_tag}- questions from StackOverflow")

    if question_tag == "all":
        all_questions = get_all_questions(API_KEY)
    else:
        all_questions = get_all_questions(API_KEY, question_tag)
    
    print(f"Total questions captured: {len(all_questions)}")

    # Save questions and answers to CSV file
    print(f"Save questions and answers to CSV file at {output_file}")
    save_to_csv(API_KEY, all_questions, output_file)
