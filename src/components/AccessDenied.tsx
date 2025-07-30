import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showIcon?: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ 
  title = 'Acesso Negado',
  message = 'Você não tem permissão para acessar este recurso.',
  showIcon = true
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {showIcon && (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
        )}
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Entre em contato com um administrador para solicitar as permissões necessárias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied; 