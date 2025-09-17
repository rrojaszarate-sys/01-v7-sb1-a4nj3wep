import React, { useState } from 'react';
import { 
  runComprehensiveDashboardDiagnostics, 
  quickDashboardHealthCheck,
  type DiagnosticReport,
  type ValidationResult 
} from '../utils/dashboardDiagnostics';
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
  FileText,
  Users,
  Settings,
  Globe,
  Lock
} from 'lucide-react';

export function DashboardDiagnostics() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [quickStatus, setQuickStatus] = useState<{
    status: 'HEALTHY' | 'UNHEALTHY';
    message: string;
    data_available: boolean;
    timestamp: string;
  } | null>(null);

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setReport(null);
    
    try {
      const diagnosticReport = await runComprehensiveDashboardDiagnostics();
      setReport(diagnosticReport);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuickCheck = async () => {
    try {
      const status = await quickDashboardHealthCheck();
      setQuickStatus(status);
    } catch (error) {
      console.error('Quick check failed:', error);
    }
  };

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'INFO':
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: ValidationResult['category']) => {
    switch (category) {
      case 'Environment':
        return <Settings className="h-4 w-4" />;
      case 'Connectivity':
        return <Network className="h-4 w-4" />;
      case 'Security':
        return <Shield className="h-4 w-4" />;
      case 'Authentication':
        return <Lock className="h-4 w-4" />;
      case 'Data':
        return <Database className="h-4 w-4" />;
      case 'Schema':
        return <Server className="h-4 w-4" />;
      case 'API':
        return <Globe className="h-4 w-4" />;
      case 'Frontend':
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: ValidationResult['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ISSUES_FOUND':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CRITICAL_FAILURE':
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
            <h1 className="text-3xl font-bold text-gray-900">Diagnóstico de Dashboard</h1>
            <p className="text-gray-600">Análisis sistemático de conectividad y visualización de datos</p>
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
                Ejecutando Diagnóstico...
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
                Dashboard: {quickStatus.status === 'HEALTHY' ? 'FUNCIONANDO' : 'CON PROBLEMAS'}
              </h3>
              <p className={`text-sm ${
                quickStatus.status === 'HEALTHY' ? 'text-green-700' : 'text-red-700'
              }`}>
                {quickStatus.message}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  quickStatus.data_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  Datos: {quickStatus.data_available ? 'Disponibles' : 'No Disponibles'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(quickStatus.timestamp).toLocaleString('es-MX')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Diagnostic Report */}
      {report && (
        <div className="space-y-6">
          {/* Overall Status */}
          <div className={`rounded-lg p-6 border-2 ${getOverallStatusColor(report.overall_status)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Estado General del Dashboard</h2>
              <div className="text-right">
                <div className="text-2xl font-bold">{report.overall_status}</div>
                <div className="text-sm opacity-75">{report.execution_time_ms}ms</div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{report.passed}</div>
                <div className="text-sm text-gray-600">Exitosas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{report.warnings}</div>
                <div className="text-sm text-gray-600">Advertencias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{report.failed}</div>
                <div className="text-sm text-gray-600">Fallas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{report.total_tests}</div>
                <div className="text-sm text-gray-600">Total Pruebas</div>
              </div>
            </div>

            {/* Critical Issues Alert */}
            {report.critical_issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-800 mb-2">
                  🚨 Problemas Críticos Detectados ({report.critical_issues.length})
                </h3>
                <ul className="space-y-1">
                  {report.critical_issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{issue.step}: {issue.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Recomendaciones de Solución:</h3>
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

          {/* Detailed Test Results */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Resultados Detallados por Categoría</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {report.results.map((result, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {getCategoryIcon(result.category)}
                      {getStatusIcon(result.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{result.step}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(result.priority)}`}>
                            {result.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(result.timestamp).toLocaleTimeString('es-MX')}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-2 ${
                        result.status === 'PASS' ? 'text-green-700' :
                        result.status === 'WARNING' ? 'text-yellow-700' :
                        result.status === 'INFO' ? 'text-blue-700' :
                        'text-red-700'
                      }`}>
                        {result.message}
                      </p>

                      {result.solution && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                          <h5 className="text-sm font-medium text-blue-800 mb-1">Solución Recomendada:</h5>
                          <p className="text-sm text-blue-700">{result.solution}</p>
                        </div>
                      )}
                      
                      {result.details && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            Ver detalles técnicos
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Acciones Requeridas</h3>
            
            <div className="space-y-4">
              {/* High Priority Actions */}
              {report.results.filter(r => r.status === 'FAIL' && r.priority === 'HIGH').length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">🚨 Acciones Críticas (Resolver Inmediatamente)</h4>
                  <ul className="space-y-2">
                    {report.results
                      .filter(r => r.status === 'FAIL' && r.priority === 'HIGH')
                      .map((result, index) => (
                        <li key={index} className="text-sm text-red-700">
                          <strong>{result.step}:</strong> {result.solution || result.message}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Medium Priority Actions */}
              {report.results.filter(r => (r.status === 'FAIL' || r.status === 'WARNING') && r.priority === 'MEDIUM').length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Acciones Importantes (Resolver Pronto)</h4>
                  <ul className="space-y-2">
                    {report.results
                      .filter(r => (r.status === 'FAIL' || r.status === 'WARNING') && r.priority === 'MEDIUM')
                      .map((result, index) => (
                        <li key={index} className="text-sm text-yellow-700">
                          <strong>{result.step}:</strong> {result.solution || result.message}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Success Summary */}
              {report.passed > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Componentes Funcionando Correctamente</h4>
                  <div className="text-sm text-green-700">
                    {report.passed} de {report.total_tests} validaciones pasaron exitosamente.
                  </div>
                </div>
              )}
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
                Sistema de Diagnóstico de Dashboard
              </h3>
              <p className="text-blue-700 mb-4">
                Esta herramienta ejecuta una validación sistemática de 9 pasos para identificar 
                por qué el dashboard no muestra datos a pesar de que la base de datos contiene información.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <h4 className="font-medium mb-2">Validaciones de Infraestructura:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Variables de entorno y configuración</li>
                    <li>• Conectividad de base de datos</li>
                    <li>• Políticas de seguridad (RLS)</li>
                    <li>• Estado de autenticación</li>
                    <li>• Endpoints de API</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Validaciones de Datos:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Funciones de recuperación de datos</li>
                    <li>• Esquema de base de datos</li>
                    <li>• Conteo de registros</li>
                    <li>• Carga de datos en componentes</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Recomendación:</strong> Ejecute primero la "Verificación Rápida" para un diagnóstico 
                  inmediato, luego use el "Diagnóstico Completo\" para un análisis detallado.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isRunning && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ejecutando Diagnóstico Completo</h3>
            <p className="text-gray-600">
              Validando 9 componentes críticos del sistema...
            </p>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}