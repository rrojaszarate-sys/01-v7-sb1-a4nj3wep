import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { TestDataGenerator } from './components/TestDataGenerator';
import { Dashboard } from './components/Dashboard';
import { BillingMaster } from './components/BillingMaster';
import { EventDetail } from './components/EventDetail';
import { Clients } from './components/Clients';
import { ActivityLog } from './components/ActivityLog';
import { CreateEvent } from './components/CreateEvent';
import { CatalogManager } from './components/catalogs/CatalogManager';
import { UserManager } from './components/admin/UserManager';
import { RoleSelector } from './components/RoleSelector';
import { DashboardDiagnostics } from './components/DashboardDiagnostics';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  if (!user) {
    return <RoleSelector />;
  }

  const handleViewEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    setCurrentPage('event-detail');
  };

  const handleBackFromEventDetail = () => {
    setSelectedEventId(null);
    setCurrentPage('billing-master');
  };

  const handleEventCreated = () => {
    setShowCreateEvent(false);
    setCurrentPage('billing-master');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'test-data':
        return <TestDataGenerator />;
      case 'diagnostics':
        return <DatabaseDiagnostics />;
      case 'diagnostics':
        return <DashboardDiagnostics />;
      case 'billing-master':
        return (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateEvent(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Crear Evento
              </button>
            </div>
            <BillingMaster onViewEvent={handleViewEvent} />
          </div>
        );
      case 'event-detail':
        return selectedEventId ? (
          <EventDetail 
            eventId={selectedEventId} 
            onBack={handleBackFromEventDetail} 
          />
        ) : (
          <div>Error: No se ha seleccionado un evento</div>
        );
      case 'clients':
        return <Clients user={user} />;
      case 'users':
        return <UserManager />;
      case 'activity-log':
        return <ActivityLog />;
      case 'catalogs':
        return <CatalogManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        mockUser={user}
      >
        {renderCurrentPage()}
      </Layout>
      
      {showCreateEvent && (
        <CreateEvent
          onEventCreated={handleEventCreated}
          onCancel={() => setShowCreateEvent(false)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;