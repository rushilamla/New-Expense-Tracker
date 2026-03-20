"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const port = Number(process.env.PORT ?? 5000);
if (process.env.RUN_MIGRATIONS === "true") {
    // Apply DB schema in production deployments (Render/Railway) before starting the API.
    // This requires `DATABASE_URL` to be set.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = require("child_process");
    console.log("Running Prisma migrations (migrate deploy)...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
app_1.app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
//# sourceMappingURL=index.js.map