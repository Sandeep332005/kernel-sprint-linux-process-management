FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    build-essential gcc make git \
    linux-tools-common linux-tools-generic \
    "linux-tools-$(uname -r)" \
    trace-cmd \
    qemu-system-x86 qemu-utils \
    stress-ng \
    flex bison libssl-dev libelf-dev bc \
    libncurses-dev dwarves \
    && rm -rf /var/lib/apt/lists/*
CMD ["/bin/bash"]
