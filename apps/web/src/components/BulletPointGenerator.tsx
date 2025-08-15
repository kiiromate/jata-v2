import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateBulletPoint } from '../services/aiService';
import { Copy } from 'lucide-react';

interface BulletPointGeneratorProps {
  keywords: string[];
}

const BulletPointGenerator: React.FC<BulletPointGeneratorProps> = ({ keywords }) => {
  const [accomplishmentDescription, setAccomplishmentDescription] = useState<string>('');
  const [generatedBulletPoints, setGeneratedBulletPoints] = useState<string[]>([]);

  const {
    mutate: generate,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation<string[], Error, { description: string; keywords: string[] }>({
    mutationFn: ({ description, keywords }) => generateBulletPoint(description, keywords),
    onSuccess: (data) => {
      setGeneratedBulletPoints(data);
    },
    onError: (err) => {
      console.error('Error generating bullet points:', err);
      alert(`Failed to generate bullet points: ${err.message}`);
    },
  });

  const handleGenerate = () => {
    if (accomplishmentDescription.trim()) {
      generate({ description: accomplishmentDescription, keywords });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard.');
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Resume Bullet Points</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="Describe your accomplishment (e.g., 'Led a team to develop a new feature that increased user engagement by 20%')."
            value={accomplishmentDescription}
            onChange={(e) => setAccomplishmentDescription(e.target.value)}
            rows={5}
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!accomplishmentDescription.trim() || isPending}
        >
          {isPending ? 'Generating...' : 'Generate'}
        </Button>

        {isError && (
          <p className="text-red-500 text-sm">Error: {error?.message}</p>
        )}

        {isSuccess && generatedBulletPoints.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Generated Bullet Points:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {generatedBulletPoints.map((point, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="flex-grow pr-2">{point}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(point)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulletPointGenerator;
