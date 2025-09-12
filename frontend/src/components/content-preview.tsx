"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  Edit, 
  Save, 
  X, 
  Copy, 
  Download,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ContentPreviewProps {
  content: {
    id: number;
    content_type: string;
    generated_content: string | null;
    model_used: string;
    is_approved: boolean;
    created_at: string;
    approved_by?: number;
  };
  onSave?: (id: number, updatedContent: string) => void;
  onApprove?: (id: number) => void;
  onCopy?: (content: string) => void;
  onDownload?: (content: string, filename: string) => void;
  editable?: boolean;
  showActions?: boolean;
}

export default function ContentPreview({ 
  content, 
  onSave, 
  onApprove, 
  onCopy, 
  onDownload,
  editable = true,
  showActions = true
}: ContentPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content.generated_content || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(content.id, editedContent);
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving content:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setEditedContent(content.generated_content || '');
    setIsEditing(false);
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(editedContent);
    } else {
      navigator.clipboard.writeText(editedContent);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      const filename = `${content.content_type}_${content.id}.txt`;
      onDownload(editedContent, filename);
    } else {
      const blob = new Blob([editedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${content.content_type}_${content.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatContent = (text: string) => {
    // Handle undefined or null text
    if (!text || typeof text !== 'string') {
      return <div className="text-gray-500 italic">No content available</div>;
    }

    // Basic formatting for different content types
    if (content.content_type === 'knowledge_test') {
      try {
        const parsed = JSON.parse(text);
        return (
          <div className="space-y-4">
            {parsed.questions && parsed.questions.length > 0 ? parsed.questions.map((question: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Question {index + 1}: {question.question}
                </h4>
                <div className="space-y-2">
                  {question.options && question.options.length > 0 ? question.options.map((option: string, optIndex: number) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600 w-6">
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span className={option === question.correct_answer ? 'text-green-600 font-semibold' : 'text-gray-700'}>
                        {option}
                      </span>
                      {option === question.correct_answer && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  )) : (
                    <div className="text-gray-500 italic">No options available</div>
                  )}
                </div>
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-gray-500 italic text-center py-4">
                No questions available
              </div>
            )}
          </div>
        );
      } catch (error) {
        // Fallback to plain text if JSON parsing fails
        return <pre className="whitespace-pre-wrap text-sm text-gray-700">{text}</pre>;
      }
    } else {
      // For learning materials and lesson plans, format as markdown-like content
      const lines = text.split('\n');
      return (
        <div className="prose max-w-none">
          {lines.map((line, index) => {
            if (line.startsWith('# ')) {
              return (
                <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-4">
                  {line.substring(2)}
                </h1>
              );
            } else if (line.startsWith('## ')) {
              return (
                <h2 key={index} className="text-xl font-semibold text-gray-900 mt-5 mb-3">
                  {line.substring(3)}
                </h2>
              );
            } else if (line.startsWith('### ')) {
              return (
                <h3 key={index} className="text-lg font-medium text-gray-900 mt-4 mb-2">
                  {line.substring(4)}
                </h3>
              );
            } else if (line.startsWith('- ')) {
              return (
                <li key={index} className="ml-4 text-gray-700">
                  {line.substring(2)}
                </li>
              );
            } else if (line.trim() === '') {
              return <br key={index} />;
            } else {
              return (
                <p key={index} className="text-gray-700 mb-2">
                  {line}
                </p>
              );
            }
          })}
        </div>
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span className="text-lg font-semibold">
              {content.content_type.replace('_', ' ').toUpperCase()}
            </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {content.model_used}
            </span>
            {content.is_approved && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </span>
            )}
          </CardTitle>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  {editable && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={handleCopy}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {!content.is_approved && onApprove && (
                    <Button
                      onClick={() => onApprove(content.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          Generated: {new Date(content.created_at).toLocaleString()}
          {content.approved_by && (
            <span className="ml-2">
              • Approved by user {content.approved_by}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content-edit" className="text-sm font-medium text-gray-700">
                Content
              </Label>
              <Textarea
                id="content-edit"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="mt-1 min-h-[400px] font-mono text-sm"
                placeholder="Edit the generated content..."
              />
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Make your changes and click Save to update the content</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {editedContent ? formatContent(editedContent) : (
              <div className="text-gray-500 italic text-center py-8">
                No content available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

