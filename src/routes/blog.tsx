import { createFileRoute, redirect } from "@tanstack/react-router";

// The blog became the OGCW Forum (src/routes/forum.*); old links land there
export const Route = createFileRoute("/blog")({
  beforeLoad: () => {
    throw redirect({ to: "/forum", statusCode: 301 });
  },
});
