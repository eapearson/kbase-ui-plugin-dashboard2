define([], function () {
    'use strict';

    class Timer {
        constructor() {
            this.timings = [];
            this.started = null;
            this.currentTimer = null;
        }

        start(timer) {
            let now = new Date().getTime();
            if (this.currentTimer) {
                let timer = {
                    name: this.currentTimer,
                    started: this.started,
                    ended: now,
                    elapsed: now - this.started
                };
                this.timings.push(timer);
                console.log(timer.name, timer.elapsed);
            }
            this.currentTimer = timer;
            this.started = new Date().getTime();
        }

        stop() {
            if (this.currentTimer) {
                let now = new Date().getTime();
                let timer = {
                    name: this.currentTimer,
                    started: this.started,
                    ended: now,
                    elapsed: now - this.started
                };
                this.timings.push(timer);
                console.log(timer.name, timer.elapsed);
            }
        }

        log() {
            this.timings.forEach((timer) => {
                /*eslint no-console: ["error", {allow: ["log"]}]*/
                console.log(timer.name, timer.elapsed);
            });
        }

    }

    return Timer;
});