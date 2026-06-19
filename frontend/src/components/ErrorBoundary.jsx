import React from "react";
import { Result, Button, Card, Collapse } from "antd";
import { ReloadOutlined, HomeOutlined } from "@ant-design/icons";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0F172A",
            padding: "24px",
          }}
        >
          <Card
            style={{
              maxWidth: "600px",
              width: "100%",
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "12px",
            }}
          >
            <Result
              status="error"
              title="Oops! Something went wrong"
              subTitle="The application encountered an unexpected error. Please try the options below."
              extra={[
                <Button
                  key="home"
                  type="primary"
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                  style={{ marginRight: "12px" }}
                >
                  Go Home
                </Button>,
                <Button
                  key="reload"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                  style={{ marginRight: "12px" }}
                >
                  Reload Page
                </Button>,
                <Button
                  key="reset"
                  size="large"
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>,
              ]}
            />

            {this.state.error && (
              <Collapse
                style={{ marginTop: "24px" }}
                items={[
                  {
                    key: "error-details",
                    label: "Error Details",
                    children: (
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "#ef4444",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: "400px",
                          overflow: "auto",
                          background: "#0F172A",
                          padding: "12px",
                          borderRadius: "8px",
                        }}
                      >
                        <strong>Error Message:</strong>
                        {"\n"}
                        {this.state.error.toString()}
                        {"\n\n"}
                        <strong>Stack Trace:</strong>
                        {"\n"}
                        {this.state.errorInfo?.componentStack}
                      </div>
                    ),
                  },
                ]}
              />
            )}

            {this.state.errorCount > 3 && (
              <div
                style={{
                  marginTop: "24px",
                  padding: "12px",
                  background: "#7f1d1d",
                  border: "1px solid #ef4444",
                  borderRadius: "8px",
                  color: "#fca5a5",
                }}
              >
                <strong>⚠️ Multiple errors detected:</strong> The application may be unstable. Please reload the page.
              </div>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
