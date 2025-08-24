'use client';

/**
 * Extracted Data Display Component
 * 
 * Shows the structured data extracted from the student record in a clean,
 * organized format with expandable sections.
 */

import React, { useState } from 'react';
import { ExtractedData } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface ExtractedDataDisplayProps {
  extractedData: ExtractedData;
  className?: string;
}

export function ExtractedDataDisplay({ extractedData, className }: ExtractedDataDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['creative']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const sections = [
    {
      id: 'creative',
      title: '창의적 체험활동상황',
      icon: '🎯',
      description: '자율활동, 동아리활동, 진로활동, 봉사활동 등',
      data: extractedData.creativeActivities?.창의적체험활동상황 || [],
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'academic',
      title: '교과학습발달상황',
      icon: '📚',
      description: '각 과목별 성적 및 성취도',
      data: extractedData.academicDevelopments?.교과학습발달상황 || [],
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      id: 'detailed',
      title: '세부능력 및 특기사항',
      icon: '🔍',
      description: '과목별 상세 평가 및 특기사항',
      data: extractedData.detailedAbilities?.세부특기사항 || [],
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    }
  ];

  return (
    <div className={`extracted-data-display space-y-4 ${className || ''}`}>
      {sections.map((section) => (
        <Card key={section.id} className="overflow-hidden">
          {/* Section Header */}
          <div 
            className={`p-4 cursor-pointer ${section.color} border-b`}
            onClick={() => toggleSection(section.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{section.icon}</span>
                <div>
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-sm opacity-80">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-white bg-opacity-80">
                  {section.data.length}개
                </Badge>
                <div className={`
                  transform transition-transform duration-200
                  ${expandedSections.has(section.id) ? 'rotate-180' : ''}
                `}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Section Content */}
          {expandedSections.has(section.id) && (
            <div className="p-4">
              {section.data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>추출된 데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {section.id === 'creative' && (
                    <CreativeActivitiesTable data={section.data} />
                  )}
                  {section.id === 'academic' && (
                    <AcademicDevelopmentTable data={section.data} />
                  )}
                  {section.id === 'detailed' && (
                    <DetailedAbilitiesTable data={section.data} />
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      {/* Export Options */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-900">데이터 내보내기</h4>
            <p className="text-sm text-gray-600">추출된 데이터를 다양한 형식으로 저장하세요</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportAsJSON(extractedData)}
            >
              JSON 다운로드
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportAsCSV(extractedData)}
            >
              CSV 다운로드
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Creative Activities Table Component
 */
function CreativeActivitiesTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900">
              영역
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900">
              시간
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900">
              특기사항
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 font-medium">
                <Badge variant="default" size="sm">
                  {item.영역}
                </Badge>
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center">
                {item.시간}시간
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm leading-relaxed">
                {item.특기사항}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Academic Development Table Component
 */
function AcademicDevelopmentTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900">
              과목
            </th>
            <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-900">
              학점수
            </th>
            <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-900">
              원점수/평균
            </th>
            <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-900">
              성취도
            </th>
            <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-900">
              석차등급
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 font-medium">
                {item.과목}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center">
                {item.학점수}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                {item.score_over_average}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center">
                <Badge 
                  variant={item.성취도 === 'A' ? 'success' : 
                          item.성취도 === 'B' ? 'primary' :
                          item.성취도 === 'C' ? 'warning' : 'default'}
                  size="sm"
                >
                  {item.성취도}
                </Badge>
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center">
                {item.석차등급}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Detailed Abilities Table Component
 */
function DetailedAbilitiesTable({ data }: { data: any[] }) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
          <div 
            className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100"
            onClick={() => toggleItem(index)}
          >
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">{item.과목}</h4>
              <div className={`
                transform transition-transform duration-200
                ${expandedItems.has(index) ? 'rotate-180' : ''}
              `}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          {expandedItems.has(index) && (
            <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed border-t border-gray-200">
              {item.특기사항}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Export data as JSON
 */
function exportAsJSON(data: ExtractedData) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadFile(blob, 'extracted_data.json');
}

/**
 * Export data as CSV
 */
function exportAsCSV(data: ExtractedData) {
  let csvContent = '';

  // Creative Activities
  if (data.creativeActivities?.창의적체험활동상황) {
    csvContent += '창의적 체험활동상황\n';
    csvContent += '영역,시간,특기사항\n';
    data.creativeActivities.창의적체험활동상황.forEach(item => {
      csvContent += `"${item.영역}","${item.시간}","${item.특기사항.replace(/"/g, '""')}"\n`;
    });
    csvContent += '\n';
  }

  // Academic Development
  if (data.academicDevelopments?.교과학습발달상황) {
    csvContent += '교과학습발달상황\n';
    csvContent += '과목,학점수,원점수/평균,성취도,석차등급\n';
    data.academicDevelopments.교과학습발달상황.forEach(item => {
      csvContent += `"${item.과목}","${item.학점수}","${item.score_over_average}","${item.성취도}","${item.석차등급}"\n`;
    });
    csvContent += '\n';
  }

  // Detailed Abilities
  if (data.detailedAbilities?.세부특기사항) {
    csvContent += '세부능력 및 특기사항\n';
    csvContent += '과목,특기사항\n';
    data.detailedAbilities.세부특기사항.forEach(item => {
      csvContent += `"${item.과목}","${item.특기사항.replace(/"/g, '""')}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, 'extracted_data.csv');
}

/**
 * Download file helper
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}