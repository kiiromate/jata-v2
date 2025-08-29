interface AvatarProps {
  avatarUrl: string | null;
  name: string | undefined | null;
  className?: string;
}

const avatarColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
];

function selectColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

// Function to get initials from a name
const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ avatarUrl, name, className }) => {
  const displayName = name || 'User';
  const initials = getInitials(displayName);
  const colorClass = selectColor(displayName);

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden ${!avatarUrl ? colorClass : ''} ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold select-none" aria-hidden>
          {initials}
        </span>
      )}
    </div>
  );
};

export default Avatar;
