'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  Square,
  CornerDownLeft, 
  Sparkles, 
  ArrowRight,
  Globe,
  ChevronDown,
  Download
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const FEATURES = [
  { id: 'Translate', label: 'Translate', icon: Globe, isDropdown: true },
  { id: 'Rephrase', label: 'Rephrase', icon: Sparkles },
  { id: 'Concise', label: 'Concise', icon: ArrowRight },
  { id: 'Professional', label: 'Professional', icon: Sparkles },
  { id: 'Polite', label: 'Polite / Friendly', icon: Sparkles },
  { id: 'Grammar', label: 'Fix Grammar', icon: Sparkles },
  { id: 'Style: Witty', label: 'Witty Style', icon: Sparkles },
  { id: 'Style: Assertive', label: 'Assertive Style', icon: Sparkles },
  { id: 'Style: Empathetic', label: 'Empathetic Style', icon: Sparkles },
  { id: 'Style: Direct', label: 'Direct Style', icon: Sparkles },
  { id: 'Style: Storytelling', label: 'Storytelling', icon: Sparkles },
];

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState('');
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Tamil'>('English');
  const [copied, setCopied] = useState(false);
  
  // TTS State
  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [speechSpeed, setSpeechSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // PWA Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Web Speech API Refs
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Scroll Container Ref for Zone 2 Chips
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Character and Word count
  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setInputText((prev) => prev + (prev ? ' ' : '') + transcript);
          showToast('Speech recorded successfully!', 'success');
        };

        recognition.onerror = (event: any) => {
          console.error('Speech Recognition Error', event.error);
          showToast(`Voice input error: ${event.error}`, 'error');
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Stop TTS playing on change of output text
  useEffect(() => {
    stopSpeech();
  }, [outputText]);

  // Register Service Worker and PWA Install Handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Register Service Worker
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then(
            (registration) => {
              console.log('ServiceWorker registration successful with scope: ', registration.scope);
            },
            (err) => {
              console.log('ServiceWorker registration failed: ', err);
            }
          );
        });
      }

      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Listen for appinstalled event
      const handleAppInstalled = () => {
        setIsInstallable(false);
        setDeferredPrompt(null);
        showToast('App installed successfully!', 'success');
      };

      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        showToast('iOS Install: Tap Share, then "Add to Home Screen".', 'success');
      } else {
        showToast('To install, open your browser menu and choose "Add to Home Screen".', 'success');
      }
      return;
    }
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Thank you for installing Clariva!', 'success');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.error(err);
      showToast('Install failed or canceled.', 'error');
    }
  };

  // Speech to Text Trigger
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        showToast('Listening... Speak now.', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to start recording.', 'error');
      }
    }
  };

  // Trigger Groq API Transformation
  const handleFeatureClick = async (featureId: string, customLang?: 'English' | 'Tamil') => {
    if (featureId === 'Translate' && !customLang) {
      setShowTranslateMenu(!showTranslateMenu);
      return;
    }

    setShowTranslateMenu(false);

    if (!inputText.trim()) {
      showToast('Please type or record some text first.', 'error');
      return;
    }

    setActiveFeature(featureId);
    setIsLoading(true);
    
    const targetLang = customLang || selectedLanguage;

    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature: featureId,
          targetLanguage: featureId === 'Translate' ? targetLang : undefined,
          text: inputText,
        }),
      });

      const data = await response.json();

      if (response.ok && data.result) {
        setOutputText(data.result);
        showToast(`${featureId === 'Translate' ? 'Translated' : featureId} completed successfully!`, 'success');
      } else {
        throw new Error(data.error || 'Transformation failed');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error occurred while processing request.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Clipboard Copier
  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy text.', 'error');
    }
  };

  // Push output back as input
  const handleUseAsInput = () => {
    if (!outputText) return;
    setInputText(outputText);
    setOutputText('');
    setActiveFeature('');
    showToast('Output pushed to input field!', 'success');
  };

  // Speak Output Text (TTS)
  const speakSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showToast('Text-to-speech is not supported in this browser.', 'error');
      return;
    }

    if (speechState === 'paused') {
      window.speechSynthesis.resume();
      setSpeechState('playing');
      return;
    }

    // Stop current speaking
    window.speechSynthesis.cancel();

    if (!outputText) {
      showToast('No text available to read aloud.', 'error');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(outputText);
    utteranceRef.current = utterance;

    // Detect language of output text or use the active setting
    let langCode = 'en-US';
    
    // Auto-detect Tamil by looking for Tamil characters (range U+0B80 to U+0BFF)
    const hasTamil = /[\u0B80-\u0BFF]/.test(outputText);
    if (hasTamil || (activeFeature === 'Translate' && selectedLanguage === 'Tamil')) {
      langCode = 'ta-IN';
    }

    utterance.lang = langCode;

    // Adjust speed rate
    if (speechSpeed === 'slow') utterance.rate = 0.65;
    else if (speechSpeed === 'fast') utterance.rate = 1.4;
    else utterance.rate = 1.0;

    // Set voice based on language preference
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(langCode));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      setSpeechState('idle');
    };

    utterance.onerror = (e) => {
      console.error(e);
      setSpeechState('idle');
    };

    setSpeechState('playing');
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis && speechState === 'playing') {
      window.speechSynthesis.pause();
      setSpeechState('paused');
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeechState('idle');
    }
  };

  const handleSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    setSpeechSpeed(speed);
    // If speaking, restart speech to apply new rate
    if (speechState === 'playing' || speechState === 'paused') {
      setTimeout(() => {
        speakSpeech();
      }, 50);
    }
  };

  // Scroll controls for middle action bar chips
  const scrollChips = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="app-container">
      <div className="app-card">
        
        {/* App Title */}
        <div className="app-header">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <img src="/logo.png" alt="Clariva Logo" className="brand-logo-img" />
            </div>
            <h1 className="brand-name">Clariva</h1>
          </div>
          <button className="install-app-btn" onClick={handleInstallApp} type="button">
            <Download size={14} />
            <span>Install App</span>
          </button>
        </div>

        {/* ZONE 1: Input Area */}
        <div className="input-zone">
          <div className="textarea-wrapper">
            <textarea
              className="app-textarea"
              placeholder="Paste or type your text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              className={`stt-button ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
              type="button"
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
          <div className="meta-info">
            <div className="character-count">
              <span>{inputText.length} characters</span>
              <span>•</span>
              <span>{getWordCount(inputText)} words</span>
            </div>
            {isRecording && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Recording active...</span>}
          </div>
        </div>

        {/* ZONE 2: Action Bar (Middle) */}
        <div className="action-zone">
          <div className="chips-outer-container">
            <div className="chips-scroll-container" ref={scrollContainerRef}>
              {FEATURES.map((feature) => {
                const IconComponent = feature.icon;
                const isCurrentActive = activeFeature === feature.id;
                
                return (
                  <button
                    key={feature.id}
                    className={`chip-button ${isCurrentActive ? 'active' : ''}`}
                    onClick={() => handleFeatureClick(feature.id)}
                    type="button"
                  >
                    <IconComponent size={14} />
                    <span>{feature.label}</span>
                    {feature.isDropdown && <ChevronDown size={14} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Translate Language Selector Dropdown */}
          {showTranslateMenu && (
            <div className="translate-dropdown-wrapper">
              <div className="dropdown-label">Select Target Language</div>
              <div className="languages-grid">
                <button
                  className={`lang-select-button ${selectedLanguage === 'English' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedLanguage('English');
                    handleFeatureClick('Translate', 'English');
                  }}
                  type="button"
                >
                  English
                </button>
                <button
                  className={`lang-select-button ${selectedLanguage === 'Tamil' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedLanguage('Tamil');
                    handleFeatureClick('Translate', 'Tamil');
                  }}
                  type="button"
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ZONE 3: Output Area (Bottom) */}
        <div className="output-zone">
          <div className={`output-textarea-wrapper ${isLoading ? 'loading' : ''}`}>
            <textarea
              className="output-textarea"
              placeholder="Your optimized text will appear here..."
              value={outputText}
              readOnly
            />
            {isLoading && <div className="shimmer-overlay" />}
          </div>

          {/* Zone 3 Footer Action Controls */}
          <div className="output-controls">
            
            {/* Left Controls: Audio / Read Aloud Player */}
            <div className="tts-player-container">
              {speechState === 'idle' ? (
                <button 
                  className="tts-play-btn"
                  onClick={speakSpeech} 
                  disabled={!outputText}
                  title="Read Aloud"
                  type="button"
                >
                  <Volume2 size={16} />
                </button>
              ) : speechState === 'playing' ? (
                <button 
                  className="tts-play-btn"
                  onClick={pauseSpeech}
                  title="Pause"
                  type="button"
                >
                  <Pause size={16} />
                </button>
              ) : (
                <button 
                  className="tts-play-btn"
                  onClick={speakSpeech}
                  title="Resume"
                  type="button"
                >
                  <Play size={16} />
                </button>
              )}
              
              {speechState !== 'idle' && (
                <button 
                  className="tts-play-btn"
                  onClick={stopSpeech}
                  title="Stop Playback"
                  type="button"
                >
                  <Square size={14} />
                </button>
              )}

              {/* Speed Controller */}
              <div className="tts-speed-selector">
                <button
                  className={`tts-speed-btn ${speechSpeed === 'slow' ? 'active' : ''}`}
                  onClick={() => handleSpeedChange('slow')}
                  type="button"
                >
                  0.7x
                </button>
                <button
                  className={`tts-speed-btn ${speechSpeed === 'normal' ? 'active' : ''}`}
                  onClick={() => handleSpeedChange('normal')}
                  type="button"
                >
                  1x
                </button>
                <button
                  className={`tts-speed-btn ${speechSpeed === 'fast' ? 'active' : ''}`}
                  onClick={() => handleSpeedChange('fast')}
                  type="button"
                >
                  1.4x
                </button>
              </div>

              {/* Audio Visualizer animation */}
              <div className={`audio-visualizer ${speechState === 'playing' ? 'playing' : ''}`}>
                <div className="audio-bar" />
                <div className="audio-bar" />
                <div className="audio-bar" />
                <div className="audio-bar" />
              </div>
            </div>

            {/* Right Controls: Copy & Push back */}
            <div className="output-action-group">
              <button 
                className={`action-btn ${copied ? 'success' : ''}`}
                onClick={handleCopy}
                disabled={!outputText}
                type="button"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button 
                className="action-btn"
                onClick={handleUseAsInput}
                disabled={!outputText}
                type="button"
              >
                <CornerDownLeft size={14} />
                <span>Use as Input</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Toast Notification HUD */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <Sparkles size={14} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
