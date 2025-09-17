import React, { useState } from 'react';
import { 
  runCompleteDiagnostics, 
  quickHealthCheck,
  type ConnectivityReport,
  type DiagnosticResult 
} from '../utils/diagnostics';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Activity,
  Zap,
  Shield,
  Server,
  Network,
  FileText
} from 'lucide-react';

export function DatabaseDiagnostics() {
  const [report, setReport] = useState<ConnectivityReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [quickStatus, setQuickStatus] = useState<{
    status: 'HEALTHY' | 'UNHEALTHY';
    message: string;
    timestamp: string;
  } | null>(null);

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setReport(null);
    
    try {
      const diagnosticReport = await runCompleteDiagnostics();
      setReport(diagnosticReport);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuickCheck = async () => {
    try {
      const status = await quickHealthCheck();
      setQuickStatus(status);
    } catch (error) {
      console.error('Quick check failed:', error);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case 'Environment Variables':
        return <FileText className="h-4 w-4" />;
      case 'Database Connection':
        return <Database className="h-4 w-4" />;
      case 'RLS Policies':
        return <Shield className="h-4 w-4" />;
      case 'Authentication State':
        return <Activity className="h-4 w-4" />;
      case 'Data Retrieval Functions':
        return <Zap className="h-4 w-4" />;
      case 'Database Schema':
        return <Server className="h-4 w-4" />;
      case 'API Endpoints':
        return <Network className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DEGRADED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Diagnóstico de Conectividad</h1>
            <p className="text-gray-600">Análisis completo de base de datos y aplicación</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleQuickCheck}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Zap className="h-4 w-4 mr-2" />
            Verificación Rápida
          </button>
          <button
            onClick={handleRunDiagnostics}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Diagnóstico Completo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Status */}
      {quickStatus && (
        <div className={`rounded-lg p-4 border-2 ${
          quickStatus.status === 'HEALTHY' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {quickStatus.status === 'HEALTHY' ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <div>
              <h3 className={`font-semibold ${
                quickStatus.status === 'HEALTHY' ? 'text-green-800' : 'text-red-800'
              }`}>
                Estado: {quickStatus.status === 'HEALTHY' ? 'SALUDABLE' : 'CON PROBLEMAS'}
              </h3>
              <p className={`text-sm ${
                quickStatus.status === 'HEALTHY' ? 'text-green-700' : 'text-red-700'
              }`}>
                {quickStatus.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Última verificación: {new Date(quickStatus.timestamp).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Report */}
      {report && (
        <div className="space-y-6">
          {/* Overall Status */}
          <div className={`rounded-lg p-6 border-2 ${getOverallStatusColor(report.overall_status)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Estado General del Sistema</h2>
              <span className="text-2xl font-bold">{report.overall_status}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{report.summary.passed}</div>
                <div className="text-sm text-gray-600">Pruebas Exitosas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</div>
                <div className="text-sm text-gray-600">Advertencias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{report.summary.failed}</div>
                <div className="text-sm text-gray-600">Fallas</div>
              </div>
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Recomendaciones:</h3>
                <ul className="space-y-1">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Individual Test Results */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Resultados Detallados</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {report.tests.map((test, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {getTestIcon(test.test)}
                      {getStatusIcon(test.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{test.test}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(test.timestamp).toLocaleTimeString('es-MX')}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-2 ${
                        test.status === 'PASS' ? 'text-green-700' :
                        test.status === 'WARNING' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {test.message}
                      </p>
                      
                      {test.details && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            Ver detalles técnicos
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!report && !isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Database className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                Diagnóstico de Conectividad de Base de Datos
              </h3>
              <p className="text-blue-700 mb-4">
                Esta herramienta ejecuta una serie completa de pruebas para identificar problemas 
                de conectividad entre la aplicación y la base de datos.
              </p>
              
              <div className="space-y-2 text-sm text-blue-700">
                <h4 className="font-medium">Pruebas que se ejecutarán:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Validación de variables de entorno</li>
                  <li>• Conectividad de base de datos</li>
                  <li>• Políticas de seguridad (RLS)</li>
                  <li>• Estado de autenticación</li>
                  <li>• Funciones de recuperación de datos</li>
                  <li>• Esquema de base de datos</li>
                  <li>• Endpoints de API</li>
                  <li>• Conteo de registros</li>
                  <li>• Carga de datos en componentes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}