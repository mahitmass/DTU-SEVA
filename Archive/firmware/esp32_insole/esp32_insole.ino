// Smart Diabetic Insole - Wired USB Serial Firmware
const int heelPin  = 32;
const int outerPin = 33;
const int innerPin = 34;
const int toePin   = 35;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // ADC range 0-4095

  pinMode(heelPin,  INPUT);
  pinMode(outerPin, INPUT);
  pinMode(innerPin, INPUT);
  pinMode(toePin,   INPUT);
  
  delay(500);
}

void loop() {
  int heel  = analogRead(heelPin);
  int outer = analogRead(outerPin);
  int inner = analogRead(innerPin);
  int toe   = analogRead(toePin);

  // Send JSON line directly over USB cable
  Serial.print("{\"heel\":");
  Serial.print(heel);
  Serial.print(",\"outer\":");
  Serial.print(outer);
  Serial.print(",\"inner\":");
  Serial.print(inner);
  Serial.print(",\"toe\":");
  Serial.print(toe);
  Serial.println("}");

  delay(100); // 10 updates per second
}