#!/usr/bin/env python3
"""Generate src/doom_song.cpp from Doom E1M1 note data."""

NOTE = {
    "E2": 82,
    "E3": 165,
    "D3": 147,
    "C3": 131,
    "AS2": 117,
    "B2": 123,
    "FS3": 185,
    "A3": 220,
    "B3": 247,
    "E4": 330,
    "G3": 196,
    "G4": 392,
    "B4": 494,
    "A2": 110,
    "DS3": 156,
    "F3": 175,
    "CS3": 139,
    "CS4": 277,
    "GS3": 208,
    "D4": 294,
    "DS4": 311,
}

BLOCK_E2 = (
    "E2 E2 E3 E2 E2 D3 E2 E2 "
    "C3 E2 E2 AS2 E2 E2 B2 C3 "
    "E2 E2 E3 E2 E2 D3 E2 E2 "
    "C3 E2 E2 AS2"
).split()

DUR_BLOCK = [8] * 27 + [2]

BLOCK_A2 = (
    "A2 A2 A3 A2 A2 G3 A2 A2 "
    "F3 A2 A2 DS3 A2 A2 E3 F3 "
    "A2 A2 A3 A2 A2 G3 A2 A2 "
    "F3 A2 A2 DS3"
).split()

BLOCK_CS = (
    "CS3 CS3 CS4 CS3 CS3 B3 CS3 CS3 "
    "A3 CS3 CS3 G3 CS3 CS3 GS3 A3 "
    "B2 B2 B3 B2 B2 A3 B2 B2 "
    "G3 B2 B2 F3"
).split()

BRIDGES = {
    "b1": "FS3 D3 B2 A3 FS3 B2 D3 FS3 A3 FS3 D3 B2".split(),
    "b2": "B3 G3 E3 B2 E3 G3 C4 B3 G3 B3 G3 E3".split(),
    "b3": "A3 F3 D3 A3 F3 D3 C4 A3 F3 A3 F3 D3".split(),
    "b4": "FS3 DS3 B2 FS3 DS3 B2 G3 D3 B2 DS4 DS3 B2".split(),
    "b5": "E4 B3 G3 G4 E4 G3 B3 D4 E4 G4 E4 G3".split(),
    "b6": "B3 G3 E3 B2 E3 G3 C4 B3 G3 B3 G3 E3".split(),
}

DUR_BRIDGE = [16] * 12

SECTIONS = [
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2[:-4] + BRIDGES["b1"], DUR_BLOCK[:-4] + DUR_BRIDGE),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2[:-4] + BRIDGES["b2"], DUR_BLOCK[:-4] + DUR_BRIDGE),
    (BLOCK_A2, DUR_BLOCK),
    (BLOCK_A2[:-4] + BRIDGES["b3"], DUR_BLOCK[:-4] + DUR_BRIDGE),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_CS, DUR_BLOCK),
    (BLOCK_E2[:-4] + BRIDGES["b6"], DUR_BLOCK[:-4] + DUR_BRIDGE),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2[:-4] + BRIDGES["b4"], DUR_BLOCK[:-4] + DUR_BRIDGE),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2[:-4] + BRIDGES["b5"], DUR_BLOCK[:-4] + DUR_BRIDGE),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_A2[:-4] + BRIDGES["b3"], DUR_BLOCK[:-4] + DUR_BRIDGE),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2, DUR_BLOCK),
    (BLOCK_E2[:-4] + BRIDGES["b6"], DUR_BLOCK[:-4] + DUR_BRIDGE),
]


def main() -> None:
    melody = []
    tempo = []
    for notes, durs in SECTIONS:
        if len(notes) != len(durs):
            raise SystemExit(f"length mismatch: {len(notes)} notes vs {len(durs)} durs")
        melody.extend(notes)
        tempo.extend(durs)

    mel_cpp = ",\n    ".join(
        "0" if n == "0" else f"NOTE_{n}" for n in melody
    )
    dur_cpp = ",\n    ".join(str(d) for d in tempo)

    out = f"""#include "doom_song.h"

#include "notes.h"

const uint16_t DOOM_MELODY[] = {{
    {mel_cpp}
}};

const uint8_t DOOM_TEMPO[] = {{
    {dur_cpp}
}};

static_assert(sizeof(DOOM_MELODY) / sizeof(DOOM_MELODY[0]) == sizeof(DOOM_TEMPO) / sizeof(DOOM_TEMPO[0]),
              "Doom melody and tempo must have the same length");

const size_t DOOM_MELODY_LEN = sizeof(DOOM_MELODY) / sizeof(DOOM_MELODY[0]);
"""
    path = "src/doom_song.cpp"
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(out)
    print(f"Wrote {{path}}: {{len(melody)}} notes")


if __name__ == "__main__":
    main()
