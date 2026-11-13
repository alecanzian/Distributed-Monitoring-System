import { SampleStore } from "../core/store.js";
import { createCollector } from "../components/collector.js";

const port = Number(process.env.PORT ?? 3001);
createCollector(new SampleStore()).listen(port, () => {
  console.log(`collector listening on :${port}`);
});
