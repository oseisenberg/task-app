import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

// A render crash should show the error, never a silent blank screen.
export class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            color: "#e8e8ec",
            background: "#0b0b0f",
            font: "14px system-ui",
            padding: 24,
            minHeight: "100vh",
            whiteSpace: "pre-wrap",
          }}
        >
          <h2>Something broke</h2>
          <p>{this.state.error.message}</p>
          <pre style={{ color: "#9a9aa6", fontSize: 12 }}>
            {this.state.error.stack}
          </pre>
          <button onClick={() => location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
