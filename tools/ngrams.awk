# ngrams.awk — emit normalized N-word shingles (one per line) from stdin.
#
# Normalization: lowercase, collapse every non-alphanumeric run to a single
# space. Digits are kept (mechanics like "dc 15" matter). Shingles span line
# breaks, so column-split / oddly-wrapped extraction text is still caught.
#
# Usage: awk -v N=6 -f ngrams.awk < text
{
  line = tolower($0)
  gsub(/[^a-z0-9]+/, " ", line)
  n = split(line, a, " ")
  for (i = 1; i <= n; i++) if (a[i] != "") { c++; T[c] = a[i] }
}
END {
  if (N + 0 < 3) N = 6
  if (c < N) exit
  for (i = 1; i + N - 1 <= c; i++) {
    s = T[i]
    for (j = 1; j < N; j++) s = s " " T[i + j]
    print s
  }
}
