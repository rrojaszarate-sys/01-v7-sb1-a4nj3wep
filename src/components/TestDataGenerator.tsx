import React, { useState } from 'react';
import { generateTestData } from '../utils/testDataGenerator';
import { Database, Trash2, Plus, BarChart3 } from 'lucide-react';

export function TestDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      clients: number;
      events: number;
      expenses: number;
    };
  } | null>(null);

  const handleGenerateData = async () => {
    if (!confirm('¿Está seguro de que desea generar datos de prueba? Esto eliminará todos los datos existentes.')) {
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const generationResult = await generateTestData();
      setResult(generationResult);
    } catch (error) {
      setResult({
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Generador de Datos de Prueba</h2>
      </div>

      <div className="space-y-6">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Datos que se generarán:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className="flex items-center">
              <Plus className="h-3 w-3 mr-2" />
              20 clientes con datos realistas mexicanos
            </li>
            <li className="flex items-center">
              <Plus className="h-3 w-3 mr-2" />
              2,480 proyectos (124 por cliente) distribuidos mensualmente
            </li>
            <li className="flex items-center">
              <Plus className="h-3 w-3 mr-2" />
              24,800 gastos (mínimo 2 de cada tipo por proyecto)
            </li>
            <li className="flex items-center">
              <BarChart3 className="h-3 w-3 mr-2" />
              Datos financieros coherentes para análisis de gráficas
            </li>
          </ul>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Trash2 className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Advertencia Importante
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Esta acción eliminará TODOS los datos existentes (clientes, eventos, gastos) 
                  y los reemplazará con datos de prueba. Esta operación no se puede deshacer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerateData}
            disabled={isGenerating}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generando Datos...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Generar Datos de Prueba
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Datos Generados Exitosamente' : 'Error en la Generación'}
                </h3>
                <div className={`mt-2 text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p>{result.message}</p>
                  {result.success && result.stats && (
                    <div className="mt-2 space-y-1">
                      <p>• {result.stats.clients} clientes creados</p>
                      <p>• {result.stats.events} eventos creados</p>
                      <p>• {result.stats.expenses} gastos creados</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">
            Después de generar los datos:
          </h3>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Vaya al Dashboard para ver las nuevas gráficas 3D</li>
            <li>Explore el Master de Facturación con los nuevos eventos</li>
            <li>Pruebe el flujo de estados secuencial</li>
            <li>Verifique los cálculos financieros automáticos</li>
          </ol>
        </div>
      </div>
    </div>
  );
}