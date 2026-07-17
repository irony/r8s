import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

const config: Config = {
  title: "r8s — Kubernetes Infrastructure as TypeScript Components",
  description: "Build Kubernetes infrastructure with familiar TSX components. Composable, testable, and type-safe infrastructure as code.",
  extends: [vikeReact],
};

export default config;
