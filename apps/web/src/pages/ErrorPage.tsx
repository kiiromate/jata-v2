import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

const ErrorPage: React.FC = () => {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Oops! Something went wrong.
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We're sorry, but an unexpected error has occurred.
          </p>
          {error?.statusText && (
            <p className="mt-2 text-center text-sm text-gray-500">
              <i>{error.statusText}</i>
            </p>
          )}
          {error?.message && (
            <p className="mt-2 text-center text-sm text-gray-500">
              <i>{error.message}</i>
            </p>
          )}
        </div>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reload Page
          </button>
          <Link
            to="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
