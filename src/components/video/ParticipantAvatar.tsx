interface ParticipantAvatarProps {
  identity: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ParticipantAvatar({ identity, size = 'lg' }: ParticipantAvatarProps) {
  // Extract initials from email or name
  const getInitials = (id: string): string => {
    if (!id) return '?';
    
    // If it's an email, get the part before @
    const name = id.includes('@') ? id.split('@')[0] : id;
    
    // Split by common separators
    const parts = name.split(/[\s._-]+/).filter(Boolean);
    
    if (parts.length >= 2) {
      // First letter of first two parts
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      // First two letters
      return parts[0].substring(0, 2).toUpperCase();
    } else {
      return parts[0]?.[0]?.toUpperCase() || '?';
    }
  };

  // Generate a consistent color based on the identity
  const getAvatarColor = (id: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
    ];
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-20 h-20 text-3xl',
    lg: 'w-32 h-32 text-5xl',
  };

  const initials = getInitials(identity);
  const colorClass = getAvatarColor(identity);

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
    >
      {initials}
    </div>
  );
}
