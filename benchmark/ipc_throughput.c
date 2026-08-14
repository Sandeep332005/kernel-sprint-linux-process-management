/*
 * ipc_throughput.c
 *
 * Measures pipe IPC throughput (distinct from context_switch.c's
 * per-switch latency focus): a writer process streams a fixed total
 * volume of data to a reader process in fixed-size chunks over a
 * pipe, and we report MB/s.
 *
 * Usage: ipc_throughput [chunk_bytes] [total_mb]
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <time.h>

#define DEFAULT_CHUNK_BYTES 4096
#define DEFAULT_TOTAL_MB 64

int main(int argc, char **argv) {
    int chunk_bytes = argc > 1 ? atoi(argv[1]) : DEFAULT_CHUNK_BYTES;
    long total_mb = argc > 2 ? atol(argv[2]) : DEFAULT_TOTAL_MB;
    long total_bytes = total_mb * 1024L * 1024L;
    long chunks = total_bytes / chunk_bytes;

    int fds[2];
    if (pipe(fds) < 0) {
        perror("pipe");
        return 1;
    }

    pid_t pid = fork();
    if (pid < 0) {
        perror("fork");
        return 1;
    }

    if (pid == 0) {
        /* reader */
        close(fds[1]);
        char *buf = malloc(chunk_bytes);
        long received = 0;
        ssize_t n;
        while (received < total_bytes && (n = read(fds[0], buf, chunk_bytes)) > 0) {
            received += n;
        }
        free(buf);
        _exit(0);
    }

    /* writer */
    close(fds[0]);
    char *buf = calloc(1, chunk_bytes);

    struct timespec t0, t1;
    clock_gettime(CLOCK_MONOTONIC, &t0);

    for (long i = 0; i < chunks; i++) {
        if (write(fds[1], buf, chunk_bytes) != chunk_bytes) {
            perror("write");
            break;
        }
    }
    close(fds[1]);

    int status;
    waitpid(pid, &status, 0);
    clock_gettime(CLOCK_MONOTONIC, &t1);

    double elapsed_s = (t1.tv_sec - t0.tv_sec) + (t1.tv_nsec - t0.tv_nsec) / 1e9;
    double actual_mb = (double)(chunks * chunk_bytes) / (1024.0 * 1024.0);
    double throughput_mb_s = actual_mb / elapsed_s;

    printf("benchmark=ipc_throughput chunk_bytes=%d total_mb=%.1f\n", chunk_bytes, actual_mb);
    printf("elapsed_s=%.3f throughput_mb_s=%.1f\n", elapsed_s, throughput_mb_s);

    free(buf);
    return 0;
}
