'use client';
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../providers';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import SqlTerminal from '../../../components/faculties/SqlTerminal';

export default function AdminTerminal() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  // SQL Terminal state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM faculties LIMIT 5;');
  const [queryResult, setQueryResult] = useState(null);
  const [executingQuery, setExecutingQuery] = useState(false);
  const [queryError, setQueryError] = useState('');

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      toast.error('Access Denied: Only administrators can access the database query terminal.');
      router.push('/');
    }
  }, [user, loading, router]);

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query statement first.');
      return;
    }
    setExecutingQuery(true);
    setQueryError('');
    setQueryResult(null);
    try {
      const res = await api.post('/auth/admin/query', { query: sqlQuery });
      setQueryResult(res.data);
      toast.success('SQL executed successfully!');
    } catch (err) {
      console.error(err);
      setQueryError(err.response?.data?.detail || 'An error occurred during query execution.');
      toast.error('Query execution failed.');
    } finally {
      setExecutingQuery(false);
    }
  };

  const dbSchema = [
    {
      name: 'faculties',
      description: 'Faculty mentors login registry',
      columns: ['faculty_id (UUID, PK)', 'faculty_name (VARCHAR)', 'email (VARCHAR, UNIQUE)', 'hashed_password (VARCHAR)', 'role (VARCHAR)']
    },
    {
      name: 'interns',
      description: 'Mentored student demographic data',
      columns: ['intern_id (UUID, PK)', 'intern_name (VARCHAR)', 'college_name (VARCHAR)', 'department (VARCHAR)', 'email (VARCHAR)', 'phone (VARCHAR)']
    },
    {
      name: 'internships',
      description: 'Project records & mentors linkages',
      columns: ['internship_id (UUID, PK)', 'intern_id (UUID, FK)', 'faculty_id (UUID, FK)', 'internship_title (VARCHAR)', 'internship_domain (VARCHAR)', 'internship_mode (VARCHAR)', 'start_date (DATE)', 'end_date (DATE)', 'remarks (TEXT)', 'transaction_number (VARCHAR)', 'is_paid (BOOLEAN)', 'is_emailed (BOOLEAN)']
    },
    {
      name: 'documents',
      description: 'Student upload verification index',
      columns: ['document_id (UUID, PK)', 'internship_id (UUID, FK)', 'document_type (VARCHAR)', 'file_path (VARCHAR)', 'uploaded_at (TIMESTAMP)']
    },
    {
      name: 'certificates',
      description: 'Issued digital credentials index',
      columns: ['certificate_id (UUID, PK)', 'internship_id (UUID, FK)', 'certificate_path (VARCHAR)', 'generated_at (TIMESTAMP)']
    }
  ];

  if (loading) {
    return <div className="text-indigo-600 font-semibold p-6 text-center">Loading SQL Terminal...</div>;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-850 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">SQL Query Terminal</h2>
          <p className="text-xs text-indigo-200 mt-1">Execute raw SQL statements directly on the PostgreSQL database engine.</p>
        </div>
      </div>
      <SqlTerminal 
        sqlQuery={sqlQuery} 
        setSqlQuery={setSqlQuery} 
        handleExecuteQuery={handleExecuteQuery} 
        executingQuery={executingQuery} 
        queryError={queryError} 
        queryResult={queryResult} 
        dbSchema={dbSchema} 
      />
    </div>
  );
}
