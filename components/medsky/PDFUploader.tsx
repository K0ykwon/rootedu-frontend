'use client';

/**
 * PDF Uploader Component
 * 
 * Handles PDF file drag & drop upload with validation and preview.
 * Provides user-friendly upload experience with proper error handling.
 */

import React, { useState, useRef, useCallback } from 'react';
import { PDFUploadProps } from '@/types/medsky';
import Button from '@/components/ui/Button';

export function PDFUploader({ onUpload, isLoading, error, className }: PDFUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate PDF file
   */
  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'PDF 파일만 업로드 가능합니다.';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return '파일 크기는 10MB 이하여야 합니다.';
    }

    const minSize = 1024; // 1KB
    if (file.size < minSize) {
      return '파일이 너무 작습니다. 올바른 PDF 파일인지 확인해주세요.';
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setSelectedFile(file);
  }, []);

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * Handle upload button click
   */
  const handleUpload = useCallback(() => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  }, [selectedFile, onUpload]);

  /**
   * Handle browse button click
   */
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Clear selected file
   */
  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`pdf-uploader ${className || ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!selectedFile ? (
        // Upload Area
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
            ${isDragOver 
              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]/20' 
              : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            {/* Upload Icon */}
            <div className="mx-auto w-16 h-16 text-[var(--color-text-tertiary)]">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {/* Upload Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                학생생활기록부 PDF를 업로드하세요
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                파일을 이곳에 드래그하거나 아래 버튼을 클릭하세요
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                최대 10MB, PDF 파일만 지원
              </p>
            </div>

            {/* Browse Button */}
            <Button
              onClick={handleBrowseClick}
              variant="primary"
              disabled={isLoading}
            >
              파일 선택
            </Button>
          </div>
        </div>
      ) : (
        // Selected File Preview
        <div className="border border-[var(--color-border-primary)] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* PDF Icon */}
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* File Info */}
              <div>
                <h4 className="font-medium text-[var(--color-text-primary)] truncate max-w-xs">
                  {selectedFile.name}
                </h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleUpload}
                variant="primary"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? '분석 중...' : '분석 시작'}
              </Button>
              <Button
                onClick={handleClearFile}
                variant="secondary"
                size="sm"
                disabled={isLoading}
              >
                변경
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="mt-4 text-xs text-[var(--color-text-tertiary)] space-y-1">
        <p>• 학교생활기록부 PDF 파일을 업로드해주세요</p>
        <p>• 창의적 체험활동상황, 교과학습발달상황, 세부능력 및 특기사항이 포함된 파일이어야 합니다</p>
        <p>• 개인정보가 포함된 파일이므로 업로드 후 즉시 삭제됩니다</p>
      </div>
    </div>
  );
}