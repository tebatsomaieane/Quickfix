import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { documentTitleFor } from "../lib/routeTitles";

/**
 * Keeps `document.title` in step with the current route.
 *
 * Driven from the router rather than from each page so that lazy-loaded routes
 * and the placeholder/404 branches are covered without every page having to
 * remember to set a title.
 */
export default function RouteTitle() {
    const { pathname } = useLocation();

    useEffect(() => {
        document.title = documentTitleFor(pathname);
    }, [pathname]);

    return null;
}
