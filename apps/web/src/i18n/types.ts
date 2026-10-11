export type Locale = 'pt-BR' | 'en';

export interface Translations {
  meta: {
    title: string;
    description: string;
  };
  common: {
    loading: string;
    cancel: string;
    save: string;
    clear: string;
    change: string;
    matched: string;
    notFound: string;
    openInSpotify: string;
    by: string;
    artists: string;
    artist: string;
    all: string;
    load: string;
  };
  header: {
    subtitle: string;
    presets: string;
    presetsDesc: string;
    history: string;
    historyDesc: string;
    login: string;
    logout: string;
    language: string;
    toggleLanguage: string;
    menu: string;
    openMenu: string;
    closeMenu: string;
    connectedAs: string;
    navigation: string;
  };
  hero: {
    badge: string;
    title: string;
    description: string;
    connectButton: string;
    features: {
      tracksAlbums: {
        title: string;
        desc: string;
      };
      catalogFollowed: {
        title: string;
        desc: string;
      };
      presetsHistory: {
        title: string;
        desc: string;
      };
    };
  };
  randomizer: {
    track: string;
    trackDesc: string;
    album: string;
    albumDesc: string;
    single: string;
    singleDesc: string;
    leftToday: string;
    drawing: string;
    limitReachedButton: string;
    spinTrack: string;
    spinAlbum: string;
    spinSingle: string;
    limitReachedBanner: string;
    categoryTracks: string;
    categoryAlbums: string;
    categorySingles: string;
    selectArtistWarning: string;
  };
  result: {
    randomTrack: string;
    randomAlbum: string;
    randomSingle: string;
    spinAnother: string;
    limitReached: string;
    released: string;
    tracksCount: string;
    album: string;
    openInSpotify: string;
  };
  artistSelection: {
    title: string;
    subtitle: string;
    pasteList: string;
    savePreset: string;
    clear: string;
    presetPlaceholder: string;
    presetSave: string;
    presetCancel: string;
    presetErrorRequired: string;
    presetErrorTooLong: string;
    presetSaveFailed: string;
    noArtistsSelected: string;
    removeArtist: string;
    quickPresets: string;
    searchPlaceholder: string;
    searchResults: string;
    noArtistsFound: string;
    followedTitle: string;
    followedSubtitle: string;
    selectAll: string;
    deselectAll: string;
    selectAllGenre: string;
    deselectAllGenre: string;
    genreLabel: string;
    allGenres: string;
    noFollowedArtists: string;
    noArtistsForGenre: string;
    clearFilter: string;
  };
  history: {
    title: string;
    clear: string;
    loading: string;
    empty: string;
    openInSpotify: string;
    typeTrack: string;
    typeAlbum: string;
    typeSingle: string;
  };
  presets: {
    title: string;
    loading: string;
    empty: string;
    artistsCount: string;
    load: string;
    deleteTitle: string;
  };
  pasteList: {
    titleInput: string;
    subtitleInput: string;
    titleReview: string;
    subtitleReview: string;
    inputLabel: string;
    artistsDetectedOne: string;
    artistsDetectedMany: string;
    searching: string;
    findArtists: string;
    alertNotFoundOne: string;
    alertNotFoundMany: string;
    alertAllMatched: string;
    queryLabel: string;
    noMatchHelp: string;
    searchManually: string;
    change: string;
    changeTitle: string;
    removeTitle: string;
    manualSearchPlaceholder: string;
    selectCorrectArtist: string;
    select: string;
    noArtistsForQuery: string;
    backToText: string;
    addOne: string;
    addMany: string;
  };
  errors: {
    unauthorized: string;
    invalidToken: string;
    userNotFound: string;
    presetNotFound: string;
    noTracksFound: string;
    noAlbumsFound: string;
    noSinglesFound: string;
    dailyLimitReached: string;
    generalError: string;
    authFailed: string;
  };
}
