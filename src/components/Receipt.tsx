// components/Receipt.tsx
import React from 'react';

// Helper function to format YYYY-MM to "Jan 2026" style
const formatMonth = (monthStr: string): string => {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return monthStr;
  }
};

// Helper to format date as DD/MM/YYYY
const formatDate = (dateString: string | Date): string => {
  try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return String(dateString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
      return String(dateString);
  }
};

export const Receipt = React.forwardRef((props: any, ref: any) => {
  const { data } = props;
  
  if (!data) return null;

  // Get class name from correct path
  const className = data.classLevelName || data.classSession?.classLevelName || 'N/A';
  
  // Format months array
  const formattedMonths = data.months?.map(formatMonth).join(', ') || '';

  return (
    <div ref={ref} className="receipt-wrapper">
      <style jsx global>{`
        @media print {
          .receipt-wrapper {
            width: 80mm; /* Standard thermal printer width */
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            padding: 2mm;
            color: black;
            background: white;
          }
          @page {
            margin: 0;
            size: 80mm auto;
          }
          .no-print { display: none; }
        }
      `}</style>
      
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: '0 0 2px 0', fontSize: '16px' }}>MOHAMMADIA MAKTAB</h2>
        <p style={{ margin: 0, fontSize: '10px' }}>Madarsa Management System</p>
        <p style={{ margin: 0, fontSize: '9px' }}>Receipt of Fee Payment</p>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
      
      <div style={{ marginBottom: '8px', lineHeight: '1.4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date: {formatDate(new Date())}</span>
          <span>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div>Receipt No: {data.receiptNo || (data.id?.substring(data.id.length - 8).toUpperCase() || 'TEMP')}</div>
        {/* <div>Receipt No: {data.receiptNo}</div> */}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      <div style={{ marginBottom: '8px', lineHeight: '1.5' }}>
        <div><strong>STUDENT DETAILS</strong></div>
        <div>Name: {data.studentName}</div>
        <div>F.Name: {data.fatherName}</div>
        <div>Roll No: {data.rollNumber}</div>
        <div>Class: {className}</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
            <th style={{ padding: '4px 0' }}>Description</th>
            <th style={{ padding: '4px 0', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '4px 0' }}>
              Tuition Fee<br/>
              <span style={{ fontSize: '9px' }}>({formattedMonths})</span>
            </td>
            <td style={{ padding: '4px 0', textAlign: 'right' }}>₹{data.amount}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
      
      <div style={{ textAlign: 'right', fontSize: '14px' }}>
        <strong>TOTAL PAID: ₹{data.amount}</strong>
      </div>

      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px' }}>
        <p style={{ margin: '0 0 4px 0' }}>JazakAllah Khair for your payment!</p>
        <div style={{ borderTop: '1px dotted #ccc', marginTop: '10px', paddingTop: '5px' }}>
             <p style={{ fontSize: '8px', color: '#666' }}>System Generated Receipt</p>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';