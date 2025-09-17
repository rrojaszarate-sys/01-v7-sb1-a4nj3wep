/**
 * Test Data Generator - Client Interface
 * Calls the Supabase Edge Function to generate test data with proper permissions
 */

export async function generateTestData(): Promise<{
  success: boolean;
  message: string;
  stats?: {
    clients: number;
    events: number;
    expenses: number;
  };
}> {
  try {
    // Call the Edge Function to generate test data with elevated permissions
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-test-data`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Error calling test data generation function:', error);
    return {
      success: false,
      message: `Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}