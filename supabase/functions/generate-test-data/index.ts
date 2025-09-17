import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestClient {
  razon_social: string;
  nombre_comercial: string;
  rfc: string;
}

interface TestEvent {
  clave_evento: string;
  nombre_proyecto: string;
  subtotal: number;
  iva: number;
  total: number;
  client_id: number;
  status_pago: 'Pendiente Facturar' | 'Pago Pendiente' | 'Vencido' | 'Pagado';
  created_at: string;
}

interface TestExpense {
  concepto: string;
  monto_a_pagar: number;
  event_id: number;
  category: 'SPs' | 'Combustible/Peaje' | 'RH' | 'Materiales' | 'Provisiones';
  created_at: string;
}

const EXPENSE_CATEGORIES = ['SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones'] as const;

const PROJECT_TYPES = [
  'Evento Corporativo', 'Conferencia Anual', 'Seminario Técnico', 'Workshop Especializado', 
  'Lanzamiento de Producto', 'Convención Nacional', 'Feria Comercial', 'Capacitación Empresarial', 
  'Reunión Anual', 'Presentación Ejecutiva', 'Congreso Internacional', 'Simposio Científico', 
  'Mesa Redonda', 'Networking Empresarial', 'Celebración Corporativa', 'Summit Tecnológico',
  'Expo Industrial', 'Forum de Negocios', 'Gala de Premiación', 'Conferencia de Prensa'
];

const EXPENSE_CONCEPTS = {
  'SPs': [
    'Servicios Profesionales Especializados', 'Consultoría Estratégica', 
    'Asesoría Técnica Avanzada', 'Coordinación de Proyecto', 'Gestión Ejecutiva'
  ],
  'Combustible/Peaje': [
    'Combustible Vehículos Oficiales', 'Peajes Autopista México-Querétaro', 
    'Transporte Terrestre Ejecutivo', 'Gasolina Flotilla', 'Casetas de Cobro'
  ],
  'RH': [
    'Honorarios Personal Especializado', 'Coordinadores de Evento', 
    'Staff Técnico Certificado', 'Personal de Apoyo Logístico', 'Facilitadores'
  ],
  'Materiales': [
    'Material Promocional Corporativo', 'Papelería Institucional', 
    'Equipos Audiovisuales', 'Suministros de Oficina', 'Mobiliario Temporal'
  ],
  'Provisiones': [
    'Catering Ejecutivo Premium', 'Refrigerios Coffee Break', 
    'Alimentos Gourmet', 'Bebidas Especializadas', 'Servicio de Banquetes'
  ]
};

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function generateTestClients(count: number): TestClient[] {
  const companyTypes = [
    'Grupo Empresarial', 'Corporativo', 'Industrias', 'Servicios', 'Tecnología',
    'Consultores', 'Desarrollos', 'Comercializadora', 'Distribuidora', 'Manufacturas',
    'Sistemas', 'Soluciones', 'Innovación', 'Estrategias', 'Proyectos'
  ];
  
  const sectors = [
    'Automotriz', 'Financiero', 'Tecnológico', 'Alimentario', 'Textil',
    'Farmacéutico', 'Construcción', 'Energético', 'Logístico', 'Educativo',
    'Telecomunicaciones', 'Retail', 'Hospitalario', 'Turístico', 'Agrícola'
  ];

  const mexicanCities = [
    'CDMX', 'GDL', 'MTY', 'PUE', 'TIJ', 'LEO', 'JUA', 'TOR', 'MER', 'AGU',
    'CUL', 'HER', 'VER', 'ACU', 'TAM', 'OAX', 'TUX', 'PAC', 'CAN', 'CHI'
  ];

  const clients: TestClient[] = [];
  
  for (let i = 1; i <= count; i++) {
    const companyType = companyTypes[Math.floor(Math.random() * companyTypes.length)];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const city = mexicanCities[Math.floor(Math.random() * mexicanCities.length)];
    const number = String(i).padStart(3, '0');
    
    const companyInitials = companyType.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const year = Math.floor(Math.random() * 30) + 70;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const homoclave = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                     String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                     Math.floor(Math.random() * 10);
    const rfc = `${companyInitials}${year}${month}${day}${homoclave}`;
    
    clients.push({
      razon_social: `${companyType} ${sector} ${city} ${number} S.A. de C.V.`,
      nombre_comercial: `${sector} ${companyType} ${city}`,
      rfc: rfc.substring(0, 13)
    });
  }
  
  return clients;
}

