/**
 * @file Dashboard.tsx
 * @description The main dashboard page for the Jata application.
 *
 * This component serves as the central hub for users to view and manage their
 * applications. It follows the architectural guidelines by using TanStack Query
 * for data fetching, Zustand for UI state management (modal), and Tailwind CSS
 * for styling. The page is designed to be accessible and responsive.
 */

import { useState, FormEvent, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ApplicationCard } from '../components/ApplicationCard';
import Welcome from '../components/Welcome';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useDashboardStore } from '../store/dashboardStore';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../../../packages/common/types/database';


type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

/**
 * @component CreateApplicationModal
 * @description A modal dialog for creating a new application.
 *
 * This component is controlled by the `useDashboardStore` and handles the
 * form submission for creating a new application record via a `useMutation` hook.
 *
 * @returns {JSX.Element | null} The rendered modal or null if closed.
 */
const CreateApplicationModal = (): JSX.Element | null => {
  const { isModalOpen, closeModal } = useDashboardStore();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Omit<ApplicationInsert, 'user_id'>>({
    title: '',
    company: '',
    date_applied: new Date().toISOString().split('T')[0], // Defaults to today
    status: 'Applied',
    url: '',
    source: '',
    industry: ''
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (newApplication: Omit<ApplicationInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('applications')
        .insert({ ...newApplication, user_id: user.id })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      closeModal();
    },
    onError: (error: Error) => {
      alert(`Error creating application: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createApplicationMutation.mutate(formData);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900">Create New Application</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title</label>
            <input id="title" type="text" value={formData.title} onChange={handleInputChange} required className="mt-1 block w-full input" />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
            <input id="company" type="text" value={formData.company} onChange={handleInputChange} required className="mt-1 block w-full input" />
          </div>
          
          <div>
            <label htmlFor="date_applied" className="block text-sm font-medium text-gray-700">Date Applied</label>
            <input id="date_applied" type="date" value={formData.date_applied} onChange={handleInputChange} required className="mt-1 block w-full input" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={createApplicationMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {createApplicationMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * @component Dashboard
 * @description The main dashboard page, displaying a list of applications.
 *
 * @returns {JSX.Element}
 */
const Dashboard = (): JSX.Element => {
  const { openModal } = useDashboardStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [sortOrder, setSortOrder] = useState('Newest First');

  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['applications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user, // Only run the query if the user is available
  });

  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    // eslint-disable-next-line prefer-const
    let filtered = applications
      .filter(app => 
        app.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        app.company.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(app => 
        filterStatus === 'All Status' || app.status === filterStatus
      );

    filtered.sort((a, b) => {
      const dateA = new Date(a.date_applied).getTime();
      const dateB = new Date(b.date_applied).getTime();
      return sortOrder === 'Newest First' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [applications, searchTerm, filterStatus, sortOrder]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">

      {!isLoading && applications && applications.length === 0 ? (
        <Welcome />
      ) : (
        <>
          
                    <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <button onClick={openModal} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Create Application
            </button>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Search by job title or company..."
                className="sm:col-span-1 w-full input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                aria-label="Filter by status"
                className="w-full input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option>All Status</option>
                <option>Applied</option>
                <option>Interview</option>
                <option>Offer</option>
                <option>Rejected</option>
              </select>
              <select
                aria-label="Sort by date"
                className="w-full input"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option>Newest First</option>
                <option>Oldest First</option>
              </select>
            </div>
          </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {error ? (
              <p className="text-red-600">Error: {error.message}</p>
            ) : (
              filteredApplications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))
            )}
          </div>
        </>
      )}
      <CreateApplicationModal />
    </div>
  );
};

export default Dashboard;
