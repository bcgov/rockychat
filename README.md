# rockychat

## Introduction
Rocky is an internal chatbot accessed through a [Rocketchat channel](https://chat.developer.gov.bc.ca/channel/rocky-chat). Messages in this channel starting with `!rocky` trigger a response from the chatbot. Rocky provides referenced answers related to the BC Gov's OpenShift platform based on source documentation, and is designed not to answer questions outside of this knowledge base to avoid giving misleading information. 

## Sources
Rocky provides answers from: 
- [Digital.gov.bc.ca Private Cloud site](https://digital.gov.bc.ca/technology/cloud/private/)
- BC Government Private Cloud Technical Documentation
(https://developer.gov.bc.ca/docs/default/component/platform-developer-docs/)
- bcgov github discussions, including an archive of Stackoverflow questions and answers

### Requirements:
Node v20+
npm v10.4+
Rocketchat: a bot user with password, a channel that the bot user can join

### Run locally:
```bash
# fill in the env vars:
cp .env.sample .env

# Use Docker compose to bring up chatbot and Redis DB:
docker-compose up --build

# if Redis is running somewhere else, just create container for chatbot:
docker build -t rockychat .
docker run -it -p 3000:3000 --rm rockychat

# you can run the app locally as well:
npm install
npm run build
npm run start
```

To test the app:
- head to the channel
- message starting with `!Rocky`
