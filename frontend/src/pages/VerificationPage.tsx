import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import api from '../services/api';

export default function VerificationPage() {
  const { documentId } = useParams();
  const [inputId, setInputId] = useState(documentId || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    if (documentId) {
      handleVerify(documentId);
    }
  }, [documentId]);

  const handleVerify = async (id?: string) => {
    const idToVerify = id || inputId;
    if (!idToVerify) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await api.get(`/api/verification/${idToVerify}`);
      setVerificationResult(response.data);
    } catch (error: any) {
      setVerificationResult({
        valid: false,
        message: error.response?.data?.message || 'Document not found or invalid',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">UD</span>
              </div>
              <span className="text-xl font-bold text-gray-900">UniDocs</span>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Verification</h1>
          <p className="text-gray-600">Verify the authenticity of UniDocs documents</p>
        </div>

        <Card className="p-8 mb-8">
          <div className="space-y-6">
            <div>
              <Input
                label="Document ID"
                placeholder="Enter document ID or scan QR code"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                hint="The document ID is found on the certificate or in the QR code"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => handleVerify()}
              isLoading={isVerifying}
              disabled={!inputId}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Verify Document
            </Button>
          </div>
        </Card>

        {/* Verification Result */}
        {verificationResult && (
          <Card className="p-8">
            {verificationResult.valid ? (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Document Verified</h3>
                    <p className="text-sm text-gray-600">This document is authentic and valid</p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Document ID</span>
                    <span className="text-sm font-medium text-gray-900">{verificationResult.document.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Document Type</span>
                    <span className="text-sm font-medium text-gray-900">
                      {verificationResult.document.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Student Name</span>
                    <span className="text-sm font-medium text-gray-900">{verificationResult.document.student?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Student ID</span>
                    <span className="text-sm font-medium text-gray-900">{verificationResult.document.student?.studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Program</span>
                    <span className="text-sm font-medium text-gray-900">{verificationResult.document.student?.program}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Faculty</span>
                    <span className="text-sm font-medium text-gray-900">{verificationResult.document.student?.faculty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Issued Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(verificationResult.document.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Generated By</span>
                    <span className="text-sm font-medium text-gray-900">{verificationResult.document.generatedBy || 'System'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Verification Failed</h3>
                    <p className="text-sm text-gray-600">This document could not be verified</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Secure</h4>
            <p className="text-xs text-gray-600">Digital signatures ensure authenticity</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Instant</h4>
            <p className="text-xs text-gray-600">Real-time verification in seconds</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Trusted</h4>
            <p className="text-xs text-gray-600">Official university documents</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
