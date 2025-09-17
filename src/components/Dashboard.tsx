import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event, ExpenseChartData, IncomeChartData, ProfitChartData } from '../types/database';
import { formatCurrency, calculateProfit } from '../utils/financial';
import { IncomeChart3D } from './charts/IncomeChart3D';
import { ExpenseChart3D } from './charts/ExpenseChart3D';
import { ProfitChart3D } from './charts/ProfitChart3D';
import { MonthlyEventsChart } from './charts/MonthlyEventsChart';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState<IncomeChartData>({
    pending: { subtotal: 0, vat: 0, total: 0, percentage: 0 },
    paid: { subtotal: 0, vat: 0, total: 0, percentage: 0 }
  });
  const [expenseData, setExpenseData] = useState<ExpenseChartData[]>([]);
  const [profitData, setProfitData] = useState<ProfitChartData>({
    income: { amount: 0, percentage: 0 },
    expenses: { amount: 0, percentage: 0 },
    profit: { amount: 0, percentage: 0, isLoss: false }
  });
  const [monthlyEventsData, setMonthlyEventsData] = useState<{
    month: string;
    year: number;
    eventCount: number;
    monthName: string;
  }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all events with expenses
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*),
          expenses:expenses(*)
        `);

      if (eventsError) throw eventsError;

      // Process income data by status
      const pendingEvents = events?.filter(event => 
        ['Pendiente Facturar', 'Pago Pendiente', 'Vencido'].includes(event.status_pago)
      ) || [];
      
      const paidEvents = events?.filter(event => 
        event.status_pago === 'Pagado'
      ) || [];

      const pendingTotals = pendingEvents.reduce((acc, event) => ({
        subtotal: acc.subtotal + (event.subtotal ?? 0),
        vat: acc.vat + (event.iva ?? 0),
        total: acc.total + (event.total ?? 0)
      }), { subtotal: 0, vat: 0, total: 0 });

      const paidTotals = paidEvents.reduce((acc, event) => ({
        subtotal: acc.subtotal + (event.subtotal ?? 0),
        iva: acc.iva + (event.iva ?? 0),
        total: acc.total + (event.total ?? 0)
      }), { subtotal: 0, iva: 0, total: 0 });

      const totalIncome = pendingTotals.total + paidTotals.total;

      setIncomeData({
        pending: {
          ...pendingTotals,
          percentage: totalIncome > 0 ? (pendingTotals.total / totalIncome) * 100 : 0
        },
        paid: {
          ...paidTotals,
          percentage: totalIncome > 0 ? (paidTotals.total / totalIncome) * 100 : 0
        }
      });

      // Process expense data by category
      const expensesByCategory: { [key: string]: { subtotal: number; vat: number; total: number } } = {};
      
      events?.forEach(event => {
        event.expenses?.forEach((expense: any) => {
          if (!expense.deleted_at) { // Only include non-deleted expenses
            if (!expensesByCategory[expense.category]) {
              expensesByCategory[expense.category] = { subtotal: 0, vat: 0, total: 0 };
            }
            // Calculate VAT for expenses (assuming they include VAT)
            const expenseSubtotal = expense.monto_a_pagar / 1.16;
            const expenseVat = expense.monto_a_pagar - expenseSubtotal;
            
            expensesByCategory[expense.category].subtotal += expenseSubtotal;
            expensesByCategory[expense.category].vat += expenseVat;
            expensesByCategory[expense.category].total += expense.monto_a_pagar;
          }
        });
      });

      const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.total, 0);

      const expenseChartData: ExpenseChartData[] = Object.entries(expensesByCategory).map(([category, amounts]) => ({
        category,
        subtotal: amounts.subtotal,
        vat: amounts.vat,
        total: amounts.total,
        percentage: totalExpenses > 0 ? (amounts.total / totalExpenses) * 100 : 0
      }));

      setExpenseData(expenseChartData);

      // Calculate profit data
      const profitAnalysis = calculateProfit(totalIncome, totalExpenses);
      const totalAmount = totalIncome + totalExpenses;

      setProfitData({
        income: {
          amount: totalIncome,
          percentage: totalAmount > 0 ? (totalIncome / totalAmount) * 100 : 0
        },
        expenses: {
          amount: totalExpenses,
          percentage: totalAmount > 0 ? (totalExpenses / totalAmount) * 100 : 0
        },
        profit: {
          amount: profitAnalysis.profit,
          percentage: profitAnalysis.percentage,
          isLoss: profitAnalysis.isLoss
        }
      });

      // Process monthly events data
      const monthlyEvents: { [key: string]: number } = {};
      
      events?.forEach(event => {
        const eventDate = new Date(event.created_at!);
        const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyEvents[monthKey] = (monthlyEvents[monthKey] || 0) + 1;
      });

      const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];

      const monthlyEventsArray = Object.entries(monthlyEvents).map(([monthKey, count]) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        
        return {
          month: monthKey,
          year: parseInt(year),
          eventCount: count,
          monthName: monthNames[monthIndex]
        };
      }).sort((a, b) => a.month.localeCompare(b.month));

      setMonthlyEventsData(monthlyEventsArray);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 py-4 z-10">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Analítico</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Actualizar Datos
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(incomeData.pending.total + incomeData.paid.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenseData.reduce((sum, item) => sum + item.total, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${profitData.profit.isLoss ? 'bg-red-100' : 'bg-green-100'}`}>
              <svg className={`h-6 w-6 ${profitData.profit.isLoss ? 'text-red-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={profitData.profit.isLoss ? "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" : "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"} />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {profitData.profit.isLoss ? 'Pérdida' : 'Utilidad'}
              </p>
              <p className={`text-2xl font-bold ${profitData.profit.isLoss ? 'text-red-900' : 'text-green-900'}`}>
                {formatCurrency(Math.abs(profitData.profit.amount))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Margen</p>
              <p className={`text-2xl font-bold ${profitData.profit.isLoss ? 'text-red-900' : 'text-green-900'}`}>
                {Math.abs(profitData.profit.percentage).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Three Main Charts */}
      <div className="space-y-8">
        {/* Income Distribution Chart */}
        <IncomeChart3D data={incomeData} />

        {/* Expenses by Category Chart */}
        <ExpenseChart3D data={expenseData} />

        {/* Profit Analysis Chart */}
        <ProfitChart3D data={profitData} />

        {/* Monthly Events Chart */}
        <MonthlyEventsChart data={monthlyEventsData} />
      </div>
    </div>
  );
}