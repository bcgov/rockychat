# rockychat

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
