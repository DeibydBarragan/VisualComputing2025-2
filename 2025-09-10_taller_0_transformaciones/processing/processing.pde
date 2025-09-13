void setup() {
  size(600, 600, P3D);   // lienzo 3D
}

void draw() {
  background(30);
  lights(); 

  float t = millis() / 1000.0; // tiempo en segundos
  
  pushMatrix();
  
  // 1. Traslación ondulada
  float x = sin(t) * 150;
  float y = cos(t) * 50;
  translate(width/2 + x, height/2 + y, 0);

  // 2. Rotación sobre varios ejes
  rotateX(t * 0.8);
  rotateY(t * 0.6);

  // 3. Escalado cíclico
  float s = 50 + 30 * sin(t * 2);
  scale(s/50.0);

  // Figura (cubo)
  fill(100, 150, 255);
  stroke(255);
  box(100);

  popMatrix();
}
