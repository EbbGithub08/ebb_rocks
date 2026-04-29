export const pdaTracks = [
  {
    id: "dracula",
    title: "Dracula",
    artist: "",
    audioSrc: "/media/tracks/Dracula.mp3",
    coverSrc: "/media/covers/Dracula.jpeg",
  },
];

export function getTrackById(trackId) {
  return pdaTracks.find((track) => track.id === trackId) ?? null;
}
