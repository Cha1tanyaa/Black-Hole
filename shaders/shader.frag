precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define tau 6.28318530718
#define verzerrungsStaerke 0.2
#define partikelAnzahl 16
#define verzerrungsGeschwindigkeit 0.3

//Rotation
vec2 rotate(vec2 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

//Hexagonales Muster
float hex(vec2 p) {
    p.x =abs(p.x);
    p.y =abs(p.y);

    float part1 =p.x * 0.8660254;
    float part2 =p.y * 0.5;
    float sum =part1 + part2;
    
    float max1 =max(sum, p.y);
    
    return max1;
}

//HSV zu RGB
vec3 hsv2rgb(vec3 c) {
    float hTimesSix =c.x *6.0; //Farbton auf Sektoren skalieren

    //RGB Werte berechnen
    float rMod = mod(hTimesSix +0.0, 6.0); 
    float gMod = mod(hTimesSix +4.0, 6.0); 
    float bMod = mod(hTimesSix +2.0, 6.0); 

    //Abstand zum Mittelpunkt
    float rAbs = abs(rMod-3.0); 
    float gAbs = abs(gMod-3.0); 
    float bAbs = abs(bMod-3.0);

    //Normalisierung
    float r =clamp(rAbs - 1.0, 0.0, 1.0); 
    float g =clamp(gAbs - 1.0, 0.0, 1.0); 
    float b =clamp(bAbs - 1.0, 0.0, 1.0); 

    vec3 rgb = vec3(r, g, b); //RGB-Werte kombinieren

    vec3 weiss =vec3(1.0, 1.0, 1.0);
    vec3 interpoliert =mix(weiss, rgb, c.y); //Mischen mit Sättigung

    vec3 finaleFarbe =c.z * interpoliert; //Helligkeit anwenden

    return finaleFarbe; //Rückabe der finalen Farbe
}

void main() {
    vec2 uv = (vUv - 0.5) *2.0;  //Normiert und skaliert uv
    uv.x *= u_resolution.x/u_resolution.y; 
    vec2 maus = (u_mouse/u_resolution) * 2.0 - 1.0;  //Mausposition normalisieren

    //Schwarzes Loch
    vec2 d = uv - maus;  //Distanz zwischen uv und maus
    float dotDist = dot(d, d); 
    float verzerrungsFaktor = verzerrungsStaerke/ (0.1 + dotDist);  //Verzerrungstärke
    vec2 verzerrung = normalize(d) * verzerrungsFaktor * sin(u_time);  //Verzerrung 
    uv = uv + verzerrung;  //Endgültige uv berechnen
    
    //Gitter
    vec2 gridUV = rotate(uv * 4.0 + vec2(u_time * verzerrungsGeschwindigkeit), 0.5); //UV rotiert + Zeit
    vec2 g = fract(gridUV) - 0.5;
    float hexMuster = 1.0 - smoothstep(0.0, 0.2, hex(g)-0.3); //Hexgitter erzeugen

    
    //Wellen Verzerrung
    vec2 p = uv *1.5 + vec2(u_time * verzerrungsGeschwindigkeit);
    for(int i = 1;i<4; i++) { 
        p.x += 0.3 / float(i) * sin(float(i) * p.y + u_time);  //x-Welle hinzufügen
        p.y += 0.3 /float(i) * cos(float(i) * p.x + u_time);  //y-Welle hinzufügen
    }
    float welle = sin(p.x + sin(p.y + u_time)) * sin(length(p) * 4.0 - (u_time * 3.0));  //Wellen-Effekt berechnen

    
    //Dynamischen Partikel
    vec3 partikel = vec3(0.0); //Initialisiere Partikel-Farbe
    for (int i = 0; i < partikelAnzahl; i++) {
        float fi = float(i);
        //Berechnung des Verschiebung
        float Winkel = fi * tau / 16.0 + u_time;
        vec2 verschiebung = vec2(sin(Winkel),cos(Winkel));
        //Berechnung der Partikelposition mit separaten Variablen
        float zeitVerschiebung =0.5 + 0.3 * sin(u_time + fi);
        vec2 pPos = maus + verschiebung *zeitVerschiebung;

        //Berechnung der HSV-Werte für jedes Partikel
        float hue = 0.55 + sin(fi + u_time) * 0.1;
        float saettigung = 0.8;
        float wert = 1.0;
        vec3 farbe = hsv2rgb(vec3(hue, saettigung, wert));

        //Berechnung der Gewichtung basirend auf der Distanz und Hinzufügen der Partikel
        float distanz = length(uv - pPos);
        float gewicht = 0.02 / (distanz * distanz);
        partikel += farbe * gewicht;
    }
    
    //Finale Farben
    vec3 baseFarbe = vec3(0.3, 0.8, 1.0) * hexMuster * 0.3; 
    vec3 hsvFarbe = hsv2rgb(vec3(0.6 + welle * 0.2, 0.8, 0.7)); //HSV zu RGB konvertieren

    float mixFaktor = 0.7; 
    vec3 mixedFarbe = baseFarbe + (hsvFarbe - baseFarbe) * mixFaktor; //Mischung der Farben

    vec3 farbe = mixedFarbe +partikel; //Hinzufügen von Partikeln

    float distanz = length(uv);
    float fadeFaktor =1.0 - smoothstep(0.8, 1.8, distanz); //Sanfter Übergang basierend auf Abstand
    farbe *= fadeFaktor;//Fade anwenden

    gl_FragColor= vec4(farbe, 1.0); //Endfarbe setzen
}  
