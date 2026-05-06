// lista over spor PDA-playeren kan spille
export const pdaTracks = [
  {
    id: "inmyroom",
    title: "In My Room",
    artist: "",
    audioSrc: "/media/tracks/inmyroom.mp3",
    coverSrc: "/media/covers/inmyroom.jpg",
  },
  {
    id: "universalcollapse",
    title: "Universal Collapse",
    artist: "",
    audioSrc: "/media/tracks/universalcollapse.mp3",
    coverSrc: "/media/covers/universalcollapse.jpg",
  },
];

// helper for å slå opp track fra id (brukes hvis vi senere lagrer “current track”)
export function getTrackById(trackId) {
  return pdaTracks.find((track) => track.id === trackId) ?? null;
}
