import { STUDIO_PAUSED_MESSAGE } from "../lib/studio-availability";

export default function StudioUnavailable({onLibrary}:{onLibrary:()=>void}) {
  return <section className="studio-view" aria-labelledby="studio-paused-title">
    <p className="eyebrow">Listening Studio · paused</p>
    <h1 id="studio-paused-title">YouTube Studio is temporarily unavailable</h1>
    <p role="status">{STUDIO_PAUSED_MESSAGE}</p>
    <button className="primary" onClick={onLibrary}>Explore Library lessons →</button>
  </section>;
}
