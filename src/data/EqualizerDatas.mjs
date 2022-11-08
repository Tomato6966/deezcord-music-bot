const emptyEQ = new Array(15).fill(true).map((_, i) => { return {band: i, gain: 0};});
export const defaultEQ = [{
    band: 0,
    gain: 0.25
  },
  {
    band: 1,
    gain: 0.025
  },
  {
    band: 2,
    gain: 0.0125
  },
  {
    band: 3,
    gain: 0
  },
  {
    band: 4,
    gain: 0
  },
  {
    band: 5,
    gain: -0.0125
  },
  {
    band: 6,
    gain: -0.025
  },
  {
    band: 7,
    gain: -0.0175
  },
  {
    band: 8,
    gain: 0
  },
  {
    band: 9,
    gain: 0
  },
  {
    band: 10,
    gain: 0.0125
  },
  {
    band: 11,
    gain: 0.025
  },
  {
    band: 12,
    gain: 0.25
  },
  {
    band: 13,
    gain: 0.125
  },
  {
    band: 14,
    gain: 0.125
  },
];

/**
 * 25 Hz, 40 Hz, 63 Hz, 100 Hz, 160 Hz, 250 Hz, 400 Hz, 630 Hz, 1 kHz, 1.6 kHz, 2.5 kHz, 4 kHz, 6.3 kHz, 10 kHz, 16 kHz

  The meaningful range for the values is -0.25 to 0.5

 */
export const bassboost = {
    none: emptyEQ,
    low: [
      {band: 0, gain: 0.6*0.125},
      {band: 1, gain: 0.67*0.125},
      {band: 2, gain: 0.67*0.125},
      {band: 3, gain: 0.4*0.125},
      {band: 4, gain: -0.5*0.125},
      {band: 5, gain: 0.15*0.125},
      {band: 6, gain: -0.45*0.125},
      {band: 7, gain: 0.23*0.125},
      {band: 8, gain: 0.35*0.125},
      {band: 9, gain: 0.45*0.125},
      {band: 10, gain: 0.55*0.125},
      {band: 11, gain: -0.6*0.125},
      {band: 12, gain: 0.55*0.125},
      {band: 13, gain: -0.5*0.125},
      {band: 14, gain: -0.75*0.125},
    ],
    medium: [
      {band: 0, gain: 0.6*0.1875},
      {band: 1, gain: 0.67*0.1875},
      {band: 2, gain: 0.67*0.1875},
      {band: 3, gain: 0.4*0.1875},
      {band: 4, gain: -0.5*0.1875},
      {band: 5, gain: 0.15*0.1875},
      {band: 6, gain: -0.45*0.1875},
      {band: 7, gain: 0.23*0.1875},
      {band: 8, gain: 0.35*0.1875},
      {band: 9, gain: 0.45*0.1875},
      {band: 10, gain: 0.55*0.1875},
      {band: 11, gain: -0.6*0.1875},
      {band: 12, gain: 0.55*0.1875},
      {band: 13, gain: -0.5*0.1875},
      {band: 14, gain: -0.75*0.1875},
    ],
    high: [
      {band: 0, gain: 0.6*0.25},
      {band: 1, gain: 0.67*0.25},
      {band: 2, gain: 0.67*0.25},
      {band: 3, gain: 0.4*0.25},
      {band: 4, gain: -0.5*0.25},
      {band: 5, gain: 0.15*0.25},
      {band: 6, gain: -0.45*0.25},
      {band: 7, gain: 0.23*0.25},
      {band: 8, gain: 0.35*0.25},
      {band: 9, gain: 0.45*0.25},
      {band: 10, gain: 0.55*0.25},
      {band: 11, gain: -0.6*0.25},
      {band: 12, gain: 0.55*0.25},
      {band: 13, gain: -0.5*0.25},
      {band: 14, gain: -0.75*0.25},
    ],
    highest: [
      {band: 0, gain: 0.6*0.375},
      {band: 1, gain: 0.67*0.375},
      {band: 2, gain: 0.67*0.375},
      {band: 3, gain: 0.4*0.375},
      {band: 4, gain: -0.5*0.375},
      {band: 5, gain: 0.15*0.375},
      {band: 6, gain: -0.45*0.375},
      {band: 7, gain: 0.23*0.375},
      {band: 8, gain: 0.35*0.375},
      {band: 9, gain: 0.45*0.375},
      {band: 10, gain: 0.55*0.375},
      {band: 11, gain: -0.6*0.375},
      {band: 12, gain: 0.55*0.375},
      {band: 13, gain: -0.5*0.375},
      {band: 14, gain: -0.75*0.375},
    ],
};

