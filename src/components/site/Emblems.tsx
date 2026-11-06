import { useId } from "react";
import type { PaletteKey } from "./palettes";

/* Painted emblems for the homepage's project list in handwritten mode
   (hand.css): each project's own mark, painted in watercolour on the page
   rather than shown as a screenshot. Everdeck is its iOS icon without the
   rounded square: a fanned deck of cards, the E on the front one, and a
   stroke of highlighter under it. OpenWrit is its favicon: a dark round
   wash with the cross left as bare paper.

   Each shape runs through a paint filter: its edge wanders, the pigment
   settles unevenly into the paper's grain, and it pools darker along the
   rim where the wash dried. */

function Paint({
  id,
  seed,
  rim = 1.3,
  grain = true,
}: {
  id: string;
  seed: number;
  rim?: number;
  /* Off for the white of the front card, which is paper, not pigment. */
  grain?: boolean;
}) {
  return (
    <filter
      id={id}
      x="-15%"
      y="-15%"
      width="130%"
      height="130%"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.045"
        numOctaves="3"
        seed={seed}
        result="warp"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="warp"
        scale="3.2"
        xChannelSelector="R"
        yChannelSelector="G"
        result="shape"
      />
      <feMorphology in="shape" operator="erode" radius={rim} result="inner" />
      <feComposite in="shape" in2="inner" operator="out" result="rim" />
      <feGaussianBlur in="rim" stdDeviation="0.45" result="rimSoft" />
      <feComponentTransfer in="rimSoft" result="rimInk">
        <feFuncA type="linear" slope="0.75" />
      </feComponentTransfer>
      {grain ? (
        <>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="2"
            seed={seed + 3}
            result="grain"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.06"
            numOctaves="2"
            seed={seed + 7}
            result="bloom"
          />
          <feComposite
            in="grain"
            in2="bloom"
            operator="arithmetic"
            k2="0.55"
            k3="0.45"
            result="paper"
          />
          <feColorMatrix
            in="paper"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.1 0 0 0 1.38"
            result="settle"
          />
          <feComposite in="shape" in2="settle" operator="in" result="wash" />
        </>
      ) : (
        <feOffset in="shape" result="wash" />
      )}
      <feMerge>
        <feMergeNode in="wash" />
        <feMergeNode in="rimInk" />
      </feMerge>
    </filter>
  );
}

const CARD = { x: 24.6, y: 17.8, width: 50.8, height: 64.8, rx: 7.6 };
const E_PATH =
  "M447 753H764Q826 753 852 777Q877 801 890 871Q896 895 908 907Q921 919 940 920Q978 922 989 877L1066 580Q1072 554 1066 538Q1059 523 1038 516Q1018 510 1000 516Q983 522 971 541Q944 587 920 612Q897 636 868 645Q839 654 794 654H447ZM104 1354Q104 1376 119 1388Q134 1400 165 1400H925Q961 1400 984 1410Q1008 1420 1028 1430Q1049 1440 1076 1440Q1106 1440 1122 1423Q1137 1406 1149 1367L1229 1086Q1236 1061 1228 1044Q1220 1027 1198 1020Q1173 1012 1153 1021Q1133 1030 1120 1055Q1082 1133 1050 1182Q1017 1230 984 1256Q951 1281 912 1290Q874 1300 823 1300H563V199Q563 149 591 124Q619 100 676 100H852Q920 100 970 122Q1020 145 1066 208Q1111 272 1166 397Q1176 420 1193 428Q1210 436 1232 433Q1257 429 1268 411Q1278 393 1271 366L1185 37Q1175 -1 1158 -19Q1141 -37 1108 -37Q1085 -37 1064 -28Q1044 -18 1020 -9Q996 0 961 0H165Q134 0 119 12Q104 25 104 46Q104 84 146 97L203 110Q228 117 240 131Q253 145 253 167V1233Q253 1255 240 1269Q228 1283 203 1290L146 1303Q104 1316 104 1354Z";
const HIGHLIGHT =
  "M318 652 C 410 634, 570 628, 714 640 C 730 642, 734 668, 718 676 C 566 708, 424 712, 324 716 C 298 717, 294 657, 318 652 Z";

function Everdeck() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="11 9 78 82" aria-hidden="true">
      <defs>
        <Paint id={`${id}-a`} seed={3} />
        <Paint id={`${id}-b`} seed={11} />
        <Paint id={`${id}-c`} seed={19} rim={0.9} grain={false} />
        <Paint id={`${id}-e`} seed={23} rim={0.8} />
        <Paint id={`${id}-d`} seed={27} rim={0.7} />
      </defs>
      {/* The deck behind: two cards fanned out, in washes of the teal. */}
      <g filter={`url(#${id}-a)`}>
        <rect
          {...CARD}
          transform="rotate(-11 50 58.6)"
          className="em-card-back"
        />
      </g>
      <g filter={`url(#${id}-b)`}>
        <rect
          {...CARD}
          transform="rotate(7 50 58.6)"
          className="em-card-middle"
        />
      </g>
      {/* The front card, left white, drawn round in a fine line. */}
      <g filter={`url(#${id}-c)`}>
        <rect {...CARD} className="em-card-front" />
      </g>
      {/* A stroke of highlighter, then the E over it. */}
      <g filter={`url(#${id}-d)`}>
        <path
          d={HIGHLIGHT}
          transform="scale(0.09766)"
          className="em-highlight"
        />
      </g>
      <g filter={`url(#${id}-e)`}>
        <path
          d={E_PATH}
          transform="scale(0.09766) translate(335 700) scale(0.257 -0.257)"
          className="em-e"
        />
      </g>
    </svg>
  );
}

const CROSS =
  "M9.8 3.5Q9.8 3 10.3 3H13.7Q14.2 3 14.2 3.5V9.8H20.5Q21 9.8 21 10.3V13.7Q21 14.2 20.5 14.2H14.2V20.5Q14.2 21 13.7 21H10.3Q9.8 21 9.8 20.5V14.2H3.5Q3 14.2 3 13.7V10.3Q3 9.8 3.5 9.8H9.8Z";

function OpenWrit() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <Paint id={`${id}-a`} seed={5} rim={1.6} />
        <radialGradient id={`${id}-g`} cx="0.36" cy="0.3" r="0.75">
          <stop offset="0" className="em-ow-light" />
          <stop offset="1" className="em-ow-dark" />
        </radialGradient>
        {/* The cross is never painted: the wash goes round it. */}
        <mask
          id={`${id}-m`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="100"
        >
          <rect width="100" height="100" fill="#fff" />
          <path
            d={CROSS}
            transform="scale(1.5625) translate(11 11) scale(1.75)"
            fill="#000"
          />
        </mask>
      </defs>
      <g filter={`url(#${id}-a)`}>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill={`url(#${id}-g)`}
          mask={`url(#${id}-m)`}
          className="em-ow-wash"
        />
      </g>
    </svg>
  );
}

const EMBLEMS: Partial<Record<PaletteKey, () => React.ReactNode>> = {
  everdeck: Everdeck,
  openwrit: OpenWrit,
};

export function hasEmblem(palette: PaletteKey) {
  return palette in EMBLEMS;
}

export default function Emblem({ palette }: { palette: PaletteKey }) {
  const Mark = EMBLEMS[palette];
  if (!Mark) return null;
  return (
    <span className="emblem" aria-hidden="true">
      <Mark />
    </span>
  );
}
