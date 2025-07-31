/**
 * @file Dashboard.tsx
 * @description The main dashboard page for the Jata application.
 *
 * This component serves as the central hub for users to view and manage their
 * applications. It follows the architectural guidelines by using TanStack Query
 * for data fetching, Zustand for UI state management (modal), and Tailwind CSS
 * for styling. The page is designed to be accessible and responsive.
 */

import { useState, FormEvent } from 'react';
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
    status: 'applied',
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">My Applications</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all the applications in your account.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Create Application
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Company</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Job Title</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date Applied</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan={3} className="text-center p-4">Loading...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={3} className="text-center p-4 text-red-600">Error: {error.message}</td></tr>
                  ) : !applications || applications.length === 0 ? (
                    <tr><td colSpan={4} className="text-center p-4">No applications found.</td></tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{app.company}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{app.title}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(app.date_applied).toLocaleDateString()}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{app.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <CreateApplicationModal />
    </div>
  );
};

export default Dashboard;
