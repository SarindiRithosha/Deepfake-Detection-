import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDFReport = async (analysisData, elementId = 'results-container') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Results container not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#E5E3E3'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    pdf.setProperties({
      title: `Verity-X Analysis Report - ${analysisData.analysis_id}`,
      subject: 'Deepfake Detection Analysis Report',
      author: 'Verity-X AI System',
      keywords: 'deepfake, detection, analysis, AI, verification'
    });

    pdf.save(`verityx_report_${analysisData.analysis_id}.pdf`);
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

export const generateTextReport = (analysisData) => {
  const report = `
VERITY-X DEEPFAKE ANALYSIS REPORT
=================================

Analysis ID: ${analysisData.analysis_id || 'N/A'}
Date: ${new Date().toLocaleString()}
Filename: ${analysisData.filename || 'Unknown'}
Model Version: ${analysisData.model_version || 'XceptionNet v3.2'}

FINAL VERDICT: ${analysisData.prediction}
Confidence Level: ${Math.round(analysisData.confidence * 100)}%

SUMMARY:
${analysisData.summary}

${analysisData.anomalies && analysisData.anomalies.length > 0 ? `
DETECTED ANOMALIES:
${analysisData.anomalies.map((anomaly, index) => `${index + 1}. ${anomaly}`).join('\n')}
` : ''}

TECHNICAL DETAILS:
- Frames Analyzed: ${analysisData.frame_count || '10'}
- Processing Time: ${analysisData.analysis_time || '2.8 seconds'}
- Detection Model: ${analysisData.model_version || 'XceptionNet v3.2'}

This report was generated automatically by the Verity-X deepfake detection system.
For additional information or support, please contact our technical team.

© 2025 Verity-X. All rights reserved.
https://verity-x.example.com
  `;

  return report;
};