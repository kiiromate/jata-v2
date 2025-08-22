interface AvatarProps {
  avatarUrl: string | null;
  userId: string | undefined;
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

const Avatar: React.FC<AvatarProps> = ({ avatarUrl, userId, className }) => {
  const name = userId || 'User';
  const initial = name.charAt(0).toUpperCase();
  const colorClass = selectColor(name);

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden ${!avatarUrl ? colorClass : ''} ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold select-none" aria-hidden>
          {initial}
        </span>
      )}
    </div>
  );
};

export default Avatar;
