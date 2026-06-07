interface VersionSelectorProps {
  versions: { versionNumber: number }[]
  selected: number | 'all'
  onSelect: (version: number | 'all') => void
}

export default function VersionSelector({ versions, selected, onSelect }: VersionSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect('all')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          selected === 'all'
            ? 'bg-primary-purple text-white'
            : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
        }`}
      >
        Toate
      </button>
      {versions.map((v) => (
        <button
          key={v.versionNumber}
          onClick={() => onSelect(v.versionNumber)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selected === v.versionNumber
              ? 'bg-primary-purple text-white'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          V{v.versionNumber}
        </button>
      ))}
    </div>
  )
}
