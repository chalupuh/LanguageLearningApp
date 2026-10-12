"use client";
import {swedishWordClues} from "../content/swedish-word-help";
export default function SwedishWordHelp({text}:{text:string}){
 const clues=swedishWordClues(text);if(!clues.length)return null;
 return <details className="swedish-word-help" key={text}><summary>Help with a few words</summary><p>Try these clues, then listen again. You can reveal the full meaning separately.</p><dl>{clues.map(clue=><div key={clue.word}><dt lang="sv" data-study-text>{clue.word}</dt><dd>{clue.meaning}</dd></div>)}</dl></details>;
}
