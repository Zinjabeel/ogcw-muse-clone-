import { Studio } from "sanity";
import config from "./config";

// The Studio itself. Loaded only in the browser, and only on /admin, so the
// rest of the site never downloads it.
export default function OgcwStudio() {
  return <Studio config={config} />;
}
