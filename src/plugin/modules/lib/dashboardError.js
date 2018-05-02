define([], function () {
    'use strict';

    class DashboardError extends Error {
        constructor(source, code, message, detail, info) {
            super(message);
            this.source = source;
            this.code = code;
            this.message = message;
            this.detail = detail;
            this.info = info;
            this.stack = new Error().stack;
        }
    }

    return DashboardError;
});