'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import spec from './swagger.json';

export default function DocsPage() {
  return (
    <div className="container mx-auto p-4 bg-white min-h-screen">
      <SwaggerUI spec={spec} />
    </div>
  );
}
