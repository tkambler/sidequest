export const SCENE_STYLES = `
        :host([hidden]){visibility:hidden!important} .bird{position:absolute;left:0;top:0;pointer-events:none;will-change:transform;contain:layout style}
        svg{width:100%;height:100%;overflow:visible;image-rendering:pixelated;display:block}
        .game-character{all:initial;box-sizing:border-box;position:absolute;bottom:0;left:0;z-index:20;display:block;cursor:pointer;pointer-events:auto;touch-action:none;user-select:none}
        .game-character:focus-visible{outline:none;filter:drop-shadow(0 0 3px #e4b655)}
        .game-character[data-controlled="true"]{filter:drop-shadow(0 0 2px #e4b655)}
        .game-character svg{pointer-events:none}
        .game-shield{position:absolute;inset:0;z-index:10;pointer-events:auto;cursor:crosshair;touch-action:none}
        .game-shield[hidden],.charge-meter[hidden],.game-hint[hidden]{display:none}
        .trajectory-preview{position:absolute;inset:0;z-index:11;pointer-events:none;overflow:hidden}
        .trajectory-preview[hidden]{display:none}
        .trajectory-preview path{fill:none;stroke-linecap:round;stroke-dasharray:3 8}
        .trajectory-outline{stroke:#40372a;stroke-width:4;opacity:.45}
        .trajectory-line{stroke:#e9bd5c;stroke-width:2}
        .trajectory-tip{fill:#f4cf73;stroke:#51402b;stroke-width:1}
        .charge-meter{box-sizing:border-box;position:absolute;z-index:21;width:44px;height:6px;border:1px solid #403c2c;background:#f4efda;pointer-events:none}
        .charge-fill{display:block;height:100%;background:#d69a32}
        .game-hint{border-radius:3px;position:absolute;z-index:21;box-sizing:border-box;width:260px;max-width:calc(100vw - 16px);padding:5px 7px;background:#303b30;color:#fff5d8;font:10px/1.4 ui-monospace,monospace;pointer-events:none;text-align:center}
        [data-walking="true"] .leg-a{animation:cowboy-step var(--stride-duration,.68s) steps(2,end) infinite}
        [data-walking="true"] .leg-b{animation:cowboy-step var(--stride-duration,.68s) steps(2,end) infinite;animation-delay:calc(var(--stride-duration,.68s) * -.5)}
        @keyframes cowboy-step{50%{transform:translateX(var(--stride-distance,1px)) translateY(-1px)}}
        .shot,.pellet,.smoke{position:absolute;left:0;top:0;pointer-events:none}
        .shot{z-index:19}
        .pellet{width:3px;height:3px;border-radius:1px;background:#493b2d;box-shadow:1px 0 #e0cda0}
        .smoke{width:7px;height:6px;background:#c1b9a8;box-shadow:3px -3px #ded8ca,-3px 1px #a39d90;transform-origin:center}
        .dropping{position:absolute;left:0;top:0;width:5px;height:4px;pointer-events:none}
        [data-action="poop"] svg{translate:0 1px}
        .wing{transform-box:fill-box;transform-origin:80% 30%} .foot{transform-box:fill-box;transform-origin:center}
        [data-action="walk"] .foot-a{animation:step .24s steps(2,end) infinite}
        [data-action="walk"] .foot-b{animation:step .24s steps(2,end) -.12s infinite}
        [data-action="flap"] .wing,[data-action="jump"] .wing{animation:flap .16s steps(2,end) infinite}
        :host([data-paused="true"]) *{animation-play-state:paused!important}
        @keyframes step{50%{transform:translateY(-2px) rotate(20deg)}}
        @keyframes flap{50%{transform:rotate(-65deg) translateY(-2px)}}
      `;

export const ORC_STYLES = `
  .flaming-arrow{position:absolute;left:0;top:0;width:24px;height:12px;transform-origin:20px 6px;z-index:19;pointer-events:none}
  .element-fire{position:absolute;left:0;top:0;width:30px;height:18px;z-index:19;pointer-events:none}
  .fire-tongue{position:absolute;bottom:0;left:0;display:block;width:10px;height:14px;transform-origin:center bottom;animation:fire-flicker .48s steps(2,end) infinite}
  .fire-tongue:nth-child(2){left:10px;height:18px;animation-delay:-.16s}
  .fire-tongue:nth-child(3){left:20px;height:15px;animation-delay:-.32s}
  [data-charging="true"] .bow-string{transform:translateX(-1px)}
  @keyframes fire-flicker{50%{transform:scaleY(.8) translateY(1px)}}
`;
