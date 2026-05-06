import "./style.css";
import { initBackgroundVideo } from "./app/video.js";
import { initAuthPanel } from "./app/auth.js";
import { initComments } from "./app/comments.js";
import { initPdaRefreshButton } from "./app/pdaButton.js";
import { initPdaPlayer } from "./app/pdaPlayer.js";

// starter alle moduler for forsiden
initBackgroundVideo();
initAuthPanel();
initComments();
initPdaRefreshButton();
initPdaPlayer();
