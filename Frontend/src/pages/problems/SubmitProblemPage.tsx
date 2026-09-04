import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemService } from '../../services/problemService';
import { detectLanguage, LanguageDetectionResult } from '../../utils/languageDetector';
import {
  PlusCircle,
  FileText,
  Mic,
  MicOff,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Camera,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export const SubmitProblemPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'image'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Voice Recording state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Auto detected language
  const [detectedLang, setDetectedLang] = useState<LanguageDetectionResult>({
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
  });

  // Real-time language detection as user types or speaks
  useEffect(() => {
    const combinedText = `${title} ${description} ${transcript}`;
    const result = detectLanguage(combinedText);
    setDetectedLang(result);
  }, [title, description, transcript]);

  // Initialize Web Speech API for voice input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN'; // Default to Indian multilingual speech recognition

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          setDescription((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast.error('Voice input error. You can continue typing text.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser. Please type your problem text.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info('Voice recording stopped.');
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('Listening... Speak your problem in your language.');
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast.success('Problem image attached!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDescription = description.trim() || transcript.trim();

    if (!finalDescription) {
      toast.error('Please describe the problem using text, voice, or image.');
      return;
    }

    const finalTitle = title.trim() || (finalDescription.slice(0, 60) + '...');

    setIsSubmitting(true);
    try {
      const res = await problemService.submitProblem({
        title: finalTitle,
        description: finalDescription,
        location: location || 'Not specified',
        language: detectedLang.name,
        input_type: activeTab,
        image_url: imageUrl || undefined,
      });

      const problemId = res?.problem?.id;
      toast.success('Problem submitted! AI is auto-analyzing category, department & expertise.');

      if (problemId) {
        navigate(`/problems/${problemId}`);
      } else {
        navigate('/citizen');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Citizen Innovation Platform</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Tell Us About the Problem
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Describe the challenge in your preferred language using Text, Voice, or Image. AI automatically detects language, category, department, and required expertise.
        </p>
      </div>

      {/* Input Mode Selector (Text / Voice / Image) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'text'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Write Problem</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'voice'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
          <span>Speak (Voice)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'image'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">

        {/* Real-time Language Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Automatic AI Language Detection:</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Language detected: {detectedLang.name} ({detectedLang.nativeName})</span>
          </div>
        </div>

        {/* Tab 1: Voice Recording Controller (Active when in Voice mode) */}
        {activeTab === 'voice' && (
          <div className="p-6 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              {isListening ? (
                <Mic className="w-8 h-8 animate-pulse text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-blue-200" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isListening ? 'Listening... Speak now' : 'Click microphone to record your voice'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You can speak in Hindi, English, Tamil, Telugu, Bengali or any regional language.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-md transition ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isListening ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
        )}

        {/* Tab 2: Image Upload Controller (Active when in Image mode) */}
        {activeTab === 'image' && (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4">
            {imageUrl ? (
              <div className="relative max-w-sm mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={imageUrl} alt="Problem Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Camera className="w-10 h-10 mx-auto text-slate-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Upload an Image of the Issue
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload photos of broken road, garbage pile, flooding, damaged infrastructure, etc.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition shadow-md">
                  <Camera className="w-4 h-4" />
                  <span>Choose Photo / Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Optional Title Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Problem Headline / Title (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Broken water pipeline causing shortage in Village Rampur"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Problem Description Area */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Describe the Problem <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            placeholder="Describe the problem in your own words. You can write in your preferred language (Hindi, English, Bengali, Tamil, etc.)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition leading-relaxed"
          />
        </div>

        {/* Location Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Location / Village / Ward
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Village Rampur, District Solan, HP"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* AI Auto-Detection Information Card */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <span className="font-bold">Automated AI Processing:</span> You do not need to choose category or department manually. Gemini AI will analyze your report, determine the category, required expertise, and submit it for Government validation.
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Analyzing Problem with AI...</span>
          ) : (
            <>
              <span>Submit Problem for AI Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
