/*
 * scheduler_latency.c
 *
 * Measures scheduling (wake-up) latency under CPU contention, in the
 * style of cyclictest: spawn one CPU-hog thread per online CPU to keep
 * every core saturated, then have a separate probe thread sleep for a
 * fixed interval using an absolute CLOCK_MONOTONIC deadline and measure
 * how much later than the deadline it actually resumes execution. The
 * overshoot is the time the probe spent runnable-but-waiting for a CPU
 * to free up -- exactly what sysctl_sched_base_slice governs: how long
 * a hog holds the CPU before its EEVDF deadline lets something else in.
 *
 * Usage: scheduler_latency [iterations] [interval_us]
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>
#include <time.h>

#define DEFAULT_ITERATIONS 2000
#define DEFAULT_INTERVAL_US 2000

static volatile int stop_hogs = 0;

static void *hog_thread(void *arg) {
    (void)arg;
    volatile unsigned long counter = 0;
    while (!stop_hogs) {
        counter++;
    }
    return NULL;
}

static long elapsed_ns(struct timespec *start, struct timespec *end) {
    return (end->tv_sec - start->tv_sec) * 1000000000L +
           (end->tv_nsec - start->tv_nsec);
}

static void ts_add_ns(struct timespec *ts, long ns) {
    ts->tv_nsec += ns;
    while (ts->tv_nsec >= 1000000000L) {
        ts->tv_nsec -= 1000000000L;
        ts->tv_sec += 1;
    }
}

static int cmp_long(const void *a, const void *b) {
    long la = *(const long *)a, lb = *(const long *)b;
    return (la > lb) - (la < lb);
}

int main(int argc, char **argv) {
    int iterations = argc > 1 ? atoi(argv[1]) : DEFAULT_ITERATIONS;
    long interval_us = argc > 2 ? atol(argv[2]) : DEFAULT_INTERVAL_US;

    long ncpus = sysconf(_SC_NPROCESSORS_ONLN);
    if (ncpus < 1) ncpus = 1;

    pthread_t *hogs = malloc(sizeof(pthread_t) * ncpus);
    for (long i = 0; i < ncpus; i++) {
        pthread_create(&hogs[i], NULL, hog_thread, NULL);
    }

    /* let hogs ramp up and occupy all CPUs */
    usleep(200000);

    long *samples_ns = malloc(sizeof(long) * iterations);

    struct timespec target;
    clock_gettime(CLOCK_MONOTONIC, &target);

    for (int i = 0; i < iterations; i++) {
        ts_add_ns(&target, interval_us * 1000L);
        clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &target, NULL);

        struct timespec actual;
        clock_gettime(CLOCK_MONOTONIC, &actual);

        long overshoot_ns = elapsed_ns(&target, &actual);
        if (overshoot_ns < 0) overshoot_ns = 0;
        samples_ns[i] = overshoot_ns;
    }

    stop_hogs = 1;
    for (long i = 0; i < ncpus; i++) {
        pthread_join(hogs[i], NULL);
    }

    qsort(samples_ns, iterations, sizeof(long), cmp_long);

    double sum = 0;
    for (int i = 0; i < iterations; i++) sum += samples_ns[i];
    double mean_us = (sum / iterations) / 1000.0;
    double min_us = samples_ns[0] / 1000.0;
    double max_us = samples_ns[iterations - 1] / 1000.0;
    double p50_us = samples_ns[iterations / 2] / 1000.0;
    double p99_us = samples_ns[(int)(iterations * 0.99)] / 1000.0;

    printf("benchmark=scheduler_latency iterations=%d interval_us=%ld ncpus=%ld\n",
           iterations, interval_us, ncpus);
    printf("mean_us=%.3f min_us=%.3f max_us=%.3f p50_us=%.3f p99_us=%.3f\n",
           mean_us, min_us, max_us, p50_us, p99_us);

    free(samples_ns);
    free(hogs);
    return 0;
}
