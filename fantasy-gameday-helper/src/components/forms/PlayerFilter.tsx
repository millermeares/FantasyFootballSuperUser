import { useAppContext } from '../../context';
import './PlayerFilter.css';

export function PlayerFilter() {
  const { state, setPlayerFilter } = useAppContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerFilter(e.target.value);
  };

  const handleClear = () => {
    setPlayerFilter('');
  };

  return (
    <div className="player-filter">
      <div className="player-filter-input-wrapper">
        <svg
          className="player-filter-search-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          className="player-filter-input"
          placeholder="Filter players by name or team..."
          value={state.playerFilter}
          onChange={handleChange}
          aria-label="Filter players by name or team"
        />
        {state.playerFilter && (
          <button
            className="player-filter-clear-button"
            onClick={handleClear}
            aria-label="Clear player filter"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
