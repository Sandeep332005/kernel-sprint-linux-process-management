const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function ThemeScript() {
  // Inline + sync so the theme class lands before first paint -- avoids a
  // light-then-dark (or dark-then-light) flash on load.
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
