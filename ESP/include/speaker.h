#pragma once

void speakerSetup();
// Only entry point for playback — driven by dashboard MQTT (sound + lost_my_device).
void speakerApplyMqttControl(bool soundEnabled, bool lostPlantAlarm);
bool speakerShouldPlay();
const char* speakerGetSongName();
void speakerUpdate();
