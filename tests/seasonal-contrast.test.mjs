import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css = readFileSync(new URL('../app/seasonal-contrast.css', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const luminance = hex => {
  const channels = hex.slice(1).match(/../g).map(v => parseInt(v,16)/255)
    .map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
};
const contrast = (a,b) => {
  const [high,low] = [luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (high+.05)/(low+.05);
};
for (const theme of ['classic','autumn','halloween','winter','valentine','spring','summer']) {
  test(`${theme}: all reading, secondary, speaker and selected-control colors meet WCAG AA`, () => {
    const rule = css.match(new RegExp(`html\\[data-holiday-theme="${theme}"\\] \\{([^}]+)\\}`));
    assert.ok(rule, `Missing palette: ${theme}`);
    const tokens = Object.fromEntries([...rule[1].matchAll(/--([\w-]+):\s*(#[\da-f]{6})/g)].map(m=>[m[1],m[2]]));
    for (const fg of ['ink','muted','study-accent']) {
      for (const bg of ['paper','card','white']) {
        const ratio = contrast(tokens[fg], bg==='white'?'#ffffff':tokens[bg]);
        assert.ok(ratio>=4.5, `${theme} ${fg}/${bg}: ${ratio.toFixed(2)} < 4.5`);
      }
    }
    assert.ok(contrast('#ffffff',tokens['study-accent'])>=4.5);
  });
}
test('contrast contract is loaded after base styles and protects every reading surface', () => {
  assert.ok(layout.indexOf('./seasonal-contrast.css') > layout.indexOf('./swedish-lab.css'));
  for (const surface of ['workspace','home-view','standalone-view','about-view','topbar','session-rail','parisian-test','dual-summary','full-transcript','parisian-transcript','studio-transcript']) {
    assert.ok(css.includes(`.${surface}`), `Missing opaque foundation for ${surface}`);
  }
  assert.match(css,/textarea::placeholder\s*\{[^}]*color:var\(--muted\)/);
  assert.match(css,/\.steps li\.current \.step-icon\s*\{[^}]*color:#fff/);
  assert.match(css,/\.listen-closer \.play\s*\{[^}]*color:#fff/);
});
