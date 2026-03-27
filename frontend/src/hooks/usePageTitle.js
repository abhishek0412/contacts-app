import React, { createContext, useContext, useEffect, useState } from "react";

const APP_NAME = "Contact Manager";

const PageTitleContext = createContext({ title: "", setTitle: () => {} });

/**
 * Provider that holds the current page title. Wrap around the layout.
 */
export const PageTitleProvider = ({ children }) => {
  const [title, setTitle] = useState("");
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};

/**
 * Hook for pages to SET the title — updates document.title and the shared context.
 * Hook for TopBar to READ the title — returns { title }.
 */
export const usePageTitle = (pageTitle) => {
  const ctx = useContext(PageTitleContext);

  useEffect(() => {
    if (pageTitle != null) {
      ctx.setTitle(pageTitle);
      document.title = `${pageTitle} — ${APP_NAME}`;
      return () => {
        document.title = APP_NAME;
      };
    }
  }, [pageTitle, ctx]);

  return { title: ctx.title };
};

export { PageTitleContext };
