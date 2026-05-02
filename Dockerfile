FROM node:20-slim

# system tools (minimum sensowne CLI środowisko)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    nano \
    screen \
    ca-certificates \
    bubblewrap \
    && rm -rf /var/lib/apt/lists/*

# Fix dla programu screen i terminala (uprawnienia + kodowanie UTF-8)
RUN mkdir -p /var/run/screen && chmod 777 /var/run/screen
ENV TERM=xterm
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Konfiguracja screena na stałe (opcjonalnie, ale polecam)
RUN echo "defutf8 on\nutf8 on on" > /etc/screenrc

# global tools (dev stack)
RUN npm install -g \
    @openai/codex \
    typescript \
    ts-node

# workspace (Twoje ASCII-OS repo)
WORKDIR /workspace

# wygodny shell
CMD ["bash"]