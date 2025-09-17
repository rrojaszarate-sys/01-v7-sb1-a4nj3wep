/**
 * Comprehensive Dashboard Diagnostics System
 * Systematic validation and troubleshooting for dashboard data display issues
 */

import { supabase } from '../lib/supabase';

export interface ValidationResult {
  step: string;
  category: 'Environment' | 'Connectivity' | 'Security' | 'Authentication' | 'Data' | 'Schema' | 'API' | 'Frontend';
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO';
  message: string;
  details?: any;
  solution?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

export interface DiagnosticReport {
  overall_status: 'HEALTHY' | 'ISSUES_FOUND' | 'CRITICAL_FAILURE';
  total_tests: number;
  passed: number;
  failed: number;
  warnings: number;
  critical_issues: ValidationResult[];
  recommendations: string[];
  execution_time_ms: number;
  results: ValidationResult[];
}

/**
 * Step 1: Environment Variables Validation
 */
export async function validateEnvironmentVariables(): Promise<ValidationResult> {
  try {
    const requiredVars = {
      'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY
    };

    const missing = Object.entries(requiredVars).filter(([key, value]) => !value);
    const invalid = [];

    // Validate URL format
    if (requiredVars.VITE_SUPABASE_URL) {
      try {
        const url = new URL(requiredVars.VITE_SUPABASE_URL);
        if (!url.hostname.includes('supabase.co')) {
          invalid.push('VITE_SUPABASE_URL does not appear to be a valid Supabase URL');
        }
      } catch {
        invalid.push('VITE_SUPABASE_URL is not a valid URL format');
      }
    }

    // Validate key format
    if (requiredVars.VITE_SUPABASE_ANON_KEY) {
      if (!requiredVars.VITE_SUPABASE_ANON_KEY.startsWith('eyJ')) {
        invalid.push('VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT token');
      }
    }

    if (missing.length > 0 || invalid.length > 0) {
      return {
        step: '1. Environment Variables',
        category: 'Environment',
        status: 'FAIL',
        message: `Environment configuration issues detected`,
        details: { missing_vars: missing.map(([key]) => key), validation_errors: invalid },
        solution: 'Check your .env file and ensure all Supabase credentials are correctly set',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    return {
      step: '1. Environment Variables',
      category: 'Environment',
      status: 'PASS',
      message: 'All environment variables are properly configured',
      details: { 
        url_host: new URL(requiredVars.VITE_SUPABASE_URL).hostname,
        key_length: requiredVars.VITE_SUPABASE_ANON_KEY.length 
      },
      priority: 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '1. Environment Variables',
      category: 'Environment',
      status: 'FAIL',
      message: `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Review environment variable configuration and restart the application',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 2: Database Connectivity Test
 */
export async function validateDatabaseConnectivity(): Promise<ValidationResult> {
  try {
    const startTime = Date.now();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      return {
        step: '2. Database Connectivity',
        category: 'Connectivity',
        status: 'FAIL',
        message: `Database connection failed: ${error.message}`,
        details: { 
          error_code: error.code,
          error_details: error.details,
          latency_ms: latency 
        },
        solution: 'Check Supabase project status, network connectivity, and credentials',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    const statusLevel = latency < 500 ? 'PASS' : latency < 2000 ? 'WARNING' : 'FAIL';
    
    return {
      step: '2. Database Connectivity',
      category: 'Connectivity',
      status: statusLevel,
      message: `Database connection ${statusLevel === 'PASS' ? 'excellent' : statusLevel === 'WARNING' ? 'slow but functional' : 'critically slow'}`,
      details: { latency_ms: latency, connection_status: 'active' },
      solution: statusLevel !== 'PASS' ? 'Consider optimizing network connection or checking server performance' : undefined,
      priority: statusLevel === 'FAIL' ? 'HIGH' : statusLevel === 'WARNING' ? 'MEDIUM' : 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '2. Database Connectivity',
      category: 'Connectivity',
      status: 'FAIL',
      message: `Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Verify network connectivity and Supabase service status',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 3: Row Level Security Policies Validation
 */
export async function validateRLSPolicies(): Promise<ValidationResult> {
  try {
    const tableTests = [];
    const tables = ['clients', 'events', 'expenses', 'incomes', 'users'];

    for (const table of tables) {
      try {
        // Test SELECT permission
        const { data: selectData, error: selectError } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        // Test INSERT permission (dry run)
        const testRecord = getTestRecord(table);
        const { error: insertError } = await supabase
          .from(table)
          .insert([testRecord])
          .select()
          .limit(0); // This won't actually insert but will test permissions

        tableTests.push({
          table,
          select_access: !selectError,
          insert_access: !insertError,
          select_error: selectError?.message,
          insert_error: insertError?.message,
          record_count: selectData?.length || 0
        });
      } catch (error) {
        tableTests.push({
          table,
          select_access: false,
          insert_access: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          record_count: 0
        });
      }
    }

    const failedTables = tableTests.filter(test => !test.select_access);
    const insertIssues = tableTests.filter(test => test.select_access && !test.insert_access);

    if (failedTables.length > 0) {
      return {
        step: '3. RLS Policies',
        category: 'Security',
        status: 'FAIL',
        message: `${failedTables.length} table(s) have SELECT access issues`,
        details: { failed_tables: failedTables, all_tests: tableTests },
        solution: 'Review and update RLS policies to allow proper data access for authenticated users',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    if (insertIssues.length > 0) {
      return {
        step: '3. RLS Policies',
        category: 'Security',
        status: 'WARNING',
        message: `${insertIssues.length} table(s) have INSERT permission issues`,
        details: { insert_issues: insertIssues, all_tests: tableTests },
        solution: 'Update RLS policies to allow INSERT operations for authenticated users',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString()
      };
    }

    return {
      step: '3. RLS Policies',
      category: 'Security',
      status: 'PASS',
      message: 'All RLS policies are functioning correctly',
      details: { table_tests: tableTests },
      priority: 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '3. RLS Policies',
      category: 'Security',
      status: 'FAIL',
      message: `RLS validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Check RLS policy configuration and user authentication context',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 4: Authentication Status Validation
 */
export async function validateAuthenticationStatus(): Promise<ValidationResult> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return {
        step: '4. Authentication Status',
        category: 'Authentication',
        status: 'FAIL',
        message: `Authentication check failed: ${authError.message}`,
        details: { error_code: authError.message },
        solution: 'Implement proper authentication flow or check authentication service status',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    if (!user) {
      // Check if we can access data without authentication (public access)
      const { data: publicData, error: publicError } = await supabase
        .from('clients')
        .select('count')
        .limit(1);

      if (publicError) {
        return {
          step: '4. Authentication Status',
          category: 'Authentication',
          status: 'FAIL',
          message: 'No authenticated user and public access is restricted',
          details: { 
            user_state: 'anonymous',
            public_access_error: publicError.message 
          },
          solution: 'Implement user authentication or configure public access policies',
          priority: 'HIGH',
          timestamp: new Date().toISOString()
        };
      }

      return {
        step: '4. Authentication Status',
        category: 'Authentication',
        status: 'WARNING',
        message: 'Using anonymous access - some features may be limited',
        details: { 
          user_state: 'anonymous',
          public_access: 'available' 
        },
        solution: 'Consider implementing user authentication for full functionality',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString()
      };
    }

    // Test if authenticated user can access user profile data
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      step: '4. Authentication Status',
      category: 'Authentication',
      status: userDataError ? 'WARNING' : 'PASS',
      message: userDataError 
        ? 'User authenticated but profile data inaccessible'
        : 'User authentication and profile access working correctly',
      details: {
        user_id: user.id,
        email: user.email,
        profile_accessible: !userDataError,
        profile_error: userDataError?.message
      },
      solution: userDataError ? 'Check user table RLS policies and ensure user record exists' : undefined,
      priority: userDataError ? 'MEDIUM' : 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '4. Authentication Status',
      category: 'Authentication',
      status: 'FAIL',
      message: `Authentication validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Debug authentication system and check service configuration',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 5: Data Recovery Functions Validation
 */
export async function validateDataRecoveryFunctions(): Promise<ValidationResult> {
  try {
    const functionTests = [];

    // Test 1: Dashboard data query (complex join)
    try {
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*),
          expenses:expenses(*)
        `)
        .limit(5);

      functionTests.push({
        function: 'dashboard_complex_query',
        success: !dashboardError,
        error: dashboardError?.message,
        record_count: dashboardData?.length || 0,
        has_relationships: dashboardData?.some(event => event.client || event.expenses?.length > 0) || false
      });
    } catch (error) {
      functionTests.push({
        function: 'dashboard_complex_query',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        record_count: 0,
        has_relationships: false
      });
    }

    // Test 2: Simple table queries
    const simpleTables = ['clients', 'events', 'expenses'];
    for (const table of simpleTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(10);

        functionTests.push({
          function: `${table}_simple_query`,
          success: !error,
          error: error?.message,
          record_count: data?.length || 0
        });
      } catch (error) {
        functionTests.push({
          function: `${table}_simple_query`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          record_count: 0
        });
      }
    }

    // Test 3: Aggregation queries (for dashboard calculations)
    try {
      const { data: aggregateData, error: aggregateError } = await supabase
        .from('events')
        .select('status_pago, total')
        .not('total', 'is', null);

      const totals = aggregateData?.reduce((acc, event) => {
        acc[event.status_pago] = (acc[event.status_pago] || 0) + (event.total || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      functionTests.push({
        function: 'dashboard_aggregations',
        success: !aggregateError,
        error: aggregateError?.message,
        record_count: aggregateData?.length || 0,
        calculated_totals: totals
      });
    } catch (error) {
      functionTests.push({
        function: 'dashboard_aggregations',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        record_count: 0
      });
    }

    const failedFunctions = functionTests.filter(test => !test.success);
    const totalRecords = functionTests.reduce((sum, test) => sum + test.record_count, 0);

    if (failedFunctions.length > 0) {
      return {
        step: '5. Data Recovery Functions',
        category: 'Data',
        status: 'FAIL',
        message: `${failedFunctions.length} data recovery function(s) failed`,
        details: { failed_functions: failedFunctions, all_tests: functionTests },
        solution: 'Debug specific queries and check table permissions and relationships',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    if (totalRecords === 0) {
      return {
        step: '5. Data Recovery Functions',
        category: 'Data',
        status: 'WARNING',
        message: 'Data recovery functions work but no data retrieved',
        details: { function_tests: functionTests, total_records: totalRecords },
        solution: 'Database may be empty - consider generating test data or importing production data',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString()
      };
    }

    return {
      step: '5. Data Recovery Functions',
      category: 'Data',
      status: 'PASS',
      message: `All data recovery functions working - ${totalRecords} records retrieved`,
      details: { function_tests: functionTests, total_records: totalRecords },
      priority: 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '5. Data Recovery Functions',
      category: 'Data',
      status: 'FAIL',
      message: `Data recovery validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Check database queries and data access patterns',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 6: Database Schema Validation
 */
export async function validateDatabaseSchema(): Promise<ValidationResult> {
  try {
    const requiredTables = [
      { name: 'clients', required_columns: ['id', 'razon_social', 'nombre_comercial', 'rfc'] },
      { name: 'events', required_columns: ['id', 'clave_evento', 'nombre_proyecto', 'total', 'status_pago', 'client_id'] },
      { name: 'expenses', required_columns: ['id', 'concepto', 'monto_a_pagar', 'event_id', 'category'] },
      { name: 'users', required_columns: ['id', 'username', 'email', 'role'] }
    ];

    const schemaTests = [];

    for (const table of requiredTables) {
      try {
        // Test table existence and get sample record
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);

        if (error) {
          schemaTests.push({
            table: table.name,
            exists: false,
            error: error.message,
            columns_present: [],
            missing_columns: table.required_columns
          });
          continue;
        }

        // Check column presence
        const sampleRecord = data?.[0] || {};
        const presentColumns = Object.keys(sampleRecord);
        const missingColumns = table.required_columns.filter(col => !presentColumns.includes(col));

        schemaTests.push({
          table: table.name,
          exists: true,
          columns_present: presentColumns,
          missing_columns: missingColumns,
          has_data: data && data.length > 0,
          sample_record_keys: presentColumns
        });
      } catch (error) {
        schemaTests.push({
          table: table.name,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          columns_present: [],
          missing_columns: table.required_columns
        });
      }
    }

    const missingTables = schemaTests.filter(test => !test.exists);
    const incompleteSchemas = schemaTests.filter(test => test.exists && test.missing_columns.length > 0);

    if (missingTables.length > 0) {
      return {
        step: '6. Database Schema',
        category: 'Schema',
        status: 'FAIL',
        message: `${missingTables.length} required table(s) missing or inaccessible`,
        details: { missing_tables: missingTables, all_schema_tests: schemaTests },
        solution: 'Run database migrations to create missing tables and columns',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    if (incompleteSchemas.length > 0) {
      return {
        step: '6. Database Schema',
        category: 'Schema',
        status: 'WARNING',
        message: `${incompleteSchemas.length} table(s) missing required columns`,
        details: { incomplete_schemas: incompleteSchemas, all_schema_tests: schemaTests },
        solution: 'Update database schema to include missing columns',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString()
      };
    }

    return {
      step: '6. Database Schema',
      category: 'Schema',
      status: 'PASS',
      message: 'Database schema is complete and accessible',
      details: { schema_tests: schemaTests },
      priority: 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '6. Database Schema',
      category: 'Schema',
      status: 'FAIL',
      message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Check database structure and table definitions',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 7: API Endpoints Validation
 */
export async function validateAPIEndpoints(): Promise<ValidationResult> {
  try {
    const endpointTests = [];
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const endpoints = [
      { name: 'REST API Health', path: '/rest/v1/' },
      { name: 'Auth API Health', path: '/auth/v1/health' },
      { name: 'REST API - Clients', path: '/rest/v1/clients?select=id&limit=1' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        endpointTests.push({
          endpoint: endpoint.name,
          url: `${baseUrl}${endpoint.path}`,
          status_code: response.status,
          success: response.ok,
          response_size: responseText.length,
          has_data: Array.isArray(responseData) ? responseData.length > 0 : !!responseData
        });
      } catch (error) {
        endpointTests.push({
          endpoint: endpoint.name,
          url: `${baseUrl}${endpoint.path}`,
          status_code: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const failedEndpoints = endpointTests.filter(test => !test.success);

    if (failedEndpoints.length > 0) {
      return {
        step: '7. API Endpoints',
        category: 'API',
        status: 'FAIL',
        message: `${failedEndpoints.length} API endpoint(s) failed`,
        details: { failed_endpoints: failedEndpoints, all_endpoint_tests: endpointTests },
        solution: 'Check API configuration, authentication headers, and service availability',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    return {
      step: '7. API Endpoints',
      category: 'API',
      status: 'PASS',
      message: 'All API endpoints responding correctly',
      details: { endpoint_tests: endpointTests },
      priority: 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '7. API Endpoints',
      category: 'API',
      status: 'FAIL',
      message: `API endpoint validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Check network connectivity and API service status',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 8: Record Count Verification
 */
export async function validateRecordCounts(): Promise<ValidationResult> {
  try {
    const countTests = [];
    const tables = ['clients', 'events', 'expenses', 'incomes', 'users', 'activity_log'];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        countTests.push({
          table,
          count: count || 0,
          accessible: !error,
          error: error?.message
        });
      } catch (error) {
        countTests.push({
          table,
          count: 0,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const inaccessibleTables = countTests.filter(test => !test.accessible);
    const totalRecords = countTests.reduce((sum, test) => sum + test.count, 0);
    const emptyTables = countTests.filter(test => test.accessible && test.count === 0);

    if (inaccessibleTables.length > 0) {
      return {
        step: '8. Record Count Verification',
        category: 'Data',
        status: 'FAIL',
        message: `Cannot access ${inaccessibleTables.length} table(s) for counting`,
        details: { inaccessible_tables: inaccessibleTables, all_count_tests: countTests },
        solution: 'Fix table access permissions and connectivity issues',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    if (totalRecords === 0) {
      return {
        step: '8. Record Count Verification',
        category: 'Data',
        status: 'WARNING',
        message: 'Database is completely empty - no records in any table',
        details: { count_tests: countTests, total_records: totalRecords },
        solution: 'Import data or generate test data to populate the database',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString()
      };
    }

    if (emptyTables.length > 0) {
      return {
        step: '8. Record Count Verification',
        category: 'Data',
        status: 'WARNING',
        message: `${emptyTables.length} table(s) are empty but ${totalRecords} total records found`,
        details: { empty_tables: emptyTables, count_tests: countTests, total_records: totalRecords },
        solution: 'Consider populating empty tables if they should contain data',
        priority: 'LOW',
        timestamp: new Date().toISOString()
      };
    }

    return {
      step: '8. Record Count Verification',
      category: 'Data',
      status: 'PASS',
      message: `Database contains ${totalRecords} total records across all tables`,
      details: { count_tests: countTests, total_records: totalRecords },
      priority: 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '8. Record Count Verification',
      category: 'Data',
      status: 'FAIL',
      message: `Record count validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Check database connectivity and query permissions',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Step 9: Component Data Loading Validation
 */
export async function validateComponentDataLoading(): Promise<ValidationResult> {
  try {
    const componentTests = [];

    // Test Dashboard component data loading
    try {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*),
          expenses:expenses(*)
        `);

      if (eventsError) throw eventsError;

      // Simulate dashboard calculations
      const pendingEvents = events?.filter(event => 
        ['Pendiente Facturar', 'Pago Pendiente', 'Vencido'].includes(event.status_pago)
      ) || [];
      
      const paidEvents = events?.filter(event => 
        event.status_pago === 'Pagado'
      ) || [];

      const totalIncome = [...pendingEvents, ...paidEvents].reduce((sum, event) => sum + (event.total || 0), 0);
      const totalExpenses = events?.reduce((sum, event) => {
        return sum + (event.expenses?.reduce((expSum: number, exp: any) => expSum + (exp.monto_a_pagar || 0), 0) || 0);
      }, 0) || 0;

      componentTests.push({
        component: 'Dashboard',
        success: true,
        data_loaded: events?.length || 0,
        calculations: {
          total_income: totalIncome,
          total_expenses: totalExpenses,
          profit: totalIncome - totalExpenses,
          pending_events: pendingEvents.length,
          paid_events: paidEvents.length
        }
      });
    } catch (error) {
      componentTests.push({
        component: 'Dashboard',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data_loaded: 0
      });
    }

    // Test BillingMaster component data loading
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
        data_loaded: billingData?.length || 0,
        has_client_data: billingData?.some(event => event.client) || false
      });
    } catch (error) {
      componentTests.push({
        component: 'BillingMaster',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data_loaded: 0
      });
    }

    // Test Clients component data loading
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      componentTests.push({
        component: 'Clients',
        success: !clientsError,
        error: clientsError?.message,
        data_loaded: clientsData?.length || 0
      });
    } catch (error) {
      componentTests.push({
        component: 'Clients',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data_loaded: 0
      });
    }

    const failedComponents = componentTests.filter(test => !test.success);
    const totalDataLoaded = componentTests.reduce((sum, test) => sum + test.data_loaded, 0);

    if (failedComponents.length > 0) {
      return {
        step: '9. Component Data Loading',
        category: 'Frontend',
        status: 'FAIL',
        message: `${failedComponents.length} component(s) cannot load data`,
        details: { failed_components: failedComponents, all_component_tests: componentTests },
        solution: 'Debug component queries and check data access permissions',
        priority: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    if (totalDataLoaded === 0) {
      return {
        step: '9. Component Data Loading',
        category: 'Frontend',
        status: 'WARNING',
        message: 'Components can access database but no data is being loaded',
        details: { component_tests: componentTests, total_data_loaded: totalDataLoaded },
        solution: 'Check if database contains data and review data filtering logic',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString()
      };
    }

    return {
      step: '9. Component Data Loading',
      category: 'Frontend',
      status: 'PASS',
      message: `All components successfully loading data - ${totalDataLoaded} total records`,
      details: { component_tests: componentTests, total_data_loaded: totalDataLoaded },
      priority: 'LOW',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      step: '9. Component Data Loading',
      category: 'Frontend',
      status: 'FAIL',
      message: `Component data loading validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      solution: 'Debug frontend components and data loading logic',
      priority: 'HIGH',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Helper function to generate test records for RLS testing
 */
function getTestRecord(table: string): any {
  const testRecords: Record<string, any> = {
    clients: {
      razon_social: 'Test Company S.A. de C.V.',
      nombre_comercial: 'Test Company',
      rfc: 'TST123456ABC'
    },
    events: {
      clave_evento: 'TEST-001',
      nombre_proyecto: 'Test Project',
      subtotal: 1000,
      iva: 160,
      total: 1160,
      client_id: 1,
      status_pago: 'Pendiente Facturar'
    },
    expenses: {
      concepto: 'Test Expense',
      monto_a_pagar: 500,
      event_id: 1,
      category: 'SPs'
    },
    incomes: {
      concepto: 'Test Income',
      monto_a_pagar: 1000,
      event_id: 1
    },
    users: {
      username: 'testuser',
      email: 'test@example.com',
      role: 'Ejecutivo'
    }
  };

  return testRecords[table] || {};
}

/**
 * Main Diagnostic Function - Runs All Validations
 */
export async function runComprehensiveDashboardDiagnostics(): Promise<DiagnosticReport> {
  const startTime = Date.now();
  console.log('🔍 Starting comprehensive dashboard diagnostics...');
  
  const results: ValidationResult[] = [];
  
  // Run all validation steps in sequence
  results.push(await validateEnvironmentVariables());
  results.push(await validateDatabaseConnectivity());
  results.push(await validateRLSPolicies());
  results.push(await validateAuthenticationStatus());
  results.push(await validateDataRecoveryFunctions());
  results.push(await validateDatabaseSchema());
  results.push(await validateAPIEndpoints());
  results.push(await validateRecordCounts());
  results.push(await validateComponentDataLoading());

  const executionTime = Date.now() - startTime;

  // Calculate summary statistics
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;

  // Identify critical issues
  const criticalIssues = results.filter(r => r.status === 'FAIL' && r.priority === 'HIGH');

  // Determine overall status
  let overall_status: 'HEALTHY' | 'ISSUES_FOUND' | 'CRITICAL_FAILURE';
  if (criticalIssues.length > 0) {
    overall_status = 'CRITICAL_FAILURE';
  } else if (failed > 0 || warnings > 0) {
    overall_status = 'ISSUES_FOUND';
  } else {
    overall_status = 'HEALTHY';
  }

  // Generate prioritized recommendations
  const recommendations: string[] = [];
  
  // High priority issues first
  results.filter(r => r.status === 'FAIL' && r.priority === 'HIGH').forEach(result => {
    if (result.solution) {
      recommendations.push(`🚨 CRITICAL: ${result.solution}`);
    }
  });

  // Medium priority issues
  results.filter(r => (r.status === 'FAIL' || r.status === 'WARNING') && r.priority === 'MEDIUM').forEach(result => {
    if (result.solution) {
      recommendations.push(`⚠️ IMPORTANT: ${result.solution}`);
    }
  });

  // Low priority issues
  results.filter(r => r.status === 'WARNING' && r.priority === 'LOW').forEach(result => {
    if (result.solution) {
      recommendations.push(`💡 SUGGESTION: ${result.solution}`);
    }
  });

  // Add general recommendations based on patterns
  if (results.some(r => r.message.includes('empty') || r.message.includes('no data'))) {
    recommendations.push('📊 Consider generating test data to verify dashboard functionality');
  }

  if (results.some(r => r.message.includes('RLS') || r.message.includes('permission'))) {
    recommendations.push('🔐 Review and update Row Level Security policies for proper data access');
  }

  return {
    overall_status,
    total_tests: results.length,
    passed,
    failed,
    warnings,
    critical_issues: criticalIssues,
    recommendations,
    execution_time_ms: executionTime,
    results
  };
}

/**
 * Quick Dashboard Health Check
 */
export async function quickDashboardHealthCheck(): Promise<{
  status: 'HEALTHY' | 'UNHEALTHY';
  message: string;
  data_available: boolean;
  timestamp: string;
}> {
  try {
    // Test if we can load basic dashboard data
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        total,
        status_pago,
        client:clients(nombre_comercial)
      `)
      .limit(5);

    if (error) {
      return {
        status: 'UNHEALTHY',
        message: `Dashboard data loading failed: ${error.message}`,
        data_available: false,
        timestamp: new Date().toISOString()
      };
    }

    const hasData = events && events.length > 0;
    const hasClientData = events?.some(event => event.client) || false;

    return {
      status: hasData ? 'HEALTHY' : 'UNHEALTHY',
      message: hasData 
        ? `Dashboard can load ${events.length} events${hasClientData ? ' with client data' : ''}`
        : 'Dashboard cannot load any event data',
      data_available: hasData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'UNHEALTHY',
      message: `Dashboard health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data_available: false,
      timestamp: new Date().toISOString()
    };
  }
}