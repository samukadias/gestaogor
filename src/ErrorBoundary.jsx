import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary apanhou um erro:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', margin: '20px', fontFamily: 'sans-serif' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>Ops! O Layout sofreu uma falha (Crash)</h2>
                    <p style={{ marginBottom: '15px' }}>Ocorreu um erro ao renderizar esta tela. Tire um print abaixo para o Assistente IA:</p>

                    <div style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '4px', border: '1px solid #fca5a5', overflowX: 'auto', fontSize: '13px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{this.state.error && this.state.error.toString()}</p>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Recarregar Aplicativo
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
