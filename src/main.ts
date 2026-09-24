import "./style.css";
import { Game } from "./game";

const canvas = document.querySelector("#c") as HTMLCanvasElement;
const game = new Game(canvas);
game.start();

declare global {
  interface Window {
    __game: Game;
  }
}
window.__game = game;
