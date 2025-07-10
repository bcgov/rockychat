# This does the following:
# - fetch questions and verified answers from GH discussion
# - save them into individual txt files that:
#   - contains the question, answer, title, url
#   - named after the ID of the question for URL reference

import requests
import os

def fetch_discussions(gh_token, repo_owner, repo_name):
    discussions = []
    cursor = None
    while True:
        query = """
        query ($owner: String!, $name: String!, $cursor: String) {
          repository(owner: $owner, name: $name) {
            discussions(first: 50, after: $cursor) {
              pageInfo {
                endCursor
                hasNextPage
              }
              nodes {
                id
                number
                title
                bodyText
                comments(first: 10) {
                  nodes {
                    bodyText
                    isAnswer
                  }
                }
              }
            }
          }
        }
        """

        variables = {
            "owner": repo_owner,
            "name": repo_name,
            "cursor": cursor
        }

        headers = {
            "Authorization": f"Bearer {gh_token}",
            "Accept": "application/vnd.github.v3+json"
        }

        response = requests.post(
            'https://api.github.com/graphql',
            json={"query": query, "variables": variables},
            headers=headers
        )
        response.raise_for_status()
        data = response.json()

        if "data" not in data or data["data"]["repository"] is None:
            print("Unexpected response:")
            print(data)
            return []

        repo_data = data["data"]["repository"]["discussions"]
        for discussion in repo_data["nodes"]:
            discussions.append(discussion)

        if not repo_data["pageInfo"]["hasNextPage"]:
            break
        cursor = repo_data["pageInfo"]["endCursor"]
    
    return discussions

def save_discussion_to_file(discussion, repo_owner, repo_name, output_directory):
    discussion_id = discussion["number"]
    title = discussion["title"]
    body = discussion["bodyText"]
    url = f"https://github.com/{repo_owner}/{repo_name}/discussions/{discussion_id}"
    
    # Get the top answer (marked as answer, or first comment)
    comments = discussion.get("comments", {}).get("nodes", [])
    verified_answer = ""
    for comment in comments:
        if comment.get("isAnswer"):
            verified_answer = comment.get("bodyText", "")
            break

    content = f"title:\n{title}\nquestion:\n{body}\nanswer:\n{verified_answer}\nurl:\n{url}"
    
    filename = os.path.join(output_directory, f"{discussion_id}.txt")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

# main
if __name__ == "__main__":
    # Access the environment variable
    if 'GITHUB_TOKEN' in os.environ and 'REPO_OWNER' in os.environ and 'REPO_NAME' in os.environ and 'GH_OUTPUT_PATH' in os.environ:
        gh_token = os.environ.get("GITHUB_TOKEN")
        repo_owner = os.environ.get("REPO_OWNER")
        repo_name = os.environ.get("REPO_NAME")
        output_directory = os.environ.get("GH_OUTPUT_PATH")

        print(f"Fetch from: https://github.com/{repo_owner}/{repo_name}/discussions.\nOutput to: {output_directory}")
    
    else:
        print("Missing env var!")
        sys.exit(1)

    # Create the output directory if it doesn't exist
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    # Fetch gh discussion contents:
    discussions = fetch_discussions(gh_token, repo_owner, repo_name)
    print(f"Fetched {len(discussions)} discussions.")

    # Output to individual files:
    for d in discussions:
        save_discussion_to_file(d, repo_owner, repo_name, output_directory)
