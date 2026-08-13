/*
 * context_switch.c
 *
 * Classic pipe ping-pong benchmark: two processes hand a single byte
 * back and forth over two pipes. Each round trip forces (at least) two
 * context switches. Reports the derived per-context-switch latency.
 *
 * Usage: context_switch [round_trips]
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <time.h>

#define DEFAULT_ROUND_TRIPS 50000

static long elapsed_ns(struct timespec *start, struct timespec *end) {
    return (end->tv_sec - start->tv_sec) * 1000000000L +
           (end->tv_nsec - start->tv_nsec);
}

int main(int argc, char **argv) {
    int round_trips = argc > 1 ? atoi(argv[1]) : DEFAULT_ROUND_TRIPS;

    int ping[2], pong[2];
    if (pipe(ping) < 0 || pipe(pong) < 0) {
        perror("pipe");
        return 1;
    }

    pid_t pid = fork();
    if (pid < 0) {
        perror("fork");
        return 1;
    }

    char byte = 'x';

    if (pid == 0) {
        /* child: bounce byte back */
        close(ping[1]);
        close(pong[0]);
        for (int i = 0; i < round_trips; i++) {
            if (read(ping[0], &byte, 1) != 1) _exit(1);
            if (write(pong[1], &byte, 1) != 1) _exit(1);
        }
        _exit(0);
    }

    /* parent: initiate and time round trips */
    close(ping[0]);
    close(pong[1]);

    struct timespec t0, t1;
    clock_gettime(CLOCK_MONOTONIC, &t0);

    for (int i = 0; i < round_trips; i++) {
        if (write(ping[1], &byte, 1) != 1) { perror("write"); return 1; }
        if (read(pong[0], &byte, 1) != 1) { perror("read"); return 1; }
    }

    clock_gettime(CLOCK_MONOTONIC, &t1);

    int status;
    waitpid(pid, &status, 0);

    long total_ns = elapsed_ns(&t0, &t1);
    double round_trip_us = (double)total_ns / round_trips / 1000.0;
    /* each round trip is 2 context switches (parent->child, child->parent) */
    double context_switch_us = round_trip_us / 2.0;
    double context_switches_per_sec = 1000000.0 / context_switch_us;

    printf("benchmark=context_switch round_trips=%d\n", round_trips);
    printf("round_trip_us=%.3f context_switch_us=%.3f context_switches_per_sec=%.0f\n",
           round_trip_us, context_switch_us, context_switches_per_sec);

    return 0;
}
