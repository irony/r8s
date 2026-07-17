import type { Config } from "vike/types";

export default {
  route: "/recipes/@slug",
  passToClient: ["recipe"]
} satisfies Config;
