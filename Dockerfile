FROM node:20-slim

# system tools (minimum sensowne CLI środowisko)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    nano \
    ca-certificates \
	bubblewrap \
    && rm -rf /var/lib/apt/lists/*

	
	
# global tools (dev stack)
RUN npm install -g \
    @openai/codex \
    typescript \
    ts-node

# workspace (Twoje ASCII-OS repo)
WORKDIR /workspace

# wygodny shell
CMD ["bash"]