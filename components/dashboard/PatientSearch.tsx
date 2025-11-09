"use client"

import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Patient = {
  id: string;
  name: string;
  dob?: string;
  gender?: string;
  createdAt: string;
};

interface PatientSearchProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  isLoading?: boolean;
}

export default function PatientSearch({
  patients,
  selectedPatientId,
  onSelectPatient,
  isLoading = false,
}: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) {
      return patients;
    }

    const query = searchQuery.toLowerCase();
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  // Get selected patient name for display
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredPatients]);

  const handleSelectPatient = (patientId: string) => {
    onSelectPatient(patientId);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen && e.key !== 'Escape') {
      setIsDropdownOpen(true);
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredPatients.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPatients.length > 0) {
          handleSelectPatient(filteredPatients[highlightedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search patients by name or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || patients.length === 0}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Currently selected patient */}
        {selectedPatient && !isDropdownOpen && (
          <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-100">
                  {selectedPatient.name}
                </span>
                <span className="text-xs text-slate-400">
                  ID: {selectedPatient.id.slice(0, 8)}...
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-white border-slate-600">
              Selected
            </Badge>
          </div>
        )}
      </div>

      {/* Dropdown with search results */}
      {isDropdownOpen && (
        <Card className="absolute z-9999 w-full mt-2 bg-slate-900 border-slate-700 shadow-2xl max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {filteredPatients.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                {patients.length === 0 ? 'No patients available' : 'No patients found'}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredPatients.map((patient, index) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectPatient(patient.id)}
                    className={`w-full text-left p-3 border-b border-slate-800 last:border-b-0 transition-colors ${
                      index === highlightedIndex
                        ? 'bg-slate-800'
                        : 'hover:bg-slate-800/50'
                    } ${
                      patient.id === selectedPatientId
                        ? 'bg-blue-900/20 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-100">
                          {patient.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>ID: {patient.id.slice(0, 8)}...</span>
                          {patient.dob && <span>• DOB: {patient.dob}</span>}
                          {patient.gender && <span>• {patient.gender}</span>}
                        </div>
                      </div>
                      {patient.id === selectedPatientId && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                          Current
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
