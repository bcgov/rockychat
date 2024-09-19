# ChatBot User Requirements

## Service Definition:
A Rocket.Chat integrated Generative AI ChatBot to answer community questions related to the platform. RocketChat users can interact with the Chatbot from a designated channel, the chatbot is able to provide information from the platform knowledge base with links to the material. This [Miro board](https://miro.com/app/board/uXjVKVqzyA4=/) includes the infrastructure overview of the service design.

## MVP features:
The **Generative AI model** is trained with the platform knowledge base, including the following sources:
- documentation websites
    - public information
    - IDIR protected pages
- BCGov StackOverflow
- BCGov GitHub repos
    - public repos only
    - covering `bcgov` GitHub organizations
- ~existing Rocketchat channel chat history~ (not in MVP)

The **Chatbot account** is able to provide an answer to a message with the specific prompt (i.e.: `!Rocky ...`). Here's the workflow:
1. user post a message in the Chatbot channel
1. Chatbot account pick up the question, process a response:
    1. if an answer is available, provide the document link (with the relevant message body quoted) for the responding message
    1. if not, tag platform admin for support in the message
1. Chatbot account reply to the message with the response

## Second Steps:
- consider how to continuously/iteratively train the model when information updated from the sources
- include existing RocketChat channel chat history as part of knowledge base:
    - use platform services channels only
        - #devops-how-to
        - #devops-alerts
        - #devops-operations
        - shared services repo (artifactory, vault, sysdig, ACS, Registry, etc.)
    - data validation/clean up is required
- the ability to follow through a message thread as the conversation context


## Plan to Evaluate the ChatBot AI model:

We will be evaluating the following GenAI services:

- Google Agent Builder with Dialogflow CX
- Azure OpenAI GPT models
- AWS Bedrock

### Evaluation Criteria:

- Accuracy and Relevance: the model understands and responds correctly based on BCGov platform information, the response includes suggestions and reference link to the data source.
- Customization: the service is able to perform grounding with BCGov specific knowledge from various sources and formats; the response is traceable with reference URLs to the knowledge base
- Maintenance: the service is low-maintenance in contiguously feeding updated information
- Cost-effectiveness: the service charges by usage with lowest price

### Testing:
- randomly pick existing questions from the #devops-how-to channel as initial test scenarios
- open up Rocky to small group of users for two weeks of testing and feedback
- collect list of questions as test cases to further changes
