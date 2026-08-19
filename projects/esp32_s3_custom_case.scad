// ==============================================================================
// TITAN 3D STUDIO — CUSTOM ESP32-S3 DUAL USB-C SOLO MINER ENCLOSURE (v3 OPEN FRONT)
// Designed for ESP32-S3 (Dual USB-C Ports) with Full Front Cable Opening & Snap Cover
// ==============================================================================

// --- PARAMETRI DIMENSIONALI CORRETTI CON AMPIE TOLLERANZE DI STAMPA (mm) ---
board_length = 62.0;     // Lunghezza PCB ESP32-S3 (estesa per spazio interno)
board_width = 30.0;      // Larghezza PCB ESP32-S3 (estesa per spaziosità)
board_thickness = 1.8;   // Spessore PCB
comp_height_top = 8.0;   // Altezza componenti superiori (schermo / pin / cap)
comp_height_bot = 4.0;   // Altezza componenti inferiori (resistori / pin saldature)
wall_thickness = 2.4;    // Spessore pareti scocca PLA
clearance = 1.6;         // Tolleranza abbondante per inserimento libero

inner_l = board_length + clearance; // 63.6 mm
inner_w = board_width + clearance;  // 31.6 mm
inner_h = comp_height_top + comp_height_bot + board_thickness; // 13.8 mm

outer_l = inner_l + (wall_thickness * 2);
outer_w = inner_w + (wall_thickness * 2);
outer_h = inner_h + (wall_thickness * 2);

// Tolleranza Incastro Coperchio Superiore (più grande per incastro facile e liscio)
lid_play = 0.8; 

$fn = 50;

// Modulo Scatola Arrotondata Solida
module rounded_box(l, w, h, r) {
    hull() {
        translate([-l/2 + r, -w/2 + r, 0]) cylinder(r=r, h=h, center=true);
        translate([ l/2 - r, -w/2 + r, 0]) cylinder(r=r, h=h, center=true);
        translate([-l/2 + r,  w/2 - r, 0]) cylinder(r=r, h=h, center=true);
        translate([ l/2 - r,  w/2 - r, 0]) cylinder(r=r, h=h, center=true);
    }
}

// --- MODULO GRIGLIA NIDO D'APE PASSANTE GIGANTE ---
module honeycomb_grid(width, length, hex_r, wall) {
    x_spacing = (hex_r * sqrt(3)) + wall;
    y_spacing = (hex_r * 1.5) + (wall * 0.5);
    
    for (y = [-length/2 : y_spacing : length/2]) {
        row = round(y / y_spacing);
        x_offset = (abs(row) % 2 == 1) ? x_spacing / 2 : 0;
        
        for (x = [-width/2 + x_offset : x_spacing : width/2 - x_offset]) {
            translate([x, y, 0])
                rotate([0, 0, 30])
                    cylinder(r = hex_r, h = 60, $fn = 6, center = true); // Bucato da parte a parte
        }
    }
}

// --- MODULO BASE INFERIORE (BOTTOM CASE) — APERTA DAVANTI PER LE 2 PORTE USB-C ---
module bottom_case() {
    difference() {
        // Scocca Esterna
        rounded_box(outer_l, outer_w, outer_h / 2, 3);

        // Cavità Interna Spaziosa
        translate([0, 0, wall_thickness / 2])
            cube([inner_l, inner_w, outer_h / 2 + 1], center = true);

        // APERTURA TOTALE FRONTALE PER 2 PORTE USB-C & CAVI (AVANTI APERTO)
        translate([-outer_l / 2, 0, 2])
            cube([wall_thickness * 4, inner_w + 2, outer_h], center = true);

        // FORI PASSANTI GIGANTI A NIDO D'APE SUL FONDO (SOTTO)
        honeycomb_grid(width = inner_l - 16, length = inner_w - 6, hex_r = 3.2, wall = 1.2);
    }

    // Supporti di Appoggio PCB (Spessore e Posizione Ampia)
    translate([-inner_l/2 + 6, -inner_w/2 + 5, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([ inner_l/2 - 6, -inner_w/2 + 5, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([-inner_l/2 + 6,  inner_w/2 - 5, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([ inner_l/2 - 6,  inner_w/2 - 5, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
}

// --- MODULO COPERCHIO SUPERIORE (TOP COVER) — INCASTRO AMPIO E APERTO DAVANTI ---
module top_cover() {
    translate([0, outer_w + 25, 0]) {
        difference() {
            // Coperchio Esterno Più Grande per Incastro Liscio
            rounded_box(outer_l + (lid_play * 2), outer_w + (lid_play * 2), outer_h / 2, 3.5);

            // Cavità Incastro con Tolleranza
            translate([0, 0, -wall_thickness / 2])
                cube([outer_l + 0.2, outer_w + 0.2, outer_h / 2 + 1], center = true);

            // APERTURA TOTALE FRONTALE SUL COPERCHIO PER PASSAGGIO LIBERO CAVI USB-C
            translate([-(outer_l + lid_play * 2) / 2, 0, 0])
                cube([wall_thickness * 4, inner_w + 6, outer_h + 2], center = true);

            // FORI PASSANTI GIGANTI A NIDO D'APE SUL COPERCHIO (SOPRA)
            honeycomb_grid(width = inner_l - 16, length = inner_w - 6, hex_r = 3.2, wall = 1.2);

            // LOGO INCISO TITAN 3D
            translate([4, 0, outer_h/4 - 0.4])
                linear_extrude(height = 2)
                    text("TITAN 3D", size = 4.5, halign = "center", valign = "center", font = "Liberation Sans:style=Bold");
        }
    }
}

// RENDERING COMPLETO
bottom_case();
top_cover();
