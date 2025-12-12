export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const getReasonLabel = (reason: string): string => {
  const labels: Record<string, string> = {
    poor_quality: 'Poor Quality',
    wrong_style: 'Wrong Style',
    technical_issue: 'Technical Issue',
    other: 'Other',
  };
  return labels[reason] || reason;
};