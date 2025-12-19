import * as React from 'react';
import {
  Button,
  Select,
  Label,
  Textarea,
  ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  cn,
} from '../primitives';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
} from '../../shadcn';
import { ChevronDown, X, Loader2, Wand2, Lock, Play, Settings2, BarChart2 } from 'lucide-react';
import type { GenerationRun, AnalysisRun } from '../../types/index';

interface GenerationPhaseProps {
  sessionId: string;
  parentRunId: string | null;
  analysisRuns: AnalysisRun[];
  runs: GenerationRun[];
  selectedRunId: string | null;
  disabled: boolean;
  onRunComplete: (run: GenerationRun) => void;
  onSelectRun: (id: string) => void;
  onRemoveRun: (id: string) => void;
}

interface Template {
  slug: string;
  template_data: Record<string, unknown>;
  variables_schema?: Record<string, unknown>;
  version?: number;
}

export function GenerationPhase({
  sessionId,
  parentRunId,
  analysisRuns,
  runs,
  selectedRunId,
  disabled,
  onRunComplete,
  onSelectRun,
  onRemoveRun,
}: GenerationPhaseProps): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [templateSlug, setTemplateSlug] = React.useState('multi-angle-hybrid');
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [templateData, setTemplateData] = React.useState<Record<string, unknown>>({});
  const [analysisVariables, setAnalysisVariables] = React.useState<Record<string, unknown>>({});
  const [expandedRunId, setExpandedRunId] = React.useState<string | null>(null);
  const [model, setModel] = React.useState('gemini-3-pro-image-preview');
  const [compiledPrompt, setCompiledPrompt] = React.useState<string | null>(null);
  const [generationConfig, setGenerationConfig] = React.useState({
    resolution: '1k' as '1k' | '2k' | '4k',
    aspectRatio: '1:1' as string,
    numberOfImages: 1,
  });
  const [currentTemplateVersion, setCurrentTemplateVersion] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const previousTemplateSlugRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []));
  }, []);

  React.useEffect(() => {
    if (templateSlug) {
      const template = templates.find((t) => t.slug === templateSlug);
      if (template) {
        // Only warn if actually switching templates (not on initial load or template data changes)
        const isTemplateSwitch = previousTemplateSlugRef.current !== null &&
                                 previousTemplateSlugRef.current !== templateSlug;

        if (isTemplateSwitch && hasUnsavedChanges) {
          const confirmed = window.confirm(
            'You have unsaved changes. Switching templates will lose your edits. Continue?'
          );
          if (!confirmed) return;
        }

        setTemplateData(template.template_data || {});
        setCurrentTemplateVersion(template.version || null);
        setHasUnsavedChanges(false);
        previousTemplateSlugRef.current = templateSlug;
      }
    }
  }, [templateSlug, templates, hasUnsavedChanges]);

  React.useEffect(() => {
    if (parentRunId) {
      const parentRun = analysisRuns.find((r) => r.id === parentRunId);
      if (parentRun) {
        setAnalysisVariables(parentRun.inputs || {});
      }
    }
  }, [parentRunId, analysisRuns]);

  React.useEffect(() => {
    if (templateSlug) {
      const template = templates.find((t) => t.slug === templateSlug);
      const originalData = template?.template_data || {};
      const hasChanges = JSON.stringify(templateData) !== JSON.stringify(originalData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [templateData, templateSlug, templates]);

  const previewPrompt = async () => {
    if (!templateSlug) {
      setError('Please select a template first');
      return;
    }

    try {
      const res = await fetch('/api/notebook/compile-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateSlug, templateData, variables: analysisVariables }),
      });
      const data = await res.json();
      setCompiledPrompt(data.prompt || 'Error compiling prompt');
    } catch (err) {
      setError(`Failed to compile prompt: ${(err as Error).message}`);
    }
  };

  const handleRun = async () => {
    if (!templateSlug || !parentRunId) {
      setError('Missing required fields');
      return;
    }

    setError(null);
    setIsRunning(true);
    setGenerationProgress({ current: 0, total: generationConfig.numberOfImages });

    try {
      const res = await fetch('/api/notebook/conversation-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          parentRunId,
          templateSlug,
          templateData,
          variables: analysisVariables,
          model,
          config: {
            aspectRatio: generationConfig.aspectRatio,
            resolution: generationConfig.resolution
          },
          outputCount: generationConfig.numberOfImages
        }),
      });

      const result = await res.json();

      if (result.error) {
        setError(`Generation failed: ${result.error}`);
      } else {
        // result.generationRuns is array of generation records
        result.generationRuns.forEach(run => onRunComplete(run));
        setError(null);
      }
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
    } finally {
      setIsRunning(false);
      setGenerationProgress(null);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateSlug || !templateData) {
      setError('Cannot save: missing template slug or data');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/notebook/save-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: templateSlug,
          templateData,
          variablesSchema: templates.find(t => t.slug === templateSlug)?.variables_schema,
          outputCount: generationConfig.numberOfImages  // Backend auto-detects type from this
        }),
      });

      const result = await res.json();

      if (result.error) {
        setError(`Save failed: ${result.error}`);
      } else {
        setCurrentTemplateVersion(result.template.version);
        setHasUnsavedChanges(false);
        // Optionally: show success toast or message
        console.log(result.message); // "Saved template-slug v4"
      }
    } catch (err) {
      setError(`Save failed: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (disabled) {
    return (
      <ShadcnCard className="opacity-50 border-dashed border-2 shadow-none bg-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-muted-foreground/60">
            <Lock className="h-5 w-5" />
            Generation Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground/60">
            Complete the analysis phase to unlock generation tools.
          </p>
        </CardContent>
      </ShadcnCard>
    );
  }

  const templateOptions = [
    { value: '', label: '-- Select template --' },
    ...templates.map((t) => ({ value: t.slug, label: t.slug })),
  ];

  return (
    <ShadcnCard className="border-l-4 border-l-purple-500/50 shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Wand2 className="h-5 w-5 text-purple-500" />
            Generation Phase
            {currentTemplateVersion && (
              <Badge variant="secondary" className="text-xs">
                v{currentTemplateVersion}
              </Badge>
            )}
          </CardTitle>
            <Button onClick={handleRun} disabled={isRunning || !templateSlug} className="bg-purple-600 hover:bg-purple-700">
              {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRunning ? 'Generating...' : `Generate ${generationConfig.numberOfImages} Image${generationConfig.numberOfImages > 1 ? 's' : ''}`}
              {!isRunning && <Play className="ml-2 h-3 w-3" />}
            </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {generationProgress && (
          <Alert>
            <AlertDescription>
              Generating image {generationProgress.current} of {generationProgress.total}...
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <Select
                label="Template"
                value={templateSlug}
                onChange={setTemplateSlug}
                options={templateOptions}
                className="w-full"
              />
               <Select
                label="Model"
                value={model}
                onChange={setModel}
                options={[{ value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image' }]}
                 className="w-full"
              />
               <Select
                label="Number of Images"
                value={generationConfig.numberOfImages.toString()}
                onChange={(value) =>
                  setGenerationConfig((prev) => ({ ...prev, numberOfImages: parseInt(value, 10) }))
                }
                options={[
                  { value: '1', label: '1 Image' },
                  { value: '2', label: '2 Images' },
                  { value: '3', label: '3 Images' },
                  { value: '4', label: '4 Images' },
                  { value: '5', label: '5 Images' },
                  { value: '6', label: '6 Images' },
                  { value: '7', label: '7 Images' },
                ]}
                className="w-full"
              />
            </div>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Resolution"
                    value={generationConfig.resolution}
                    onChange={(value) =>
                      setGenerationConfig((prev) => ({ ...prev, resolution: value as '1k' | '2k' | '4k' }))
                    }
                    options={[
                      { value: '1k', label: '1K Standard' },
                      { value: '2k', label: '2K High' },
                      { value: '4k', label: '4K Ultra' },
                    ]}
                  />
                  <Select
                    label="Aspect Ratio"
                    value={generationConfig.aspectRatio}
                    onChange={(value) => setGenerationConfig((prev) => ({ ...prev, aspectRatio: value }))}
                     options={[
                       { value: '1:1', label: '1:1 (Square)' },
                       { value: '2:3', label: '2:3 (Portrait)' },
                       { value: '3:2', label: '3:2 (Landscape)' },
                       { value: '3:4', label: '3:4 (Portrait)' },
                       { value: '4:3', label: '4:3 (Landscape)' },
                       { value: '4:5', label: '4:5 (Portrait)' },
                       { value: '5:4', label: '5:4 (Landscape)' },
                       { value: '9:16', label: '9:16 (Vertical)' },
                       { value: '16:9', label: '16:9 (Horizontal)' },
                       { value: '21:9', label: '21:9 (Ultrawide)' },
                     ]}
                  />
               </div>
            </div>
         </div>

         {/* Angle Plan Display - Only show when we have generation runs with angle data */}
         {runs.length > 0 && runs[0].debug_metadata?.angle_plan && (
           <Accordion type="single" collapsible className="w-full border rounded-lg bg-card">
             <AccordionItem value="angles" className="border-none px-4">
               <AccordionTrigger className="hover:no-underline py-3">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <BarChart2 className="h-4 w-4" />
                   <span>Angle Plan</span>
                 </div>
               </AccordionTrigger>
               <AccordionContent className="pt-2 pb-4 space-y-4">
                 {/* Display angle assignments */}
                 <div className="space-y-2">
                   <Label className="text-xs font-medium text-muted-foreground">Generation Plan:</Label>
                   <div className="space-y-1">
                     {runs[0].debug_metadata.angle_plan.assignments.map((assignment, idx) => (
                       <div key={`${runs[0].id}-assignment-${idx}`} className="text-xs font-mono bg-muted/30 p-2 rounded flex items-center justify-between">
                         <span>
                           {idx + 1}. <strong>{assignment.targetAngle}</strong>
                         </span>
                         <span className="text-muted-foreground">
                           using Image {assignment.sourceImageIndex + 1} ({assignment.matchType.replace('-', ' ')})
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Optional: Show angle-specific prompts */}
                 {runs[0].debug_metadata.angle_prompts && runs[0].debug_metadata.angle_prompts.length > 0 && (
                   <div className="space-y-2">
                     <Label className="text-xs font-medium text-muted-foreground">Angle-Specific Prompts:</Label>
                     <div className="space-y-1 max-h-40 overflow-y-auto">
                       {runs[0].debug_metadata.angle_prompts.map((prompt, idx) => (
                         <div key={`${runs[0].id}-prompt-${idx}`} className="text-xs bg-muted/20 p-2 rounded">
                           <strong className="text-muted-foreground">Image {idx + 1}:</strong> {prompt}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </AccordionContent>
             </AccordionItem>
           </Accordion>
         )}

         {templateSlug && (
          <Accordion type="single" collapsible className="w-full border rounded-lg bg-card">
            <AccordionItem value="config" className="border-none px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings2 className="h-4 w-4" />
                  <span>Advanced Configuration</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Template Data (JSON)</Label>
                      <Textarea
                        value={JSON.stringify(templateData, null, 2)}
                        onChange={(e) => {
                          try {
                            setTemplateData(JSON.parse(e.target.value));
                          } catch {
                            // Invalid JSON
                          }
                        }}
                        className="h-40 font-mono text-xs resize-none bg-muted/30"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Analysis Variables (JSON)</Label>
                      <Textarea
                        value={JSON.stringify(analysisVariables || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            setAnalysisVariables(JSON.parse(e.target.value));
                          } catch {
                            // Invalid JSON
                          }
                        }}
                        placeholder='{"background": "white"}'
                        className="h-40 font-mono text-xs resize-none bg-muted/30"
                      />
                   </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={previewPrompt} className="h-8">
                    Preview Compiled Prompt
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={isSaving || !templateSlug}
                    className="h-8"
                  >
                    {isSaving ? 'Saving...' : `Save as v${(currentTemplateVersion || 0) + 1}`}
                  </Button>
                </div>
                
                {compiledPrompt && (
                   <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs font-medium text-primary">Compiled Prompt Preview</Label>
                      <div className="bg-muted/50 p-3 rounded-md border text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {compiledPrompt}
                      </div>
                   </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {runs.length > 0 && (
          <div className="space-y-4 pt-4">
             <div className="flex items-center justify-between border-b pb-2">
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Generation History</h3>
                {runs.length >= 2 && (
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                    <BarChart2 className="h-3 w-3 mr-1.5" />
                    Compare All
                  </Button>
                )}
             </div>
             
             <div className="grid grid-cols-1 gap-4">
               {runs.map((run) => {
                 const isSelected = selectedRunId === run.id;
                 return (
                  <div
                    key={run.id}
                    className={cn(
                      "group relative rounded-xl border transition-all duration-300 overflow-hidden",
                       isSelected ? "border-purple-500/50 shadow-md bg-purple-500/5" : "border-border hover:border-purple-500/20 hover:shadow-sm"
                    )}
                  >
                     <div className="flex flex-col md:flex-row">
                        {/* Image Preview Area */}
                        <div className="relative w-full md:w-48 h-48 md:h-auto bg-muted/10 shrink-0 border-b md:border-b-0 md:border-r border-border/50">
                            {run.debug_metadata?.image_urls && run.debug_metadata.image_urls.length > 1 ? (
                               // Multi-image grid for conversations
                               <div className="grid grid-cols-2 gap-2 p-2 h-full">
                                  {run.debug_metadata.image_urls.map((url, idx) => (
                                     <div key={`${run.id}-image-${idx}`} className="flex flex-col">
                                        <div className="flex-1 relative">
                                           <img
                                              src={url}
                                              alt={`Generated ${idx + 1}`}
                                              loading="lazy"
                                              className="w-full h-full object-cover rounded"
                                           />
                                        </div>
                                        {/* Add angle label underneath */}
                                        {run.debug_metadata.angle_plan?.assignments[idx] && (
                                           <div className="text-center mt-1">
                                              <Badge
                                                 variant="secondary"
                                                 className="text-xs"
                                              >
                                                 {run.debug_metadata.angle_plan.assignments[idx].targetAngle}
                                              </Badge>
                                           </div>
                                        )}
                                     </div>
                                  ))}
                               </div>
                           ) : run.debug_metadata?.image_urls?.[0] ? (
                              // Single image fallback
                              <img
                                 src={run.debug_metadata.image_urls[0]}
                                 alt="Generated"
                                 loading="lazy"
                                 className="w-full h-full object-cover"
                              />
                           ) : (
                              // No image fallback
                              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                 No image
                              </div>
                           )}
                           
                           {/* Selection Overlay */}
                           <div className={cn(
                             "absolute inset-0 bg-black/10 transition-opacity flex items-center justify-center",
                              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                           )}>
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "secondary"}
                                onClick={() => onSelectRun(run.id)}
                                className={cn("shadow-lg", isSelected && "bg-purple-600 hover:bg-purple-700")}
                              >
                                {isSelected ? "Selected" : "Select Result"}
                              </Button>
                           </div>
                           
                           <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="backdrop-blur-md bg-background/50 border-white/10 text-xs">
                                Run {run.phase_run_number}
                              </Badge>
                           </div>
                        </div>

                        {/* Details Area */}
                        <div className="flex-1 p-4 flex flex-col justify-between gap-4">
                           <div>
                              <div className="flex justify-between items-start mb-2">
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                       <span className="font-medium text-foreground">{run.debug_metadata?.model}</span>
                                       <span>•</span>
                                       <span>{run.debug_metadata?.duration_ms ? `${(run.debug_metadata.duration_ms / 1000).toFixed(1)}s` : ''}</span>
                                       <span>•</span>
                                       <span>${run.debug_metadata?.cost?.toFixed(4) || '0.0000'}</span>
                                    </div>
                                 </div>
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemoveRun(run.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                              </div>
                              
                              {/* Collapsible Details */}
                              <Collapsible open={expandedRunId === run.id} onOpenChange={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}>
                                 <CollapsibleContent>
                                    <div className="space-y-3 mt-3">
                                       {run.debug_metadata?.thinking && (
                                         <div className="space-y-1">
                                           <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">AI Thought Process</span>
                                           <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded max-h-24 overflow-y-auto">
                                              {run.debug_metadata.thinking}
                                           </div>
                                         </div>
                                       )}
                                       <div className="space-y-1">
                                           <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Final Prompt</span>
                                           <div className="text-xs font-mono text-muted-foreground bg-muted/30 p-2 rounded max-h-24 overflow-y-auto">
                                              {run.final_prompt}
                                           </div>
                                       </div>
                                    </div>
                                 </CollapsibleContent>
                                 <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground mt-2 w-full justify-between hover:bg-transparent">
                                       {expandedRunId === run.id ? 'Hide Details' : 'Show Details'}
                                       <ChevronDown className={cn("h-3 w-3 transition-transform", expandedRunId === run.id && "rotate-180")} />
                                    </Button>
                                 </CollapsibleTrigger>
                              </Collapsible>
                           </div>
                        </div>
                     </div>
                  </div>
                 );
               })}
             </div>
          </div>
        )}
      </CardContent>
    </ShadcnCard>
  );
}
