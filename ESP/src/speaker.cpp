#include "speaker.h"

#include <Arduino.h>

#include "config.h"
#include "doom_song.h"
#include "mario_song.h"
#include "notes.h"

enum class SongChoice { Mario, Doom };

enum class PlayPhase { Idle, PlayingNote, PauseBetweenNotes };

struct ActiveSong {
  const uint16_t* melody;
  const uint8_t* tempo;
  size_t length;
};

static SongChoice activeSongChoice = SongChoice::Mario;
static ActiveSong activeSong = {MARIO_MELODY, MARIO_TEMPO, MARIO_MELODY_LEN};

static size_t noteIndex = 0;
static PlayPhase phase = PlayPhase::Idle;
static unsigned long phaseStartedMs = 0;
static uint16_t noteDurationMs = 0;
static uint16_t pauseBetweenNotesMs = 0;

static bool mqttSoundEnabled = false;
static bool mqttLostPlant = false;
static bool playbackActive = false;

static uint16_t calcNoteDurationMs(const uint8_t tempoDiv) {
  if (tempoDiv == 0) {
    return 100;
  }
  return static_cast<uint16_t>(MELODY_TEMPO_NUMERATOR_MS / tempoDiv);
}

static void resetPlayback() {
  noteIndex = 0;
  phase = PlayPhase::Idle;
  phaseStartedMs = 0;
}

static void applySong(const SongChoice song) {
  if (song == SongChoice::Doom) {
    activeSong = {DOOM_MELODY, DOOM_TEMPO, DOOM_MELODY_LEN};
    activeSongChoice = SongChoice::Doom;
  } else {
    activeSong = {MARIO_MELODY, MARIO_TEMPO, MARIO_MELODY_LEN};
    activeSongChoice = SongChoice::Mario;
  }
}

static void stopOutput() {
#if SPEAKER_ACTIVE_BUZZER
  digitalWrite(SPEAKER_PIN, LOW);
#else
  ledcWriteTone(SPEAKER_LEDC_CHANNEL, 0);
#endif
}

static void stopPlayback() {
  resetPlayback();
  stopOutput();
  playbackActive = false;
}

static void playFrequency(const uint16_t frequencyHz) {
  if (frequencyHz == 0) {
    stopOutput();
    return;
  }

#if SPEAKER_ACTIVE_BUZZER
  digitalWrite(SPEAKER_PIN, HIGH);
#else
  ledcWriteTone(SPEAKER_LEDC_CHANNEL, frequencyHz);
#endif
}

static void beginNote() {
  const uint16_t frequencyHz = activeSong.melody[noteIndex];
  const uint8_t tempoDiv = activeSong.tempo[noteIndex];
  noteDurationMs = calcNoteDurationMs(tempoDiv);
  pauseBetweenNotesMs = (noteDurationMs * MELODY_PAUSE_PERCENT) / 100;

  playFrequency(frequencyHz);
  phase = PlayPhase::PlayingNote;
  phaseStartedMs = millis();
}

void speakerSetup() {
  pinMode(SPEAKER_PIN, OUTPUT);
  stopOutput();

#if !SPEAKER_ACTIVE_BUZZER
  ledcSetup(SPEAKER_LEDC_CHANNEL, 2000, 8);
  ledcAttachPin(SPEAKER_PIN, SPEAKER_LEDC_CHANNEL);
  stopOutput();
#endif

  applySong(SongChoice::Mario);
  stopPlayback();
}

void speakerApplyMqttControl(const bool soundEnabled, const bool lostPlantAlarm) {
  mqttSoundEnabled = soundEnabled;
  mqttLostPlant = lostPlantAlarm;

  const bool shouldPlay = mqttLostPlant || mqttSoundEnabled;
  if (!shouldPlay) {
    stopPlayback();
    return;
  }

  const SongChoice nextSong = mqttLostPlant ? SongChoice::Doom : SongChoice::Mario;
  const bool songChanged = nextSong != activeSongChoice;

  if (!playbackActive || songChanged) {
    applySong(nextSong);
    resetPlayback();
    playbackActive = true;
  }
}

bool speakerShouldPlay() {
  return playbackActive;
}

const char* speakerGetSongName() {
  return activeSongChoice == SongChoice::Doom ? "doom" : "mario";
}

void speakerUpdate() {
  if (!playbackActive) {
    return;
  }

  const unsigned long now = millis();

  if (phase == PlayPhase::Idle) {
    beginNote();
    return;
  }

  if (phase == PlayPhase::PlayingNote) {
    if (now - phaseStartedMs < noteDurationMs) {
      return;
    }

    stopOutput();
    phase = PlayPhase::PauseBetweenNotes;
    phaseStartedMs = now;
    return;
  }

  if (now - phaseStartedMs < pauseBetweenNotesMs) {
    return;
  }

  noteIndex = (noteIndex + 1) % activeSong.length;
  beginNote();
}
