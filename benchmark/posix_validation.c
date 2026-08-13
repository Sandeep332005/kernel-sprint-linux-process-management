/*
 * posix_validation.c
 *
 * Phase 8 POSIX compliance checks, run against the actual booted
 * kernel (baseline or patched) rather than assumed:
 *
 *  1. fork():  parent receives the child's PID (>0); child receives 0.
 *  2. wait():  parent correctly blocks until the child exits and
 *              retrieves its real exit status.
 *  3. exec():  execve() replaces the process image; verified by
 *              observing the exit code of the replacement program.
 *  4. signals: SIGTERM and SIGKILL correctly terminate a child, with
 *              waitpid() reporting WIFSIGNALED and the right signal
 *              number.
 *
 * Prints PASS/FAIL per check plus a final RESULT= line.
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <sys/wait.h>
#include <string.h>

static int failures = 0;

static void check(int cond, const char *name) {
    printf("%s: %s\n", cond ? "PASS" : "FAIL", name);
    if (!cond) failures++;
}

static void test_fork(void) {
    pid_t pid = fork();
    if (pid < 0) {
        check(0, "fork: fork() succeeded");
        return;
    }
    if (pid == 0) {
        _exit(0);
    }
    check(pid > 0, "fork: parent received positive child PID");
    int status;
    waitpid(pid, &status, 0);
}

static void test_wait(void) {
    pid_t pid = fork();
    if (pid == 0) {
        _exit(77);
    }
    int status = 0;
    pid_t waited = wait(&status);
    check(waited == pid, "wait: wait() returned the correct child PID");
    check(WIFEXITED(status) && WEXITSTATUS(status) == 77,
          "wait: exit status correctly propagated (77)");
}

static void test_exec(void) {
    pid_t pid = fork();
    if (pid == 0) {
        /* busybox true always exits 0; execve replaces this image */
        char *argv[] = { "/bin/busybox", "true", NULL };
        execve("/bin/busybox", argv, NULL);
        /* only reached if execve failed */
        _exit(126);
    }
    int status;
    waitpid(pid, &status, 0);
    check(WIFEXITED(status) && WEXITSTATUS(status) == 0,
          "exec: execve() replaced the process image and ran to completion");
}

static void test_sigterm(void) {
    pid_t pid = fork();
    if (pid == 0) {
        /* default SIGTERM disposition: terminate */
        for (;;) pause();
    }
    usleep(50000); /* let child install itself and block in pause() */
    kill(pid, SIGTERM);
    int status;
    waitpid(pid, &status, 0);
    check(WIFSIGNALED(status) && WTERMSIG(status) == SIGTERM,
          "signals: SIGTERM terminated the child with the correct signal");
}

static void test_sigkill(void) {
    pid_t pid = fork();
    if (pid == 0) {
        /* even with SIGTERM blocked, SIGKILL cannot be blocked or caught */
        sigset_t set;
        sigemptyset(&set);
        sigaddset(&set, SIGTERM);
        sigprocmask(SIG_BLOCK, &set, NULL);
        for (;;) pause();
    }
    usleep(50000);
    kill(pid, SIGKILL);
    int status;
    waitpid(pid, &status, 0);
    check(WIFSIGNALED(status) && WTERMSIG(status) == SIGKILL,
          "signals: SIGKILL terminated the child unconditionally");
}

int main(void) {
    test_fork();
    test_wait();
    test_exec();
    test_sigterm();
    test_sigkill();

    printf("posix_validation: %d failures\n", failures);
    printf("posix_validation: RESULT=%s\n", failures == 0 ? "PASS" : "FAIL");
    return failures == 0 ? 0 : 1;
}
