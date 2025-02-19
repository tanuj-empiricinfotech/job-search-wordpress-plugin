import React, { Component } from "react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="text-red-500 text-xl flex justify-center items-center py-6">
                <span>Something went wrong!</span>
            </div>;
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
