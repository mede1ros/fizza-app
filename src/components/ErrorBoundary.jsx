import { Component } from 'react';

// Tela amigável para erros inesperados: o usuário nunca fica preso.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, exportStatus: '' };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  handleExport = async () => {
    if (!this.props.onExport) return;
    try {
      await this.props.onExport();
      this.setState({ exportStatus: 'Backup exportado.' });
    } catch {
      this.setState({ exportStatus: 'Não foi possível exportar o backup.' });
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            Seus dados continuam salvos neste aparelho. Recarregue o app; se o problema continuar, exporte um backup.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              Recarregar
            </button>
            {this.props.onExport && (
              <button
                type="button"
                onClick={this.handleExport}
                className="h-11 rounded-xl border border-border text-sm font-medium"
              >
                Exportar backup
              </button>
            )}
          </div>
          {this.state.exportStatus && <p className="text-xs text-muted-foreground">{this.state.exportStatus}</p>}
        </div>
      </div>
    );
  }
}
