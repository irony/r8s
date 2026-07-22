import type { PageContext } from "vike/types";
import { getPackageBySlug } from "../../../data/packages";

export function onBeforeRender(pageContext: PageContext) {
  const { routeParams } = pageContext;
  const pkg = getPackageBySlug(routeParams?.slug || "");

  return {
    pageContext: {
      package: pkg
    }
  };
}
