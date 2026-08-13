/*
 * stress_test.c
 *
 * Correctness stress test standing in for stress-ng inside the minimal
 * static-binary QEMU guest (stress-ng itself is a large dynamically
 * linked tool that doesn't fit the busybox-initramfs approach used
 * here -- see documentation/environment-setup.md). Exercises the same
 * three patterns stress-ng --fork / --pthread / --cpu would:
 *
 *  1. fork stress:    spawn N children repeatedly, verify every one
 *                      reports the correct exit status to the parent.
 *  2. pthread stress:  spawn N threads incrementing a shared counter
 *                      under a mutex, verify the final count is exact.
 *  3. cpu stress:      run N busy-spin threads for a fixed duration
 *                      concurrently with (1) and (2) to create real
 *                      contention, then confirm the process is still
 *                      alive and responsive (no deadlock/hang).
 *
 * Exit status 0 means all checks passed -- no crash, no deadlock, no
 * corrupted state. Any mismatch or hang is the failure signal.
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>
#include <sys/wait.h>
#include <time.h>

#define FORK_COUNT 100
#define PTHREAD_COUNT 100
#define CPU_HOG_DURATION_SEC 3

static pthread_mutex_t counter_lock = PTHREAD_MUTEX_INITIALIZER;
static long shared_counter = 0;
static volatile int stop_cpu_hogs = 0;

static void *pthread_worker(void *arg) {
    (void)arg;
    pthread_mutex_lock(&counter_lock);
    shared_counter++;
    pthread_mutex_unlock(&counter_lock);
    return NULL;
}

static void *cpu_hog(void *arg) {
    (void)arg;
    volatile unsigned long x = 0;
    while (!stop_cpu_hogs) x++;
    return NULL;
}

static int fork_stress(void) {
    int failures = 0;
    for (int i = 0; i < FORK_COUNT; i++) {
        pid_t pid = fork();
        if (pid == 0) {
            _exit(42);
        } else if (pid < 0) {
            perror("fork");
            failures++;
            continue;
        }
        int status;
        if (waitpid(pid, &status, 0) < 0) {
            perror("waitpid");
            failures++;
            continue;
        }
        if (!WIFEXITED(status) || WEXITSTATUS(status) != 42) {
            fprintf(stderr, "fork_stress: child %d bad exit status\n", i);
            failures++;
        }
    }
    return failures;
}

static int pthread_stress(void) {
    pthread_t threads[PTHREAD_COUNT];
    shared_counter = 0;
    for (int i = 0; i < PTHREAD_COUNT; i++) {
        if (pthread_create(&threads[i], NULL, pthread_worker, NULL) != 0) {
            fprintf(stderr, "pthread_stress: create failed at %d\n", i);
            return 1;
        }
    }
    for (int i = 0; i < PTHREAD_COUNT; i++) {
        pthread_join(threads[i], NULL);
    }
    if (shared_counter != PTHREAD_COUNT) {
        fprintf(stderr, "pthread_stress: counter mismatch: got %ld want %d\n",
                shared_counter, PTHREAD_COUNT);
        return 1;
    }
    return 0;
}

int main(void) {
    long ncpus = sysconf(_SC_NPROCESSORS_ONLN);
    if (ncpus < 1) ncpus = 1;

    printf("stress_test: starting %ld cpu hog threads for %ds while running "
           "fork+pthread stress concurrently\n", ncpus, CPU_HOG_DURATION_SEC);

    pthread_t *hogs = malloc(sizeof(pthread_t) * ncpus);
    for (long i = 0; i < ncpus; i++) {
        pthread_create(&hogs[i], NULL, cpu_hog, NULL);
    }

    struct timespec start, now;
    clock_gettime(CLOCK_MONOTONIC, &start);

    int total_failures = 0;
    int rounds = 0;
    do {
        total_failures += fork_stress();
        total_failures += pthread_stress();
        rounds++;
        clock_gettime(CLOCK_MONOTONIC, &now);
    } while (now.tv_sec - start.tv_sec < CPU_HOG_DURATION_SEC);

    stop_cpu_hogs = 1;
    for (long i = 0; i < ncpus; i++) {
        pthread_join(hogs[i], NULL);
    }
    free(hogs);

    printf("stress_test: completed %d rounds (fork x%d, pthread x%d each), "
           "%d failures\n", rounds, FORK_COUNT, PTHREAD_COUNT, total_failures);

    if (total_failures > 0) {
        printf("stress_test: RESULT=FAIL\n");
        return 1;
    }
    printf("stress_test: RESULT=PASS\n");
    return 0;
}
