import React from 'react';
import { 
  MessageSquare, 
  Globe, 
  Github, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Instagram, 
  Send, 
  Twitter as XIcon, 
  Music, 
  Tv, 
  Bot, 
  Ghost, 
  Pin, 
  DollarSign, 
  FileText, 
  Image as ImageIcon, 
  Slack, 
  Gamepad2,
  Trash2
} from 'lucide-react';

const SocialIcon = ({ name, size = 20, color = 'currentColor' }) => {
  const brandName = name?.toLowerCase() || '';

  // Brand-accurate SVGs that Lucide might not have or that need specific styling
  if (brandName.includes('tiktok')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
      </svg>
    );
  }

  if (brandName.includes('zalo')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M22.05 10.3c-.05-1.55-1.12-2.85-2.6-3.14-1.63-.33-3.23.51-3.77 2.01-.15.36-.21.78-.18 1.16.06.66.33 1.25.76 1.74-.82 1.62-1.83 3.12-3.03 4.54-1.2-1.42-2.21-2.92-3.03-4.54.43-.49.7-1.08.76-1.74.03-.38-.03-.8-.18-1.16-.54-1.5-2.14-2.34-3.77-2.01-1.48.29-2.55 1.59-2.6 3.14-.02.43.05.86.2 1.27.42 1.13 1.45 1.94 2.67 2.04v2.96c0 .35.28.63.63.63.17 0 .33-.07.45-.19l2.45-2.43c1.37.08 2.76.12 4.14.12 1.38 0 2.77-.04 4.14-.12l2.45 2.43c.12.12.28.19.45.19.35 0 .63-.28.63-.63v-2.96c1.22-.1 2.25-.91 2.67-2.04.15-.41.22-.84.2-1.27z"/>
      </svg>
    );
  }

  if (brandName.includes('spotify')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 12c2-1 4-1 8 0"></path>
        <path d="M7 15c3-1 6-1 10 0"></path>
        <path d="M9 9c2-1 3-1 6 0"></path>
      </svg>
    );
  }

  if (brandName.includes('reddit')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M17 12a5 5 0 0 0-10 0"></path>
        <line x1="12" y1="7" x2="12" y2="12"></line>
      </svg>
    );
  }

  if (brandName.includes('twitch')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2H3v16h5v4l4-4h5l4-4V2z"></path>
        <line x1="11" y1="7" x2="11" y2="11"></line>
        <line x1="16" y1="7" x2="16" y2="11"></line>
      </svg>
    );
  }

  if (brandName.includes('messenger')) return <MessageSquare size={size} color={color} />;
  if (brandName.includes('facebook')) return <Facebook size={size} color={color} />;
  if (brandName.includes('github')) return <Github size={size} color={color} />;
  if (brandName.includes('linkedin')) return <Linkedin size={size} color={color} />;
  if (brandName.includes('youtube')) return <Youtube size={size} color={color} />;
  if (brandName.includes('instagram')) return <Instagram size={size} color={color} />;
  if (brandName.includes('telegram')) return <Send size={size} color={color} />;
  if (brandName.includes('x') || brandName.includes('twitter')) return <XIcon size={size} color={color} />;
  if (brandName.includes('snapchat')) return <Ghost size={size} color={color} />;
  if (brandName.includes('pinterest')) return <Pin size={size} color={color} />;
  if (brandName.includes('patreon')) return <DollarSign size={size} color={color} />;
  if (brandName.includes('medium')) return <FileText size={size} color={color} />;
  if (brandName.includes('behance') || brandName.includes('image')) return <ImageIcon size={size} color={color} />;
  if (brandName.includes('slack')) return <Slack size={size} color={color} />;
  if (brandName.includes('steam') || brandName.includes('gamepad')) return <Gamepad2 size={size} color={color} />;
  if (brandName.includes('discord')) return <MessageSquare size={size} color={color} />;
  if (brandName.includes('apple')) return <Music size={size} color={color} />;

  return <Globe size={size} color={color} />;
};

export default SocialIcon;
