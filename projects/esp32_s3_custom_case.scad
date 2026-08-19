// ==============================================================================
// TITAN 3D STUDIO — CUSTOM ESP32-S3 DUAL USB-C SOLO MINER ENCLOSURE (v4 ANTI-SLIP)
// Con Bordino Frontale di Trattenuta PCB anti-scivolamento cavo e doppio slot USB-C
// ==============================================================================

// --- PARAMETRI DIMENSIONALI CON TOLLERANZE E BORDINI DI TRATTENUTA (mm) ---
board_length = 60.5;     // Lunghezza PCB ESP32-S3
board_width = 29.5;      // Larghezza PCB ESP32-S3
board_thickness = 1.8;   // Spessore PCB
comp_height_top = 7.5;   // Altezza componenti superiori
comp_height_bot = 3.5;   // Altezza componenti inferiori
wall_thickness = 2.4;    // Spessore pareti scocca PLA
clearance = 1.2;         // Tolleranza inserimento liscio

inner_l = board_length + clearance; // 61.7 mm
inner_w = board_width + clearance;  // 30.7 mm
inner_h = comp_height_top + comp_height_bot + board_thickness; // 12.8 mm

outer_l = inner_l + (wall_thickness * 2);
outer_w = inner_w + (wall_thickness * 2);
outer_h = inner_h + (wall_thickness * 2);

// Tolleranza Incastro Coperchio Superiore
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
                    cylinder(r = hex_r, h = 60, $fn = 6, center = true);
        }
    }
}

// --- MODULO BASE INFERIORE (BOTTOM CASE) CON BORDINO ANTI-SCIVOLAMENTO ---
module bottom_case() {
    difference() {
        // Scocca Esterna
        rounded_box(outer_l, outer_w, outer_h / 2, 3);

        // Cavità Interna Spaziosa
        translate([0, 0, wall_thickness / 2])
            cube([inner_l, inner_w, outer_h / 2 + 1], center = true);

        // FINESTRA AMPIA PER PORTE USB-C (LASCIA BORDINO INFERIORE E ANGOLARI DI TRATTENUTA)
        // Il taglio parte da Z = 2.0 mm sopra il fondo, mantenendo il bordino frontale da 2mm!
        translate([-outer_l / 2, 0, 3.5])
            cube([wall_thickness * 4, inner_w - 6, outer_h / 2], center = true);

        // FORI PASSANTI GIGANTI A NIDO D'APE SUL FONDO (SOTTO)
        honeycomb_grid(width = inner_l - 16, length = inner_w - 6, hex_r = 3.2, wall = 1.2);
    }

    // DENTI DI TRATTENUTA FRONTALE ANTI-SCIVOLAMENTO (Bloccano il PCB se si tira il cavo)
    translate([-inner_l/2 + 1.2, -inner_w/2 + 2.5, 0.5]) cube([2.4, 4.0, 5.0], center = true);
    translate([-inner_l/2 + 1.2,  inner_w/2 - 2.5, 0.5]) cube([2.4, 4.0, 5.0], center = true);

    // Supporti di Appoggio PCB
    translate([-inner_l/2 + 6, -inner_w/2 + 5, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([ inner_l/2 - 6, -inner_w/2 + 5, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([-inner_l/2 + 6,  inner_w/2 - 5, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([ inner_l/2 - 6,  inner_w/2 - 5, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
}

// --- MODULO COPERCHIO SUPERIORE (TOP COVER) CON BORDINO FRONTALE ---
module top_cover() {
    translate([0, outer_w + 25, 0]) {
        difference() {
            // Coperchio Esterno Più Grande per Incastro Liscio
            rounded_box(outer_l + (lid_play * 2), outer_w + (lid_play * 2), outer_h / 2, 3.5);

            // Cavità Incastro con Tolleranza
            translate([0, 0, -wall_thickness / 2])
                cube([outer_l + 0.2, outer_w + 0.2, outer_h / 2 + 1], center = true);

            // PASSAGGIO CAVI FRONTALE SUL COPERCHIO CON BORDINO DI TENUTA
            translate([-(outer_l + lid_play * 2) / 2, 0, -1])
                cube([wall_thickness * 4, inner_w - 6, outer_h / 2 + 2], center = true);

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
