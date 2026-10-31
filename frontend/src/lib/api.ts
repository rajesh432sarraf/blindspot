import type { AnalyzeRequest, AnalysisResult, HealthResponse } from '../types';

const API_BASE = '/api';

export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.json();
}

export async function analyzeSources(request: AnalyzeRequest): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorDetail = `Analysis failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

