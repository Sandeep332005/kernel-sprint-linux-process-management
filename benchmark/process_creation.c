/*
 * process_creation.c
 *
 * Measures fork()+exit()+wait() latency: how long it takes the kernel
 * to create a new process and reap it. Reports mean/min/max/p50/p99
 * over N iterations in microseconds.
 *
 * Usage: process_creation [iterations]
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <time.h>

#define DEFAULT_ITERATIONS 20000

static long elapsed_ns(struct timespec *start, struct timespec *end) {
    return (end->tv_sec - start->tv_sec) * 1000000000L +
           (end->tv_nsec - start->tv_nsec);
}

static int cmp_long(const void *a, const void *b) {
    long la = *(const long *)a, lb = *(const long *)b;
    return (la > lb) - (la < lb);
}

int main(int argc, char **argv) {
    int iterations = argc > 1 ? atoi(argv[1]) : DEFAULT_ITERATIONS;
    long *samples_ns = malloc(sizeof(long) * iterations);
    if (!samples_ns) {
        fprintf(stderr, "out of memory\n");
        return 1;
    }

    for (int i = 0; i < iterations; i++) {
        struct timespec t0, t1;
        clock_gettime(CLOCK_MONOTONIC, &t0);

        pid_t pid = fork();
        if (pid == 0) {
            _exit(0);
        } else if (pid < 0) {
            perror("fork");
            return 1;
        }
        int status;
        waitpid(pid, &status, 0);

        clock_gettime(CLOCK_MONOTONIC, &t1);
        samples_ns[i] = elapsed_ns(&t0, &t1);
    }

    qsort(samples_ns, iterations, sizeof(long), cmp_long);

    double sum = 0;
    for (int i = 0; i < iterations; i++) sum += samples_ns[i];
    double mean_us = (sum / iterations) / 1000.0;
    double min_us = samples_ns[0] / 1000.0;
    double max_us = samples_ns[iterations - 1] / 1000.0;
    double p50_us = samples_ns[iterations / 2] / 1000.0;
    double p99_us = samples_ns[(int)(iterations * 0.99)] / 1000.0;

    printf("benchmark=process_creation iterations=%d\n", iterations);
    printf("mean_us=%.3f min_us=%.3f max_us=%.3f p50_us=%.3f p99_us=%.3f\n",
           mean_us, min_us, max_us, p50_us, p99_us);

    free(samples_ns);
    return 0;
}
