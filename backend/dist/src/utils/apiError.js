"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = void 0;
const sendError = (res, status, payload) => {
    return res.status(status).json({ error: payload });
};
exports.sendError = sendError;
//# sourceMappingURL=apiError.js.map