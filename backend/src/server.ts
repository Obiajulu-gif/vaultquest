import { buildApp } from "./app.js";
import { env } from "./env.js";
import { getPrisma } from "./db.js";

const app = buildApp({ prisma: getPrisma(env.DATABASE_URL), internalSecret: env.INTERNAL_SERVICE_SECRET });

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then((addr) => {
    app.log.info({ addr }, "listening");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
