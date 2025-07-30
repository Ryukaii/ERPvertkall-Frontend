import React from 'react';
import Layout from '../components/Layout';
import { Outlet } from 'react-router-dom';

const Ajustes: React.FC = () => {
  return (
    <Layout>
      <div className="py-6">
        <Outlet />
      </div>
    </Layout>
  );
};

export default Ajustes; 