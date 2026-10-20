const { execSync } = require("child_process");

module.exports = async () => {
  const url = "postgresql://postgres:postgres@localhost:5432/appdb?schema=public";

  execSync("npx prisma db push --skip-generate --force-reset", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
};