function generateTestEvents(clientIds: number[], eventsPerClient: number): TestEvent[] {
  const events: TestEvent[] = [];
  const currentYear = new Date().getFullYear();
  
  clientIds.forEach((clientId, clientIndex) => {
    for (let i = 1; i <= eventsPerClient; i++) {
      const month = ((i - 1) % 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const eventDate = new Date(currentYear, month - 1, day);
      
      const total = Math.floor(Math.random() * 450000) + 100000;
      const iva = Math.round(total * 0.16 * 100) / 100;
      const subtotal = Math.round((total - iva) * 100) / 100;
      
      const statusRandom = Math.random();
      let status_pago: TestEvent['status_pago'];
      if (statusRandom < 0.5) status_pago = 'Pagado';
      else if (statusRandom < 0.75) status_pago = 'Pago Pendiente';
      else if (statusRandom < 0.9) status_pago = 'Vencido';
      else status_pago = 'Pendiente Facturar';
      
      const projectType = PROJECT_TYPES[Math.floor(Math.random() * PROJECT_TYPES.length)];
      
      events.push({
        clave_evento: `EVT-${currentYear}-${String(clientIndex + 1).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
        nombre_proyecto: `${projectType} ${clientIndex + 1}-${i}`,
        subtotal,
        iva,
        total,
        client_id: clientId,
        status_pago,
        created_at: eventDate.toISOString()
      });
    }
  });
  
  return events;
}

function generateTestExpenses(eventIds: number[], events: TestEvent[]): TestExpense[] {
  const expenses: TestExpense[] = [];
  
  eventIds.forEach((eventId, index) => {
    const event = events[index];
    const eventDate = new Date(event.created_at);
    
    EXPENSE_CATEGORIES.forEach(category => {
      const conceptsForCategory = EXPENSE_CONCEPTS[category];
      
      for (let i = 0; i < 2; i++) {
        const concept = conceptsForCategory[Math.floor(Math.random() * conceptsForCategory.length)];
        
        const maxExpenseTotal = event.total * 0.12;
        const minExpenseTotal = event.total * 0.03;
        const expenseTotal = Math.floor(Math.random() * (maxExpenseTotal - minExpenseTotal)) + minExpenseTotal;
        
        const amount = Math.round(expenseTotal * 100) / 100;
        
        const expenseDate = new Date(eventDate);
        expenseDate.setDate(expenseDate.getDate() + Math.floor(Math.random() * 20) - 10);
        
        expenses.push({
          concepto: `${concept} - Proyecto ${event.clave_evento}`,
          monto_a_pagar: Math.round(amount),
          event_id: eventId,
          category,
          created_at: expenseDate.toISOString()
        });
      }
    });
  });
  
  return expenses;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting test data generation...');
    
    // Step 1: Clean existing data using admin client
    console.log('Cleaning existing data...');
    
    // Delete in order: expenses -> events -> clients (respecting foreign keys)
    await supabaseAdmin.from('expenses').delete().neq('id', 0);
    await supabaseAdmin.from('events').delete().neq('id', 0);
    await supabaseAdmin.from('clients').delete().neq('id', 0);
    
    // Step 2: Generate and insert clients
    console.log('Generating clients...');
    const testClients = generateTestClients(20);
    const { data: insertedClients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .insert(testClients)
      .select('id');
    
    if (clientsError) throw clientsError;
    if (!insertedClients) throw new Error('No clients were inserted');
    
    const clientIds = insertedClients.map(client => client.id);
    console.log(`Inserted ${clientIds.length} clients`);
    
    // Step 3: Generate and insert events
    console.log('Generating events...');
    const testEvents = generateTestEvents(clientIds, 124);
    
    const eventChunks = chunkArray(testEvents, 100);
    const insertedEvents: { id: number }[] = [];
    
    for (let i = 0; i < eventChunks.length; i++) {
      console.log(`Inserting event chunk ${i + 1}/${eventChunks.length}...`);
      const { data: chunkData, error: eventsError } = await supabaseAdmin
        .from('events')
        .insert(eventChunks[i])
        .select('id');
      
      if (eventsError) throw eventsError;
      if (!chunkData) throw new Error(`No events were inserted in chunk ${i + 1}`);
      
      insertedEvents.push(...chunkData);
    }
    
    const eventIds = insertedEvents.map(event => event.id);
    console.log(`Inserted ${eventIds.length} events`);
    
    // Step 4: Generate and insert expenses
    console.log('Generating expenses...');
    const testExpenses = generateTestExpenses(eventIds, testEvents);
    
    const expenseChunks = chunkArray(testExpenses, 500);
    
    for (let i = 0; i < expenseChunks.length; i++) {
      console.log(`Inserting expense chunk ${i + 1}/${expenseChunks.length}...`);
      const { error: expensesError } = await supabaseAdmin
        .from('expenses')
        .insert(expenseChunks[i]);
      
      if (expensesError) throw expensesError;
    }
    
    console.log(`Inserted ${testExpenses.length} expenses`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test data generated successfully',
        stats: {
          clients: testClients.length,
          events: testEvents.length,
          expenses: testExpenses.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
    
  } catch (error) {
    console.error('Error generating test data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})