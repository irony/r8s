import type { PageContext } from "vike/types";
import { getRecipeBySlug } from "../../../data/recipes";

export function onBeforeRender(pageContext: PageContext) {
  const { routeParams } = pageContext;
  const recipe = getRecipeBySlug(routeParams?.slug || "");
  
  return {
    pageContext: {
      recipe
    }
  };
}
