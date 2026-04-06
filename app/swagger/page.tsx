"use client";

import { useEffect, useState, createRef, Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Suppress React strict mode warnings from swagger-ui-react.
 * The library uses legacy lifecycle methods (UNSAFE_componentWillReceiveProps)
 * that cannot be fixed from our side.
 */
class SwaggerErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SwaggerUI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <p>Failed to load API documentation.</p>;
    }
    return this.props.children;
  }
}

export default function SwaggerPage() {
  const [SwaggerUI, setSwaggerUI] = useState<React.ComponentType<{ url: string }> | null>(null);

  useEffect(() => {
    // Temporarily suppress console.error for the known strict mode warning
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (msg.includes("UNSAFE_componentWillReceiveProps") || msg.includes("UNSAFE_componentWillMount")) {
        return; // suppress known swagger-ui-react warnings
      }
      originalError.apply(console, args);
    };

    import("swagger-ui-react").then((mod) => {
      // @ts-expect-error - swagger-ui-react CSS import
      import("swagger-ui-react/swagger-ui.css");
      setSwaggerUI(() => mod.default);
    });

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!SwaggerUI) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <p>Loading API Documentation...</p>
      </div>
    );
  }

  return (
    <SwaggerErrorBoundary>
      <div style={{ height: "100vh", background: "#fafafa" }}>
        <SwaggerUI url="/api/openapi" />
      </div>
    </SwaggerErrorBoundary>
  );
}
