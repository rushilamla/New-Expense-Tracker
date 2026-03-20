import { app } from "./app";

const port = Number(process.env.PORT ?? 5000);

if (process.env.RUN_MIGRATIONS === "true") {
  // Apply DB schema in production deployments (Render/Railway) before starting the API.
  // This requires `DATABASE_URL` to be set.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { execSync } = require("child_process") as typeof import("child_process");
  console.log("Running Prisma migrations (migrate deploy)...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

