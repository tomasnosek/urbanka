"use client";

import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
    children: ReactNode;
    blockType?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class BlockErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[BlockErrorBoundary] Block "${this.props.blockType}" threw:`, error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: "32px",
                    border: "1px dashed #e2e8e4",
                    borderRadius: "4px",
                    textAlign: "center",
                    color: "#8FA9A0",
                    fontSize: "14px",
                    margin: "16px 0",
                }}>
                    <strong>Tento blok se nepodařilo zobrazit.</strong>
                    <br />
                    <span>Zkus obnovit stránku nebo kontaktuj administrátora.</span>
                </div>
            );
        }
        return this.props.children;
    }
}
