import { fileURLToPath } from "node:url";
import { createApi } from "../components/api.js";

const port = Number(process.env.PORT ?? 3000);
const collectorUrl = process.env.COLLECTOR_URL ?? "http://localhost:3001";
const indexHtml = fileURLToPath(new URL("../../web/index.html", import.meta.url));

createApi(collectorUrl, indexHtml).listen(port, () => {
  console.log(`api and web UI on http://localhost:${port}`);
});
