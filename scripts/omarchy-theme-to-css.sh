#!/usr/bin/env bash
# Generate Customer Pulse CSS tokens from the active Omarchy theme.
#
#   scripts/omarchy-theme-to-css.sh                # reads the current theme, prints CSS
#   scripts/omarchy-theme-to-css.sh path/colors.toml > src/theme/omarchy.css
#
# Dark tokens come straight from colors.toml. Light tokens are a fixed warm-paper
# palette that keeps the theme's accent hue, because Omarchy themes are usually
# dark-only. Falls back to the checked-in Aether tokens when no theme is found.
set -euo pipefail

src="${1:-${OMARCHY_THEME_COLORS:-$HOME/.local/state/omarchy/current/theme/colors.toml}}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -r "$src" ]]; then
  echo "/* omarchy theme not found at $src — using Aether fallback */"
  cat "$here/../design/tokens/aether.css"
  exit 0
fi

get() { # key -> "#rrggbb" (first match, quotes stripped)
  sed -nE "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*\"?(#[0-9A-Fa-f]{6})\"?.*/\1/p" "$src" | head -n1
}

bg=$(get background);            fg=$(get foreground)
accent=$(get accent);            muted=$(get muted)
lighter=$(get lighter_background); bright_fg=$(get bright_foreground)
bright_red=$(get bright_red);    orange=$(get orange)
bright_yellow=$(get bright_yellow); bright_blue=$(get bright_blue)
theme_name=$(cat "$(dirname "$src")/../theme.name" 2>/dev/null || echo custom)

: "${bg:=#02050B}" "${fg:=#FC7B00}" "${accent:=#5577c9}" "${lighter:=#1b1e23}"
: "${bright_fg:=#FD9C40}" "${bright_red:=#F9780C}" "${orange:=#DD8834}"
: "${bright_yellow:=#B8865A}" "${bright_blue:=#7698FF}" "${muted:=#63676d}"

cat <<CSS
/* Generated from Omarchy theme "$theme_name" ($src). Do not edit by hand. */
:root, :root[data-theme="dark"] {
  color-scheme: dark;
  --cp-bg: $bg;
  --cp-panel: color-mix(in srgb, $bg 88%, $lighter);
  --cp-raised: color-mix(in srgb, $bg 70%, $lighter);
  --cp-well: $lighter;
  --cp-line: color-mix(in srgb, $lighter 80%, #ffffff 8%);
  --cp-text: #ECE3D8;
  --cp-sub: #BDB1A3;
  --cp-faint: #93969C;
  --cp-brand: $fg;            /* theme foreground: headings, hero numbers */
  --cp-brand-hi: $bright_fg;
  --cp-accent: $bright_blue;  /* links, focus, healthy */
  --cp-accent-dim: $accent;
  --cp-on-accent: $bg;
  --cp-critical: $bright_red;
  --cp-on-critical: $bg;
  --cp-high: $orange;
  --cp-watch: color-mix(in srgb, $bright_yellow 65%, $muted 35%); /* duller than high; dashed line + label carry meaning */
  --cp-healthy: $bright_blue;
  --cp-band: $lighter;
  --cp-band-text: $bright_fg;
  --cp-shadow: 0 24px 60px rgb(0 0 0 / 0.7);
  --cp-font-ui: "JetBrainsMono Nerd Font", "JetBrains Mono", ui-monospace, monospace;
  --cp-font-prose: Inter, system-ui, sans-serif;
}
:root[data-theme="light"] {
  color-scheme: light;
  --cp-bg: #F2ECE4; --cp-panel: #FBF8F3; --cp-raised: #FFFFFF; --cp-well: #EAE2D7;
  --cp-line: #D9CFC2; --cp-text: #1b1e23; --cp-sub: #4A4540; --cp-faint: #6B655E;
  --cp-brand: color-mix(in srgb, $fg 60%, #000 40%);
  --cp-brand-hi: color-mix(in srgb, $fg 55%, #000 45%);
  --cp-accent: color-mix(in srgb, $accent 70%, #000 30%);
  --cp-accent-dim: $accent; --cp-on-accent: #FFFFFF;
  --cp-critical: #B04F00; --cp-on-critical: #FFFFFF;
  --cp-high: #9A5418; --cp-watch: #7D4317; --cp-healthy: color-mix(in srgb, $accent 70%, #000 30%);
  --cp-band: $lighter; --cp-band-text: $bright_fg;
  --cp-shadow: 0 18px 40px rgb(60 40 20 / 0.14);
}
CSS
