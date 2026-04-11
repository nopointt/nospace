/**
 * Alpha: text-only formats (TextParser, zero external deps).
 * Single source of truth for frontend format validation.
 *
 * Post-alpha formats (PDF, DOCX, XLSX, PPTX, ODS — Docling;
 * PNG, JPG, WebP, SVG — OCR; MP3, WAV, M4A, OGG — Whisper;
 * MP4, MOV, WebM — ffmpeg; YouTube URL) will be re-enabled.
 */

export const SUPPORTED_EXTENSIONS = new Set([
  // ── Plain Text & Documentation ──
  "txt", "text", "md", "markdown", "mdown", "mkd", "mkdn", "mdwn",
  "rst", "rest", "adoc", "asciidoc", "org",
  "tex", "latex", "ltx", "bib", "cls", "sty", "bst",
  "wiki", "mediawiki", "textile", "rdoc", "pod",
  "nfo", "diz", "rtf", "log", "changelog",
  "man", "info", "me", "1st",

  // ── Web Frontend ──
  "html", "htm", "xhtml",
  "css", "scss", "sass", "less", "styl", "pcss",
  "js", "mjs", "cjs", "jsx",
  "ts", "mts", "cts", "tsx",
  "vue", "svelte", "astro", "mdx",
  "coffee", "litcoffee",

  // ── Programming — General Purpose ──
  "py", "pyi", "pyw",
  "rb", "php", "phtml",
  "java", "kt", "kts", "scala", "sc",
  "go", "rs", "swift",
  "c", "h", "cpp", "hpp", "cc", "cxx", "hxx", "hh",
  "cs", "csx",
  "d", "zig", "nim", "cr", "dart",
  "lua", "r", "jl",
  "ex", "exs", "erl", "hrl",
  "groovy", "gvy",
  "m", "mm",
  "pl", "pm", "tcl", "tk",
  "awk", "sed",

  // ── Programming — Functional ──
  "hs", "lhs", "ml", "mli",
  "re", "rei", "res", "resi",
  "clj", "cljs", "cljc", "edn",
  "lisp", "cl", "el",
  "scm", "ss", "rkt",
  "elm", "purs", "idr", "agda", "lean",
  "sml", "sig",
  "fs", "fsi", "fsx",

  // ── Programming — Legacy & Domain-Specific ──
  "bas", "vb", "vbs",
  "pas", "pp", "dpr",
  "f", "f90", "f95", "f03", "f08", "for",
  "ada", "adb", "ads",
  "cob", "cbl",
  "pro", "sol", "vy", "hx", "sas",

  // ── Shell & Scripts ──
  "sh", "bash", "zsh", "fish", "ksh", "csh", "tcsh",
  "ps1", "psm1", "psd1",
  "bat", "cmd", "ahk", "nu",

  // ── Configuration & Data ──
  "json", "json5", "jsonc", "jsonl", "ndjson",
  "yaml", "yml", "toml",
  "ini", "cfg", "conf", "config", "properties", "env",
  "csv", "tsv", "psv",
  "xml", "xsl", "xslt", "xsd", "dtd", "sgml",
  "plist", "editorconfig", "htaccess", "nginx",
  "geojson", "topojson", "hjson", "ron", "dhall", "cue",
  "reg", "inf", "cnf", "desktop", "service",

  // ── Templates ──
  "njk", "ejs", "erb",
  "haml", "slim", "pug", "jade",
  "hbs", "handlebars", "mustache",
  "twig", "liquid", "jinja", "jinja2", "j2",
  "mako", "cshtml", "razor", "jsp", "ftl",

  // ── Query & Database ──
  "sql", "psql", "mysql", "pgsql",
  "graphql", "gql", "graphqls",
  "sparql", "cypher", "prisma", "cql",

  // ── Schema & API ──
  "proto", "avsc", "thrift", "capnp", "fbs",
  "smithy", "raml", "wadl", "idl", "openapi",

  // ── DevOps & Build ──
  "tf", "tfvars", "hcl", "nomad",
  "dockerfile", "mk", "cmake", "gradle", "sbt",
  "bzl", "bazel", "ninja", "meson",
  "rake", "gemspec", "podspec",

  // ── Subtitles & i18n ──
  "srt", "vtt", "sub", "ass", "ssa", "lrc", "sbv", "smi",
  "ttml", "dfxp",
  "po", "pot", "strings", "xlf", "xliff", "arb", "resx",

  // ── Diff, VCS & Misc Dev ──
  "diff", "patch",
  "gitignore", "gitattributes", "gitmodules", "mailmap", "hgignore",

  // ── Other Text ──
  "ics", "vcf", "vcard", "ldif",
  "ipynb", "rmd", "qmd",
  "feature", "robot",
  "asm", "nasm",
  "svg", "rss", "atom", "wsdl",
  "pem", "crt", "pub", "ovpn",
  "snap", "mod", "sum",
])

export const SUPPORTED_EXTENSIONS_COUNT = SUPPORTED_EXTENSIONS.size
