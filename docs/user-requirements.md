# ChatBot User Requirements

## Service Definition:
A Rocket.Chat integrated Generative AI ChatBot to answer community questions related to the platform. Rocketchat users can interact with the Chatbot from a designated channel, the chatbot is able to provide information from the platform knowledge base with links to the material.

## MVP features:
The **Generative AI model** is trained with the platform knowledge base, including the following sources:
- documentation websites
    - public information only
    - TBD on IDIR protected pages
- BCGov StackOverflow
- BCGov GitHub repos
    - public repos only
    - covering `bcgov` and `BCDevOps` GitHub organizations
- ~existing Rocketchat channel chat history~ (not in MVP)

The **Chatbot account** is able to provide an answer to a message with the specific prompt (i.e.: `/chatbot ...`). Here's the workflow:
1. user post a message in the Chatbot channel
1. Chatbot account pick up the question, process a response:
    1. if an answer is available, provide the document link (with the relevant message body quoted) for the responding message
    1. if not, tag platform admin for support in the message
1. Chatbot account reply to the message with the response

## Second Steps:
- consider how to continuously/iteratively train the model when information updated from the sources
- include existing Rocketchat channel chat history as part of knowledge base:
    - use platform services channels only
        - #devops-how-to
        - #devops-alerts
        - #devops-operations
        - shared services repo (artifactory, vault, sysdig, ACS, Registry, etc.)
    - data validation/clean up is required
- the ability to follow through a message thread as the conversation context
