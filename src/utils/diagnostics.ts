/**
 * Database Connectivity and Application Diagnostics
 * Comprehensive testing suite for database connectivity issues
 */

import { supabase } from '../lib/supabase';

export interface DiagnosticResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  timestamp: string;
}

export interface ConnectivityReport {
  overall_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  tests: DiagnosticResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
  recommendations: string[];
}

/**
 * Test 1: Environment Variables Validation
 */
export async function testEnvironmentVariables(): Promise<DiagnosticResult> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return {
        test: 'Environment Variables',
        status: 'FAIL',
        message: 'VITE_SUPABASE_URL is not defined',
        timestamp: new Date().toISOString()
      };
    }

    if (!supabaseKey) {
      return {
        test: 'Environment Variables',
        status: 'FAIL',
        message: 'VITE_SUPABASE_ANON_KEY is not defined',
        timestamp: new Date().toISOString()
      };
    }

    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch {
      return {
        test: 'Environment Variables',
        status: 'FAIL',
        message: 'VITE_SUPABASE_URL is not a valid URL',
        details: { url: supabaseUrl },
        timestamp: new Date().toISOString()
      };
    }

    // Check if URL is accessible
    const urlCheck = supabaseUrl.includes('supabase.co') && supabaseUrl.startsWith('https://');
    
    return {
      test: 'Environment Variables',
      status: urlCheck ? 'PASS' : 'WARNING',
      message: urlCheck ? 'Environment variables are properly configured' : 'URL format may be incorrect',
      details: {
        url: supabaseUrl,
        keyLength: supabaseKey.length,
        keyPrefix: supabaseKey.substring(0, 20) + '...'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'Environment Variables',
      status: 'FAIL',
      message: `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 2: Database Connection Test
 */
export async function testDatabaseConnection(): Promise<DiagnosticResult> {
  try {
    const startTime = Date.now();
    
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        test: 'Database Connection',
        status: 'FAIL',
        message: `Database connection failed: ${error.message}`,
        details: {
          error_code: error.code,
          error_details: error.details,
          response_time_ms: responseTime
        },
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'Database Connection',
      status: 'PASS',
      message: 'Database connection successful',
      details: {
        response_time_ms: responseTime,
        connection_status: 'active'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'Database Connection',
      status: 'FAIL',
      message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 3: Row Level Security Policies Test
 */
export async function testRLSPolicies(): Promise<DiagnosticResult> {
  try {
    const tests = [];

    // Test clients table access
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, nombre_comercial')
        .limit(5);

      tests.push({
        table: 'clients',
        success: !clientsError,
        error: clientsError?.message,
        recordCount: clientsData?.length || 0
      });
    } catch (error) {
      tests.push({
        table: 'clients',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    // Test events table access
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, clave_evento')
        .limit(5);

      tests.push({
        table: 'events',
        success: !eventsError,
        error: eventsError?.message,
        recordCount: eventsData?.length || 0
      });
    } catch (error) {
      tests.push({
        table: 'events',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    // Test expenses table access
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('id, concepto')
        .limit(5);

      tests.push({
        table: 'expenses',
        success: !expensesError,
        error: expensesError?.message,
        recordCount: expensesData?.length || 0
      });
    } catch (error) {
      tests.push({
        table: 'expenses',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    const failedTests = tests.filter(test => !test.success);
    const totalRecords = tests.reduce((sum, test) => sum + test.recordCount, 0);

    if (failedTests.length > 0) {
      return {
        test: 'RLS Policies',
        status: 'FAIL',
        message: `${failedTests.length} table(s) have access issues`,
        details: {
          failed_tables: failedTests,
          all_tests: tests,
          total_accessible_records: totalRecords
        },
        timestamp: new Date().toISOString()
      };
    }

    if (totalRecords === 0) {
      return {
        test: 'RLS Policies',
        status: 'WARNING',
        message: 'All tables accessible but no data found',
        details: { tests, total_records: totalRecords },
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'RLS Policies',
      status: 'PASS',
      message: `All tables accessible with ${totalRecords} total records found`,
      details: { tests, total_records: totalRecords },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'RLS Policies',
      status: 'FAIL',
      message: `RLS policy test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 4: Authentication State Test
 */
export async function testAuthenticationState(): Promise<DiagnosticResult> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return {
        test: 'Authentication State',
        status: 'WARNING',
        message: `Authentication check failed: ${error.message}`,
        details: { error_code: error.message },
        timestamp: new Date().toISOString()
      };
    }

    if (!user) {
      return {
        test: 'Authentication State',
        status: 'WARNING',
        message: 'No authenticated user found - using anonymous access',
        details: { user_state: 'anonymous' },
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'Authentication State',
      status: 'PASS',
      message: 'User is authenticated',
      details: {
        user_id: user.id,
        email: user.email,
        user_state: 'authenticated'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'Authentication State',
      status: 'FAIL',
      message: `Authentication test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 5: Data Retrieval Functions Test
 */
export async function testDataRetrievalFunctions(): Promise<DiagnosticResult> {
  try {
    const tests = [];

    // Test clients with relationships
    try {
      const { data: clientsWithEvents, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          nombre_comercial,
          events:events(count)
        `)
        .limit(3);

      tests.push({
        function: 'clients_with_relationships',
        success: !clientsError,
        error: clientsError?.message,
        recordCount: clientsWithEvents?.length || 0
      });
    } catch (error) {
      tests.push({
        function: 'clients_with_relationships',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    // Test events with client data
    try {
      const { data: eventsWithClients, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          clave_evento,
          nombre_proyecto,
          total,
          status_pago,
          client:clients(nombre_comercial, rfc)
        `)
        .limit(5);

      tests.push({
        function: 'events_with_clients',
        success: !eventsError,
        error: eventsError?.message,
        recordCount: eventsWithClients?.length || 0
      });
    } catch (error) {
      tests.push({
        function: 'events_with_clients',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    // Test expenses with event data
    try {
      const { data: expensesWithEvents, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          concepto,
          monto_a_pagar,
          category,
          event:events(clave_evento)
        `)
        .is('deleted_at', null)
        .limit(5);

      tests.push({
        function: 'expenses_with_events',
        success: !expensesError,
        error: expensesError?.message,
        recordCount: expensesWithEvents?.length || 0
      });
    } catch (error) {
      tests.push({
        function: 'expenses_with_events',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    const failedTests = tests.filter(test => !test.success);
    const totalRecords = tests.reduce((sum, test) => sum + test.recordCount, 0);

    if (failedTests.length > 0) {
      return {
        test: 'Data Retrieval Functions',
        status: 'FAIL',
        message: `${failedTests.length} data retrieval function(s) failed`,
        details: {
          failed_functions: failedTests,
          all_tests: tests,
          total_records_retrieved: totalRecords
        },
        timestamp: new Date().toISOString()
      };
    }

    if (totalRecords === 0) {
      return {
        test: 'Data Retrieval Functions',
        status: 'WARNING',
        message: 'All functions work but no data retrieved',
        details: { tests, total_records: totalRecords },
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'Data Retrieval Functions',
      status: 'PASS',
      message: `All data retrieval functions working - ${totalRecords} records retrieved`,
      details: { tests, total_records: totalRecords },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'Data Retrieval Functions',
      status: 'FAIL',
      message: `Data retrieval test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 6: Database Schema Validation
 */
export async function testDatabaseSchema(): Promise<DiagnosticResult> {
  try {
    const requiredTables = ['users', 'clients', 'events', 'expenses', 'activity_log'];
    const tableTests = [];

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        tableTests.push({
          table: tableName,
          exists: !error,
          error: error?.message,
          hasData: (data?.length || 0) > 0
        });
      } catch (error) {
        tableTests.push({
          table: tableName,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          hasData: false
        });
      }
    }

    const missingTables = tableTests.filter(test => !test.exists);
    const emptyTables = tableTests.filter(test => test.exists && !test.hasData);

    if (missingTables.length > 0) {
      return {
        test: 'Database Schema',
        status: 'FAIL',
        message: `${missingTables.length} required table(s) missing or inaccessible`,
        details: {
          missing_tables: missingTables,
          all_table_tests: tableTests
        },
        timestamp: new Date().toISOString()
      };
    }

    if (emptyTables.length === requiredTables.length) {
      return {
        test: 'Database Schema',
        status: 'WARNING',
        message: 'All tables exist but contain no data',
        details: { table_tests: tableTests },
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'Database Schema',
      status: 'PASS',
      message: `All required tables accessible, ${requiredTables.length - emptyTables.length} contain data`,
      details: { table_tests: tableTests },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'Database Schema',
      status: 'FAIL',
      message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 7: API Endpoints Test
 */
export async function testAPIEndpoints(): Promise<DiagnosticResult> {
  try {
    const endpoints = [
      {
        name: 'REST API Health',
        test: async () => {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          });
          return { status: response.status, ok: response.ok };
        }
      },
      {
        name: 'Auth API Health',
        test: async () => {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            }
          });
          return { status: response.status, ok: response.ok };
        }
      }
    ];

    const results = [];
    for (const endpoint of endpoints) {
      try {
        const result = await endpoint.test();
        results.push({
          endpoint: endpoint.name,
          status: result.status,
          success: result.ok
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const failedEndpoints = results.filter(r => !r.success);

    if (failedEndpoints.length > 0) {
      return {
        test: 'API Endpoints',
        status: 'FAIL',
        message: `${failedEndpoints.length} API endpoint(s) failed`,
        details: { endpoint_tests: results },
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'API Endpoints',
      status: 'PASS',
      message: 'All API endpoints responding correctly',
      details: { endpoint_tests: results },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'API Endpoints',
      status: 'FAIL',
      message: `API endpoint test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 8: Data Count Verification
 */
export async function testDataCounts(): Promise<DiagnosticResult> {
  try {
    const counts = [];

    // Count records in each table
    const tables = ['clients', 'events', 'expenses', 'users', 'activity_log'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        counts.push({
          table,
          count: count || 0,
          error: error?.message
        });
      } catch (error) {
        counts.push({
          table,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const totalRecords = counts.reduce((sum, item) => sum + item.count, 0);
    const tablesWithErrors = counts.filter(item => item.error);

    if (tablesWithErrors.length > 0) {
      return {
        test: 'Data Count Verification',
        status: 'FAIL',
        message: `Cannot count records in ${tablesWithErrors.length} table(s)`,
        details: { table_counts: counts, total_records: totalRecords },
        timestamp: new Date().toISOString()
      };
    }

    if (totalRecords === 0) {
      return {
        test: 'Data Count Verification',
        status: 'WARNING',
        message: 'Database is empty - no records found in any table',
        details: { table_counts: counts, total_records: totalRecords },
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'Data Count Verification',
      status: 'PASS',
      message: `Database contains ${totalRecords} total records across all tables`,
      details: { table_counts: counts, total_records: totalRecords },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'Data Count Verification',
      status: 'FAIL',
      message: `Data count test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 9: Component Data Loading Test
 */
export async function testComponentDataLoading(): Promise<DiagnosticResult> {
  try {
    // Simulate the exact queries used by main components
    const componentTests = [];

    // Dashboard query simulation
    try {
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*),
          expenses:expenses(*)
        `);

      componentTests.push({
        component: 'Dashboard',
        success: !dashboardError,
        error: dashboardError?.message,
        recordCount: dashboardData?.length || 0
      });
    } catch (error) {
      componentTests.push({
        component: 'Dashboard',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    // BillingMaster query simulation
    try {
      const { data: billingData, error: billingError } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });

      componentTests.push({
        component: 'BillingMaster',
        success: !billingError,
        error: billingError?.message,
        recordCount: billingData?.length || 0
      });
    } catch (error) {
      componentTests.push({
        component: 'BillingMaster',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    // Clients query simulation
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      componentTests.push({
        component: 'Clients',
        success: !clientsError,
        error: clientsError?.message,
        recordCount: clientsData?.length || 0
      });
    } catch (error) {
      componentTests.push({
        component: 'Clients',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordCount: 0
      });
    }

    const failedComponents = componentTests.filter(test => !test.success);
    const totalRecords = componentTests.reduce((sum, test) => sum + test.recordCount, 0);

    if (failedComponents.length > 0) {
      return {
        test: 'Component Data Loading',
        status: 'FAIL',
        message: `${failedComponents.length} component(s) cannot load data`,
        details: {
          failed_components: failedComponents,
          all_component_tests: componentTests,
          total_records_loaded: totalRecords
        },
        timestamp: new Date().toISOString()
      };
    }

    if (totalRecords === 0) {
      return {
        test: 'Component Data Loading',
        status: 'WARNING',
        message: 'Components can access database but no data available',
        details: { component_tests: componentTests, total_records: totalRecords },
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'Component Data Loading',
      status: 'PASS',
      message: `All components can load data successfully - ${totalRecords} records available`,
      details: { component_tests: componentTests, total_records: totalRecords },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'Component Data Loading',
      status: 'FAIL',
      message: `Component data loading test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Run Complete Diagnostic Suite
 */
export async function runCompleteDiagnostics(): Promise<ConnectivityReport> {
  console.log('🔍 Starting comprehensive database connectivity diagnostics...');
  
  const tests: DiagnosticResult[] = [];
  
  // Run all diagnostic tests
  tests.push(await testEnvironmentVariables());
  tests.push(await testDatabaseConnection());
  tests.push(await testRLSPolicies());
  tests.push(await testAuthenticationState());
  tests.push(await testDataRetrievalFunctions());
  tests.push(await testDatabaseSchema());
  tests.push(await testAPIEndpoints());
  tests.push(await testDataCounts());
  tests.push(await testComponentDataLoading());

  // Calculate summary
  const passed = tests.filter(test => test.status === 'PASS').length;
  const failed = tests.filter(test => test.status === 'FAIL').length;
  const warnings = tests.filter(test => test.status === 'WARNING').length;

  // Determine overall status
  let overall_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  if (failed > 0) {
    overall_status = 'CRITICAL';
  } else if (warnings > 0) {
    overall_status = 'DEGRADED';
  } else {
    overall_status = 'HEALTHY';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  tests.forEach(test => {
    if (test.status === 'FAIL') {
      switch (test.test) {
        case 'Environment Variables':
          recommendations.push('Configure missing environment variables in .env file');
          break;
        case 'Database Connection':
          recommendations.push('Check Supabase project status and network connectivity');
          break;
        case 'RLS Policies':
          recommendations.push('Review and update Row Level Security policies for data access');
          break;
        case 'Data Retrieval Functions':
          recommendations.push('Debug specific component queries and fix data loading issues');
          break;
        case 'Database Schema':
          recommendations.push('Run database migrations to create missing tables');
          break;
        case 'API Endpoints':
          recommendations.push('Verify Supabase project configuration and API keys');
          break;
      }
    } else if (test.status === 'WARNING') {
      if (test.test === 'Data Count Verification' && test.message.includes('empty')) {
        recommendations.push('Generate test data or import production data to populate database');
      }
      if (test.test === 'Authentication State' && test.message.includes('anonymous')) {
        recommendations.push('Implement proper authentication flow for better data access');
      }
    }
  });

  // Add general recommendations based on overall status
  if (overall_status === 'CRITICAL') {
    recommendations.push('URGENT: Fix critical database connectivity issues before proceeding');
  } else if (overall_status === 'DEGRADED') {
    recommendations.push('Address warnings to ensure optimal application performance');
  }

  return {
    overall_status,
    tests,
    summary: { passed, failed, warnings },
    recommendations
  };
}

/**
 * Quick Health Check (for monitoring)
 */
export async function quickHealthCheck(): Promise<{
  status: 'HEALTHY' | 'UNHEALTHY';
  message: string;
  timestamp: string;
}> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (error) {
      return {
        status: 'UNHEALTHY',
        message: `Database connection failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      status: 'HEALTHY',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'UNHEALTHY',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}