// ============================================================
// Smart Diabetic Insole - Wired USB Serial Firmware
// Plug USB cable into laptop, select COM9 at 115200 baud.
// No Wi-Fi or hotspot needed!
// ============================================================

// FSR Analog Pins (ADC1 channels: safe for ESP32 boot)
const int heelPin  = 32;
const int outerPin = 33;
const int innerPin = 34;
const int toePin   = 35;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  pinMode(heelPin,  INPUT);
  pinMode(outerPin, INPUT);
  pinMode(innerPin, INPUT);
  pinMode(toePin,   INPUT);

  delay(400);
  Serial.println("[INSOLE] Hardware initialized. Streaming live sensor data...");
}

void loop() {
  // Read 12-bit ADC values (0 to 4095)
  int heel  = analogRead(heelPin);
  int outer = analogRead(outerPin);
  int inner = analogRead(innerPin);
  int toe   = analogRead(toePin);

  // Send JSON packet directly over USB Serial to the laptop
  Serial.print("{\"heel\":");
  Serial.print(heel);
  Serial.print(",\"outer\":");
  Serial.print(outer);
  Serial.print(",\"inner\":");
  Serial.print(inner);
  Serial.print(",\"toe\":");
  Serial.print(toe);
  Serial.println("}");

  delay(100); // 10 samples per second (10 Hz)
}
