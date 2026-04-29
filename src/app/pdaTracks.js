export const pdaTracks = [
  {
    id: "dracula",
    title: "Dracula",
    artist: "",
    audioSrc: "/media/tracks/Dracula.mp3",
    coverSrc: "/media/covers/Dracula.jpeg",
  },
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

export function getTrackById(trackId) {
  return pdaTracks.find((track) => track.id === trackId) ?? null;
}
