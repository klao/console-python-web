FROM nilcons/debian
RUN apt-get update
RUN apt-get install -y nodejs
RUN curl -fsSL https://get.pnpm.io/install.sh | PNPM_HOME=/pnpm bash