export const eqs = {
    music: defaultEQ,
    pop: [
      {band: 0, gain: 0.2635},
      {band: 1, gain: 0.22141},
      {band: 2, gain: -0.21141},
      {band: 3, gain: -0.1851},
      {band: 4, gain: -0.155},
      {band: 5, gain: 0.21141},
      {band: 6, gain: 0.22456},
      {band: 7, gain: 0.237},
      {band: 8, gain: 0.237},
      {band: 9, gain: 0.237},
      {band: 10, gain: -0.05},
      {band: 11, gain: -0.116},
      {band: 12, gain: 0.192},
      {band: 13, gain: 0},
    ],
    electronic: [{
      band: 0,
      gain: 0.375
    },
    {
      band: 1,
      gain: 0.350
    },
    {
      band: 2,
      gain: 0.125
    },
    {
      band: 3,
      gain: 0
    },
    {
      band: 4,
      gain: 0
    },
    {
      band: 5,
      gain: -0.125
    },
    {
      band: 6,
      gain: -0.125
    },
    {
      band: 7,
      gain: 0
    },
    {
      band: 8,
      gain: 0.25
    },
    {
      band: 9,
      gain: 0.125
    },
    {
      band: 10,
      gain: 0.15
    },
    {
      band: 11,
      gain: 0.2
    },
    {
      band: 12,
      gain: 0.250
    },
    {
      band: 13,
      gain: 0.350
    },
    {
      band: 14,
      gain: 0.400
    },
    ],
    classical: [{
      band: 0,
      gain: 0.375
    },
    {
      band: 1,
      gain: 0.350
    },
    {
      band: 2,
      gain: 0.125
    },
    {
      band: 3,
      gain: 0
    },
    {
      band: 4,
      gain: 0
    },
    {
      band: 5,
      gain: 0.125
    },
    {
      band: 6,
      gain: 0.550
    },
    {
      band: 7,
      gain: 0.050
    },
    {
      band: 8,
      gain: 0.125
    },
    {
      band: 9,
      gain: 0.250
    },
    {
      band: 10,
      gain: 0.200
    },
    {
      band: 11,
      gain: 0.250
    },
    {
      band: 12,
      gain: 0.300
    },
    {
      band: 13,
      gain: 0.250
    },
    {
      band: 14,
      gain: 0.300
    },
    ],
    rock: [{
      band: 0,
      gain: 0.300
    },
    {
      band: 1,
      gain: 0.250
    },
    {
      band: 2,
      gain: 0.200
    },
    {
      band: 3,
      gain: 0.100
    },
    {
      band: 4,
      gain: 0.050
    },
    {
      band: 5,
      gain: -0.050
    },
    {
      band: 6,
      gain: -0.150
    },
    {
      band: 7,
      gain: -0.200
    },
    {
      band: 8,
      gain: -0.100
    },
    {
      band: 9,
      gain: -0.050
    },
    {
      band: 10,
      gain: 0.050
    },
    {
      band: 11,
      gain: 0.100
    },
    {
      band: 12,
      gain: 0.200
    },
    {
      band: 13,
      gain: 0.250
    },
    {
      band: 14,
      gain: 0.300
    },
    ],
    full: [{
      band: 0,
      gain: 0.25 + 0.375
    },
    {
      band: 1,
      gain: 0.25 + 0.025
    },
    {
      band: 2,
      gain: 0.25 + 0.0125
    },
    {
      band: 3,
      gain: 0.25 + 0
    },
    {
      band: 4,
      gain: 0.25 + 0
    },
    {
      band: 5,
      gain: 0.25 + -0.0125
    },
    {
      band: 6,
      gain: 0.25 + -0.025
    },
    {
      band: 7,
      gain: 0.25 + -0.0175
    },
    {
      band: 8,
      gain: 0.25 + 0
    },
    {
      band: 9,
      gain: 0.25 + 0
    },
    {
      band: 10,
      gain: 0.25 + 0.0125
    },
    {
      band: 11,
      gain: 0.25 + 0.025
    },
    {
      band: 12,
      gain: 0.25 + 0.375
    },
    {
      band: 13,
      gain: 0.25 + 0.125
    },
    {
      band: 14,
      gain: 0.25 + 0.125
    },
    ],
    gaming: [{
      band: 0,
      gain: 0.350
    },
    {
      band: 1,
      gain: 0.300
    },
    {
      band: 2,
      gain: 0.250
    },
    {
      band: 3,
      gain: 0.200
    },
    {
      band: 4,
      gain: 0.150
    },
    {
      band: 5,
      gain: 0.100
    },
    {
      band: 6,
      gain: 0.050
    },
    {
      band: 7,
      gain: -0.0
    },
    {
      band: 8,
      gain: -0.050
    },
    {
      band: 9,
      gain: -0.100
    },
    {
      band: 10,
      gain: -0.150
    },
    {
      band: 11,
      gain: -0.200
    },
    {
      band: 12,
      gain: -0.250
    },
    {
      band: 13,
      gain: -0.300
    },
    {
      band: 14,
      gain: -0.350
    },
    ],
    bassboost: bassboost.medium,
    earrape: bassboost.highest
};
export const EQS = {
    Music: "🎵 Music",
    Pop: "🔥 Pop",
    None: "💣 None",
    Full: `🎶 Full`,
    Gaming: `🕹️ Gaming`,
    Rock: `🤙 Rock`,
    Classical: `🎹 Classical`,
    Electronic: `🎙️ Electronic`,
    LOW_BASS: "🎚 Low Bass",
    MEDIUM_BASS: "🎚 Medium Bass",
    HIGH_BASS: "🎚 High Bass",
    HIGHEST_BASS: "🎚 Highest Bass"
}
 